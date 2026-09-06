import React from 'react';
import { X, Globe, MapPin, Clock, Home, Copy, Camera, Image as ImageIcon, PenLine } from 'lucide-react';
import { REGIONS_BY_COUNTRY } from '../utils/constants';
import { S, compressAndStoreImage } from '../utils/helpers';
import SelectOrInput from './SelectOrInput';

const THEME_OPTIONS = [
  { value: '식당', emoji: '🍽️', label: '식당 · 맛집' },
  { value: '디저트', emoji: '☕', label: '카페 · 디저트' },
  { value: '관광지', emoji: '🏛️', label: '관광 명소' },
  { value: '숙소', emoji: '🏨', label: '숙소' },
  { value: '쇼핑', emoji: '🛍️', label: '쇼핑' },
  { value: '기타', emoji: '📌', label: '기타 핀' },
];

const EditPlanModal = ({
  editingPlan, setEditingPlan, isDarkMode, appTheme, textMuted, inputBg,
  tripDays, handleTimeInput, editFileInputRef, handlePlanPhotoUpload,
  supabaseClient, appUserId, activeTripId,
  planTimeline, setPlanTimeline, currentRestaurants, setCurrentRestaurants,
  setDisplayCityName, saveToDb, showToast, handleCopyLocalName,
}) => {
  if (!editingPlan) return null;

  const border = isDarkMode ? 'border-slate-600' : 'border-slate-200';
  const softBg = isDarkMode ? 'bg-slate-900/40' : 'bg-slate-50/70';
  const inputCls = `w-full ${softBg} border ${border} focus:border-[#007AFF] rounded-2xl px-3.5 py-2.5 text-sm font-medium outline-none focus:ring-4 focus:ring-[#007AFF]/10 transition-all ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`;

  const photos = Array.isArray(editingPlan.photos) ? editingPlan.photos : (editingPlan.photo ? [editingPlan.photo] : []);
  const photoCount = photos.length;
  const emptySlotCount = Math.max(0, 3 - photoCount - (photoCount < 3 ? 1 : 0));

  const dayOtherPlans = (Array.isArray(planTimeline) ? planTimeline : [])
    .filter(p => p && String(p.day) === String(editingPlan.day) && S(p.id) !== S(editingPlan.id))
    .sort((a, b) => S(a.time).localeCompare(S(b.time)));

  return (
    <div className="fixed inset-0 bg-black/60 z-[6000] backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto transition-opacity duration-300" onClick={() => setEditingPlan(null)}>
      <div className="flex flex-row items-stretch justify-center gap-2 w-full max-w-[720px] my-auto">

        {/* 좌측 미니 패널: 같은 Day에 등록된 다른 일정 미리보기 (항상 좌측 고정, 화면이 좁으면 함께 축소) */}
        {dayOtherPlans.length > 0 && (
          <div
            onClick={e => e.stopPropagation()}
            className={`w-[30%] max-w-[180px] min-w-0 shrink rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
          >
            <div className={`px-2 sm:px-3 py-2 border-b shrink-0 flex items-center justify-between gap-1 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <span className={`text-[10px] sm:text-[11px] font-bold truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                {S(editingPlan.day) === '0' ? '보관함' : `Day ${editingPlan.day}`}
              </span>
              <span className="text-[10px] font-bold text-[#007AFF] bg-[#007AFF]/10 px-1.5 py-0.5 rounded-full shrink-0">{dayOtherPlans.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 sm:p-2 space-y-1.5">
              {dayOtherPlans.map(p => (
                <div key={p.id} className={`rounded-lg border px-1.5 sm:px-2 py-1.5 leading-tight ${isDarkMode ? 'bg-slate-900/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  {p.time && p.time !== '99:99' && <div className="text-[10px] font-bold text-[#007AFF]">{S(p.time)}</div>}
                  <div className={`truncate text-[10px] ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{p.isAccommodation ? '🏠 ' : ''}{S(p.place)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} flex-1 min-w-0 max-w-sm max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300`} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={`sticky top-0 z-10 ${isDarkMode ? 'bg-slate-800/95 border-slate-700' : 'bg-white/95 border-slate-100'} backdrop-blur-xl border-b px-4 pt-3.5 pb-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full ${isDarkMode ? 'bg-[#007AFF]/20' : 'bg-[#007AFF]/10'} flex items-center justify-center text-[#007AFF]`}>
                <PenLine className="w-[18px] h-[18px]" />
              </div>
              <h3 className={`text-[15px] font-bold tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>일정 수정하기</h3>
            </div>
            <button onClick={() => setEditingPlan(null)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-200' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}>
              <X className="w-[18px] h-[18px]" />
            </button>
          </div>
          <div className={`grid gap-1 mt-2.5 ${isDarkMode ? 'bg-slate-900/40 border-slate-700' : 'bg-slate-50/80 border-slate-200/70'} border rounded-xl p-1`} style={{ gridTemplateColumns: `repeat(${Math.min(tripDays.length, 6)}, minmax(0, 1fr))` }}>
            {tripDays.map(d => (
              <button key={d} onClick={() => setEditingPlan({ ...editingPlan, day: d })} className={`text-[11px] font-bold py-1.5 rounded-lg transition-all ${parseInt(editingPlan.day) === d ? 'bg-[#007AFF] text-white shadow-sm' : (isDarkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-200')}`}>D{d}</button>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-4 custom-scrollbar scroll-smooth">

          {/* 테마 분류 */}
          <section className="space-y-1.5">
            <label className={`block text-[11px] font-bold uppercase tracking-wider ${textMuted}`}>테마 분류</label>
            <div className="grid grid-cols-3 gap-2">
              {THEME_OPTIONS.map(opt => {
                const selected = S(editingPlan.theme || '기타') === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEditingPlan({ ...editingPlan, theme: opt.value })}
                    className={`flex items-center justify-center gap-1 py-2.5 px-1.5 rounded-xl border text-[11px] font-semibold transition-all ${selected
                      ? 'border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF]'
                      : (isDarkMode ? 'border-slate-600 bg-slate-900/30 text-slate-300 hover:border-slate-500' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300')}`}
                  >
                    <span>{opt.emoji}</span>
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 시간 / 장소 */}
          <section className="grid grid-cols-3 gap-2.5">
            <div className="space-y-1">
              <label className={`block text-[11px] font-semibold ${textMuted}`}>시간 <Clock className="w-3 h-3 inline" /></label>
              <input type="text" maxLength="5" value={S(editingPlan.time)} onChange={(e) => handleTimeInput(e, (val) => setEditingPlan({ ...editingPlan, time: val }))} placeholder="09:00" className={`w-full ${softBg} border ${border} rounded-xl px-2.5 py-2 text-xs font-bold text-center outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`} />
            </div>
            <div className="col-span-2 space-y-1">
              <label className={`block text-[11px] font-semibold ${textMuted}`}>장소 <MapPin className="w-3 h-3 inline" /></label>
              <input type="text" placeholder="장소 이름 입력" value={S(editingPlan.place)} onChange={(e) => setEditingPlan({ ...editingPlan, place: e.target.value })} className={`w-full ${softBg} border ${border} rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`} />
            </div>
          </section>

          {/* 국가 / 지역 */}
          <section className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className={`block text-[11px] font-semibold ${textMuted}`}>국가 <Globe className="w-3 h-3 inline" /></label>
              <div className={`w-full ${softBg} border ${border} rounded-xl px-2.5 h-9 flex items-center transition-all`}>
                <SelectOrInput
                  inputId="edit-country-input"
                  value={editingPlan.countrySelect} manualValue={editingPlan.manualCountry} isDarkMode={isDarkMode} appTheme={appTheme}
                  options={Object.keys(REGIONS_BY_COUNTRY)}
                  onChangeSelect={e => setEditingPlan({ ...editingPlan, countrySelect: e.target.value, regionSelect: "", manualCountry: "", manualRegion: "" })}
                  onChangeManual={val => setEditingPlan({ ...editingPlan, manualCountry: val })}
                  onCancelManual={() => setEditingPlan({ ...editingPlan, countrySelect: "", manualCountry: "" })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className={`block text-[11px] font-semibold ${textMuted}`}>지역 <MapPin className="w-3 h-3 inline" /></label>
              <div className={`w-full ${softBg} border ${border} rounded-xl px-2.5 h-9 flex items-center transition-all`}>
                <SelectOrInput
                  inputId="edit-region-input"
                  value={editingPlan.regionSelect} manualValue={editingPlan.manualRegion} isDarkMode={isDarkMode} appTheme={appTheme}
                  options={(!editingPlan.countrySelect || editingPlan.countrySelect === '수동입력') ? null : REGIONS_BY_COUNTRY[editingPlan.countrySelect]}
                  onChangeSelect={e => setEditingPlan({ ...editingPlan, regionSelect: e.target.value, manualRegion: "" })}
                  onChangeManual={val => setEditingPlan({ ...editingPlan, manualRegion: val })}
                  onCancelManual={() => setEditingPlan({ ...editingPlan, regionSelect: "", manualRegion: "" })}
                />
              </div>
            </div>
          </section>

          {/* 메모 */}
          <section className="space-y-1.5">
            <label className={`block text-xs font-bold ${textMuted}`}>메모 / 특징</label>
            <textarea
              rows="3"
              placeholder="메모 입력"
              value={S(editingPlan.features)}
              onChange={(e) => setEditingPlan({ ...editingPlan, features: e.target.value })}
              className={`${inputCls} resize-none leading-relaxed`}
            />
          </section>

          {/* 현지어 이름 */}
          <section className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`block text-xs font-bold ${textMuted}`}>현지어 이름 <span className="font-normal opacity-70">(택시기사 제시 및 검색용)</span></label>
              {handleCopyLocalName && (
                <button
                  type="button"
                  onClick={e => handleCopyLocalName(e, editingPlan.localName)}
                  className="text-[11px] text-[#007AFF] hover:underline flex items-center gap-0.5 font-medium transition-colors"
                >
                  <Copy className="w-3 h-3" /> 복사 테스트
                </button>
              )}
            </div>
            <input type="text" placeholder="현지어 입력" value={S(editingPlan.localName)} onChange={(e) => setEditingPlan({ ...editingPlan, localName: e.target.value })} className={`${inputCls} font-mono`} />
          </section>

          {/* 사진 첨부 */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={`block text-xs font-bold flex items-center gap-1.5 ${textMuted}`}>
                <span>사진 첨부 (최대 3장)</span>
                <span className={`text-[10px] ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'} px-1.5 py-0.5 rounded font-semibold`}>{photoCount}/3</span>
              </label>
              <span className={`text-[11px] ${textMuted}`}>Ctrl+V 붙여넣기 지원</span>
            </div>
            <input type="file" accept="image/*" multiple ref={editFileInputRef} onChange={(e) => handlePlanPhotoUpload(e, true)} className="hidden" />
            <div className="grid grid-cols-3 gap-2.5">
              {photos.map((img, i) => (
                <div
                  key={i}
                  className={`relative aspect-square rounded-2xl overflow-hidden border ${border} group cursor-pointer`}
                  onClick={() => { if (i !== 0) setEditingPlan(prev => { const imgs = Array.isArray(prev.photos) ? prev.photos : (prev.photo ? [prev.photo] : []); const arr = [...imgs]; arr.splice(i, 1); arr.unshift(img); return { ...prev, photos: arr, photo: arr[0] }; }); }}
                >
                  <img src={img} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" />
                  {i === 0 && <span className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded-md font-medium">대표</span>}
                  <button type="button" onClick={e => { e.stopPropagation(); setEditingPlan(prev => { const imgs = (Array.isArray(prev.photos) ? prev.photos : (prev.photo ? [prev.photo] : [])).filter((_, idx) => idx !== i); return { ...prev, photos: imgs, photo: imgs[0] || "" }; }); }} className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-rose-500 transition-colors">
                    <X className="w-[14px] h-[14px]" />
                  </button>
                </div>
              ))}
              {photoCount < 3 && (
                <button type="button" onClick={() => editFileInputRef.current?.click()} className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all ${isDarkMode ? 'border-slate-600 hover:border-[#007AFF] bg-slate-900/30 text-slate-400 hover:text-[#007AFF]' : 'border-slate-300 hover:border-[#007AFF] bg-slate-50/50 hover:bg-[#007AFF]/5 text-slate-400 hover:text-[#007AFF]'}`}>
                  <Camera className="w-6 h-6" />
                  <span className="text-[10px] font-semibold">사진 추가</span>
                </button>
              )}
              {Array.from({ length: emptySlotCount }).map((_, i) => (
                <div key={`empty-${i}`} className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 ${isDarkMode ? 'border-slate-700 bg-slate-900/20 text-slate-600' : 'border-slate-200 bg-slate-50/30 text-slate-300'}`}>
                  <ImageIcon className="w-[22px] h-[22px]" />
                  <span className="text-[10px]">미등록</span>
                </div>
              ))}
            </div>
            {photoCount < 3 && (
              <input
                type="text"
                placeholder="URL 붙여넣기 후 Enter (웹 사진 복사 후 Ctrl+V)"
                className={`w-full ${softBg} border ${border} rounded-xl px-3 py-2 text-[11px] font-medium outline-none focus:border-[#007AFF] transition-all ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}
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
                          if (!prev) return prev;
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
          </section>

          {/* 숙소 / 랜드마크 설정 */}
          <section className="space-y-2">
            <label className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all ${isDarkMode ? 'border-slate-700 bg-slate-900/30 hover:border-[#007AFF]/50 hover:bg-[#007AFF]/10' : 'border-slate-200/80 bg-slate-50/60 hover:border-[#007AFF]/40 hover:bg-[#007AFF]/5'}`}>
              <input type="checkbox" checked={Boolean(editingPlan.isAccommodation)} onChange={e => setEditingPlan({ ...editingPlan, isAccommodation: e.target.checked, accommodationDays: e.target.checked ? (editingPlan.accommodationDays || []) : [] })} className="accent-[#007AFF] w-4 h-4 rounded cursor-pointer" />
              <div className={`flex items-center gap-1.5 text-xs font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                <Home className="w-3.5 h-3.5" />
                <span>이 장소를 숙소로 설정</span>
              </div>
            </label>
            {editingPlan.isAccommodation && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 px-1">
                <span className={`text-[10px] font-bold ${textMuted}`}>숙박 Day:</span>
                {tripDays.map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setEditingPlan(prev => {
                      const days = Array.isArray(prev.accommodationDays) ? prev.accommodationDays : [];
                      return { ...prev, accommodationDays: days.includes(d) ? days.filter(x => x !== d) : [...days, d] };
                    })}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${(Array.isArray(editingPlan.accommodationDays) && editingPlan.accommodationDays.includes(d)) ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-sm' : (isDarkMode ? 'bg-slate-700 text-slate-300 border-slate-600' : 'bg-white text-slate-500 border-slate-300')}`}
                  >D{d}</button>
                ))}
              </div>
            )}
            <label className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all ${isDarkMode ? 'border-slate-700 bg-slate-900/30 hover:border-amber-500/50 hover:bg-amber-500/10' : 'border-slate-200/80 bg-slate-50/60 hover:border-amber-400/60 hover:bg-amber-50'}`}>
              <input type="checkbox" checked={Boolean(editingPlan.isLandmark)} onChange={e => setEditingPlan({ ...editingPlan, isLandmark: e.target.checked })} className="accent-amber-500 w-4 h-4 rounded cursor-pointer" />
              <div className={`flex items-center gap-1.5 text-xs font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                <span>랜드마크 지정 👑</span>
              </div>
            </label>
          </section>
        </div>

        {/* Bottom Sticky Action Bar */}
        <div className={`shrink-0 ${isDarkMode ? 'bg-slate-800/95 border-slate-700' : 'bg-white/95 border-slate-100'} backdrop-blur-xl border-t px-4 py-3`}>
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
                isLandmark: Boolean(editingPlan.isLandmark),
                theme: editingPlan.theme || "기타"
              };
              setCurrentRestaurants(updatedRests);
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
          }} className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-1.5 active:scale-95">
            <PenLine className="w-[18px] h-[18px]" />
            <span>수정 내용 저장</span>
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default EditPlanModal;
