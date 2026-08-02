import React from 'react';
import { X, Globe, MapPin, Clock, Home } from 'lucide-react';
import { REGIONS_BY_COUNTRY } from '../utils/constants';
import { S, compressAndStoreImage } from '../utils/helpers';
import SelectOrInput from './SelectOrInput';

const EditPlanModal = ({
  editingPlan, setEditingPlan, isDarkMode, appTheme, textMuted, inputBg,
  tripDays, handleTimeInput, editFileInputRef, handlePlanPhotoUpload,
  supabaseClient, appUserId, activeTripId,
  planTimeline, setPlanTimeline, currentRestaurants, setCurrentRestaurants,
  setDisplayCityName, saveToDb, showToast,
}) => {
  if (!editingPlan) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[6000] flex items-center justify-center p-4 transition-opacity duration-300" onClick={() => setEditingPlan(null)}>
      <div className={`${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white'} w-full max-w-sm shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 rounded-2xl`} onClick={e => e.stopPropagation()}>
        <div className={`flex items-center justify-between p-3 border-b ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'}`}>
          <div className="flex items-center space-x-2">
            <span className="text-orange-500 text-sm">✏️</span>
            <h3 className="text-xs font-bold">일정 수정하기</h3>
          </div>
          <button onClick={() => setEditingPlan(null)} className={`p-1 rounded transition-colors ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700'}`}><X className="w-[1em] h-[1em] inline" /></button>
        </div>

        <div className="p-4 space-y-3">
          <div className={`grid gap-1 ${isDarkMode ? 'bg-slate-700' : 'bg-white'} border border-slate-200/80 rounded-lg p-1 shadow-sm`} style={{gridTemplateColumns: `repeat(${Math.min(tripDays.length, 4)}, minmax(0, 1fr))`}}>
            {tripDays.map(d => (
              <button key={d} onClick={() => setEditingPlan({...editingPlan, day: d})} className={`flex-1 text-[10px] font-bold py-1.5 rounded transition-all duration-300 border border-transparent ${parseInt(editingPlan.day) === d ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600'}`}>D{d}</button>
            ))}
          </div>

          <div className="flex space-x-2">
            <div className="flex flex-col space-y-1 w-1/2">
              <label className={`text-[9px] font-bold ${textMuted} px-1`}>국가 <Globe className="w-3 h-3 inline" /></label>
              <div className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} px-2 py-1.5 shadow-sm h-8 flex items-center transition-colors duration-300`}>
                <SelectOrInput
                  inputId="edit-country-input"
                  value={editingPlan.countrySelect} manualValue={editingPlan.manualCountry} isDarkMode={isDarkMode} appTheme={appTheme}
                  options={Object.keys(REGIONS_BY_COUNTRY)}
                  onChangeSelect={e => setEditingPlan({...editingPlan, countrySelect: e.target.value, regionSelect: "", manualCountry: "", manualRegion: ""})}
                  onChangeManual={val => setEditingPlan({...editingPlan, manualCountry: val})}
                  onCancelManual={() => setEditingPlan({...editingPlan, countrySelect: "", manualCountry: ""})}
                />
              </div>
            </div>
            <div className="flex flex-col space-y-1 w-1/2">
              <label className={`text-[9px] font-bold ${textMuted} px-1`}>지역 <MapPin className="w-3 h-3 inline" /></label>
              <div className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} px-2 py-1.5 shadow-sm h-8 flex items-center transition-colors duration-300`}>
                <SelectOrInput
                  inputId="edit-region-input"
                  value={editingPlan.regionSelect} manualValue={editingPlan.manualRegion} isDarkMode={isDarkMode} appTheme={appTheme}
                  options={(!editingPlan.countrySelect || editingPlan.countrySelect === '수동입력') ? null : REGIONS_BY_COUNTRY[editingPlan.countrySelect]}
                  onChangeSelect={e => setEditingPlan({...editingPlan, regionSelect: e.target.value, manualRegion: ""})}
                  onChangeManual={val => setEditingPlan({...editingPlan, manualRegion: val})}
                  onCancelManual={() => setEditingPlan({...editingPlan, regionSelect: "", manualRegion: ""})}
                />
              </div>
            </div>
          </div>

          <div className="flex space-x-2 items-end">
            <div className="flex flex-col space-y-1 w-1/3">
              <label className={`text-[9px] font-bold ${textMuted} px-1`}>시간 <Clock className="w-3 h-3 inline" /></label>
              <input type="text" maxLength="5" value={S(editingPlan.time)} onChange={(e) => handleTimeInput(e, (val) => setEditingPlan({...editingPlan, time: val}))} placeholder="09:00" className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-1.5 text-[10px] font-bold focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm transition-all duration-300`} />
            </div>
            <div className="flex flex-col space-y-1 flex-1 relative">
              <label className={`text-[9px] font-bold ${textMuted} px-1`}>장소 <MapPin className="w-3 h-3 inline" /></label>
              <input type="text" placeholder="장소 이름 입력" value={S(editingPlan.place)} onChange={(e) => setEditingPlan({...editingPlan, place: e.target.value})} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-1.5 text-[10px] font-bold focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm pr-6 transition-all duration-300`} />
            </div>
          </div>

          <div className="flex space-x-2 items-end">
            <div className="flex flex-col space-y-1 flex-1">
              <label className={`text-[9px] font-bold ${textMuted} px-1`}>현지어(복사용)</label>
              <input type="text" placeholder="현지어 입력" value={S(editingPlan.localName)} onChange={(e) => setEditingPlan({...editingPlan, localName: e.target.value})} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-1.5 text-[10px] font-bold focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm transition-all duration-300`} />
            </div>
<div className="flex flex-col space-y-1 flex-1">
              <label className={`text-[9px] font-bold ${textMuted} px-1`}>메모 📝</label>
              <input type="text" placeholder="메모 입력" value={S(editingPlan.features)} onChange={(e) => setEditingPlan({...editingPlan, features: e.target.value})} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-1.5 text-[10px] font-bold rounded outline-none transition-all duration-300`} />
            </div>
          </div>

          <div className="flex flex-col space-y-1 w-full mb-3">
            <label className={`text-[9px] font-black ${textMuted} px-1 flex justify-between`}>
              <span>테마 분류 📌</span>
              <span className="text-[7px] opacity-50">미선택 시 '기타' 자동 지정</span>
            </label>
            <select
              value={S(editingPlan.theme || "기타")}
              onChange={e => setEditingPlan({...editingPlan, theme: e.target.value})}
              className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2.5 text-xs font-bold rounded-xl outline-none cursor-pointer shadow-sm focus:border-indigo-400 transition-all duration-300`}
            >
              <option value="교통">교통 🚌</option>
              <option value="식당">식당 🍽️</option>
              <option value="디저트">디저트 🍰</option>
              <option value="관광지">관광지 📸</option>
              <option value="쇼핑">쇼핑 🛍️</option>
              <option value="숙소">숙소 🏠</option>
              <option value="기타">기타 📌</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1 w-full">
            <label className={`text-[9px] font-bold px-1 transition-colors duration-300 ${textMuted}`}>사진 (최대 3장 / Ctrl+V 붙여넣기)</label>
            <input type="file" accept="image/*" multiple ref={editFileInputRef} onChange={(e) => handlePlanPhotoUpload(e, true)} className="hidden" />
            <div className="flex gap-1.5">
              {(Array.isArray(editingPlan.photos) ? editingPlan.photos : (editingPlan.photo ? [editingPlan.photo] : [])).map((img, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border flex-shrink-0 shadow-sm cursor-pointer" style={{borderColor: i === 0 ? '#6366f1' : undefined}} onClick={e => { e.stopPropagation(); if (i !== 0) setEditingPlan(prev => { const imgs = (Array.isArray(prev.photos) ? prev.photos : (prev.photo ? [prev.photo] : [])); const arr = [...imgs]; arr.splice(i, 1); arr.unshift(img); return { ...prev, photos: arr, photo: arr[0] }; }); }}>
                  <img src={img} className="w-full h-full object-cover" alt="" />
                  <button type="button" onClick={e => { e.stopPropagation(); setEditingPlan(prev => { const imgs = (Array.isArray(prev.photos) ? prev.photos : (prev.photo ? [prev.photo] : [])).filter((_, idx) => idx !== i); return {...prev, photos: imgs, photo: imgs[0] || ""}; }); }} className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] leading-none hover:bg-black/90"><X className="w-[1em] h-[1em] inline" /></button>
                  <div className={`absolute bottom-0 left-0 right-0 text-white text-[7px] text-center font-bold py-0.5 ${i === 0 ? 'bg-indigo-600/80' : 'bg-black/40'}`}>{i === 0 ? '대표' : '탭=대표'}</div>
                </div>
              ))}
              {(Array.isArray(editingPlan.photos) ? editingPlan.photos : (editingPlan.photo ? [editingPlan.photo] : [])).length < 3 && (
                <button type="button" onClick={() => editFileInputRef.current?.click()} className={`w-16 h-16 rounded-lg border-dashed border-2 flex flex-col items-center justify-center gap-0.5 flex-shrink-0 transition-colors ${isDarkMode ? 'border-slate-500 text-slate-400 hover:bg-slate-700' : 'border-slate-300 text-slate-400 hover:bg-slate-50'}`}>
                  <span className="text-lg leading-none">+</span>
                  <span className="text-[8px] font-bold">사진 추가</span>
                </button>
              )}
            </div>
            {(Array.isArray(editingPlan.photos) ? editingPlan.photos : (editingPlan.photo ? [editingPlan.photo] : [])).length < 3 && (
              <input
                type="text"
                placeholder="URL 붙여넣기 후 Enter (웹 사진 복사 후 Ctrl+V)"
                className={`w-full border p-1.5 text-[9px] font-bold focus:ring-1 focus:ring-indigo-500 outline-none rounded transition-all duration-300 ${inputBg} ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'}`}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const url = e.target.value.trim();
                    if (!url) return;
                    setEditingPlan(prev => {
                      const imgs = Array.isArray(prev.photos) ? prev.photos : (prev.photo ? [prev.photo] : []);
                      if (imgs.length >= 3) return prev;
                      const newImgs = [...imgs, url];
                      return { ...prev, photos: newImgs, photo: newImgs[0] };
                    });
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
                        setEditingPlan(prev => {
                          if (!prev) return prev; // 압축 완료 전에 모달이 닫힌 경우
                          const imgs = Array.isArray(prev.photos) ? prev.photos : (prev.photo ? [prev.photo] : []);
                          if (imgs.length >= 3) return prev;
                          const newImgs = [...imgs, compressed];
                          return { ...prev, photos: newImgs, photo: newImgs[0] };
                        });
                      });
                      e.target.value = '';
                      return;
                    }
                  }
                }}
              />
            )}
          </div>

          <div className="my-1.5 px-1">
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="editPlanIsAcc" checked={Boolean(editingPlan.isAccommodation)} onChange={e => setEditingPlan({...editingPlan, isAccommodation: e.target.checked, accommodationDays: e.target.checked ? (editingPlan.accommodationDays || []) : []})} className="accent-indigo-600 w-3.5 h-3.5 rounded cursor-pointer" />
              <label htmlFor="editPlanIsAcc" className={`text-[10px] font-bold ${textMuted} cursor-pointer flex items-center gap-1`}>이 장소를 숙소로 설정 <Home className="w-3 h-3" /></label>
            </div>
            {editingPlan.isAccommodation && (
              <div className="mt-2 ml-5">
                <p className={`text-[9px] font-bold mb-1.5 ${textMuted}`}>숙박 Day 선택 (복수 선택 가능)</p>
                <div className="flex flex-wrap gap-1">
                  {tripDays.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setEditingPlan(prev => {
                        const days = Array.isArray(prev.accommodationDays) ? prev.accommodationDays : [];
                        return { ...prev, accommodationDays: days.includes(d) ? days.filter(x => x !== d) : [...days, d] };
                      })}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${(Array.isArray(editingPlan.accommodationDays) && editingPlan.accommodationDays.includes(d)) ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : (isDarkMode ? 'bg-slate-700 text-slate-300 border-slate-600' : 'bg-white text-slate-500 border-slate-300')}`}
                    >D{d}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex space-x-2">
            <button onClick={() => {
              const finalCountry = editingPlan.countrySelect === "수동입력" ? editingPlan.manualCountry : editingPlan.countrySelect;
              const finalRegion = editingPlan.regionSelect === "수동입력" ? editingPlan.manualRegion : editingPlan.regionSelect;
// [저장 로직 수정] 테마(theme) 데이터가 핀 목록에도 저장되도록 강제 연동합니다.
// [데이터 보정] 테마가 비어있거나 선택되지 않은 경우 '기타'로 강제 할당하여 저장
const planData = {
                ...editingPlan,
                country: finalCountry,
                region: finalRegion,
                theme: (editingPlan.theme && editingPlan.theme.trim() !== "") ? editingPlan.theme : "기타",
                rating: editingPlan.rating || 0,
                review: editingPlan.review || "",
                accommodationDays: editingPlan.isAccommodation ? (Array.isArray(editingPlan.accommodationDays) ? editingPlan.accommodationDays : []) : []
              };
              const safePlanTimeline = Array.isArray(planTimeline) ? planTimeline.filter(Boolean) : [];
              let updatedTimeline = safePlanTimeline.map(p => p && S(p.id) === S(editingPlan.id) ? planData : p).sort((a, b) => S(a.time).localeCompare(S(b.time)));

              const safeCurrentRestaurants = Array.isArray(currentRestaurants) ? currentRestaurants.filter(Boolean) : [];
              const matchedIndex = safeCurrentRestaurants.findIndex(r => r && S(r.name).trim() === S(editingPlan.place).trim());
              let dbUpdates = { plan_timeline: updatedTimeline };

              if (matchedIndex !== -1) {
                  const updatedRests = [...safeCurrentRestaurants];
                  updatedRests[matchedIndex] = {
                      ...updatedRests[matchedIndex],
                      localName: editingPlan.localName ? S(editingPlan.localName) : updatedRests[matchedIndex].localName,
                      signature: editingPlan.features ? S(editingPlan.features) : updatedRests[matchedIndex].signature,
                      img: editingPlan.photo ? S(editingPlan.photo) : updatedRests[matchedIndex].img,
                      imgs: Array.isArray(editingPlan.photos) && editingPlan.photos.length > 0 ? editingPlan.photos : updatedRests[matchedIndex].imgs,
                      isAccommodation: editingPlan.isAccommodation || editingPlan.theme === "숙소",
                      theme: editingPlan.theme || "기타"
                  };
                  setCurrentRestaurants(updatedRests);
                  dbUpdates.current_restaurants = updatedRests;
                  dbUpdates.current_restaurants = updatedRests;
              }

              setPlanTimeline(updatedTimeline);

              // displayCityName: 드롭다운 지역 선택 or 수동입력 텍스트만 허용 (장소명 오염 방지)
              const regionIsFromDropdown = editingPlan.regionSelect && editingPlan.regionSelect !== "수동입력";
              const regionIsManual = editingPlan.regionSelect === "수동입력" && editingPlan.manualRegion;
              if (finalRegion && (regionIsFromDropdown || regionIsManual)) {
                setDisplayCityName(S(finalRegion));
                dbUpdates.display_city_name = S(finalRegion);
              }
              saveToDb(dbUpdates);
              setEditingPlan(null); showToast("일정이 예쁘게 수정됐어요! 📝");
            }} className="w-full bg-orange-500 text-white rounded-md py-2 text-[11px] font-bold shadow-sm hover:bg-orange-600 active:scale-95 transition-all duration-300">
              수정 내용 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPlanModal;
