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
export async function googleAutocomplete(input, sessionToken, languageCode = 'ko') {
  if (!KEY) throw new Error('no-key');
  const res = await fetch(`${BASE}/places:autocomplete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': KEY },
    body: JSON.stringify({ input, languageCode, sessionToken }),
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

// 후보의 placeId → 좌표·주소 (요금이 낮은 Essentials 필드만 요청)
export async function googlePlaceLocation(placeId, sessionToken, languageCode = 'ko') {
  if (!KEY) throw new Error('no-key');
  const url = `${BASE}/places/${encodeURIComponent(placeId)}?languageCode=${languageCode}&sessionToken=${encodeURIComponent(sessionToken)}`;
  const res = await fetch(url, { headers: { 'X-Goog-Api-Key': KEY, 'X-Goog-FieldMask': 'location,formattedAddress' } });
  if (!res.ok) throw new Error(`places-details-${res.status}`);
  const data = await res.json();
  if (!data.location) throw new Error('places-details-no-location');
  return { lat: data.location.latitude, lng: data.location.longitude, address: data.formattedAddress || '' };
}
