import React from 'react';
import { X, Globe, MapPin, Tag, Clock, Home, Backpack, ShoppingBag } from 'lucide-react';
import { REGIONS_BY_COUNTRY } from '../utils/constants';
import { S, compressAndStoreImage } from '../utils/helpers';
import SelectOrInput from './SelectOrInput';

const PlanFormPanel = ({
  planAddFormRef, textMuted, isDarkMode, inputBg, appTheme,
  maxDay, addDay, removeDay, tripDays,
  newDay, setNewDay,
  planCountry, setPlanCountry, manualCountry, setManualCountry,
  planRegion, setPlanRegion, manualRegion, setManualRegion,
  newTheme, setNewTheme,
  newTime, setNewTime, handleTimeInput,
  newPlace, setNewPlace,
  currentRestaurants, kakaoCategoryResults,
  pinSelectOpen, setPinSelectOpen,
  newLocalName, setNewLocalName,
  newFeatures, setNewFeatures, handleSavePlan,
  newPlanPhotos, setNewPlanPhotos,
  planFileInputRef, handlePlanPhotoUpload,
  supabaseClient, appUserId, activeTripId,
  newIsAccommodation, setNewIsAccommodation,
  newAccommodationDays, setNewAccommodationDays,
  editingPlanId, resetPlanForm,
  setIsPackingModalOpen, setIsShoppingModalOpen,
  globalPlanCountry, globalManualCountry, globalPlanRegion, globalManualRegion,
}) => {
  return (
    <div ref={planAddFormRef} className={`w-full md:w-[22rem] lg:w-96 p-3 sm:p-4 border-b md:border-b-0 md:border-r flex flex-col flex-shrink-0 md:overflow-y-auto custom-scrollbar transition-colors duration-300 ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
      <div className="space-y-2 mt-1">
        <div className="flex items-center justify-between mb-1">
          <label className={`text-[9px] font-bold px-1 transition-colors duration-300 ${textMuted}`}>일차 선택</label>
          <div className="flex space-x-1">
            <button onClick={addDay} className="bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[8px] font-bold shadow-sm hover:bg-indigo-100 transition-colors duration-300">+ Day 추가</button>
            {maxDay > 1 && <button onClick={removeDay} className="bg-rose-50 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded text-[8px] font-bold shadow-sm hover:bg-rose-100 transition-colors duration-300">- Day 삭제</button>}
          </div>
        </div>

        {/* [NEW] 4칸씩 줄바꿈(접힘) 처리되는 그리드 */}
        <div className={`grid gap-1 border rounded-lg p-1 shadow-sm mb-2 max-h-24 overflow-y-auto custom-scrollbar transition-colors duration-300 ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200/80'}`} style={{gridTemplateColumns: `repeat(${Math.min(tripDays.length, 4)}, minmax(0, 1fr))`}}>
          {tripDays.map(d => (
            <button key={d} onClick={() => setNewDay(d)} className={`flex-1 text-[10px] font-black py-1.5 rounded transition-all duration-300 is-tag ${newDay === d ? 'bg-indigo-600 text-white shadow-md scale-110 z-10' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-indigo-100'}`}>D{d}</button>
          ))}
        </div>

        <div className="flex space-x-2">
          <div className="flex flex-col space-y-1 w-1/2">
            <label className={`text-[9px] font-bold px-1 transition-colors duration-300 ${textMuted}`}>국가 <Globe className="w-3 h-3 inline" /></label>
            <div className={`w-full border px-2 py-1.5 h-8 flex items-center rounded transition-colors duration-300 ${inputBg} ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'}`}>
              <SelectOrInput
                inputId="form-country-input"
                value={planCountry} manualValue={manualCountry} isDarkMode={isDarkMode} appTheme={appTheme}
                options={Object.keys(REGIONS_BY_COUNTRY)}
                onChangeSelect={e => {setPlanCountry(e.target.value); setPlanRegion(""); setManualCountry(""); setManualRegion("");}}
                onChangeManual={val => setManualCountry(val)}
                onCancelManual={() => { setPlanCountry(""); setManualCountry(""); }}
              />
            </div>
          </div>
          <div className="flex flex-col space-y-1 w-1/2">
            <label className={`text-[9px] font-bold px-1 transition-colors duration-300 ${textMuted}`}>지역 <MapPin className="w-3 h-3 inline" /></label>
            <div className={`w-full border px-2 py-1.5 h-8 flex items-center rounded transition-colors duration-300 ${inputBg} ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'}`}>
              <SelectOrInput
                inputId="form-region-input"
                value={planRegion} manualValue={manualRegion} isDarkMode={isDarkMode} appTheme={appTheme}
                options={(!planCountry || planCountry === '수동입력') ? null : REGIONS_BY_COUNTRY[planCountry]}
                onChangeSelect={e => {setPlanRegion(e.target.value); setManualRegion("");}}
                onChangeManual={val => setManualRegion(val)}
                onCancelManual={() => { setPlanRegion(""); setManualRegion(""); }}
              />
            </div>
          </div>
        </div>

     <div className="flex space-x-2 items-end">
      <div className="flex flex-col space-y-1 w-1/4">
        <label className={`text-[9px] font-bold px-1 transition-colors duration-300 ${textMuted}`}>테마 <Tag className="w-3 h-3 inline" /></label>
        <select value={newTheme} onChange={e => setNewTheme(e.target.value)} className={`w-full border p-1.5 text-[10px] font-bold focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm rounded transition-all duration-300 ${inputBg} ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'}`}>
          <option value="교통편">교통편</option>
          <option value="식당">식당</option>
          <option value="디저트">디저트</option>
          <option value="관광지">관광지</option>
          <option value="쇼핑">쇼핑</option>
          <option value="숙소">숙소</option>
          <option value="기타">기타</option>
        </select>
      </div>
      <div className="flex flex-col space-y-1 w-1/4">
        <label className={`text-[9px] font-bold px-1 transition-colors duration-300 ${textMuted}`}>시간 <Clock className="w-3 h-3 inline" /></label>
        <input
          type="text"
          maxLength="5"

              value={newTime}
              onChange={(e) => handleTimeInput(e, setNewTime)}
              placeholder="09:00"
              className={`w-full border p-1.5 text-[10px] font-bold focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm rounded transition-all duration-300 ${inputBg} ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'}`}
            />
          </div>
          <div className="flex flex-col space-y-1 flex-1 relative">
            <label className={`text-[9px] font-bold px-1 transition-colors duration-300 ${textMuted}`}>장소 <MapPin className="w-3 h-3 inline" /></label>
            <input
              type="text"
              placeholder="장소 이름 입력"
              value={newPlace}
              onChange={(e) => setNewPlace(e.target.value)}
              className={`w-full border p-1.5 text-[10px] font-bold focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm pr-6 rounded transition-all duration-300 ${inputBg} ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'}`}
            />
          </div>
        </div>

        {/* 내 핀 + 카테고리 검색 결과에서 선택 - 커스텀 드롭다운 */}
        {(currentRestaurants.filter(r => r && r.name).length > 0 || kakaoCategoryResults.length > 0) && (
          <div className="flex flex-col space-y-1">
            <label className={`text-[9px] font-bold px-1 transition-colors duration-300 ${textMuted}`}>
              {kakaoCategoryResults.length > 0 ? '내 핀 / 지도 검색 결과에서 선택 📌' : '내 핀에서 선택 📌'}
            </label>
            <div className="relative" onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setPinSelectOpen(v => !v)}
                className={`w-full border p-1.5 text-[10px] font-bold text-left rounded shadow-sm flex items-center justify-between transition-all duration-300 ${inputBg} ${isDarkMode ? 'border-slate-600 text-slate-200' : 'border-slate-200/80 text-slate-700'}`}
              >
                <span className={textMuted}>— 목록에서 불러오기 —</span>
                <span className="ml-1">{pinSelectOpen ? '▲' : '▼'}</span>
              </button>
              {pinSelectOpen && (
                <div className={`absolute left-0 right-0 top-full mt-1 z-50 border rounded-lg shadow-xl overflow-y-auto max-h-44 custom-scrollbar ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'}`}>
                  {/* 내 핀 목록 */}
                  {currentRestaurants.filter(r => r && r.name).map(pin => (
                    <button
                      key={pin.id}
                      type="button"
                      onClick={() => {
                        setNewPlace(S(pin.name));
                        if (pin.localName) setNewLocalName(S(pin.localName));
                        if (pin.signature && S(pin.signature) !== "직접 추가한 장소") setNewFeatures(S(pin.signature));
                        if (pin.imgs && pin.imgs.length > 0) { setNewPlanPhotos(pin.imgs); } else if (pin.img) { setNewPlanPhotos([S(pin.img)]); }
                        setNewIsAccommodation(Boolean(pin.isAccommodation));
                        setNewTheme(S(pin.theme) || "기타");
                        {
                          const globalC = globalPlanCountry && globalPlanCountry !== '수동입력' ? globalPlanCountry : globalManualCountry;
                          const globalR = globalPlanRegion && globalPlanRegion !== '수동입력' ? globalPlanRegion : globalManualRegion;
                          if (globalC && Object.keys(REGIONS_BY_COUNTRY).includes(globalC)) {
                            setPlanCountry(globalC);
                            const inList = REGIONS_BY_COUNTRY[globalC]?.includes(globalR) ? globalR : '수동입력';
                            setPlanRegion(inList);
                            setManualRegion(inList === '수동입력' ? globalR : '');
                            setManualCountry('');
                          } else if (globalC) {
                            setPlanCountry('수동입력'); setManualCountry(globalC);
                            setPlanRegion('수동입력'); setManualRegion(globalR);
                          }
                        }
                        setPinSelectOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-[10px] font-bold flex items-center gap-1 transition-colors ${isDarkMode ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-indigo-50'}`}
                    >
                      <span>{pin.isAccommodation ? '🏠' : pin.isLandmark ? '⭐' : '📍'}</span>
                      <span className="truncate">{S(pin.name)}{pin.localName ? ` (${S(pin.localName)})` : ''}</span>
                    </button>
                  ))}
                  {/* 카테고리 검색 결과 */}
                  {kakaoCategoryResults.length > 0 && (
                    <>
                      {currentRestaurants.filter(r => r && r.name).length > 0 && (
                        <div className={`px-3 py-1 text-[9px] font-bold border-t ${isDarkMode ? 'text-slate-400 border-slate-600' : 'text-slate-400 border-slate-100'}`}>지도 검색 결과</div>
                      )}
                      {kakaoCategoryResults.map((place, idx) => (
                        <button
                          key={`cat-${idx}`}
                          type="button"
                          onClick={() => {
                            setNewPlace(place.place_name);
                            setPinSelectOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-[10px] font-bold flex items-center gap-1 transition-colors ${isDarkMode ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-rose-50'}`}
                        >
                          <span>🔍</span>
                          <span className="truncate">{place.place_name}</span>
                          {place.road_address_name && <span className={`text-[9px] ml-auto flex-shrink-0 ${textMuted}`}>{place.road_address_name.split(' ').slice(-2).join(' ')}</span>}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex space-x-2 items-end">
          <div className="flex flex-col space-y-1 flex-1">
            <label className={`text-[9px] font-bold px-1 transition-colors duration-300 ${textMuted}`}>현지어(복사용)</label>
            <input type="text" placeholder="현지어 입력" value={newLocalName} onChange={e => setNewLocalName(e.target.value)} className={`w-full border p-1.5 text-[10px] font-bold focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm rounded transition-all duration-300 ${inputBg} ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'}`} />
          </div>
          <div className="flex flex-col space-y-1 flex-1">
            <label className={`text-[9px] font-bold px-1 transition-colors duration-300 ${textMuted}`}>메모</label>
            <input type="text" placeholder="간단 메모" value={newFeatures} onChange={(e) => setNewFeatures(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSavePlan()} className={`w-full border p-1.5 text-[10px] font-bold focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm rounded transition-all duration-300 ${inputBg} ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'}`} />
          </div>
        </div>

        <div className="flex flex-col space-y-1 w-full pt-1">
          <label className={`text-[9px] font-bold px-1 transition-colors duration-300 ${textMuted}`}>사진 추가 (최대 3장)</label>
          <input type="file" accept="image/*" multiple ref={planFileInputRef} onChange={(e) => handlePlanPhotoUpload(e, false)} className="hidden" />
          <div className="flex gap-1.5">
            {newPlanPhotos.map((img, i) => (
              <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border flex-shrink-0 shadow-sm cursor-pointer" style={{borderColor: i === 0 ? '#6366f1' : undefined}} onClick={e => { e.stopPropagation(); if (i !== 0) setNewPlanPhotos(prev => { const arr = [...prev]; arr.splice(i, 1); arr.unshift(img); return arr; }); }}>
                <img src={img} className="w-full h-full object-cover" alt="" />
                <button type="button" onClick={e => { e.stopPropagation(); setNewPlanPhotos(prev => prev.filter((_, idx) => idx !== i)); }} className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] leading-none hover:bg-black/90"><X className="w-[1em] h-[1em] inline" /></button>
                <div className={`absolute bottom-0 left-0 right-0 text-white text-[7px] text-center font-bold py-0.5 ${i === 0 ? 'bg-indigo-600/80' : 'bg-black/40'}`}>{i === 0 ? '대표' : '탭=대표'}</div>
              </div>
            ))}
            {newPlanPhotos.length < 3 && (
              <button type="button" onClick={() => planFileInputRef.current?.click()} className={`w-16 h-16 rounded-lg border-dashed border-2 flex flex-col items-center justify-center gap-0.5 flex-shrink-0 transition-colors ${isDarkMode ? 'border-slate-500 text-slate-400 hover:bg-slate-700' : 'border-slate-300 text-slate-400 hover:bg-slate-50'}`}>
                <span className="text-lg leading-none">+</span>
                <span className="text-[8px] font-bold">사진 추가</span>
              </button>
            )}
          </div>
          {newPlanPhotos.length < 3 && (
            <input
              type="text"
              placeholder="URL 붙여넣기 후 Enter (웹 사진 복사 후 Ctrl+V)"
              className={`w-full border p-1.5 text-[9px] font-bold focus:ring-1 focus:ring-indigo-500 outline-none rounded transition-all duration-300 ${inputBg} ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'}`}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const url = e.target.value.trim();
                  if (!url) return;
                  setNewPlanPhotos(prev => prev.length < 3 ? [...prev, url] : prev);
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
                      setNewPlanPhotos(prev => prev.length < 3 ? [...prev, compressed] : prev);
                    });
                    e.target.value = '';
                    return;
                  }
                }
              }}
            />
          )}
        </div>

        <div className="my-1.5 px-1 pb-1">
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="planIsAcc" checked={newIsAccommodation} onChange={e => { setNewIsAccommodation(e.target.checked); if (e.target.checked) { setNewTheme("숙소"); } else { setNewAccommodationDays([]); } }} className="accent-indigo-600 w-3.5 h-3.5 cursor-pointer" />
            <label htmlFor="planIsAcc" className={`text-[10px] font-bold cursor-pointer transition-colors duration-300 flex items-center gap-1 ${textMuted}`}>이 장소를 숙소로 설정 <Home className="w-3 h-3" /></label>
          </div>
          {newIsAccommodation && (
            <div className="mt-2 ml-5">
              <p className={`text-[9px] font-bold mb-1.5 ${textMuted}`}>숙박 Day 선택 (복수 선택 가능)</p>
              <div className="flex flex-wrap gap-1">
                {tripDays.map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setNewAccommodationDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${newAccommodationDays.includes(d) ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : (isDarkMode ? 'bg-slate-700 text-slate-300 border-slate-600' : 'bg-white text-slate-500 border-slate-300')}`}
                  >D{d}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-1 flex space-x-2">
          {editingPlanId && (
            <button onClick={resetPlanForm} className={`px-3 py-2.5 rounded text-[11px] font-bold border transition-all duration-300 active:scale-95 ${isDarkMode ? 'border-slate-600 text-slate-400 hover:bg-slate-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>초기화</button>
          )}
          <button onClick={handleSavePlan} className={`flex-1 text-white rounded py-2.5 text-[11px] font-bold shadow-md active:scale-95 transition-all duration-300 ${editingPlanId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
            <span>{editingPlanId ? '✅ 수정 완료' : '스케줄에 등록! ✨'}</span>
          </button>
        </div>
          <div className="flex space-x-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
           <button onClick={() => setIsPackingModalOpen(true)} className={`flex-1 rounded-lg py-2.5 text-[11px] font-bold shadow-sm transition-colors duration-300 flex justify-center items-center gap-1.5 border ${isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
            <Backpack className="w-3.5 h-3.5" /> 준비물 입력
          </button>
           <button onClick={() => setIsShoppingModalOpen(true)} className={`flex-1 rounded-lg py-2.5 text-[11px] font-bold shadow-sm transition-colors duration-300 flex justify-center items-center gap-1.5 border ${isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
            <ShoppingBag className="w-3.5 h-3.5" /> 쇼핑리스트
           </button>
        </div>

      </div>
    </div>
  );
};

export default PlanFormPanel;
