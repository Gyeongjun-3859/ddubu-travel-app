import { REGIONS_BY_COUNTRY } from './constants';

// 검색으로 고른 장소 → 앱의 국가·지역 이름 (I2: 지역을 안 정한 여행에 첫 장소를 넣으면 그 장소 기준으로 채우기)

// Intl 이름이 앱 목록 이름과 다른 나라
const CODE_TO_COUNTRY = { KR: '한국', HK: '홍콩', MO: '마카오', TW: '대만', US: '미국', GB: '영국', CN: '중국' };
// 행정구역 접미사 (오사카시 → 오사카, 부산광역시 → 부산, 도쿄도 → 도쿄)
const SUFFIX_RE = /(특별자치시|특별자치도|특별시|광역시|자치구|시|군|구|도|부|현|주)$/;

export function countryNameFromCode(code) {
  const c = String(code || '').toUpperCase();
  if (!c) return '';
  if (CODE_TO_COUNTRY[c]) return CODE_TO_COUNTRY[c];
  try { return new Intl.DisplayNames(['ko'], { type: 'region' }).of(c) || ''; } catch (e) { return ''; }
}

// 앱의 국가 이름(한국어) → 나라 코드(ISO 2글자). 검색을 그 나라 안으로 먼저 좁힐 때 씀.
let nameToCodeCache = null;
export function codeFromCountryName(name) {
  const n = String(name || '').trim();
  if (!n) return '';
  if (!nameToCodeCache) {
    nameToCodeCache = {};
    Object.entries(CODE_TO_COUNTRY).forEach(([code, nm]) => { nameToCodeCache[nm] = code; });
    try {
      const dn = new Intl.DisplayNames(['ko'], { type: 'region' });
      const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      for (const a of A) for (const b of A) {
        const code = a + b;
        let nm = '';
        try { nm = dn.of(code); } catch (e) { nm = ''; }
        if (nm && nm !== code && !nameToCodeCache[nm]) nameToCodeCache[nm] = code;
      }
    } catch (e) {}
  }
  return nameToCodeCache[n] || '';
}

const baseName = (n) => String(n || '').trim().replace(SUFFIX_RE, '');

// 이름 후보들(작은 단위 → 큰 단위) 중 그 나라 지역 목록과 맞는 첫 이름
function matchRegion(country, names) {
  const list = REGIONS_BY_COUNTRY[country] || [];
  for (const raw of names) {
    const n = String(raw || '').trim();
    if (!n) continue;
    const base = baseName(n);
    const hit = list.find(r => r === n || r === base || n.startsWith(r));
    if (hit) return hit;
  }
  return '';
}

// { countryCode, names } — 구글 상세(한국어)의 나라 코드와 [동네/시, 구·군, 도·주] 이름
// { kakaoAddress } — 카카오 검색 결과 주소("부산 해운대구 …", "경기 수원시 …")
// → { country, region } (region은 목록에 없으면 정리한 이름, 모르면 '') / 알 수 없으면 null
export function resolvePlaceArea({ countryCode, names, kakaoAddress } = {}) {
  if (kakaoAddress) {
    const tokens = String(kakaoAddress).trim().split(/\s+/).slice(0, 3);
    if (tokens.length === 0) return null;
    const region = matchRegion('한국', tokens) || baseName(tokens[1] || tokens[0]);
    return { country: '한국', region };
  }
  const country = countryNameFromCode(countryCode);
  if (!country) return null;
  const list = Array.isArray(names) ? names.filter(Boolean) : [];
  const region = matchRegion(country, list) || (list[0] ? baseName(list[0]) : '');
  return { country, region };
}
