// 구글 Places API (New) REST 호출 — 자동완성 + 좌표 조회
// 키(VITE_GOOGLE_PLACES_KEY)는 웹사이트 주소·Places API로 제한돼 있어 브라우저에서 직접 호출한다.
const KEY = import.meta.env.VITE_GOOGLE_PLACES_KEY;
const BASE = 'https://places.googleapis.com/v1';

export const hasGooglePlacesKey = () => Boolean(KEY);

// 자동완성 세션 토큰: 후보를 고를 때까지 한 세션으로 묶여 자동완성 요금이 무료 처리된다
export const newPlacesSessionToken = () => {
  try { if (crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (_) {}
  return `s${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
};

// 검색어(한국어·영어·러시아어·카자흐어 모두 가능) → 후보 최대 5개. 좌표는 후보를 고른 뒤 googlePlaceLocation으로 조회
// biasCenter({lat,lng})를 주면 그 근처(반경 50km) 결과를 먼저 보여 준다 — 다른 나라 결과를 막지는 않음.
// (예전엔 오사카 여행에서 '유니버설 스튜디오'를 치면 할리우드 지점이 1순위로 나왔다)
export async function googleAutocomplete(input, sessionToken, languageCode = 'ko', biasCenter = null) {
  if (!KEY) throw new Error('no-key');
  const body = { input, languageCode, sessionToken };
  if (biasCenter && isFinite(biasCenter.lat) && isFinite(biasCenter.lng)) {
    body.locationBias = { circle: { center: { latitude: biasCenter.lat, longitude: biasCenter.lng }, radius: 50000 } };
  }
  const res = await fetch(`${BASE}/places:autocomplete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': KEY },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`places-autocomplete-${res.status}`);
  const data = await res.json();
  const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
  return suggestions
    .map(s => s.placePrediction)
    .filter(Boolean)
    .slice(0, 5)
    .map(p => {
      const main = p.structuredFormat && p.structuredFormat.mainText && p.structuredFormat.mainText.text;
      const sub = p.structuredFormat && p.structuredFormat.secondaryText && p.structuredFormat.secondaryText.text;
      const full = p.text && p.text.text;
      return { placeId: p.placeId, name: main || full || '', address: sub || full || '', lat: NaN, lng: NaN };
    });
}

// 여행 국가 → 현지 언어 코드 (현지어 이름 자동 채우기용). 목록에 없으면 영어.
export const LOCAL_LANG_BY_COUNTRY = {
  '일본': 'ja', '중국': 'zh-CN', '대만': 'zh-TW', '홍콩': 'zh-HK', '태국': 'th', '베트남': 'vi',
  '프랑스': 'fr', '이탈리아': 'it', '스페인': 'es', '독일': 'de', '러시아': 'ru', '카자흐스탄': 'ru',
  '인도네시아': 'id', '말레이시아': 'ms', '필리핀': 'en', '미국': 'en', '영국': 'en', '호주': 'en', '싱가포르': 'en',
};

// 후보의 placeId → 좌표·주소. localLanguageCode를 주면 같은 한 번의 요청으로 그 언어의 장소 이름(displayName)도
// 받아온다 — 택시 기사에게 보여줄 "현지어 이름" 자동 채우기용 (요청을 한 번 더 보내지 않기 위해 합침)
export async function googlePlaceLocation(placeId, sessionToken, languageCode = 'ko', localLanguageCode = null) {
  if (!KEY) throw new Error('no-key');
  const lang = localLanguageCode || languageCode;
  // addressComponents: 나라 코드·도시 이름 — 지역을 안 정한 여행에 첫 장소 기준으로 국가·지역을 채울 때 씀(I2)
  const fields = localLanguageCode ? 'location,formattedAddress,addressComponents,displayName' : 'location,formattedAddress,addressComponents';
  const url = `${BASE}/places/${encodeURIComponent(placeId)}?languageCode=${lang}&sessionToken=${encodeURIComponent(sessionToken)}`;
  const res = await fetch(url, { headers: { 'X-Goog-Api-Key': KEY, 'X-Goog-FieldMask': fields } });
  if (!res.ok) throw new Error(`places-details-${res.status}`);
  const data = await res.json();
  if (!data.location) throw new Error('places-details-no-location');
  const comps = Array.isArray(data.addressComponents) ? data.addressComponents : [];
  const compOf = (type) => comps.find(c => Array.isArray(c.types) && c.types.includes(type));
  const countryComp = compOf('country');
  // 도시 이름은 한국어로 받았을 때만 쓴다(현지어면 앱 지역 이름과 비교할 수 없음). 작은 단위 → 큰 단위 순서
  const areaNames = lang === 'ko'
    ? ['locality', 'administrative_area_level_2', 'administrative_area_level_1'].map(t => compOf(t)?.longText).filter(Boolean)
    : [];
  return {
    lat: data.location.latitude, lng: data.location.longitude, address: data.formattedAddress || '',
    localName: (localLanguageCode && data.displayName && data.displayName.text) ? data.displayName.text : '',
    countryCode: countryComp ? (countryComp.shortText || '') : '',
    areaNames,
  };
}

// 좌표 → 바로 근처(반경 40m) 가장 가까운 장소 이름 — 지도를 눌러 핀을 만들 때 이름 칸 미리 채우기용.
// 근처에 장소가 없으면 빈 문자열.
export async function googleNearbyPlaceName(lat, lng, languageCode = 'ko') {
  if (!KEY) throw new Error('no-key');
  const res = await fetch(`${BASE}/places:searchNearby`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': KEY, 'X-Goog-FieldMask': 'places.displayName' },
    body: JSON.stringify({
      maxResultCount: 1, rankPreference: 'DISTANCE', languageCode,
      locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: 40 } },
    }),
  });
  if (!res.ok) throw new Error(`places-nearby-${res.status}`);
  const data = await res.json();
  const p = Array.isArray(data.places) && data.places[0];
  return (p && p.displayName && p.displayName.text) ? p.displayName.text : '';
}

// 현지어 이름 → 한국어 번역 (Cloud Translation API v2, Places와 같은 키 사용)
const HANGUL_RE = /[가-힣]/;
export async function translateToKorean(text) {
  if (!KEY) throw new Error('no-key');
  const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(KEY)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, target: 'ko', format: 'text' }),
  });
  if (!res.ok) throw new Error(`translate-${res.status}`);
  const data = await res.json();
  const t = data && data.data && Array.isArray(data.data.translations) && data.data.translations[0];
  return t && t.translatedText ? String(t.translatedText).trim() : '';
}

// 지도를 눌러 핀을 만들 때 이름 칸 미리 채우기(I3).
// 구글에 한국어 이름이 없는 장소는 현지어 이름이 와서 이름 칸에 그대로 들어갔다 →
// 원문은 현지어 칸에, 이름 칸엔 한국어 번역을 넣는다. 번역이 실패하면 이름 칸에도 원문.
export async function googleNearbyPlaceNames(lat, lng) {
  const name = await googleNearbyPlaceName(lat, lng, 'ko');
  if (!name || HANGUL_RE.test(name)) return { name, localName: '' };
  try {
    const ko = await translateToKorean(name);
    // 영어 상호처럼 번역해도 그대로면 현지어 칸에 같은 글자를 또 넣지 않는다
    if (!ko || ko === name) return { name, localName: '' };
    return { name: ko, localName: name };
  } catch (e) {
    console.warn('[장소 이름 번역 실패]', e && e.message);
    return { name, localName: name };
  }
}
