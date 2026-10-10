// Mapillary(사용자들이 올린 거리 사진, CC BY-SA) — 핀의 '가게 앞 사진' 후보 찾기·저장
// 토큰(VITE_MAPILLARY_TOKEN)은 원래 브라우저에서 쓰도록 만든 공개용 키다.
import { compressImage } from './helpers';

const TOKEN = import.meta.env.VITE_MAPILLARY_TOKEN;
const BASE = 'https://graph.mapillary.com';

export const hasMapillaryToken = () => Boolean(TOKEN);

const toRad = (d) => d * Math.PI / 180;

// 장소 좌표 → 가게 앞 사진 후보(좋아 보이는 순).
// 사진 위치·카메라 방향 기록이 수 m~수십 도씩 틀려서 '정답 하나'를 자동으로 고를 수 없다
// (오사카 5곳 실측: 자동 1순위가 맞은 곳은 1곳) → 여러 장을 보여 주고 사용자가 고르게 한다.
export async function findStorefrontCandidates(lat, lng, max = 6) {
  if (!TOKEN) throw new Error('no-token');
  const d = 0.0004; // 약 40m
  const fields = 'id,captured_at,compass_angle,computed_compass_angle,computed_geometry,geometry,is_pano,thumb_256_url,thumb_1024_url,sequence,creator';
  const url = `${BASE}/images?access_token=${encodeURIComponent(TOKEN)}&fields=${fields}`
    + `&bbox=${lng - d},${lat - d},${lng + d},${lat + d}&limit=200`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`mapillary-${res.status}`);
  const data = await res.json();
  const list = Array.isArray(data.data) ? data.data : [];
  const now = Date.now();

  const scored = [];
  for (const im of list) {
    if (!im || im.is_pano || !im.thumb_1024_url) continue; // 360° 사진은 늘어져 보여서 뺀다
    const g = (im.computed_geometry || im.geometry || {}).coordinates;
    if (!Array.isArray(g)) continue;
    // 사진 찍은 자리 → 장소 거리·방향
    const dx = (lng - g[0]) * 111320 * Math.cos(toRad(lat));
    const dy = (lat - g[1]) * 110540;
    const dist = Math.hypot(dx, dy);
    if (dist < 3 || dist > 40) continue; // 너무 붙으면 간판이 안 보이고, 멀면 다른 가게
    const bearing = (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360;
    // 보정된 방향(computed)이 있으면 그게 더 정확하다
    const cam = im.computed_compass_angle ?? im.compass_angle;
    if (typeof cam !== 'number') continue;
    const diff = Math.abs(((bearing - cam + 540) % 360) - 180);
    if (diff > 70) continue; // 장소 반대쪽을 보고 찍은 사진
    const ageYears = Math.max(0, (now - (im.captured_at || 0)) / (365 * 864e5));
    const score = (diff / 70) * 0.55 + (Math.abs(dist - 15) / 25) * 0.3 + Math.min(ageYears, 5) / 5 * 0.15;
    scored.push({ im, dist, diff, cam, gx: g[0], gy: g[1], score });
  }
  scored.sort((a, b) => a.score - b.score);

  // 같은 사람이 연달아 찍은 거의 같은 사진이 줄줄이 나오지 않게 — 한 촬영 묶음(sequence)에서 2장까지,
  // 이미 고른 사진과 3m·15° 안이면 건너뜀
  const picked = [];
  const perSeq = {};
  for (const c of scored) {
    if (picked.length >= max) break;
    const seq = c.im.sequence || c.im.id;
    if ((perSeq[seq] || 0) >= 2) continue;
    const dup = picked.some(p => {
      const ddx = (p.gx - c.gx) * 111320 * Math.cos(toRad(lat));
      const ddy = (p.gy - c.gy) * 110540;
      return Math.hypot(ddx, ddy) < 3 && Math.abs(((p.cam - c.cam + 540) % 360) - 180) < 15;
    });
    if (dup) continue;
    perSeq[seq] = (perSeq[seq] || 0) + 1;
    picked.push(c);
  }

  return picked.map(({ im }) => ({
    mapillaryId: String(im.id),
    thumb: im.thumb_256_url || im.thumb_1024_url,
    full: im.thumb_1024_url, // 주소에 만료 기한이 있어 저장할 땐 우리 저장소로 복사한다
    author: (im.creator && im.creator.username) || '',
    capturedAt: im.captured_at || 0,
  }));
}

// 고른 후보 사진을 우리 저장소(trip-photos)로 복사 → 핀에 저장할 값 { url, mapillaryId, author, capturedAt }
// 게스트는 저장소를 못 쓰므로 직접 올린 사진처럼 기기 안(data URL)에 넣는다.
// 위키백과·위키미디어 사진은 주소가 바뀌지 않는 공개 사진이라 복사할 필요가 없고, 구글 사진은 약관상 저장하면 안 돼서
// (볼 때마다 구글에서 불러옴) 주소만 저장한다 → [등록]을 누르면 기다림 없이 바로 저장. 복사가 필요한 건 주소가 만료되는 거리 사진뿐.
export const storefrontNeedsCopy = (cand) => Boolean(cand) && !['wiki', 'commons', 'google'].includes(cand.source);

// 거리 사진 미리 받아 두기 — 자동으로 골라지는 순간 받기 시작해서, [등록]을 누를 땐 올리기만 하면 되게 (저장 대기 단축)
const blobCache = new Map(); // 사진 주소 → Promise<Blob>
export function prefetchStorefront(cand) {
  if (!storefrontNeedsCopy(cand) || !cand.full || blobCache.has(cand.full)) return;
  const p = fetch(cand.full).then(res => {
    if (!res.ok) throw new Error(`storefront-fetch-${res.status}`);
    return res.blob();
  });
  p.catch(() => blobCache.delete(cand.full)); // 실패하면 저장 때 다시 받는다
  blobCache.set(cand.full, p);
}

export async function copyStorefrontPhoto(supabaseClient, appUserId, folderId, cand) {
  if (!storefrontNeedsCopy(cand)) {
    return {
      url: String(cand.full), source: cand.source, mapillaryId: '', author: cand.author || '', capturedAt: 0, link: cand.link || '',
      ...(cand.photoName ? { photoName: cand.photoName } : {}),
    };
  }
  prefetchStorefront(cand);
  const blob = await blobCache.get(cand.full);
  blobCache.delete(cand.full);
  let url;
  if (appUserId === 'Guest' || !supabaseClient) {
    const file = new File([blob], 'storefront.jpg', { type: blob.type || 'image/jpeg' });
    url = await new Promise((resolve) => compressImage(file, resolve));
  } else {
    const path = `${folderId || appUserId}/${Date.now()}_sf_${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error } = await supabaseClient.storage.from('trip-photos').upload(path, blob, { contentType: blob.type || 'image/jpeg' });
    if (error) throw error;
    const { data } = supabaseClient.storage.from('trip-photos').getPublicUrl(path);
    url = data && data.publicUrl;
  }
  if (!url) throw new Error('storefront-upload');
  return {
    url: String(url), source: cand.source || 'mapillary', mapillaryId: cand.mapillaryId || '',
    author: cand.author || '', capturedAt: cand.capturedAt || 0, link: cand.link || '',
  };
}

// 사진 아래 출처 표시용 ("Mapillary · 찍은 사람 · 2025.04")
export function storefrontCredit(sf) {
  if (!sf) return '';
  if (sf.source === 'wiki') return ['위키백과', sf.author].filter(Boolean).join(' · ');
  if (sf.source === 'commons') return ['위키미디어 공용', sf.author].filter(Boolean).join(' · ');
  if (sf.source === 'google') return ['Google', sf.author].filter(Boolean).join(' · ');
  const dt = sf.capturedAt ? new Date(sf.capturedAt) : null;
  const when = dt && !isNaN(dt) ? `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}` : '';
  return ['Mapillary', sf.author, when].filter(Boolean).join(' · ');
}

// 사진 크게 보기 화면은 사진 주소만 받으므로, 핀들의 가게 앞 사진 출처를 주소로 찾을 수 있게 모아 둔다.
const creditByUrl = new Map();
export function setStorefrontCredits(pins) {
  creditByUrl.clear();
  (Array.isArray(pins) ? pins : []).forEach(p => {
    if (p && p.storefront && p.storefront.url) creditByUrl.set(String(p.storefront.url), p.storefront);
  });
}
export const getStorefrontByUrl = (url) => creditByUrl.get(String(url || '')) || null;

// 카드 사진 구석의 작은 출처 표시, 크게 볼 때 출처 앞머리
const SOURCE_BADGE = { wiki: '📖 위키백과', commons: '📖 위키미디어', google: '📷 Google' };
export const storefrontBadge = (sf) => (sf && SOURCE_BADGE[sf.source]) || '📷 Mapillary';
export const storefrontPrefix = (sf) => (sf && ['wiki', 'commons'].includes(sf.source)) ? '📖' : (sf && sf.source === 'google' ? '📷' : '🏪 가게 앞 ·');

// 출처 링크 — 위키백과 사진은 그 문서, 거리 사진은 Mapillary 사진 페이지
export const photoSourceLink = (sf) => (sf && sf.link) ? sf.link : mapillaryPhotoLink(sf && sf.mapillaryId);

export const mapillaryPhotoLink = (id) => `https://www.mapillary.com/app/?pKey=${encodeURIComponent(id)}&focus=photo`;
