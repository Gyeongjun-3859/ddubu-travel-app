import { useRef, useState } from 'react';
import { S, themeFromGoogleTypes, themeFromKakaoCategory } from '../utils/helpers';
import { resolvePlaceArea } from '../utils/placeArea';
import { hasGooglePlacesKey, newPlacesSessionToken, googleAutocomplete, googlePlaceLocation, LOCAL_LANG_BY_COUNTRY, translateToKorean, translateText } from '../utils/googlePlaces';
import { codeFromCountryName } from '../utils/placeArea';

const HANGUL_RE = /[가-힣]/;

// 장소 이름 자동완성 (국내: 카카오 / 해외: 구글 → 실패하면 OSM). 일정 등록 창과 일정 수정 창이 같이 쓴다.
// onPick({ name, lat, lng, localName })는 후보를 골랐을 때 한 번 불린다 (좌표가 없으면 lat/lng는 NaN).
// biasPins: 이 여행에 이미 등록된 핀들 — 가운데 좌표 근처 결과를 먼저 보여 주는 데 쓴다(해외 구글 검색)
// myPins: 넘기면 이름이 맞는 '내 핀'을 후보 맨 위에 보여 준다(고르면 onPick의 pin으로 그 핀이 넘어감).
//   일정 쪽에서 지도에 먼저 찍어 둔 핀을 불러오는 길이 없어서, 같은 이름을 치면 좌표 없는 핀이 또 생겼다(4차 C).
// excludePinId: 지금 고치고 있는 핀은 후보에서 뺀다
function centerOf(pins) {
  const pts = (Array.isArray(pins) ? pins : []).filter(p => p && isFinite(parseFloat(p.lat)) && isFinite(parseFloat(p.lng)) && parseFloat(p.lat) !== 0);
  if (pts.length === 0) return null;
  return { lat: pts.reduce((a, p) => a + parseFloat(p.lat), 0) / pts.length, lng: pts.reduce((a, p) => a + parseFloat(p.lng), 0) / pts.length };
}

export function usePlaceSearch({ isKakaoMap, isKakaoMapLoaded, country, showToast, onPick, biasPins, myPins, excludePinId }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const timerRef = useRef(null);
  const reqRef = useRef(0);
  const sessionRef = useRef(newPlacesSessionToken());

  const run = (query) => {
    const reqId = ++reqRef.current; // 늦게 도착한 이전 검색 결과가 덮어쓰지 않게 구분
    if (!query || query.trim().length < 2) { setSuggestions([]); return; }
    // 이름(또는 현지어 이름)에 검색어가 든 내 핀 — 최대 3개, 바깥 검색 결과보다 위에
    const q = query.trim().toLowerCase();
    const pinHits = (Array.isArray(myPins) ? myPins : [])
      .filter(p => p && S(p.id) !== S(excludePinId) && (S(p.name).toLowerCase().includes(q) || S(p.localName).toLowerCase().includes(q)))
      .slice(0, 3)
      .map(p => ({ name: S(p.name), address: `📍 내 핀${p.localName ? ` · ${S(p.localName)}` : ''}`, lat: parseFloat(p.lat), lng: parseFloat(p.lng), source: 'pin', pin: p }));
    const show = (list) => {
      const merged = [...pinHits, ...(Array.isArray(list) ? list : [])];
      setSuggestions(merged);
      if (merged.length > 0) setShowSuggestions(true);
    };
    if (pinHits.length > 0) show([]); // 바깥 검색이 오기 전에 내 핀부터 바로 보여 줌
    if (isKakaoMap && isKakaoMapLoaded && window.kakao && window.kakao.maps && window.kakao.maps.services) {
      const kakao = window.kakao;
      const ps = new kakao.maps.services.Places();
      ps.keywordSearch(query, (data, status) => {
        if (reqId !== reqRef.current) return;
        if (status === kakao.maps.services.Status.OK && Array.isArray(data)) {
          show(data.slice(0, 5).map(d => ({
            name: d.place_name, address: d.road_address_name || d.address_name || '',
            lat: parseFloat(d.y), lng: parseFloat(d.x), source: 'kakao', kakaoCategory: d.category_group_code || '', kakaoUrl: d.place_url || '',
          })));
        } else { show([]); }
      }, { size: 5 });
      return;
    }
    const runNominatim = () => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=ko,en,ru`)
        .then(r => r.json())
        .then(data => {
          if (reqId !== reqRef.current) return;
          if (Array.isArray(data)) {
            show(data.map(d => ({
              name: S(d.display_name).split(',')[0], address: S(d.display_name),
              lat: parseFloat(d.lat), lng: parseFloat(d.lon),
            })));
          }
        }).catch(() => { if (reqId === reqRef.current) show([]); });
    };
    // 해외는 구글 Places 우선, 키가 없거나 실패/결과 없음이면 OSM 검색으로 대체
    if (!hasGooglePlacesKey()) { runNominatim(); return; }
    // ① 여행 나라 안에서 먼저 (상하이 여행에서 '동방명주'를 치면 한국 식당이 같이 나오던 문제)
    // ② 없으면 전 세계에서 ③ 그래도 없고 한국어로 쳤으면 영어로 번역해서 다시 ('콕토베' → 'Kok Tobe')
    const regionCode = country && country !== '한국' ? codeFromCountryName(country) : '';
    const center = centerOf(biasPins);
    const q0 = query.trim();
    (async () => {
      let list = [];
      if (regionCode) list = await googleAutocomplete(q0, sessionRef.current, 'ko', center, [regionCode]).catch(() => []);
      if (list.length === 0) list = await googleAutocomplete(q0, sessionRef.current, 'ko', center);
      if (list.length === 0 && /[가-힣]/.test(q0)) {
        const en = await translateText(q0, 'en').catch(() => '');
        if (en && en.toLowerCase() !== q0.toLowerCase()) {
          if (regionCode) list = await googleAutocomplete(en, sessionRef.current, 'ko', center, [regionCode]).catch(() => []);
          if (list.length === 0) list = await googleAutocomplete(en, sessionRef.current, 'ko', center);
        }
      }
      if (reqId !== reqRef.current) return;
      if (list.length > 0) show(list); else runNominatim();
    })().catch(e => {
      console.warn('[구글 장소 검색 실패 → OSM 대체]', e && e.message);
      if (reqId === reqRef.current) runNominatim();
    });
  };

  // 입력이 바뀔 때마다(350ms 쉬면) 검색
  const onQueryChange = (val) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => run(val), 350);
  };

  const select = async (s) => {
    setSuggestions([]); setShowSuggestions(false);
    reqRef.current++; // 선택 직후 도착하는 검색 결과 무시
    if (s.source === 'pin') {
      if (typeof onPick === 'function') onPick({ name: s.name, lat: s.lat, lng: s.lng, localName: S(s.pin.localName), area: null, pin: s.pin, ext: { googlePlaceId: S(s.pin.googlePlaceId), kakaoPlaceUrl: S(s.pin.kakaoPlaceUrl) } });
      return;
    }
    let { lat, lng } = s;
    let localName = '';
    let name = s.name;
    // 고른 장소의 분류로 테마 추천 (카카오: 분류 코드 / 구글: 상세 요청의 types) — 창에서 테마가 '기타'일 때만 바뀜
    let theme = s.source === 'kakao' ? themeFromKakaoCategory(s.kakaoCategory) : '기타';
    // 장소의 국가·지역(I2) — 카카오는 주소로, 구글은 상세 요청의 주소 구성요소로
    let area = s.source === 'kakao' ? resolvePlaceArea({ kakaoAddress: s.address }) : null;
    // 구글 후보는 좌표가 없어서 선택 시점에 조회 (세션 종료 → 새 토큰). 해외면 같은 요청으로 현지어 이름도 받음
    if (s.placeId && (isNaN(lat) || isNaN(lng))) {
      const localLang = country && country !== '한국' ? (LOCAL_LANG_BY_COUNTRY[country] || 'en') : null;
      try {
        const loc = await googlePlaceLocation(s.placeId, sessionRef.current, 'ko', localLang);
        lat = loc.lat; lng = loc.lng; localName = loc.localName || '';
        area = resolvePlaceArea({ countryCode: loc.countryCode, names: loc.areaNames });
        theme = themeFromGoogleTypes('', loc.types);
      } catch (e) {
        console.warn('[구글 좌표 조회 실패]', e && e.message);
        if (typeof showToast === 'function') showToast("위치를 가져오지 못했어요. 지도를 눌러 직접 지정해주세요.");
      }
      sessionRef.current = newPlacesSessionToken();
    }
    // 구글에 한국어 이름이 없는 해외 장소(예: 'Kok-Tobe Hill')는 한국어로 번역해 이름에 쓰고, 원래 이름은 현지어 칸으로
    // (지도를 눌러 고를 때 하던 처리(I3)를 검색으로 고를 때도)
    if (s.source !== 'kakao' && hasGooglePlacesKey() && name && !HANGUL_RE.test(name)) {
      try {
        const ko = await translateToKorean(name);
        if (ko && ko !== name) { if (!localName) localName = name; name = ko; }
      } catch (e) { console.warn('[장소 이름 번역 실패]', e && e.message); }
    }
    // ext: 핀에 같이 저장할 바깥 서비스 번호 — 나중에 '장소 정보'(영업시간·리뷰)를 다시 찾지 않고 바로 열기 위함
    const ext = { googlePlaceId: s.placeId || '', kakaoPlaceUrl: s.kakaoUrl || '' };
    if (typeof onPick === 'function') onPick({ name, lat, lng, localName: localName && localName !== name ? localName : '', area, theme, ext });
  };

  return { suggestions, showSuggestions, setShowSuggestions, onQueryChange, select };
}
