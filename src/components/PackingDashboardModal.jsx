import React from 'react';
import { X, Backpack } from 'lucide-react';

const PackingDashboardModal = ({ isOpen, onClose, isDarkMode, textMain, packingList, onToggleItem, onAddItem, suggestions = [], onAddSuggestedItem }) => {
  if (!isOpen) return null;
  // 이 여행지 추천 준비물 — 일정 화면 준비물 창에만 있던 걸 여기에도 (6차 I7-1). 이미 담은 건 뺀다
  const remainingSuggestions = (Array.isArray(suggestions) ? suggestions : []).filter(text => !packingList.some(item => !item.isPersonal && item.text === text));

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[8000] flex items-center justify-center p-4 transition-opacity duration-300" onClick={onClose}>
      <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 rounded-2xl`} onClick={e => e.stopPropagation()}>
         <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
            <h3 className={`text-sm font-black flex items-center gap-1.5 ${textMain}`}><Backpack className="w-4 h-4" /> 이번 여행 준비물 목록</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg transition-colors"><X className="w-[1em] h-[1em] inline" /></button>
         </div>
         <div className="p-4 space-y-4 max-h-[60vh] flex flex-col min-h-[30vh]">
            {/* 여기서도 바로 추가 (예전엔 "일정 탭에서 등록해 주세요"만 나왔다) — 공동용으로 담기고, 개인용은 일정 탭 준비물에서 */}
            {typeof onAddItem === 'function' && (
              <input type="text" placeholder="챙길 물건 입력 후 엔터키 (공동용)" onKeyDown={onAddItem}
                className={`shrink-0 w-full border px-3 py-2.5 text-xs font-bold outline-none rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-900 border-slate-600 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`} />
            )}
            {typeof onAddSuggestedItem === 'function' && remainingSuggestions.length > 0 && (
              <div className="shrink-0 space-y-1.5">
                <p className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>✨ 이 여행지 추천 준비물 (눌러서 담기)</p>
                <div className="flex flex-wrap gap-1.5">
                  {remainingSuggestions.map(text => (
                    <button key={text} onClick={() => onAddSuggestedItem(text)}
                      className={`px-2.5 py-1 rounded-full border border-dashed text-[10px] font-bold transition-colors ${isDarkMode ? 'border-indigo-500/60 text-indigo-300 hover:bg-indigo-900/40' : 'border-indigo-300 text-indigo-600 hover:bg-indigo-50'}`}>
                      + {text}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {packingList.some(item => item.isChecked) && (
              <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-lg text-[11px] font-bold text-center animate-in fade-in shrink-0 border border-emerald-100 dark:border-emerald-800/50 duration-300">
                 ✨ 앗! 준비물을 하나씩 채우고 계시군요. 완벽한 여행이 될 거예요!
              </div>
            )}
            <div className="flex flex-wrap gap-2 overflow-y-auto custom-scrollbar flex-1 pb-2 content-start">
                  {packingList.map(item => (
                    <div key={item.id} onClick={() => onToggleItem(item.id)} className={`cursor-pointer flex items-center space-x-2 px-3 py-1.5 rounded-full border shadow-sm transition-all duration-300 ${item.isChecked ? (isDarkMode ? 'bg-slate-700 text-slate-400 border-slate-600 line-through' : 'bg-slate-200 border-slate-300 text-slate-500 line-through') : (isDarkMode ? 'bg-indigo-900/50 border-indigo-500/50 text-indigo-300 hover:bg-indigo-900/70' : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100')}`}>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-300 ${item.isChecked ? 'bg-indigo-500 border-indigo-500 scale-110' : 'border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-800'}`}>
                        {item.isChecked && <span className="text-white text-[10px] font-black leading-none mt-0.5">✓</span>}
                      </div>
                      <span className={`text-[11px] font-bold truncate max-w-[250px]`}>{item.text}</span>
                    </div>
                  ))}
              {packingList.length === 0 && (
                <div className="text-center w-full py-10">
                   <p className="text-xs text-slate-400 font-bold">등록된 준비물이 없습니다.</p>
                   <p className="text-[10px] text-slate-400 mt-2">위 칸에 입력하고 엔터를 눌러 추가해 보세요!</p>
                </div>
              )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default PackingDashboardModal;
