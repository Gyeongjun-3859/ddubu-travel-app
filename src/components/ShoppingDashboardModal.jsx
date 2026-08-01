import React from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { S } from '../utils/helpers';

const ShoppingDashboardModal = ({
  isOpen, onClose, isDarkMode, textMain, textMuted, inputBg,
  dashShoppingFilterTheme, setDashShoppingFilterTheme,
  dashShowAllShopping, setDashShowAllShopping,
  shoppingList, setShoppingList, saveToDb, dashboardDay,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[8000] flex items-center justify-center p-4 transition-opacity duration-300" onClick={onClose}>
      <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 rounded-2xl`} onClick={e => e.stopPropagation()}>
         <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
            <h3 className={`text-sm font-black flex items-center gap-1.5 ${textMain}`}><ShoppingBag className="w-4 h-4" /> 이번 여행 쇼핑리스트</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg transition-colors"><X className="w-[1em] h-[1em] inline" /></button>
         </div>

         <div className={`p-2 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
            <select value={dashShoppingFilterTheme} onChange={e => setDashShoppingFilterTheme(e.target.value)} className={`w-24 ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'} p-1 text-[9px] font-bold outline-none rounded-md shadow-sm transition-colors duration-300`}>
               <option value="all">테마 전체</option>
               <option value="쇼핑">쇼핑</option>
               <option value="식당">식당</option>
               <option value="관광지">관광지</option>
               <option value="숙소">숙소</option>
               <option value="기타">기타</option>
            </select>
            <label className="flex items-center space-x-1.5 cursor-pointer group">
              <input type="checkbox" checked={dashShowAllShopping} onChange={e => setDashShowAllShopping(e.target.checked)} className="accent-pink-500 w-3 h-3 cursor-pointer" />
              <span className={`text-[10px] font-bold ${textMuted}`}>모든 Day 보기</span>
            </label>
         </div>

         <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar flex flex-col min-h-[30vh]">
            {shoppingList.length === 0 && (
              <div className="text-center w-full py-10">
                 <p className="text-xs text-slate-400 font-bold">등록된 쇼핑 항목이 없습니다.</p>
              </div>
            )}

            {(() => {
              const baseDisplayedList = dashShowAllShopping ? shoppingList : shoppingList.filter(item => String(item.day) === String(dashboardDay) || !item.day);
              const displayedList = dashShoppingFilterTheme === 'all' ? baseDisplayedList : baseDisplayedList.filter(item => item.theme === dashShoppingFilterTheme);
              if (shoppingList.length > 0 && displayedList.length === 0) {
                 return <p className="text-center text-[10px] text-slate-400 font-bold py-5">현재 일차(Day {dashboardDay})에 등록된 쇼핑 항목이 없습니다.<br/>'전체 일정 보기'를 체크해 보세요.</p>;
              }

              const grouped = displayedList.reduce((acc, item) => {
                 const d = item.day ? `Day ${item.day}` : '미지정 (공통)';
                 const t = item.theme || '기타';
                 if (!acc[d]) acc[d] = {};
                 if (!acc[d][t]) acc[d][t] = [];
                 acc[d][t].push(item);
                 return acc;
              }, {});

              return Object.keys(grouped).sort((a,b) => {
                 if(a==='미지정 (공통)') return 1; if(b==='미지정 (공통)') return -1;
                 return a.localeCompare(b);
              }).map(dayKey => (
                 <div key={dayKey} className="mb-4 last:mb-0">
                    <h4 className={`text-xs font-black mb-2 pb-1 border-b ${isDarkMode ? 'text-indigo-400 border-slate-700' : 'text-indigo-600 border-slate-200'}`}>{dayKey}</h4>
                    {Object.keys(grouped[dayKey]).sort().map(themeKey => (
                       <div key={themeKey} className="mb-3 last:mb-0 pl-2">
                          <h5 className={`text-[10px] font-bold mb-1.5 ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`}>• {themeKey}</h5>
                          <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-2">
                             {grouped[dayKey][themeKey].map(item => (
                                <div key={item.id} onClick={() => {
                                    const newList = shoppingList.map(s => s.id === item.id ? { ...s, isChecked: !s.isChecked } : s);
                                    setShoppingList(newList); saveToDb({ shopping_list: newList });
                                }} className={`cursor-pointer flex flex-col rounded-lg border shadow-sm overflow-hidden transition-all duration-300 ${item.isChecked ? (isDarkMode ? 'bg-slate-800 border-slate-700 opacity-50 grayscale' : 'bg-slate-100 border-slate-200 opacity-50 grayscale') : (isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200')}`}>
                                  <div className="w-full aspect-square relative bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center overflow-hidden">
                                    {item.img && !S(item.img).includes("unsplash") ? (
                                      <img src={item.img} alt={item.text} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-xl opacity-40">{themeKey === '쇼핑' ? '🛍️' : themeKey === '식당' ? '🍽️' : themeKey === '관광지' ? '📸' : themeKey === '숙소' ? '🏠' : '🎁'}</span>
                                    )}
                                    <div className={`absolute top-1 left-1 w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all duration-300 shadow-sm bg-white/80 dark:bg-slate-800/80 ${item.isChecked ? 'border-pink-500 bg-pink-500 text-white' : 'border-slate-300'}`}>
                                      {item.isChecked && <span className="text-[7px] font-black">✓</span>}
                                    </div>
                                  </div>
                                  <div className={`p-1 text-center transition-all duration-300 ${item.isChecked ? 'line-through text-slate-400' : (isDarkMode ? 'text-slate-200' : 'text-slate-800')}`}>
                                    <span className="text-[8px] font-black block truncate w-full no-recolor">{item.text}</span>
                                  </div>
                                </div>
                              ))}
                          </div>
                       </div>
                    ))}
                 </div>
              ));
            })()}
         </div>
      </div>
    </div>
  );
};

export default ShoppingDashboardModal;
