import React from 'react';
import { X, Backpack } from 'lucide-react';

const PackingEditModal = ({
  isOpen, onClose, isDarkMode, textMain, inputBg,
  onAddItem, packingList, appUserId, editingItemId,
  onStartLongPress, onCancelLongPress, onToggleItem, setPackingList, setEditingItemId,
  saveToDb, onDeleteItem,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[8000] flex items-center justify-center p-4 transition-opacity duration-300" onClick={onClose}>
      <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 rounded-2xl`} onClick={e => e.stopPropagation()}>
         <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
            <h3 className={`text-sm font-black flex items-center gap-1.5 ${textMain}`}><Backpack className="w-4 h-4" /> 준비물 챙기기</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg transition-colors"><X className="w-[1em] h-[1em] inline" /></button>
         </div>
         <div className="p-4 space-y-4 max-h-[60vh] flex flex-col min-h-[30vh]">
            <div className="flex space-x-2 shrink-0">
              {/* 개인용/공동용 선택 드롭다운 */}
              <select id="packType" className={`w-24 ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'} px-2 py-2.5 text-[10px] font-bold outline-none rounded-lg shadow-sm`}>
                <option value="shared">공동용 👨‍👩‍👧‍👦</option>
                <option value="personal">개인용 🔒</option>
              </select>
              <input type="text" placeholder="챙길 물건 입력 후 엔터키" onKeyDown={onAddItem} className={`flex-1 ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'} px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none rounded-lg shadow-sm transition-all duration-300`} />
            </div>

            {packingList.some(item => item.isChecked) && (
              <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-lg text-[11px] font-bold text-center animate-in fade-in shrink-0 border border-emerald-100 dark:border-emerald-800/50 duration-300">
                 ✨ 앗! 준비물을 하나씩 채우고 계시군요. 완벽한 여행이 될 거예요!
              </div>
            )}

            <div className="flex flex-wrap gap-2 overflow-y-auto custom-scrollbar flex-1 pb-2 content-start">
              {/* 개인용 아이템은 작성자 본인(appUserId)에게만 보이도록 필터링 */}
              {packingList.filter(item => !item.isPersonal || item.userId === appUserId).map(item => {
                const isEditing = editingItemId === item.id;
                return (
                 <div
                   key={item.id}
                   onMouseDown={() => onStartLongPress(item.id)}
                   onMouseUp={onCancelLongPress}
                   onTouchStart={() => onStartLongPress(item.id)}
                   onTouchEnd={onCancelLongPress}
                   className={`group cursor-pointer flex items-center px-3 py-1.5 rounded-full border shadow-sm transition-all duration-300 ${isEditing ? 'border-indigo-500 ring-2 ring-indigo-500 bg-white dark:bg-slate-800' : (item.isChecked ? (isDarkMode ? 'bg-slate-700 text-slate-400 border-slate-600 line-through' : 'bg-slate-200 border-slate-300 text-slate-500 line-through') : (isDarkMode ? 'bg-indigo-900/50 border-indigo-500/50 text-indigo-300 hover:bg-indigo-900/70' : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'))}`}
                   onClick={() => {
                      if (isEditing) return;
                      onToggleItem(item.id);
                   }}
                 >
                   {isEditing ? (
                     <div className="flex items-center space-x-2 no-recolor" onClick={e => e.stopPropagation()}>
                       <input
                         autoFocus
                         className="text-xs font-black bg-transparent outline-none border-b border-indigo-300 w-24"
                         value={item.text}
                         onChange={(e) => {
                           const newList = packingList.map(p => p.id === item.id ? { ...p, text: e.target.value } : p);
                           setPackingList(newList);
                         }}
                         onKeyDown={e => e.key === 'Enter' && setEditingItemId(null)}
                       />
                       <button onClick={() => { setEditingItemId(null); saveToDb({ packing_list: packingList }); }} className="text-[10px] font-black text-indigo-600">저장</button>
                     </div>
                   ) : (
                     <>
                       <span className="text-[11px] font-bold truncate max-w-[200px]">{item.text}</span>
                       <button onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }} className={`ml-2 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${item.isChecked ? 'text-slate-400 hover:text-slate-600' : 'text-indigo-400 hover:text-indigo-600'}`}><X className="w-[1em] h-[1em] inline" /></button>
                     </>
                   )}
                 </div>
              )})}
              {packingList.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-10 font-bold w-full">아직 등록된 준비물이 없습니다.</p>
              )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default PackingEditModal;
