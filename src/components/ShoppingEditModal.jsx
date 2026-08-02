import React from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { S, compressAndStoreImage } from '../utils/helpers';

const ShoppingEditModal = ({
  isOpen, onClose, isDarkMode, textMuted, inputBg,
  shoppingItemDay, setShoppingItemDay,
  shoppingLinkPlanId, setShoppingLinkPlanId,
  tripDays, shoppingItemTheme, setShoppingItemTheme, planTimeline,
  newShoppingItem, setNewShoppingItem, newShoppingPhoto, setNewShoppingPhoto,
  showToast, appUserId, saveToDb, shoppingList, setShoppingList,
  shoppingFileInputRef, supabaseClient, activeTripId,
  shoppingFilterTheme, setShoppingFilterTheme, showAllShopping, setShowAllShopping,
  editingItemId, setEditingItemId, onStartLongPress, onCancelLongPress,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[8000] flex items-center justify-center p-4 transition-opacity duration-300" onClick={onClose}>
      <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 rounded-2xl`} onClick={e => e.stopPropagation()}>
         <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
            <h3 className={`text-sm font-black flex items-center gap-1.5 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}><ShoppingBag className="w-4 h-4 text-pink-500" /> 쇼핑리스트</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg transition-colors"><X className="w-[1em] h-[1em] inline" /></button>
         </div>
         <div className="p-4 space-y-4 max-h-[60vh] flex flex-col min-h-[30vh]">
            <div className="flex flex-col space-y-2 shrink-0">
<div className="flex space-x-1.5">
                <select value={shoppingItemDay} onChange={e => { setShoppingItemDay(e.target.value); setShoppingLinkPlanId("manual"); }} className={`flex-[1] ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'} p-2 text-[10px] font-bold outline-none rounded-lg shadow-sm transition-colors duration-300`}>
                   <option value="">미지정</option>
                   {tripDays.map(d => <option key={d} value={d}>Day {d}</option>)}
                </select>
                <select value={shoppingItemTheme} onChange={e => setShoppingItemTheme(e.target.value)} className={`flex-[1.2] ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'} p-2 text-[10px] font-bold outline-none rounded-lg shadow-sm transition-colors duration-300`}>
                   <option value="쇼핑">쇼핑 🛍️</option>
                   <option value="식당">식당 🍽️</option>
                   <option value="관광지">관광지 📸</option>
                   <option value="숙소">숙소 🏠</option>
                   <option value="기타">기타 📌</option>
                </select>
{/* [NEW] 쇼핑리스트 세부 일정 콤보박스: Day + Theme 완벽 교차 필터링 적용 */}
                <select value={shoppingLinkPlanId} onChange={e => setShoppingLinkPlanId(e.target.value)} className={`flex-[1.5] ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'} p-2 text-[10px] font-bold outline-none rounded-lg shadow-sm transition-colors duration-300`}>
                   <option value="manual">➕ 수동입력</option>
                   {planTimeline.filter(p => {
                      const matchDay = !shoppingItemDay || String(p.day) === String(shoppingItemDay);
                      // 이모지나 띄어쓰기로 인한 필터링 누락 방지 (순수 텍스트만 비교)
                      const rawPlanTheme = S(p.theme || '기타').replace(/[^가-힣a-zA-Z]/g, '').trim();
                      const rawShopTheme = S(shoppingItemTheme).replace(/[^가-힣a-zA-Z]/g, '').trim();
                      const matchTheme = !shoppingItemTheme || shoppingItemTheme === 'all' || rawPlanTheme === rawShopTheme;
                      return matchDay && matchTheme;
                   }).map(p => (
                      <option key={p.id} value={p.id}>[{p.time || '종일'}] {S(p.place)}</option>
                   ))}
                </select>
              </div>
<div className="flex flex-col space-y-1.5">
                <div className="flex space-x-1.5">
                  <select id="shopType" className={`w-20 ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'} px-1 py-2.5 text-[10px] font-bold outline-none rounded-lg shadow-sm`}>
                    <option value="shared">공동용 👨‍👩‍👧‍👦</option>
                    <option value="personal">개인용 🔒</option>
                  </select>
                  <input type="text" placeholder="살 물건 입력 후 우측 등록버튼" value={newShoppingItem} onChange={e => setNewShoppingItem(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') document.getElementById('addShopBtn')?.click(); }} className={`flex-1 ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'} px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-pink-500 outline-none rounded-lg shadow-sm transition-all duration-300`} />
                  <button id="addShopBtn" onClick={() => {
                    // [버그 수정] 사진만 넣어도 저장되도록 예외 처리
                    if (!newShoppingItem.trim() && !newShoppingPhoto) {
                      showToast("물건 이름이나 사진을 최소 하나는 입력해주세요!");
                      return;
                    }
                    const itemName = newShoppingItem.trim() || "사진 첨부 아이템";
                    let targetDay = shoppingItemDay;
                    let targetPlace = null;
                    let dbUpdates = {};

                    // [수정 완료] 쇼핑 리스트 등록 시 핀 목록(currentRestaurants) 연동 제거
                    if (shoppingLinkPlanId !== 'manual' && shoppingLinkPlanId) {
                        const linkedPlan = planTimeline.find(p => String(p.id) === String(shoppingLinkPlanId));
                        if (linkedPlan) {
                            targetDay = linkedPlan.day;
                            targetPlace = linkedPlan.place;
                        }
                    } else {
                        targetPlace = itemName;
                    }

                    const isPersonal = document.getElementById('shopType')?.value === 'personal';
                    // [NEW] 쇼핑 아이템에 img 필드 추가
                    const newItem = { id: Date.now().toString(), text: newShoppingItem.trim(), isChecked: false, day: targetDay, theme: shoppingItemTheme, linkedPlace: targetPlace, isPersonal: isPersonal, userId: appUserId, img: newShoppingPhoto };
                    const newList = [...shoppingList, newItem];
                    setShoppingList(newList);
                    dbUpdates.shopping_list = newList;

                    saveToDb(dbUpdates);
                    setNewShoppingItem("");
                    setNewShoppingPhoto(""); // 입력 완료 후 사진 초기화
                  }} className="bg-pink-500 text-white px-3 py-2.5 rounded-lg text-[10px] font-bold shadow-sm hover:bg-pink-600 active:scale-95 transition-all">등록</button>
                </div>
                {/* [NEW] 사진 첨부 영역 */}
                <div className="flex space-x-1.5">
                  <input type="file" accept="image/*" ref={shoppingFileInputRef} onChange={(e) => { const file = e.target.files?.[0]; if(file) compressAndStoreImage(supabaseClient, appUserId, activeTripId, file, (compressed) => setNewShoppingPhoto(S(compressed))); }} className="hidden" />
                  <button type="button" onClick={() => shoppingFileInputRef.current?.click()} className={`flex-shrink-0 px-2 py-1.5 text-[9px] font-bold rounded-lg border transition-all duration-300 flex items-center justify-center ${newShoppingPhoto ? 'bg-pink-50 border-pink-300 text-pink-600 shadow-sm' : (isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100')}`}>
                    📸 파일
                  </button>
                  <input type="text" placeholder="또는 이미지 URL 복붙" value={newShoppingPhoto} onChange={e => setNewShoppingPhoto(e.target.value)} className={`flex-1 ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'} px-2 py-1.5 text-[9px] font-bold outline-none rounded-lg shadow-sm`} />
                </div>
              </div>
<div className="flex items-center justify-between px-1 mt-2">
                <select value={shoppingFilterTheme} onChange={e => setShoppingFilterTheme(e.target.value)} className={`w-24 ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'} p-1 text-[9px] font-bold outline-none rounded-md shadow-sm transition-colors duration-300`}>
                   <option value="all">테마 전체</option>
                   <option value="쇼핑">쇼핑</option>
                   <option value="식당">식당</option>
                   <option value="관광지">관광지</option>
                   <option value="숙소">숙소</option>
                   <option value="기타">기타</option>
                </select>
                <label className="flex items-center space-x-1.5 cursor-pointer group">
                  <input type="checkbox" checked={showAllShopping} onChange={e => setShowAllShopping(e.target.checked)} className="accent-pink-500 w-3 h-3 cursor-pointer" />
                  <span className={`text-[10px] font-bold ${textMuted}`}>모든 Day 보기</span>
                </label>
              </div>
            </div>

<div className="flex flex-wrap gap-2 overflow-y-auto custom-scrollbar flex-1 pb-2 content-start">
              {(() => {
                {/* [교차 필터링 핵심 로직] */}
                const filteredList = shoppingList.filter(item => {
                  const dayMatch = showAllShopping || String(item.day) === String(shoppingItemDay || "");
                  const themeMatch = shoppingFilterTheme === 'all' || item.theme === shoppingFilterTheme;
                  return dayMatch && themeMatch;
                });

                if (shoppingList.length === 0) return <p className="text-center text-xs text-slate-400 py-10 font-bold w-full">기록된 항목이 없습니다.</p>;
                if (filteredList.length === 0) return <p className="text-center text-xs text-slate-400 py-10 font-bold w-full">해당 Day와 테마에 맞는 정보가 없습니다.</p>;

                return filteredList.map(item => {
                  const isEditing = editingItemId === item.id;
                  return (
                   <div
                     key={item.id}
                     onMouseDown={() => onStartLongPress(item.id)}
                     onMouseUp={onCancelLongPress}
                     onTouchStart={() => onStartLongPress(item.id)}
                     onTouchEnd={onCancelLongPress}
                     className={`group cursor-pointer flex flex-col justify-center px-3 py-2 rounded-xl border shadow-sm transition-all duration-300 w-full ${isEditing ? 'border-pink-500 ring-2 ring-pink-500 bg-white dark:bg-slate-800' : (item.isChecked ? (isDarkMode ? 'bg-slate-700 text-slate-400 border-slate-600 line-through' : 'bg-slate-200 border-slate-300 text-slate-500 line-through') : (isDarkMode ? 'bg-pink-900/30 border-pink-500/50 text-pink-300 hover:bg-pink-900/50' : 'bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100'))}`}
                     onClick={() => {
                        if (isEditing) return;
                        const newList = shoppingList.map(s => s.id === item.id ? { ...s, isChecked: !s.isChecked } : s);
                        setShoppingList(newList); saveToDb({ shopping_list: newList });
                     }}
                   >
                     {isEditing ? (
                       <div className="space-y-2 py-1 no-recolor" onClick={e => e.stopPropagation()}>
                         <input
                           autoFocus
                           className="w-full text-xs font-black p-1 border-b border-pink-300 bg-transparent outline-none"
                           value={item.text}
                           onChange={(e) => {
                             const newList = shoppingList.map(s => s.id === item.id ? { ...s, text: e.target.value } : s);
                             setShoppingList(newList);
                           }}
                         />
                         <div className="flex space-x-2">
                           <select
                             className="flex-1 text-[10px] p-1 rounded bg-pink-50 border border-pink-200"
                             value={item.theme}
                             onChange={(e) => {
                               const newList = shoppingList.map(s => s.id === item.id ? { ...s, theme: e.target.value } : s);
                               setShoppingList(newList);
                             }}
                           >
                             {['쇼핑', '식당', '디저트', '관광지', '숙소', '기타'].map(t => <option key={t} value={t}>{t}</option>)}
                           </select>
                           <button
                             onClick={() => { setEditingItemId(null); saveToDb({ shopping_list: shoppingList }); }}
                             className="bg-pink-500 text-white px-3 py-1 rounded text-[10px] font-black"
                           >완료</button>
                         </div>
                       </div>
                     ) : (
                       <>
                         <div className="flex items-center justify-between w-full">
                           <span className="text-[11px] font-bold truncate max-w-[200px]">{item.text}</span>
                           <button onClick={(e) => { e.stopPropagation(); const newList = shoppingList.filter(s => s.id !== item.id); setShoppingList(newList); saveToDb({ shopping_list: newList }); }} className={`ml-2 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${item.isChecked ? 'text-slate-400 hover:text-slate-600' : 'text-pink-400 hover:text-pink-600'}`}><X className="w-[1em] h-[1em] inline" /></button>
                         </div>
                         <div className="flex items-center space-x-1 mt-0.5 opacity-60">
                           <span className="text-[8px] font-bold bg-black/5 px-1 rounded">{item.linkedPlace ? `📍 ${item.linkedPlace}` : (item.day ? `Day ${item.day}` : '미지정')}</span>
                           <span className="text-[8px] font-bold bg-black/5 px-1 rounded">{item.theme || '기타'}</span>
                         </div>
                       </>
                     )}
                   </div>
                )});
              })()}
            </div>
         </div>
      </div>
    </div>
  );
};

export default ShoppingEditModal;
