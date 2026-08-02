import React from 'react';
import { LogOut, Trash2 } from 'lucide-react';

const DeleteTripConfirmModal = ({ tripToDelete, setTripToDelete, trips, isDarkMode, confirmDeleteTrip }) => {
  if (!tripToDelete) return null;

  const target = trips.find(t => t.id === tripToDelete);

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-300">
       <div className={`bg-white dark:bg-slate-800 p-6 rounded-3xl max-w-xs w-full text-center shadow-2xl animate-in zoom-in-95 duration-300`}>
          <div className="flex justify-center mb-3">{target?.isShared ? <LogOut className="w-8 h-8 text-slate-400" /> : <Trash2 className="w-8 h-8 text-slate-400" />}</div>
          <h3 className={`text-sm font-black mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
             {target?.isShared ? '공유 목록에서 나가기' : '여행 삭제'}
          </h3>
          <p className={`text-[11px] font-bold mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} leading-relaxed`}>
             {target?.isShared
               ? '이 공유 여행을 내 문서함 목록에서 지우시겠습니까?'
               : '정말 이 여행을 삭제하시겠습니까?\n삭제된 데이터는 절대 복구할 수 없습니다.'}
          </p>
          <div className="flex space-x-2">
             <button className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-colors duration-300 ${isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} onClick={() => setTripToDelete(null)}>취소</button>
             <button className="flex-1 py-2.5 bg-rose-500 text-white rounded-xl font-bold text-xs shadow-md hover:bg-rose-600 active:scale-95 transition-all duration-300" onClick={confirmDeleteTrip}>
                {target?.isShared ? '나가기' : '삭제하기'}
             </button>
          </div>
       </div>
    </div>
  );
};

export default DeleteTripConfirmModal;
