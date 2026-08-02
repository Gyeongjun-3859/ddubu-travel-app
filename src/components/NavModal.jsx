import React from 'react';
import { X, Navigation, MapPin } from 'lucide-react';
import { S, openExternalUrl } from '../utils/helpers';

const NavModal = ({
  isOpen, onClose, isDarkMode, currentRestaurants,
  navOrigin, setNavOrigin, navDest, setNavDest, navWaypoints, setNavWaypoints,
  navSelectingFor, setNavSelectingFor, navDayFilter, setNavDayFilter,
  planTimeline, tripDays, getDayColor, showToast,
}) => {
  if (!isOpen) return null;

  const validPins = currentRestaurants.filter(r => r && r.lat && r.lng);
  // 구글 맵 길 안내 실행
  const openGoogleNav = (mode) => {
    const wps = navWaypoints.filter(w => w);
    const origin = `${navOrigin.lat},${navOrigin.lng}`;
    const dest = `${navDest.lat},${navDest.lng}`;
    const waypointStr = wps.map(w => `${w.lat},${w.lng}`).join('|');
    const webUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}${waypointStr ? `&waypoints=${waypointStr}` : ''}&travelmode=${mode}`;
    openExternalUrl(webUrl);
    onClose();
  };
  // 카카오맵 네비게이션 실행 (앱 딥링크 → 웹 폴백)
  const openKakaoNav = (by) => {
    const sp = `${navOrigin.lat},${navOrigin.lng}`;
    const ep = `${navDest.lat},${navDest.lng}`;
    const appUrl = `kakaomap://route?sp=${sp}&ep=${ep}&by=${by}`;
    const webUrl = `https://map.kakao.com/link/to/${encodeURIComponent(S(navDest.name))},${navDest.lat},${navDest.lng}/from/${encodeURIComponent(S(navOrigin.name))},${navOrigin.lat},${navOrigin.lng}`;
    // 앱 딥링크 시도 후 1.5초 내 반응 없으면 웹으로 폴백
    const fallback = setTimeout(() => openExternalUrl(webUrl), 1500);
    window.location.href = appUrl;
    window.addEventListener('blur', () => clearTimeout(fallback), { once: true });
    onClose();
  };
  const selectingLabel = navSelectingFor === 'origin' ? '출발지' : navSelectingFor === 'dest' ? '도착지' : navSelectingFor !== null ? `경유지 ${navSelectingFor + 1}` : null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[9500] backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300" onClick={onClose}>
      <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]`} onClick={e => e.stopPropagation()}>
        <div className={`flex items-center justify-between p-4 border-b shrink-0 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
          <h3 className={`text-sm font-black flex items-center gap-1.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}><Navigation className="w-4 h-4" />경로 네비게이션</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg"><X className="w-[1em] h-[1em] inline" /></button>
        </div>
        <div className="p-4 space-y-2 overflow-y-auto">
          {/* 출발지 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-black text-green-500">🟢 출발지</p>
              {!navOrigin && <button onClick={() => {
                if (!navigator.geolocation) { showToast("위치 기능을 지원하지 않습니다."); return; }
                navigator.geolocation.getCurrentPosition((pos) => {
                  setNavOrigin({ id: '__my_location__', name: '📍 내 현재 위치', lat: pos.coords.latitude, lng: pos.coords.longitude });
                  setNavSelectingFor(null);
                }, () => showToast("위치 권한이 필요합니다."), { enableHighAccuracy: true, timeout: 10000 });
              }} className="text-[10px] font-black text-blue-500 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-700 transition-colors inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> 현재 위치 사용</button>}
            </div>
            <div onClick={() => setNavSelectingFor(navSelectingFor === 'origin' ? null : 'origin')}
              className={`flex items-center p-2.5 rounded-xl border-2 cursor-pointer transition-all ${navSelectingFor === 'origin' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : navOrigin ? 'border-green-400 bg-green-50/50 dark:bg-green-900/10' : 'border-dashed border-slate-300 dark:border-slate-600 hover:border-green-300'}`}>
              <span className="text-xs font-black truncate flex-1 ${navOrigin ? 'text-green-700 dark:text-green-300' : 'text-slate-400'}">{navOrigin ? navOrigin.name : '목록에서 선택'}</span>
              {navOrigin && <button onClick={e => { e.stopPropagation(); setNavOrigin(null); }} className="ml-2 text-slate-400 hover:text-red-400 shrink-0 text-xs"><X className="w-[1em] h-[1em] inline" /></button>}
            </div>
          </div>

          {/* 출발↔도착 스왑 버튼 */}
          <div className="flex items-center justify-center">
            <button onClick={() => { const tmp = navOrigin; setNavOrigin(navDest); setNavDest(tmp); }}
              className={`p-1.5 rounded-full border transition-all active:scale-90 ${isDarkMode ? 'bg-slate-700 border-slate-600 hover:bg-slate-600' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'}`} title="출발/도착 바꾸기">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* 경유지 */}
          {navWaypoints.map((wp, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-black text-orange-400">🟠 경유지 {idx + 1}</p>
              </div>
              <div onClick={() => setNavSelectingFor(navSelectingFor === idx ? null : idx)}
                className={`flex items-center p-2.5 rounded-xl border-2 cursor-pointer transition-all ${navSelectingFor === idx ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20' : wp ? 'border-orange-300 bg-orange-50/50 dark:bg-orange-900/10' : 'border-dashed border-slate-300 dark:border-slate-600 hover:border-orange-300'}`}>
                <span className="text-xs font-black truncate flex-1">{wp ? wp.name : '목록에서 선택'}</span>
                <button onClick={e => { e.stopPropagation(); setNavWaypoints(prev => prev.filter((_, i) => i !== idx)); }} className="ml-2 text-slate-400 hover:text-red-400 shrink-0 text-xs"><X className="w-[1em] h-[1em] inline" /></button>
              </div>
            </div>
          ))}

          {/* 도착지 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-black text-indigo-500">🔵 도착지</p>
              <button onClick={() => setNavWaypoints(prev => [...prev, null])}
                className="text-[10px] font-black text-orange-500 hover:text-orange-700 bg-orange-50 dark:bg-orange-900/30 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-700 transition-colors">+ 경유지 추가</button>
            </div>
            <div onClick={() => setNavSelectingFor(navSelectingFor === 'dest' ? null : 'dest')}
              className={`flex items-center p-2.5 rounded-xl border-2 cursor-pointer transition-all ${navSelectingFor === 'dest' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : navDest ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10' : 'border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-300'}`}>
              <span className="text-xs font-black truncate flex-1">{navDest ? navDest.name : '목록에서 선택'}</span>
              {navDest && <button onClick={e => { e.stopPropagation(); setNavDest(null); }} className="ml-2 text-slate-400 hover:text-red-400 shrink-0 text-xs"><X className="w-[1em] h-[1em] inline" /></button>}
            </div>
          </div>

          {/* 핀 목록 — 선택 중일 때만 표시 */}
          {navSelectingFor !== null && (() => {
            // Day별 핀 분류
            const safeTimeline = Array.isArray(planTimeline) ? planTimeline.filter(Boolean) : [];
            const linkedPinNames = new Set(safeTimeline.map(p => S(p.place).trim()));
            const pinsByDay = {};
            tripDays.forEach(d => { pinsByDay[d] = []; });
            safeTimeline.forEach(p => {
              const pin = validPins.find(r => S(r.name).trim() === S(p.place).trim());
              if (pin && p.day) {
                const d = parseInt(p.day);
                if (!pinsByDay[d]) pinsByDay[d] = [];
                if (!pinsByDay[d].find(x => x.id === pin.id)) pinsByDay[d].push(pin);
              }
            });
            const unlinkedPins = validPins.filter(r => !linkedPinNames.has(S(r.name).trim()));

            // 현재 필터에 따른 표시 핀
            let shownPins;
            if (navDayFilter === 'unlinked') shownPins = unlinkedPins;
            else if (navDayFilter === 'all') shownPins = validPins;
            else shownPins = pinsByDay[navDayFilter] || [];

            return (
              <div className={`border rounded-xl overflow-hidden ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                <p className={`text-[10px] font-black px-3 py-2 border-b ${isDarkMode ? 'bg-slate-700 text-slate-300 border-slate-600' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                  {selectingLabel} 선택 중 — 핀을 눌러주세요
                </p>
                {/* Day 탭 */}
                <div className={`flex overflow-x-auto gap-1 p-2 border-b ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-white'}`}>
                  <button onClick={() => setNavDayFilter('all')}
                    className={`px-2.5 py-1 rounded-full text-[9px] font-black whitespace-nowrap flex-shrink-0 transition-all ${navDayFilter === 'all' ? 'bg-indigo-600 text-white' : (isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500')}`}>
                    전체
                  </button>
                  {tripDays.map(d => (
                    <button key={d} onClick={() => setNavDayFilter(d)}
                      style={navDayFilter === d ? { background: getDayColor(d), color: 'white' } : { borderColor: getDayColor(d), color: getDayColor(d) }}
                      className={`px-2.5 py-1 rounded-full text-[9px] font-black whitespace-nowrap flex-shrink-0 border transition-all ${navDayFilter === d ? '' : (isDarkMode ? 'bg-slate-800' : 'bg-white')}`}>
                      D{d}
                    </button>
                  ))}
                  <button onClick={() => setNavDayFilter('unlinked')}
                    className={`px-2.5 py-1 rounded-full text-[9px] font-black whitespace-nowrap flex-shrink-0 border transition-all ${navDayFilter === 'unlinked' ? 'bg-slate-600 text-white border-slate-600' : (isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-600' : 'bg-white text-slate-500 border-slate-300')}`}>
                    미지정
                  </button>
                </div>
                {/* 핀 목록 */}
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                  {shownPins.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">해당하는 핀이 없습니다.</p>
                  ) : shownPins.map(pin => (
                    <button key={pin.id} onClick={() => {
                      if (navSelectingFor === 'origin') setNavOrigin(pin);
                      else if (navSelectingFor === 'dest') setNavDest(pin);
                      else setNavWaypoints(prev => prev.map((w, i) => i === navSelectingFor ? pin : w));
                      setNavSelectingFor(null);
                      setNavDayFilter('all');
                    }} className={`w-full flex items-center space-x-2 px-3 py-2 text-left transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}>
                      <span style={{ color: getDayColor(safeTimeline.find(p => S(p.place).trim() === S(pin.name).trim())?.day) || '#94a3b8' }} className="text-xs">📍</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-black truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{S(pin.name)}</p>
                        {pin.localName && <p className="text-[10px] text-slate-400 truncate">{S(pin.localName)}</p>}
                      </div>
                      {(() => {
                        const linked = safeTimeline.find(p => S(p.place).trim() === S(pin.name).trim());
                        return linked ? <span style={{ background: getDayColor(linked.day) }} className="text-[8px] font-black text-white px-1.5 py-0.5 rounded-full flex-shrink-0">D{linked.day}</span> : null;
                      })()}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* 이동 수단 → 출발 */}
          {navOrigin && navDest && (
            <div className="space-y-2 pt-1">
              {/* 구글 네비 */}
              <p className={`text-[9px] font-bold px-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>구글맵</p>
              <div className="grid grid-cols-3 gap-2">
                {[['walking','🚶 도보'],['driving','🚗 자동차'],['transit','🚌 대중교통']].map(([mode, label]) => (
                  <button key={mode} onClick={() => openGoogleNav(mode)}
                    className="bg-green-500 hover:bg-green-600 active:scale-95 text-white py-2.5 rounded-xl text-[11px] font-black transition-all shadow-md">
                    {label}
                  </button>
                ))}
              </div>
              {/* 카카오 네비 */}
              <p className={`text-[9px] font-bold px-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>🟡 카카오맵</p>
              <div className="grid grid-cols-3 gap-2">
                {[['CAR','🚗 자동차'],['PUBLICTRANSIT','🚌 대중교통'],['WALK','🚶 도보']].map(([by, label]) => (
                  <button key={by} onClick={() => openKakaoNav(by)}
                    className="bg-yellow-400 hover:bg-yellow-500 active:scale-95 text-yellow-900 py-2.5 rounded-xl text-[11px] font-black transition-all shadow-md">
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavModal;
