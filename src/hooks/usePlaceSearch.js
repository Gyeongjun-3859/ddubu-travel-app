import { useRef, useState } from 'react';
import { S } from '../utils/helpers';
import { hasGooglePlacesKey, newPlacesSessionToken, googleAutocomplete, googlePlaceLocation, LOCAL_LANG_BY_COUNTRY } from '../utils/googlePlaces';

// 장소 이름 자동완성 (국내: 카카오 / 해외: 구글 → 실패하면 OSM). 일정 등록 창과 일정 수정 창이 같이 쓴다.
// onPick({ name, lat, lng, localName })는 후보를 골랐을 때 한 번 불린다 (좌표가 없으면 lat/lng는 NaN).
// biasPins: 이 여행에 이미 등록된 핀들 — 가운데 좌표 근처 결과를 먼저 보여 주는 데 쓴다(해외 구글 검색)
function centerOf(pins) {
  const pts = (Array.isArray(pins) ? pins : []).filter(p => p && isFinite(parseFloat(p.lat)) && isFinite(parseFloat(p.lng)) && parseFloat(p.lat) !== 0);
  if (pts.length === 0) return null;
  return { lat: pts.reduce((a, p) => a + parseFloat(p.lat), 0) / pts.length, lng: pts.reduce((a, p) => a + parseFloat(p.lng), 0) / pts.length };
}

export function usePlaceSearch({ isKakaoMap, isKakaoMapLoaded, country, showToast, onPick, biasPins }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const timerRef = useRef(null);
  const reqRef = useRef(0);
  const sessionRef = useRef(newPlacesSessionToken());

  const run = (query) => {
    const reqId = ++reqRef.current; // 늦게 도착한 이전 검색 결과가 덮어쓰지 않게 구분
    if (!query || query.trim().length < 2) { setSuggestions([]); return; }
    if (isKakaoMap && isKakaoMapLoaded && window.kakao && window.kakao.maps && window.kakao.maps.services) {
      const kakao = window.kakao;
      const ps = new kakao.maps.services.Places();
      ps.keywordSearch(query, (data, status) => {
        if (reqId !== reqRef.current) return;
        if (status === kakao.maps.services.Status.OK && Array.isArray(data)) {
          setSuggestions(data.slice(0, 5).map(d => ({
            name: d.place_name, address: d.road_address_name || d.address_name || '',
            lat: parseFloat(d.y), lng: parseFloat(d.x),
          })));
          setShowSuggestions(true);
        } else { setSuggestions([]); }
      }, { size: 5 });
      return;
    }
    const runNominatim = () => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=ko,en,ru`)
        .then(r => r.json())
        .then(data => {
          if (reqId !== reqRef.current) return;
          if (Array.isArray(data)) {
            setSuggestions(data.map(d => ({
              name: S(d.display_name).split(',')[0], address: S(d.display_name),
              lat: parseFloat(d.lat), lng: parseFloat(d.lon),
            })));
            setShowSuggestions(true);
          }
        }).catch(() => { if (reqId === reqRef.current) setSuggestions([]); });
    };
    // 해외는 구글 Places 우선, 키가 없거나 실패/결과 없음이면 OSM 검색으로 대체
    if (!hasGooglePlacesKey()) { runNominatim(); return; }
    googleAutocomplete(query.trim(), sessionRef.current, 'ko', centerOf(biasPins))
      .then(list => {
        if (reqId !== reqRef.current) return;
        if (list.length > 0) { setSuggestions(list); setShowSuggestions(true); }
        else runNominatim();
      })
      .catch(e => {
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
    let { lat, lng } = s;
    let localName = '';
    // 구글 후보는 좌표가 없어서 선택 시점에 조회 (세션 종료 → 새 토큰). 해외면 같은 요청으로 현지어 이름도 받음
    if (s.placeId && (isNaN(lat) || isNaN(lng))) {
      const localLang = country && country !== '한국' ? (LOCAL_LANG_BY_COUNTRY[country] || 'en') : null;
      try {
        const loc = await googlePlaceLocation(s.placeId, sessionRef.current, 'ko', localLang);
        lat = loc.lat; lng = loc.lng; localName = loc.localName || '';
      } catch (e) {
        console.warn('[구글 좌표 조회 실패]', e && e.message);
        if (typeof showToast === 'function') showToast("위치를 가져오지 못했어요. 지도를 눌러 직접 지정해주세요.");
      }
      sessionRef.current = newPlacesSessionToken();
    }
    if (typeof onPick === 'function') onPick({ name: s.name, lat, lng, localName: localName && localName !== s.name ? localName : '' });
  };

  return { suggestions, showSuggestions, setShowSuggestions, onQueryChange, select };
}
