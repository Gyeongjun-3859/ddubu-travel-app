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
// regionCodes(['cn'] 등)를 주면 그 나라 결과만 — 여행 나라 안에서 먼저 찾을 때(없으면 부르는 쪽에서 전체로 다시)
export async function googleAutocomplete(input, sessionToken, languageCode = 'ko', biasCenter = null, regionCodes = null) {
  if (!KEY) throw new Error('no-key');
  const body = { input, languageCode, sessionToken };
  if (Array.isArray(regionCodes) && regionCodes.length > 0) body.includedRegionCodes = regionCodes.map(c => String(c).toLowerCase());
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
  // types: 장소 분류 — 검색으로 고른 장소의 테마(식당·카페·숙소…)를 자동으로 고르는 데 씀
  const fields = localLanguageCode ? 'location,formattedAddress,addressComponents,types,displayName' : 'location,formattedAddress,addressComponents,types';
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
    types: Array.isArray(data.types) ? data.types : [],
  };
}

// 좌표 → 근처(radius m 안) 가장 가까운 장소 하나 — 지도를 눌렀을 때 정보 창·핀 이름 미리 채우기용.
// 근처에 장소가 없으면 null. (전화번호·별점은 더 비싼 요금 등급이라 받지 않는다)
async function googleNearbyPlaceRaw(lat, lng, radius, languageCode = 'ko') {
  if (!KEY) throw new Error('no-key');
  const res = await fetch(`${BASE}/places:searchNearby`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', 'X-Goog-Api-Key': KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.primaryTypeDisplayName,places.types',
    },
    body: JSON.stringify({
      maxResultCount: 1, rankPreference: 'DISTANCE', languageCode,
      locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius } },
    }),
  });
  if (!res.ok) throw new Error(`places-nearby-${res.status}`);
  const data = await res.json();
  const p = Array.isArray(data.places) && data.places[0];
  if (!p || !p.displayName || !p.displayName.text) return null;
  return {
    id: p.id || '',
    name: p.displayName.text,
    address: p.formattedAddress || '',
    lat: p.location ? p.location.latitude : NaN,
    lng: p.location ? p.location.longitude : NaN,
    category: (p.primaryTypeDisplayName && p.primaryTypeDisplayName.text) || '',
    primaryType: p.primaryType || '',
    types: Array.isArray(p.types) ? p.types : [],
  };
}

// 장소 id → 그 언어의 장소 이름 (지도를 눌러 만든 핀의 현지어 이름 채우기 — 근처 검색은 한국어로만 받아서)
export async function googlePlaceNameIn(placeId, languageCode) {
  if (!KEY || !placeId) throw new Error('no-key');
  const res = await fetch(`${BASE}/places/${encodeURIComponent(placeId)}?languageCode=${languageCode}`, {
    headers: { 'X-Goog-Api-Key': KEY, 'X-Goog-FieldMask': 'displayName' },
  });
  if (!res.ok) throw new Error(`places-name-${res.status}`);
  const data = await res.json();
  return (data.displayName && data.displayName.text) || '';
}

// ── 장소 상세 정보 (영업시간·평점·리뷰·사진) ─────────────────────────────────────────
// 리뷰·평점은 비싼 요금 등급(월 1,000회 무료)이라 '상세 정보'를 눌렀을 때만 부르고, 한 번 받은 건 이 화면이 켜져 있는 동안 기억한다.
const detailsCache = new Map();
export async function googlePlaceDetails(placeId) {
  if (!KEY || !placeId) throw new Error('no-key');
  if (detailsCache.has(placeId)) return detailsCache.get(placeId);
  const fields = [
    'id', 'displayName', 'formattedAddress', 'rating', 'userRatingCount', 'priceLevel',
    'currentOpeningHours.openNow', 'currentOpeningHours.weekdayDescriptions', 'regularOpeningHours.weekdayDescriptions',
    'websiteUri', 'nationalPhoneNumber', 'internationalPhoneNumber', 'googleMapsUri', 'editorialSummary', 'reviews', 'photos',
  ].join(',');
  const res = await fetch(`${BASE}/places/${encodeURIComponent(placeId)}?languageCode=ko`, {
    headers: { 'X-Goog-Api-Key': KEY, 'X-Goog-FieldMask': fields },
  });
  if (!res.ok) throw new Error(`places-details-${res.status}`);
  const d = await res.json();
  const hours = (d.currentOpeningHours && d.currentOpeningHours.weekdayDescriptions) || (d.regularOpeningHours && d.regularOpeningHours.weekdayDescriptions) || [];
  const info = {
    id: d.id || placeId,
    name: (d.displayName && d.displayName.text) || '',
    address: d.formattedAddress || '',
    rating: typeof d.rating === 'number' ? d.rating : null,
    ratingCount: d.userRatingCount || 0,
    priceLevel: d.priceLevel || '',
    openNow: d.currentOpeningHours && typeof d.currentOpeningHours.openNow === 'boolean' ? d.currentOpeningHours.openNow : null,
    hours: Array.isArray(hours) ? hours : [],
    website: d.websiteUri || '',
    phone: d.nationalPhoneNumber || d.internationalPhoneNumber || '',
    mapsUrl: d.googleMapsUri || '',
    summary: (d.editorialSummary && d.editorialSummary.text) || '',
    reviews: (Array.isArray(d.reviews) ? d.reviews : []).slice(0, 3).map(r => ({
      author: (r.authorAttribution && r.authorAttribution.displayName) || '',
      rating: r.rating || 0,
      when: r.relativePublishTimeDescription || '',
      text: (r.text && r.text.text) || (r.originalText && r.originalText.text) || '',
    })),
    // 사진은 구글 약관상 저장하지 않고 볼 때마다 불러온다(올린 사람 이름 표시 필수)
    photos: (Array.isArray(d.photos) ? d.photos : []).slice(0, 5).map(ph => ({
      name: ph.name,
      author: (Array.isArray(ph.authorAttributions) && ph.authorAttributions[0] && ph.authorAttributions[0].displayName) || '',
      authorUrl: (Array.isArray(ph.authorAttributions) && ph.authorAttributions[0] && ph.authorAttributions[0].uri) || '',
    })),
  };
  detailsCache.set(placeId, info);
  return info;
}

// 사진 이름 → 화면에 띄울 주소 (img src로 바로 씀 — 구글이 실제 사진으로 넘겨준다)
export const googlePhotoSrc = (photoName, maxWidth = 800) =>
  `${BASE}/${photoName}/media?maxWidthPx=${maxWidth}&key=${encodeURIComponent(KEY || '')}`;

// 구글 장소 번호가 저장되지 않은 옛 핀: 이름 + 위치로 찾아서 번호를 알아낸다 (300m 안에서 가장 가까운 것)
export async function googleFindPlaceId(name, lat, lng) {
  if (!KEY || !name) throw new Error('no-key');
  const body = { textQuery: name, maxResultCount: 3, languageCode: 'ko' };
  if (isFinite(lat) && isFinite(lng)) body.locationBias = { circle: { center: { latitude: lat, longitude: lng }, radius: 300 } };
  const res = await fetch(`${BASE}/places:searchText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': KEY, 'X-Goog-FieldMask': 'places.id,places.location' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`places-find-${res.status}`);
  const data = await res.json();
  const list = Array.isArray(data.places) ? data.places : [];
  if (!(isFinite(lat) && isFinite(lng))) return (list[0] && list[0].id) || '';
  const near = list.map(p => ({ id: p.id, d: Math.hypot((p.location.latitude - lat) * 111000, (p.location.longitude - lng) * 111000 * Math.cos(lat * Math.PI / 180)) }))
    .filter(o => o.d <= 300).sort((a, b) => a.d - b.d);
  return (near[0] && near[0].id) || '';
}

// 글 → target 언어 번역 (Cloud Translation API v2, Places와 같은 키 사용)
export async function translateText(text, target) {
  if (!KEY) throw new Error('no-key');
  const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(KEY)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, target, format: 'text' }),
  });
  if (!res.ok) throw new Error(`translate-${res.status}`);
  const data = await res.json();
  const t = data && data.data && Array.isArray(data.data.translations) && data.data.translations[0];
  return t && t.translatedText ? String(t.translatedText).trim() : '';
}

// 현지어 이름 → 한국어 번역
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

// 지도를 눌렀을 때 근처 장소 정보(이름·현지어 이름·분류·주소·구글 분류 코드). 근처에 장소가 없으면 null.
// 구글에 한국어 이름이 없는 장소는 현지어 이름이 오므로(I3) 원문은 localName에, name엔 한국어 번역을 넣는다.
// 번역이 실패하면 name에도 원문. radius는 지도 확대 정도에 맞춰 부르는 쪽에서 정한다(기본 40m).
export async function googleNearbyPlace(lat, lng, radius = 40) {
  const place = await googleNearbyPlaceRaw(lat, lng, radius, 'ko');
  if (!place) return null;
  const name = place.name;
  if (HANGUL_RE.test(name)) return { ...place, localName: '' };
  try {
    const ko = await translateToKorean(name);
    // 영어 상호처럼 번역해도 그대로면 현지어 칸에 같은 글자를 또 넣지 않는다
    if (!ko || ko === name) return { ...place, localName: '' };
    return { ...place, name: ko, localName: name };
  } catch (e) {
    console.warn('[장소 이름 번역 실패]', e && e.message);
    return { ...place, localName: name };
  }
}
