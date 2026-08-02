import React from 'react';
import { X, Search, Map, MapPin, Compass, Navigation } from 'lucide-react';
import { KAKAO_CAT_COLORS } from '../utils/constants';
import { S } from '../utils/helpers';

const MapTab = ({
  activeTab, mapActiveDays, toggleMapDay, tripDays, getDayColor, isDarkMode,
  myPinsThemeFilter, setMyPinsThemeFilter,
  isKakaoMap, kakaoCategory, setKakaoCategory,
  markerSearchQuery, setMarkerSearchQuery, kakaoMapInstanceRef, kakaoSearchMarkersRef, showToast,
  filteredMarkers, handleMarkerSearchSelect, planTimeline, textMuted,
  showMapRoute, setShowMapRoute, setIsMyPinsModalOpen,
  isPinMode, setIsPinMode,
  showMapPhotos, setShowMapPhotos,
  showMapLabels, setShowMapLabels,
  handleFindMyLocation,
  setNavOrigin, setNavDest, setIsNavModalOpen,
  cardBg, isKakaoMapLoaded, isLeafletLoaded, setMapTypeOverride,
  mapContainerRef, kakaoMapContainerRef,
}) => {
  return (
    <div className={`absolute inset-0 flex flex-col p-2 sm:p-4 pt-3 pb-4 overflow-hidden transition-opacity duration-300 ${activeTab === 'map' ? 'visible opacity-100 z-10' : 'invisible opacity-0 -z-10 pointer-events-none'}`}>
      <div className="flex flex-col gap-2 mb-2 flex-shrink-0 relative z-20">

        {/* 필터 및 색상 동기화 패널 */}
<div className="flex flex-col space-y-2 pb-1">
          {/* [지도 타입 전환 + Day 필터] */}
          <div className="flex items-center space-x-1.5 overflow-x-auto custom-scrollbar pb-1 scroll-smooth px-0.5">
            <button onClick={() => toggleMapDay('all')} className={`px-4 py-1.5 rounded-full text-[10px] font-black whitespace-nowrap transition-all duration-300 is-tag ${mapActiveDays.includes('all') ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>전체 Day</button>                   {tripDays.map(d => {
               const color = getDayColor(d);
               const isActive = mapActiveDays.includes(d);
return (
                 <button key={d} onClick={() => toggleMapDay(d)} style={{ backgroundColor: isActive ? color : (isDarkMode ? '#1e293b' : 'white'), color: isActive ? 'white' : color, borderColor: color }} className={`px-3 py-1.5 rounded-full text-[10px] font-bold border whitespace-nowrap transition-all duration-300 ${isActive ? 'shadow-md scale-105' : 'hover:opacity-80'}`}>Day {d}</button>
               )
             })}

             {/* [추가됨] 미지정 핀 필터 버튼 복구 및 가로 정렬 유지 */}
             <button onClick={() => toggleMapDay('unlinked')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap border transition-all duration-300 ${mapActiveDays.includes('unlinked') ? 'bg-slate-500 text-white border-slate-500 shadow-md' : (isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50')}`}>
               미지정 핀
             </button>
          </div>
          {/* [테마 필터 - 신설] */}
          <div className="flex space-x-1.5 overflow-x-auto custom-scrollbar pb-1 scroll-smooth">
             {['all', '교통편', '식당', '디저트', '관광지', '쇼핑', '숙소', '기타'].map(t => (
               <button key={t} onClick={() => {
                  setMyPinsThemeFilter(prev => {
                     let arr = Array.isArray(prev) ? prev : [prev];
                     if (t === 'all') return ['all'];
                     let newThemes = arr.filter(x => x !== 'all');
                     if (newThemes.includes(t)) newThemes = newThemes.filter(x => x !== t);
                     else newThemes.push(t);
                     return newThemes.length === 0 ? ['all'] : newThemes;
                  });
               }} className={`px-3 py-1 rounded-full text-[9px] font-bold whitespace-nowrap border transition-all ${myPinsThemeFilter.includes(t) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : (isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50')}`}>
                 {t === 'all' ? '테마 전체' : t}
               </button>
             ))}
          </div>
          {/* 카카오맵 장소 카테고리 검색 필터 (복수 선택) */}
          {isKakaoMap && (
            <div className="flex space-x-1.5 overflow-x-auto custom-scrollbar pb-1 scroll-smooth">
              {/* 전체 해제 버튼 */}
              <button
                onClick={() => setKakaoCategory([])}
                className={`px-3 py-1 rounded-full text-[9px] font-bold whitespace-nowrap border transition-all ${kakaoCategory.length === 0 ? 'bg-slate-500 text-white border-slate-500 shadow-md' : (isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-white text-slate-500 border-slate-200')}`}
              >장소 전체</button>
              {[
                { code: 'FD6', label: '🍽️ 식당' },
                { code: 'CE7', label: '☕ 카페' },
                { code: 'AT4', label: '🏛️ 관광지' },
                { code: 'CS2', label: '🏪 편의점' },
                { code: 'AD5', label: '🏨 숙박' },
                { code: 'MT1', label: '🛒 마트' },
              ].map(({ code, label }) => {
                const isActive = kakaoCategory.includes(code);
                const hex = KAKAO_CAT_COLORS[code] || '#6366f1';
                return (
                  <button key={code}
                    onClick={() => setKakaoCategory(prev => {
                      const arr = Array.isArray(prev) ? prev : [];
                      return arr.includes(code) ? arr.filter(c => c !== code) : [...arr, code];
                    })}
                    style={isActive ? { background: hex, borderColor: hex, color: 'white' } : {}}
                    className={`px-3 py-1 rounded-full text-[9px] font-bold whitespace-nowrap border transition-all ${isActive ? 'shadow-md' : (isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-white text-slate-500 border-slate-200')}`}
                  >{label}</button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="relative w-full sm:w-64">
             <div className={`flex items-center shadow-sm rounded-lg overflow-hidden border transition-colors duration-300 ${isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-slate-300 bg-white'}`}>
                <span className={`ml-3 flex items-center transition-colors duration-300 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}><Search className="w-3.5 h-3.5" /></span>
                <input
                  type="text"
                  value={S(markerSearchQuery)}
                  onChange={e => setMarkerSearchQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && isKakaoMap && kakaoMapInstanceRef.current && window.kakao) {
                      try {
                        // 이전 검색 마커 제거
                        kakaoSearchMarkersRef.current.forEach(m => { try { m.setMap(null); } catch(_) {} });
                        kakaoSearchMarkersRef.current = [];
                        const kakao = window.kakao;
                        const ps = new kakao.maps.services.Places();
                        ps.keywordSearch(markerSearchQuery, (data, status) => {
                          if (status === kakao.maps.services.Status.OK && data.length > 0) {
                            // 첫 번째 결과로 지도 이동
                            kakaoMapInstanceRef.current.setCenter(new kakao.maps.LatLng(parseFloat(data[0].y), parseFloat(data[0].x)));
                            kakaoMapInstanceRef.current.setLevel(4);
                            // 검색 결과 마커 표시 (최대 5개)
                            data.slice(0, 5).forEach((place, idx) => {
                              const el = document.createElement('div');
                              el.style.cssText = 'display:flex;flex-direction:column;align-items:center;cursor:pointer;';
                              el.innerHTML = `
                                <div style="background:#4f46e5;color:white;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);">${idx + 1}</div>
                                <div style="background:white;border:1px solid #e2e8f0;border-radius:6px;padding:2px 6px;font-size:10px;font-weight:700;color:#1e293b;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.12);margin-top:2px;max-width:100px;overflow:hidden;text-overflow:ellipsis;">${place.place_name}</div>
                              `;
                              const overlay = new kakao.maps.CustomOverlay({
                                position: new kakao.maps.LatLng(parseFloat(place.y), parseFloat(place.x)),
                                content: el,
                                yAnchor: 1.1,
                                zIndex: 15,
                              });
                              overlay.setMap(kakaoMapInstanceRef.current);
                              kakaoSearchMarkersRef.current.push(overlay);
                            });
                            showToast(`🔍 "${markerSearchQuery}" 검색 결과 ${Math.min(data.length, 5)}개`);
                          } else {
                            showToast("검색 결과가 없습니다.");
                          }
                        });
                      } catch(e) {}
                    }
                  }}
                  placeholder={isKakaoMap ? "장소 검색 (한국어·영어·주소)..." : "내 지도 핀 검색..."}
                  className={`w-full pl-2 pr-8 py-2 bg-transparent text-[11px] font-bold focus:outline-none transition-colors duration-300 ${isDarkMode ? 'text-white placeholder-slate-400' : 'text-slate-800'}`}
                />
                {markerSearchQuery && (
                  <button onClick={() => {
                    setMarkerSearchQuery("");
                    kakaoSearchMarkersRef.current.forEach(m => { try { m.setMap(null); } catch(_) {} });
                    kakaoSearchMarkersRef.current = [];
                  }} className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors"><X className="w-[1em] h-[1em] inline" /></button>
                )}
             </div>
             {markerSearchQuery && filteredMarkers.length > 0 && (
               <div className={`absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-xl overflow-hidden max-h-40 overflow-y-auto custom-scrollbar animate-in fade-in duration-200 transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'}`}>
                  {filteredMarkers.map(marker => (
                    <button
                      key={marker.id}
                      onClick={() => handleMarkerSearchSelect(marker)}
                      className={`w-full text-left px-3 py-2.5 text-[11px] font-bold border-b last:border-0 flex items-center transition-colors duration-300 ${isDarkMode ? 'text-slate-200 border-slate-700 hover:bg-slate-700' : 'text-slate-700 border-slate-100 hover:bg-indigo-50'}`}
                    >
                      <div className={`w-2 h-2 rounded-full mr-2.5 ${planTimeline.some(p=>S(p.place)===S(marker.name))?'bg-orange-500':'bg-blue-500'}`}></div>
                      <span className="truncate flex-1">{S(marker.name)}</span>
                      <span className={`text-[9px] ml-2 ${textMuted}`}>{S(marker.city)}</span>
                    </button>
                  ))}
               </div>
             )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
             <label className={`flex items-center space-x-1 border px-2 py-1.5 rounded-md text-[10px] font-bold shadow-sm cursor-pointer transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                <input type="checkbox" checked={showMapRoute} onChange={e => setShowMapRoute(e.target.checked)} className="accent-indigo-600 w-3 h-3 cursor-pointer" />
                <Map className="w-3 h-3" /><span>루트표기</span>
             </label>
             <button onClick={() => setIsMyPinsModalOpen(true)} className={`border px-2 py-1.5 rounded-md text-[10px] font-bold flex items-center space-x-1 transition-all duration-300 shadow-sm active:scale-95 ${isDarkMode ? 'bg-indigo-900/50 border-indigo-500/50 text-indigo-300 hover:bg-indigo-900/70' : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'}`}>
                <MapPin className="w-3 h-3" /><span>내 핀 목록</span>
             </button>
             <label className={`flex items-center space-x-1 border px-2 py-1.5 rounded-md text-[10px] font-bold shadow-sm cursor-pointer transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                <input type="checkbox" checked={isPinMode} onChange={e => setIsPinMode(e.target.checked)} className="accent-indigo-600 w-3 h-3 cursor-pointer" />
                <MapPin className="w-3 h-3" /><span>핀 설정</span>
             </label>
             <label className={`flex items-center space-x-1 border px-2 py-1.5 rounded-md text-[10px] font-bold shadow-sm cursor-pointer transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                <input type="checkbox" checked={showMapPhotos} onChange={e => setShowMapPhotos(e.target.checked)} className="accent-indigo-600 w-3 h-3 cursor-pointer" />
                <span>사진</span>
             </label>
             <label className={`flex items-center space-x-1 border px-2 py-1.5 rounded-md text-[10px] font-bold shadow-sm cursor-pointer transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                <input type="checkbox" checked={showMapLabels} onChange={e => setShowMapLabels(e.target.checked)} className="accent-indigo-600 w-3 h-3 cursor-pointer" />
                <span>이름</span>
             </label>
             <button onClick={handleFindMyLocation} className={`border px-2 py-1.5 rounded-md text-[10px] font-bold flex items-center space-x-1 transition-all duration-300 shadow-sm active:scale-95 ${isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                <Compass className="w-3 h-3" /><span>현재 위치</span>
             </button>
             <button onClick={() => { setNavOrigin(null); setNavDest(null); setIsNavModalOpen(true); }} className={`border px-2 py-1.5 rounded-md text-[10px] font-bold flex items-center space-x-1 transition-all duration-300 shadow-sm active:scale-95 ${isDarkMode ? 'bg-green-900/50 border-green-600 text-green-300 hover:bg-green-900/70' : 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'}`}>
                <Navigation className="w-3 h-3" /><span>네비게이션</span>
             </button>
          </div>
        </div>
      </div>

      <div className={`flex-1 relative overflow-hidden min-h-0 flex flex-col items-center justify-center p-0.5 rounded-3xl transition-colors duration-300 ${cardBg}`} style={{touchAction:'none'}}>
        <div className="w-full h-full rounded-3xl overflow-hidden relative">
          {/* 로딩 표시 */}
          {((isKakaoMap && !isKakaoMapLoaded) || (!isKakaoMap && !isLeafletLoaded)) && (
            <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-400'}`}>
              <span className="text-xl animate-spin inline-block mb-2">🔄</span>
              <span className="text-[10px] font-bold">{isKakaoMap ? '카카오맵' : '구글맵'} 로딩 중...</span>
            </div>
          )}
          {/* 우측 상단 지도 타입 토글 */}
          <div className="absolute top-2 right-2 z-30 flex rounded-xl overflow-hidden shadow-md" style={{backdropFilter:'blur(4px)'}}>
            <button
              onClick={() => setMapTypeOverride('kakao')}
              className={`px-2.5 py-1.5 text-[9px] font-black transition-all duration-200 ${isKakaoMap ? 'bg-yellow-400 text-yellow-900' : (isDarkMode ? 'bg-slate-700/90 text-slate-400' : 'bg-white/90 text-slate-400')}`}
            >카카오</button>
            <button
              onClick={() => setMapTypeOverride('leaflet')}
              className={`px-2.5 py-1.5 text-[9px] font-black transition-all duration-200 ${!isKakaoMap ? 'bg-blue-500 text-white' : (isDarkMode ? 'bg-slate-700/90 text-slate-400' : 'bg-white/90 text-slate-400')}`}
            >구글</button>
          </div>
          {/* Leaflet(구글) 지도 — 항상 DOM에 존재, visibility로 전환 */}
          <div id="leaflet-map" ref={mapContainerRef} className="absolute inset-0 z-10 bg-transparent w-full h-full cursor-crosshair outline-none" style={{visibility: isKakaoMap ? 'hidden' : 'visible', touchAction:'pan-x pan-y'}}></div>
          {/* 카카오맵 — 항상 DOM에 존재, visibility로 전환 */}
          <div ref={kakaoMapContainerRef} className="absolute inset-0 z-10 w-full h-full cursor-crosshair" style={{visibility: isKakaoMap ? 'visible' : 'hidden', touchAction:'pan-x pan-y'}}></div>
        </div>
      </div>
    </div>
  );
};

export default MapTab;
