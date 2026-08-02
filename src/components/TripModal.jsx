import React from 'react';
import { X, Plane, Pencil } from 'lucide-react';
import { S } from '../utils/helpers';

const TripModal = ({
  tripModal, setTripModal, cardBg, isDarkMode, inputBg, submitTripModal, isSubmittingTrip,
}) => {
  if (!tripModal.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9998] backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300">
      <div className={`${cardBg} w-full max-w-xs p-5 flex flex-col animate-in zoom-in-95 z-[9999] duration-300`} onClick={e => e.stopPropagation()}>
        <div className={`flex items-center justify-between pb-3 border-b mb-4 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
          <h2 className="text-sm font-black text-indigo-500 flex items-center gap-1.5">{tripModal.mode === 'add' ? <><Plane className="w-4 h-4" /> 새 여행 만들기</> : <><Pencil className="w-4 h-4" /> 여행 이름 변경</>}</h2>
          <button onClick={() => setTripModal({ ...tripModal, isOpen: false })} className="transition-colors hover:text-slate-500"><X className="w-[1em] h-[1em] inline" /></button>
        </div>
        <input
          type="text"
          value={S(tripModal.name)}
          onChange={e => setTripModal({ ...tripModal, name: e.target.value })}
          placeholder="여행 이름을 입력하세요"
          className={`w-full ${inputBg} p-3 text-xs font-bold outline-none mb-4 transition-all duration-300 focus:ring-2 focus:ring-indigo-500 rounded`}
          autoFocus
          onKeyDown={e => e.key === 'Enter' && submitTripModal()}
        />
        <button onClick={submitTripModal} disabled={isSubmittingTrip} className={`w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold text-xs shadow-md transition-all duration-300 ${isSubmittingTrip ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700 active:scale-95'}`}>확인</button>
      </div>
    </div>
  );
};

export default TripModal;
