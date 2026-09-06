import React, { useState } from 'react';
import { X, Search, Navigation, Compass, Layers, Route, Image, Tag, MapPin, List, Utensils, Bus, Camera, ShoppingBag, BedDouble, MoreHorizontal, Cake } from 'lucide-react';
import { KAKAO_CAT_COLORS } from '../utils/constants';
import { S } from '../utils/helpers';

const CATS = [
  { key: '식당', label: '식당', Icon: Utensils, color: '#f97316' },
  { key: '디저트', label: '디저트', Icon: Cake, color: '#ec4899' },
  { key: '교통편', label: '교통', Icon: Bus, color: '#007AFF' },
  { key: '관광지', label: '관광', Icon: Camera, color: '#10b981' },
  { key: '쇼핑', label: '쇼핑', Icon: ShoppingBag, color: '#8b5cf6' },
  { key: '숙소', label: '숙소', Icon: BedDouble, color: '#f43f7e' },
  { key: '기타', label: '기타', Icon: MoreHorizontal, color: '#64748b' },
];

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
  const [layersOpen, setLayersOpen] = useState(false);

  const themeArr = Array.isArray(myPinsThemeFilter) ? myPinsThemeFilter : [myPinsThemeFilter];
  const isAllCats = themeArr.includes('all') || !CATS.some(c => themeArr.includes(c.key));
  const selectCat = (key) => setMyPinsThemeFilter(themeArr.includes(key) ? ['all'] : [key]);

  const ToggleRow = ({ label, Icon, checked, onChange }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-[12px] font-semibold transition-colors ${checked ? 'bg-[#007AFF]/10 text-[#007AFF]' : (isDarkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100')}`}
    >
      <span className="flex items-center gap-2"><Icon className="w-3.5 h-3.5" /> {label}</span>
      <span className={`relative h-4 w-7 rounded-full transition-colors ${checked ? 'bg-[#007AFF]' : (isDarkMode ? 'bg-slate-600' : 'bg-slate-300')}`}>
        <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${checked ? 'left-3.5' : 'left-0.5'}`} />
      </span>
    </button>
  );

  return (
    <div
      style={{ fontFamily: "'Be Vietnam Pro', system-ui, -apple-system, sans-serif" }}
      className={`absolute inset-0 flex flex-col overflow-hidden transition-opacity duration-300 ${isDarkMode ? 'bg-slate-900' : 'bg-[#faf9fe]'} ${activeTab === 'map' ? 'visible opacity-100 z-10' : 'invisible opacity-0 -z-10 pointer-events-none'}`}
    >
      {/* 헤더: Day pills + 카테고리 칩 */}
      <div className="flex-shrink-0 px-3 pt-3 pb-2 flex flex-col gap-2 relative z-20">
        {/* Day 필터 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => toggleMapDay('all')}
            className={`px-4 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 border transition-all ${mapActiveDays.includes('all') ? 'bg-slate-700 text-white border-slate-700' : (isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-600' : 'bg-white text-slate-500 border-slate-300')}`}
          >전체</button>
          {tripDays.map(d => {
            const color = getDayColor(d);
            const isActive = mapActiveDays.includes(d);
            return (
              <button
                key={d}
                onClick={() => toggleMapDay(d)}
                style={{ backgroundColor: isActive ? color : (isDarkMode ? '#1e293b' : 'white'), color: isActive ? 'white' : color, borderColor: color }}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold border whitespace-nowrap shrink-0 transition-all ${isActive ? 'shadow-sm' : 'hover:opacity-80'}`}
              >Day {d}</button>
            );
          })}
          <button
            onClick={() => toggleMapDay('unlinked')}
            className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 border transition-all ${mapActiveDays.includes('unlinked') ? 'bg-slate-500 text-white border-slate-500' : (isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-white text-slate-500 border-slate-300')}`}
          >미지정 핀</button>
        </div>

        {/* 카테고리 칩 (단일 선택) */}
        <div className="flex items-start gap-3 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => setMyPinsThemeFilter(['all'])} className="flex flex-col items-center gap-1 shrink-0">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold"
              style={{ backgroundColor: isAllCats ? '#007AFF' : '#007AFF1a', color: isAllCats ? '#fff' : '#007AFF' }}
            >All</span>
            <span className={`text-[10px] font-semibold ${isAllCats ? 'text-[#007AFF]' : textMuted}`}>전체</span>
          </button>
          {CATS.map(({ key, label, Icon, color }) => {
            const on = themeArr.includes(key);
            return (
              <button key={key} onClick={() => selectCat(key)} className="flex flex-col items-center gap-1 shrink-0">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: on ? color : `${color}1a`, color: on ? '#fff' : color }}
                >
                  <Icon className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-semibold" style={{ color: on ? color : undefined }}>
                  <span className={on ? '' : textMuted}>{label}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* 카카오 장소 카테고리 (카카오맵일 때만) */}
        {isKakaoMap && (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            <button
              onClick={() => setKakaoCategory([])}
              className={`px-2.5 py-1 rounded-full text-[9px] font-bold whitespace-nowrap shrink-0 border transition-all ${kakaoCategory.length === 0 ? 'bg-slate-500 text-white border-slate-500' : (isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-white text-slate-500 border-slate-200')}`}
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
                  className={`px-2.5 py-1 rounded-full text-[9px] font-bold whitespace-nowrap shrink-0 border transition-all ${isActive ? 'shadow-sm' : (isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-white text-slate-500 border-slate-200')}`}
                >{label}</button>
              );
            })}
          </div>
        )}
      </div>

      {/* 지도 영역 (전체 화면) */}
      <div className="flex-1 relative overflow-hidden min-h-0" style={{ touchAction: 'none' }}>
        {/* Leaflet(구글) */}
        <div id="leaflet-map" ref={mapContainerRef} className="absolute inset-0 z-10 bg-transparent w-full h-full cursor-crosshair outline-none" style={{ visibility: isKakaoMap ? 'hidden' : 'visible', touchAction: 'pan-x pan-y' }}></div>
        {/* 카카오맵 */}
        <div ref={kakaoMapContainerRef} className="absolute inset-0 z-10 w-full h-full cursor-crosshair" style={{ visibility: isKakaoMap ? 'visible' : 'hidden', touchAction: 'pan-x pan-y' }}></div>

        {/* 로딩 */}
        {((isKakaoMap && !isKakaoMapLoaded) || (!isKakaoMap && !isLeafletLoaded)) && (
          <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-400'}`}>
            <span className="text-xl animate-spin inline-block mb-2">🔄</span>
            <span className="text-[10px] font-bold">{isKakaoMap ? '카카오맵' : '구글맵'} 로딩 중...</span>
          </div>
        )}

        {/* 떠 있는 검색창 */}
        <div className="absolute top-3 left-3 right-3 z-30">
          <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.08)] backdrop-blur-md ${isDarkMode ? 'border-slate-700 bg-slate-800/90' : 'border-slate-200/70 bg-white/90'}`}>
            <Search className={`w-4 h-4 shrink-0 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              value={S(markerSearchQuery)}
              onChange={e => setMarkerSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && isKakaoMap && kakaoMapInstanceRef.current && window.kakao) {
                  try {
                    kakaoSearchMarkersRef.current.forEach(m => { try { m.setMap(null); } catch (_) {} });
                    kakaoSearchMarkersRef.current = [];
                    const kakao = window.kakao;
                    const ps = new kakao.maps.services.Places();
                    ps.keywordSearch(markerSearchQuery, (data, status) => {
                      if (status === kakao.maps.services.Status.OK && data.length > 0) {
                        kakaoMapInstanceRef.current.setCenter(new kakao.maps.LatLng(parseFloat(data[0].y), parseFloat(data[0].x)));
                        kakaoMapInstanceRef.current.setLevel(4);
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
                  } catch (e) {}
                }
              }}
              placeholder={isKakaoMap ? "장소 검색 (한국어·영어·주소)..." : "내 지도 핀 검색..."}
              className={`w-full bg-transparent text-[13px] font-medium focus:outline-none ${isDarkMode ? 'text-white placeholder-slate-400' : 'text-slate-800 placeholder-slate-400'}`}
            />
            {markerSearchQuery && (
              <button onClick={() => {
                setMarkerSearchQuery("");
                kakaoSearchMarkersRef.current.forEach(m => { try { m.setMap(null); } catch (_) {} });
                kakaoSearchMarkersRef.current = [];
              }} className="shrink-0 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            )}
          </div>
          {markerSearchQuery && filteredMarkers.length > 0 && (
            <div className={`mt-1 border rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'}`}>
              {filteredMarkers.map(marker => (
                <button
                  key={marker.id}
                  onClick={() => handleMarkerSearchSelect(marker)}
                  className={`w-full text-left px-3 py-2.5 text-[12px] font-semibold border-b last:border-0 flex items-center ${isDarkMode ? 'text-slate-200 border-slate-700 hover:bg-slate-700' : 'text-slate-700 border-slate-100 hover:bg-[#007AFF]/5'}`}
                >
                  <span className={`w-2 h-2 rounded-full mr-2.5 ${planTimeline.some(p => S(p.place) === S(marker.name)) ? 'bg-orange-500' : 'bg-[#007AFF]'}`}></span>
                  <span className="truncate flex-1">{S(marker.name)}</span>
                  <span className={`text-[10px] ml-2 ${textMuted}`}>{S(marker.city)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 지도 타입 토글 (우상단) */}
        <div className="absolute top-[68px] right-3 z-30 flex rounded-lg overflow-hidden shadow-md">
          <button onClick={() => setMapTypeOverride('kakao')} className={`px-2.5 py-1 text-[9px] font-black ${isKakaoMap ? 'bg-yellow-400 text-yellow-900' : (isDarkMode ? 'bg-slate-700/90 text-slate-400' : 'bg-white/90 text-slate-400')}`}>카카오</button>
          <button onClick={() => setMapTypeOverride('leaflet')} className={`px-2.5 py-1 text-[9px] font-black ${!isKakaoMap ? 'bg-[#007AFF] text-white' : (isDarkMode ? 'bg-slate-700/90 text-slate-400' : 'bg-white/90 text-slate-400')}`}>구글</button>
        </div>

        {/* Map Layers 패널 */}
        {layersOpen && (
          <div className={`absolute bottom-[176px] right-3 z-40 w-56 rounded-2xl border p-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.15)] flex flex-col gap-1 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/70'}`}>
            <div className={`px-1 pb-1 text-[11px] font-bold ${textMuted}`}>지도 레이어</div>
            <ToggleRow label="루트 표기" Icon={Route} checked={showMapRoute} onChange={setShowMapRoute} />
            <ToggleRow label="사진 표시" Icon={Image} checked={showMapPhotos} onChange={setShowMapPhotos} />
            <ToggleRow label="이름 표시" Icon={Tag} checked={showMapLabels} onChange={setShowMapLabels} />
            <ToggleRow label="핀 설정 모드" Icon={MapPin} checked={isPinMode} onChange={setIsPinMode} />
            <button
              onClick={() => { setIsMyPinsModalOpen(true); setLayersOpen(false); }}
              className={`mt-1 flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-[12px] font-bold transition-colors ${isDarkMode ? 'border-slate-600 text-slate-200 hover:bg-slate-700' : 'border-slate-200 text-slate-700 hover:bg-slate-100'}`}
            >
              <List className="w-3.5 h-3.5" /> 내 핀 목록
            </button>
          </div>
        )}

        {/* 우하단 플로팅 버튼 */}
        <div className="absolute bottom-5 right-3 z-30 flex flex-col items-center gap-2">
          <button
            onClick={handleFindMyLocation}
            className={`flex h-10 w-10 items-center justify-center rounded-full border text-[#007AFF] shadow-lg transition-transform active:scale-95 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/70'}`}
            aria-label="현재 위치"
          >
            <Compass className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setNavOrigin(null); setNavDest(null); setIsNavModalOpen(true); }}
            className={`flex h-14 w-14 flex-col items-center justify-center rounded-full border text-[#007AFF] shadow-xl transition-transform active:scale-95 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/70'}`}
          >
            <Navigation className="w-5 h-5" />
            <span className="mt-0.5 text-[8px] font-bold">길찾기</span>
          </button>
          <button
            onClick={() => setLayersOpen(o => !o)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-[11px] font-bold shadow-lg transition-transform active:scale-95 ${layersOpen ? 'bg-[#007AFF] text-white border-[#007AFF]' : (isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200/70 text-slate-600')}`}
          >
            <Layers className="w-3.5 h-3.5" /> 레이어
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapTab;
