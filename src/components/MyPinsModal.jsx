import React from 'react';
import { X, MapPin, Compass, Trash2 } from 'lucide-react';
import { S, openGoogleMapsNav } from '../utils/helpers';
import { tombstone } from '../sync/tripDataModel';

const MyPinsModal = ({
  isOpen, onClose, cardBg, isDarkMode,
  myPinsFilter, setMyPinsFilter, tripDays, myPinsThemeFilter, setMyPinsThemeFilter,
  filteredMyPins, planTimeline,
  setClickedLocation, setNewManualPlaceName, setNewManualLocalName, setNewManualFeature,
  setNewManualPhoto, setNewManualIsAccommodation, setPinLinkDay, setPinLinkPlanId,
  setNewManualTime, setIsAddPlaceModalOpen,
  setViewPhoto, pinQuickView, setPinQuickView,
  activeTab, setActiveTab, isKakaoMap, kakaoMapInstanceRef, mapInstanceRef, pendingMapFlyRef,
  setMovingPinId, setIsPinMode, showToast, openEditPinModal,
  safeCurrentRestaurants, setCurrentRestaurants, saveToDb, handleCopyLocalName,
}) => {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[3500] backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300" onClick={onClose}>
          <div className={`${cardBg} w-full max-w-5xl flex flex-col animate-in zoom-in-95 duration-300 max-h-[85vh] rounded-3xl overflow-hidden`} onClick={e => e.stopPropagation()}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b gap-3 ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'}`}>
              <h3 className="text-sm font-black flex items-center gap-1.5 shrink-0"><MapPin className="w-4 h-4 text-indigo-500" /> 내 핀/장소 목록</h3>

              <div className="flex items-center space-x-1 overflow-x-auto custom-scrollbar flex-1 pb-1 sm:pb-0 scroll-smooth">
                 <button onClick={() => setMyPinsFilter('all')} className={`px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors ${myPinsFilter === 'all' ? 'bg-indigo-600 text-white shadow' : (isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500 hover:bg-slate-300')}`}>전체보기</button>
                 {tripDays.map(d => (
                    <button key={d} onClick={() => setMyPinsFilter(d)} className={`px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors ${myPinsFilter === d ? 'bg-indigo-600 text-white shadow' : (isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500 hover:bg-slate-300')}`}>Day {d}</button>
                 ))}
                 <button onClick={() => setMyPinsFilter('unlinked')} className={`px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors border ${myPinsFilter === 'unlinked' ? 'bg-slate-600 text-white border-slate-600 shadow' : (isDarkMode ? 'bg-slate-700 text-slate-400 border-transparent' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50')}`}>미지정 핀</button>
                 <select value={Array.isArray(myPinsThemeFilter) ? myPinsThemeFilter[0] : myPinsThemeFilter} onChange={e => setMyPinsThemeFilter([e.target.value])} className={`ml-2 px-2 py-1 rounded-full text-[10px] font-bold outline-none cursor-pointer transition-colors border ${isDarkMode ? 'bg-slate-700 text-slate-300 border-slate-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>                    <option value="all">테마 전체</option>
                    <option value="교통편">교통편 🚌</option>
                    <option value="식당">식당 🍽️</option>
                    <option value="디저트">디저트 🍰</option>
                    <option value="관광지">관광지 📸</option>
                    <option value="쇼핑">쇼핑 🛍️</option>
                    <option value="숙소">숙소 🏠</option>
                    <option value="기타">기타 📌</option>
                 </select>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <button onClick={() => {
                  onClose();
                  setClickedLocation(null);
                  setNewManualPlaceName("");
                  setNewManualLocalName("");
                  setNewManualFeature("");
                  setNewManualPhoto("");
                  setNewManualIsAccommodation(false);
                  setPinLinkDay("");
                  setPinLinkPlanId("");
                  setNewManualTime("");
                  setIsAddPlaceModalOpen(true);
                }} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center shadow-sm hover:bg-indigo-700 active:scale-95 transition-all duration-300">
                  <span className="mr-1 text-sm">➕</span> 새 장소 추가
                </button>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg transition-colors"><X className="w-[1em] h-[1em] inline" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50 scroll-smooth">
              {filteredMyPins.length === 0 ? (
                <div className="text-center py-20 text-xs font-bold text-slate-400 flex flex-col items-center">
                  <span className="text-4xl mb-3 opacity-20">📍</span>
                  등록된 핀이 없습니다.<br/>우측 상단의 '새 장소 추가'를 눌러 장소를 기록해보세요!
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {filteredMyPins.map(pin => (
                    <div key={pin.id} className={`flex flex-col p-2 border rounded-xl shadow-sm transition-all duration-300 hover:shadow-md ${isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-slate-200 bg-white'} relative group`}>

                      {pin.isLandmark && <div className="absolute top-1 right-1 bg-yellow-400 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm z-10">👑 랜드마크</div>}

                      {pin.img && !S(pin.img).includes("unsplash") ? (
                        <div className="w-full h-20 mb-1.5 rounded-lg overflow-hidden relative shrink-0 cursor-pointer" onClick={() => { const pinImgs = Array.isArray(pin.imgs) && pin.imgs.length > 0 ? pin.imgs : (pin.img ? [pin.img] : []); if (pinImgs.length > 0) setViewPhoto({ imgs: pinImgs, idx: 0 }); }}>
                          <img src={pin.img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="" />
                          {pin.isAccommodation && <div className="absolute top-1 left-1 bg-yellow-400 text-white text-[8px] font-black px-1 py-0.5 rounded shadow-sm z-10">숙소</div>}
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                            <span className="opacity-0 hover:opacity-100 text-white text-[9px] font-bold bg-black/50 px-2 py-0.5 rounded-full transition-opacity">🔍 크게 보기</span>
                          </div>
                        </div>
                      ) : (
                        <div className={`w-full h-12 flex items-center justify-center rounded-lg mb-1.5 shrink-0 transition-colors ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                          {pin.isAccommodation ? '🏠 숙소' : '📍 장소'}
                        </div>
                      )}

                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-center mb-1 gap-1">
                          <span className="text-[8px] font-bold bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 px-1 py-0.5 rounded shrink-0">
                            {(() => {
                               const linked = planTimeline.find(p => p && S(p.place).trim() === S(pin.name).trim());
                               return linked?.theme || pin.theme || '기타';
                            })()}
                          </span>
                          <h4 className="text-[11px] font-black text-slate-900 dark:text-white truncate leading-tight flex-1 cursor-pointer hover:text-indigo-500 transition-colors" onClick={() => setPinQuickView(pin)}>{S(pin.name)}</h4>
                          {pin.lat && pin.lng && (
                            <button onClick={() => {
                              onClose();
                              if (activeTab === 'map') {
                                // 이미 지도 탭 — 즉시 이동
                                setTimeout(() => {
                                  if (isKakaoMap && kakaoMapInstanceRef.current && window.kakao) {
                                    kakaoMapInstanceRef.current.setCenter(new window.kakao.maps.LatLng(pin.lat, pin.lng));
                                    kakaoMapInstanceRef.current.setLevel(3);
                                  } else if (mapInstanceRef.current) {
                                    mapInstanceRef.current.flyTo([pin.lat, pin.lng], 17);
                                  }
                                  window.dispatchEvent(new CustomEvent('onPinClick', { detail: String(pin.id) }));
                                }, 100);
                              } else {
                                // 다른 탭 → 탭 전환 후 이동 (pendingMapFlyRef 경로)
                                pendingMapFlyRef.current = { lat: pin.lat, lng: pin.lng, id: pin.id };
                                setActiveTab('map');
                              }
                            }} className="shrink-0 bg-indigo-500 hover:bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded transition-colors" title="지도에서 위치 보기">
                              📍이동
                            </button>
                          )}
                        </div>
                        {pin.localName && (
                          <p className="text-[9px] font-bold text-indigo-500 truncate cursor-pointer hover:opacity-80 leading-tight mb-0.5 transition-opacity" onClick={(e) => handleCopyLocalName(e, pin.localName)}>
                            📋 {S(pin.localName)}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-1 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700">
                        <button onClick={(e) => {
                          e.stopPropagation();
                          setMovingPinId(pin.id);
                          setIsPinMode(true);
                          onClose();
                          setActiveTab('map');
                          showToast("🗺️ 지도에서 핀을 꽂을 위치를 클릭해주세요!");
                        }} className="flex-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 py-1 rounded text-[9px] font-bold hover:bg-emerald-100 transition-colors duration-300">
                          위치 지정
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); openEditPinModal(pin); }} className="flex-1 bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 py-1 rounded text-[9px] font-bold hover:bg-slate-200 transition-colors duration-300">
                          수정
                        </button>
                        <button onClick={(e) => {
                           e.stopPropagation();
                           const updated = safeCurrentRestaurants.filter(r => r && S(r.id) !== S(pin.id));
                           setCurrentRestaurants(updated);
                           // [삭제 표식] 배열에서 그냥 빼기만 하면 공유 여행에서 되살아날 수 있어, DB에는 tombstone을 남긴다.
                           saveToDb({ current_restaurants: [...updated, tombstone(pin.id)] });
                           showToast("핀이 삭제되었습니다.");
                        }} className="w-6 flex items-center justify-center bg-rose-50 text-rose-500 dark:bg-rose-900/30 dark:text-rose-400 py-1 rounded hover:bg-rose-100 transition-colors duration-300">
                           <span className="text-[10px]"><Trash2 className="w-[1em] h-[1em] inline" /></span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {pinQuickView && (
        <div className="fixed inset-0 bg-black/60 z-[9500] backdrop-blur-sm flex items-center justify-center p-6 transition-opacity duration-300" onClick={() => setPinQuickView(null)}>
          <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300`} onClick={e => e.stopPropagation()}>
            {pinQuickView.img && !S(pinQuickView.img).includes("unsplash") && (
              <div className="w-full h-44 relative cursor-pointer" onClick={() => { const qImgs = Array.isArray(pinQuickView.imgs) && pinQuickView.imgs.length > 0 ? pinQuickView.imgs : (pinQuickView.img ? [pinQuickView.img] : []); setPinQuickView(null); if (qImgs.length > 0) setViewPhoto({ imgs: qImgs, idx: 0 }); }}>
                <img src={pinQuickView.img} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="opacity-0 hover:opacity-100 text-white text-xs font-bold bg-black/50 px-3 py-1 rounded-full transition-opacity">🔍 크게 보기</span>
                </div>
              </div>
            )}
            <div className="p-4 flex flex-col space-y-3">
              <h3 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{S(pinQuickView.name)}</h3>
              {pinQuickView.localName && (
                <button onClick={(e) => handleCopyLocalName(e, pinQuickView.localName)} className="flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 px-3 py-2 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors text-left">
                  <span>📋</span>
                  <span className="truncate">{S(pinQuickView.localName)}</span>
                  <span className="ml-auto shrink-0 bg-indigo-100 dark:bg-indigo-800 px-2 py-0.5 rounded-full text-[10px]">복사</span>
                </button>
              )}
              {pinQuickView.lat && pinQuickView.lng && (
                <button onClick={() => { setPinQuickView(null); openGoogleMapsNav(pinQuickView.lat, pinQuickView.lng, 'driving'); }} className="w-full bg-green-500 hover:bg-green-600 active:scale-95 text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1">
                  <Compass className="w-3.5 h-3.5" /><span>현재 위치에서 길 안내</span>
                </button>
              )}
              <button onClick={() => setPinQuickView(null)} className={`w-full py-2.5 rounded-xl text-xs font-bold transition-colors ${isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MyPinsModal;
