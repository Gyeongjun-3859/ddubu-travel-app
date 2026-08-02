import React from 'react';
import { X, Home } from 'lucide-react';
import { S, compressAndStoreImage } from '../utils/helpers';

const AddPlaceModal = ({
  isOpen, onClose, cardBg, isDarkMode, textMuted, inputBg, clickedLocation,
  newManualTheme, setNewManualTheme,
  newManualPlaceName, setNewManualPlaceName,
  newManualLocalName, setNewManualLocalName,
  newManualFeature, setNewManualFeature,
  pinLinkDay, setPinLinkDay, pinLinkPlanId, setPinLinkPlanId,
  newManualTime, setNewManualTime, handleTimeInput,
  tripDays, planTimeline, showToast,
  newManualPhotos, setNewManualPhotos, setNewManualPhoto,
  newManualIsAccommodation, setNewManualIsAccommodation,
  newManualAccommodationDays, setNewManualAccommodationDays,
  newManualIsLandmark, setNewManualIsLandmark,
  manualFileInputRef, supabaseClient, appUserId, activeTripId,
  handleManualPlaceAdd,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[9000] backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300" onClick={onClose}>
      <div className={`${cardBg} w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300`} onClick={e => e.stopPropagation()}>
        <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'}`}>
          <h3 className="text-sm font-black flex items-center">
            <span className="mr-2 text-indigo-500 text-lg">📍</span>
            {clickedLocation?.id ? '핀 정보 수정' : '새 지도 핀 등록'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg transition-colors"><X className="w-[1em] h-[1em] inline" /></button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto max-h-[60vh] custom-scrollbar scroll-smooth">
          <div className="flex flex-col space-y-1">
          <div className="flex flex-col space-y-1 mb-3">
            <label className={`text-[9px] font-bold ${textMuted} px-1`}>테마 분류</label>
            <select value={newManualTheme} onChange={e => setNewManualTheme(e.target.value)} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm rounded-lg transition-all duration-300`}>
              <option value="교통편">교통편 🚌</option>
              <option value="식당">식당 🍽️</option>
              <option value="디저트">디저트 🍰</option>
              <option value="관광지">관광지 📸</option>
<option value="쇼핑">쇼핑 🛍️</option>
            <option value="숙소">숙소 🏠</option>
            <option value="기타">기타 📌</option>
            </select>
          </div>
            <label className={`text-[9px] font-bold ${textMuted} px-1`}>장소 이름 (필수)</label>
            <input type="text" placeholder="예: 에펠탑" value={newManualPlaceName} onChange={e => setNewManualPlaceName(e.target.value)} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm rounded-lg transition-all duration-300`} />
          </div>

          <div className="flex flex-col space-y-1">
            <label className={`text-[9px] font-bold ${textMuted} px-1`}>현지어 이름 (복사용)</label>
            <input type="text" placeholder="예: Tour Eiffel" value={newManualLocalName} onChange={e => setNewManualLocalName(e.target.value)} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm rounded-lg transition-all duration-300`} />
          </div>

          <div className="flex flex-col space-y-1">
            <label className={`text-[9px] font-bold ${textMuted} px-1`}>메모 / 특징</label>
            <input type="text" placeholder="간단한 메모 입력" value={newManualFeature} onChange={e => setNewManualFeature(e.target.value)} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm rounded-lg transition-all duration-300`} />
          </div>

          <div className="flex flex-col space-y-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700 transition-colors duration-300">
            <div className="flex space-x-2 items-end">
              <div className={`flex flex-col space-y-1 ${pinLinkDay ? 'w-1/3' : 'w-full'} transition-all duration-300`}>
                <label className={`text-[9px] font-bold ${textMuted} px-1`}>일정 동기화</label>
                <select value={pinLinkDay} onChange={e => {
                   setPinLinkDay(e.target.value);
                   setPinLinkPlanId("");
                   setNewManualTime("");
                }} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-[11px] font-bold focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm rounded-lg cursor-pointer transition-all duration-300`}>
                  <option value="">-- 연동 안 함 --</option>
                  {tripDays.map(d => <option key={d} value={d}>Day {d}</option>)}
                  <option value="0">보관함</option>
                </select>
              </div>
              {pinLinkDay && (
                 <div className="flex flex-col space-y-1 w-2/3 animate-in fade-in duration-300">
                   <label className={`text-[9px] font-bold ${textMuted} px-1`}>기존 일정 연동 (또는 직접 입력)</label>

                   {pinLinkPlanId === 'manual' ? (
                      <div className="relative w-full">
                        <input
                          type="text"
                          placeholder="시간 입력 (예: 09:00)"
                          maxLength="5"
                          value={newManualTime}
                          onChange={e => handleTimeInput(e, setNewManualTime)}
                          autoFocus
                          className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-indigo-300 ring-1 ring-indigo-500'} p-2 text-[10px] font-bold outline-none shadow-sm rounded-lg transition-all duration-300 pr-6`}
                        />
                        <button onClick={() => setPinLinkPlanId("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"><X className="w-[1em] h-[1em] inline" /></button>
                      </div>
                   ) : (
                      <select value={pinLinkPlanId} onChange={e => {
                         const val = e.target.value;
                         setPinLinkPlanId(val);
                         if (val !== 'manual' && val !== '') {
                            const matched = planTimeline.find(p => String(p.id) === String(val));
                            if (matched) {
                               setNewManualTime(matched.time);
                               setNewManualPlaceName(matched.place);
                               if(matched.localName) setNewManualLocalName(matched.localName);
                               if(matched.features && matched.features !== "직접 추가한 장소") setNewManualFeature(matched.features);
                               if(matched.theme) setNewManualTheme(S(matched.theme));
                               setNewManualIsAccommodation(Boolean(matched.isAccommodation));
                               setNewManualAccommodationDays(Array.isArray(matched.accommodationDays) ? matched.accommodationDays : []);
                               const matchedImgs = Array.isArray(matched.photos) && matched.photos.length > 0 ? matched.photos : (matched.photo ? [matched.photo] : []);
                               if (matchedImgs.length > 0) { setNewManualPhotos(matchedImgs); setNewManualPhoto(matchedImgs[0]); }
                               showToast("✨ 선택한 일정의 데이터가 쏙 채워졌어요!");
                            }
                         } else {
                            setNewManualTime("");
                         }
                      }} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-[10px] font-bold outline-none shadow-sm rounded-lg cursor-pointer transition-all duration-300`}>
                         <option value="">-- 일정 선택 --</option>
                         {planTimeline.filter(p => String(p.day) === String(pinLinkDay)).map(p => (
                            <option key={p.id} value={p.id}>[{p.time}] {S(p.place)}</option>
                         ))}
                         <option value="manual">➕ 새 일정으로 (시간 수동 입력)</option>
                      </select>
                   )}
                 </div>
              )}
            </div>
          </div>

          <div className="flex flex-col space-y-1 w-full pt-1">
            <label className={`text-[9px] font-bold px-1 ${textMuted}`}>사진 (최대 3장) 📸</label>
            <input type="file" accept="image/*" multiple ref={manualFileInputRef} onChange={(e) => {
              const files = Array.from(e.target.files || []);
              files.forEach(file => {
                compressAndStoreImage(supabaseClient, appUserId, activeTripId, file, (compressed) => {
                  setNewManualPhotos(prev => {
                    if (prev.length >= 3) return prev;
                    const next = [...prev, compressed];
                    setNewManualPhoto(next[0]);
                    return next;
                  });
                });
              });
              e.target.value = '';
            }} className="hidden" />
            <div className="flex gap-1.5">
              {newManualPhotos.map((img, i) => (
                <div key={i} className={`relative w-16 h-16 rounded-lg overflow-hidden shrink-0 cursor-pointer border-2 ${i === 0 ? 'border-indigo-500' : 'border-slate-200'}`}
                     onClick={() => {
                       setNewManualPhotos(prev => { const next = [...prev]; const [sel] = next.splice(i, 1); next.unshift(sel); setNewManualPhoto(next[0]); return next; });
                       showToast('⭐ 대표사진으로 설정했습니다!');
                     }}>
                  <img src={img} className="w-full h-full object-cover" alt="" />
                  <button type="button" className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px]" onClick={e => { e.stopPropagation(); setNewManualPhotos(prev => { const n = prev.filter((_, j) => j !== i); setNewManualPhoto(n[0] || ''); return n; }); }}><X className="w-[1em] h-[1em] inline" /></button>
                  {i === 0 && <div className="absolute bottom-0 left-0 right-0 bg-indigo-500/80 text-white text-[7px] text-center font-bold">대표</div>}
                </div>
              ))}
              {newManualPhotos.length < 3 && (
                <button type="button" onClick={() => manualFileInputRef.current?.click()} className={`w-16 h-16 rounded-lg border-dashed border-2 flex flex-col items-center justify-center text-[8px] font-bold shrink-0 transition-colors ${isDarkMode ? 'border-slate-500 text-slate-400 hover:bg-slate-700' : 'border-slate-300 text-slate-400 hover:bg-slate-50'}`}>
                  <span className="text-lg">+</span>
                  <span>사진 추가</span>
                </button>
              )}
            </div>
            {newManualPhotos.length < 3 && (
              <input
                type="text"
                placeholder="URL 붙여넣기 후 Enter (웹 사진 복사 후 Ctrl+V)"
                className={`w-full border p-1.5 text-[9px] font-bold focus:ring-1 focus:ring-indigo-500 outline-none rounded transition-all duration-300 ${inputBg} ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'}`}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const url = e.target.value.trim();
                    if (!url) return;
                    setNewManualPhotos(prev => prev.length < 3 ? [...prev, url] : prev);
                    setNewManualPhoto(url);
                    e.target.value = '';
                  }
                }}
                onPaste={e => {
                  const items = e.clipboardData?.items;
                  if (!items) return;
                  for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf('image') !== -1) {
                      e.preventDefault();
                      const file = items[i].getAsFile();
                      compressAndStoreImage(supabaseClient, appUserId, activeTripId, file, compressed => {
                        setNewManualPhotos(prev => prev.length < 3 ? [...prev, compressed] : prev);
                        setNewManualPhoto(compressed);
                      });
                      e.target.value = '';
                      return;
                    }
                  }
                }}
              />
            )}
          </div>

          <div className="flex flex-col my-2 px-1 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 transition-colors duration-300 gap-y-2">
            <div className="flex flex-wrap gap-y-2 items-center">
              <div className="flex items-center space-x-2 mr-3">
                <input type="checkbox" id="manualPlanIsAcc" checked={newManualIsAccommodation} onChange={e => { setNewManualIsAccommodation(e.target.checked); if (!e.target.checked) setNewManualAccommodationDays([]); }} className="accent-indigo-600 w-4 h-4 cursor-pointer" />
                <label htmlFor="manualPlanIsAcc" className={`text-xs font-bold ${textMuted} cursor-pointer flex items-center gap-1`}>이 장소를 숙소로 설정 <Home className="w-3.5 h-3.5" /></label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="manualPlanIsLandmark" checked={newManualIsLandmark} onChange={e => setNewManualIsLandmark(e.target.checked)} className="accent-yellow-500 w-4 h-4 cursor-pointer" />
                <label htmlFor="manualPlanIsLandmark" className={`text-xs font-bold ${textMuted} cursor-pointer`}>랜드마크 지정 👑</label>
              </div>
            </div>
            {newManualIsAccommodation && tripDays.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className={`text-[10px] font-bold ${textMuted} self-center`}>숙박 Day:</span>
                {tripDays.map(d => (
                  <button key={d} type="button"
                    onClick={() => setNewManualAccommodationDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${newManualAccommodationDays.includes(d) ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : (isDarkMode ? 'bg-slate-700 text-slate-300 border-slate-600' : 'bg-white text-slate-500 border-slate-300')}`}>
                    D{d}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex gap-2">
          <button onClick={() => handleManualPlaceAdd(false)} className={`flex-1 ${isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'} rounded-xl py-3 text-xs font-bold shadow-sm active:scale-95 transition-all duration-300`}>
            일단 저장하기 💾
          </button>
          <button onClick={() => handleManualPlaceAdd(true)} className="flex-1 bg-indigo-600 text-white rounded-xl py-3 text-xs font-bold shadow-md hover:bg-indigo-700 active:scale-95 transition-all duration-300">
            지도에 핀 꽂기 📍
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPlaceModal;
