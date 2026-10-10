// Vercel 서버 함수: 카카오(다음) 이미지 검색 — 국내 가게의 음식·메뉴판 사진 후보
// 카카오 REST 키는 화면 코드에 넣으면 누구나 볼 수 있어서, 서버(Vercel 환경변수 KAKAO_REST_KEY)에만 두고 여기서 대신 부른다.
// 결과는 블로그·카페 사진이라 우리 저장소로 복사하지 않고, 카카오가 주는 미리보기 주소와 원문 링크만 돌려준다.
//   GET /api/kakao-images?query=금수복국 해운대본점 음식
// 다른 주소에서 부르는 걸 허용할 곳: 안드로이드 앱(화면이 휴대폰 안 https://localhost 에서 열림)과 로컬 개발 화면.
// 아무 사이트나 허용하면 남이 우리 카카오 사용량을 쓸 수 있어서 목록으로 제한한다.
const ALLOWED_ORIGINS = /^(https?:\/\/localhost(:\d+)?|capacitor:\/\/localhost|https?:\/\/127\.0\.0\.1(:\d+)?)$/;

export default async function handler(req, res) {
  const origin = (req.headers && req.headers.origin) || '';
  if (ALLOWED_ORIGINS.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  const key = process.env.KAKAO_REST_KEY;
  if (!key) { res.status(501).json({ error: 'no-key', items: [] }); return; }
  const query = String((req.query && req.query.query) || '').trim().slice(0, 80);
  if (!query) { res.status(400).json({ error: 'no-query', items: [] }); return; }
  try {
    const r = await fetch(`https://dapi.kakao.com/v2/search/image?query=${encodeURIComponent(query)}&size=12&sort=accuracy`, {
      headers: { Authorization: `KakaoAK ${key}` },
    });
    if (!r.ok) { res.status(502).json({ error: `kakao-${r.status}`, items: [] }); return; }
    const d = await r.json();
    const items = (Array.isArray(d.documents) ? d.documents : [])
      .filter(x => x && x.thumbnail_url)
      .map(x => ({ thumb: x.thumbnail_url, full: x.image_url, site: x.display_sitename || '', link: x.doc_url || '', w: x.width || 0, h: x.height || 0 }));
    // 같은 검색은 하루 동안 Vercel이 기억 (요청 수 절약)
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600');
    res.status(200).json({ items });
  } catch (e) {
    res.status(500).json({ error: 'fetch-failed', items: [] });
  }
}
