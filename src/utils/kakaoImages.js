// 국내 가게의 음식·메뉴판 사진 후보 (카카오 이미지 검색 — 서버 함수 /api/kakao-images 를 거침)
// 키가 아직 없거나(501) 로컬 개발 서버처럼 서버 함수가 없는 곳이면 조용히 빈 목록.
// 블로그·카페 사진이라 자동으로 고르지 않고 후보로만 보여 주며, 저장할 때도 복사하지 않고 미리보기 주소·원문 링크만 남긴다.

const mem = new Map();

async function search(query) {
  if (mem.has(query)) return mem.get(query);
  const p = (async () => {
    const r = await fetch(`/api/kakao-images?query=${encodeURIComponent(query)}`);
    if (!r.ok) return [];
    const ct = r.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return []; // 로컬 개발 서버는 이 주소에 화면(html)을 돌려준다
    const d = await r.json();
    return Array.isArray(d.items) ? d.items : [];
  })().catch(() => []);
  mem.set(query, p);
  return p;
}

// 장소 이름 → 음식 사진 2장 + 메뉴판 사진 1장 (사용자 요청 순서: 가게 앞 → 음식 → 메뉴판)
export async function findKakaoFoodMenuPhotos(name, { food = 2, menu = 1 } = {}) {
  const n = String(name || '').trim();
  if (!n) return [];
  const [foods, menus] = await Promise.all([search(`${n} 음식`), search(`${n} 메뉴판`)]);
  const seen = new Set();
  const pickN = (list, k, kind) => list.filter(x => { if (seen.has(x.thumb)) return false; seen.add(x.thumb); return true; }).slice(0, k)
    .map(x => ({ source: 'kakao', kind, full: x.thumb, thumb: x.thumb, author: x.site, link: x.link }));
  return [...pickN(foods, food, 'food'), ...pickN(menus, menu, 'menu')];
}
