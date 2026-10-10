/* 뚜부트래블 오프라인 모드 (서비스 워커)
 * 산(침불락·빅 알마티 호수)·사막 투어·기내처럼 신호가 없을 때도 앱이 열리게, 앱 파일과 사진을 휴대폰에 저장해 둔다.
 * - 화면(HTML): 인터넷 먼저 → 안 되면 저장해 둔 것 (새 배포가 바로 반영되게)
 * - 앱 파일(/assets/… 이름에 해시가 붙어 바뀌지 않음): 저장해 둔 것 먼저
 * - 아이콘·글꼴·지도 스타일: 저장해 둔 것을 먼저 보여 주고 뒤에서 새로 받아 둠
 * - 우리 저장소 사진(서명 주소)·위키 사진: 한 번 본 사진은 저장 → 오프라인에서도 보임
 *   (구글 사진은 약관상 저장하지 않는다)
 * 일정·핀 데이터는 앱이 원래 휴대폰(localStorage)에 저장하고 있어서 여기서 다루지 않는다.
 */
const VERSION = 'v1';
const STATIC = `ddubu-static-${VERSION}`;
const PHOTOS = `ddubu-photos-${VERSION}`;
const MAX_PHOTOS = 250;

// 설치: 첫 화면과 그 화면이 쓰는 앱 파일을 미리 저장 (처음 연 순간엔 서비스 워커가 아직 없어 파일이 저장되지 않으므로)
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC);
    try {
      const res = await fetch('/', { cache: 'no-store' });
      if (res.ok) {
        const html = await res.clone().text();
        await cache.put('/', res);
        const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(m => m[1]);
        await cache.addAll([...new Set([...assets, '/manifest.json', '/favicon.ico', '/logo192.png'])]);
        // 이전 배포의 앱 파일은 지운다 (계속 쌓이지 않게)
        const keep = new Set(assets);
        for (const req of await cache.keys()) {
          const p = new URL(req.url).pathname;
          if (p.startsWith('/assets/') && !keep.has(p)) await cache.delete(req);
        }
      }
    } catch (e) { /* 설치 중 인터넷이 끊겨도 다음에 다시 시도 */ }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('ddubu-') && key !== STATIC && key !== PHOTOS) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

async function trimPhotos(cache) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MAX_PHOTOS; i++) await cache.delete(keys[i]); // 오래된 것부터
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 1) 화면 이동(HTML): 인터넷 먼저, 안 되면 저장된 첫 화면
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok && url.origin === self.location.origin) (await caches.open(STATIC)).put('/', res.clone());
        return res;
      } catch (e) {
        return (await caches.match('/')) || Response.error();
      }
    })());
    return;
  }

  // 2) 앱 파일: 저장된 것 먼저
  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith((async () => {
      const hit = await caches.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) (await caches.open(STATIC)).put(req, res.clone());
      return res;
    })());
    return;
  }

  // 3) 아이콘·글꼴·지도 스타일(leaflet css): 저장된 것을 먼저, 뒤에서 새로 받아 둠
  const isStaticExt = url.origin === self.location.origin && /\.(png|ico|json|svg|webmanifest)$/.test(url.pathname);
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  const isLeafletCss = url.hostname === 'unpkg.com' && url.pathname.includes('leaflet');
  if (isStaticExt || isFont || isLeafletCss) {
    event.respondWith((async () => {
      const cache = await caches.open(STATIC);
      const hit = await cache.match(req);
      const fresh = fetch(req).then(res => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; }).catch(() => null);
      return hit || (await fresh) || Response.error();
    })());
    return;
  }

  // 4) 사진: 우리 저장소 · 위키 사진. 우리 저장소 사진은 서명 주소(…/object/sign/…?token=)의 열쇠 값이 매번 달라서
  //    경로만으로 저장하고, 공개 주소(…/object/public/…)로 요청해도 같은 사진을 찾게 'sign'·'public'을 빼고 맞춘다
  //    (오프라인이라 서명 주소를 못 받으면 앱은 공개 주소로 띄우는데, 그때 저장해 둔 사진이 나오게)
  const isOurPhoto = url.hostname.endsWith('.supabase.co') && url.pathname.includes('/storage/v1/object/');
  const isWikiPhoto = url.hostname === 'upload.wikimedia.org' || url.hostname === 'thumb.wikimedia.org';
  if (isOurPhoto || isWikiPhoto) {
    const key = isOurPhoto ? `${url.origin}${url.pathname.replace('/object/sign/', '/object/').replace('/object/public/', '/object/')}` : req.url;
    event.respondWith((async () => {
      const cache = await caches.open(PHOTOS);
      try {
        const res = await fetch(req);
        // <img>로 부르는 다른 사이트 사진은 내용을 볼 수 없는 응답(opaque)으로 오지만 그대로 저장해 다시 띄울 수 있다
        if (res.ok || res.type === 'opaque') { cache.put(key, res.clone()).then(() => trimPhotos(cache)); }
        return res;
      } catch (e) {
        return (await cache.match(key)) || Response.error();
      }
    })());
  }
});
