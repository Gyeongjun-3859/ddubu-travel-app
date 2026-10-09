import React from 'react';
import { X, Plane, Pencil } from 'lucide-react';
import { S } from '../utils/helpers';
import { REGIONS_BY_COUNTRY } from '../utils/constants';

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
        {/* 새 여행이면 어디로·언제·며칠인지도 같이 받는다 (모두 선택 — 비워 두면 나중에 일정 탭에서 정해도 됨) */}
        {tripModal.mode === 'add' && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <label className="col-span-1 flex flex-col gap-1 text-[10px] font-bold text-slate-400">국가
              <select value={S(tripModal.country)} onChange={e => setTripModal({ ...tripModal, country: e.target.value, region: '' })} className={`${inputBg} p-2 text-xs font-bold outline-none rounded`}>
                <option value="">나중에</option>
                {Object.keys(REGIONS_BY_COUNTRY).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="col-span-1 flex flex-col gap-1 text-[10px] font-bold text-slate-400">지역
              <select value={S(tripModal.region)} onChange={e => setTripModal({ ...tripModal, region: e.target.value })} disabled={!tripModal.country} className={`${inputBg} p-2 text-xs font-bold outline-none rounded disabled:opacity-50`}>
                <option value="">나중에</option>
                {(REGIONS_BY_COUNTRY[tripModal.country] || []).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label className="col-span-1 flex flex-col gap-1 text-[10px] font-bold text-slate-400">시작일
              <input type="date" value={S(tripModal.startDate)} onChange={e => setTripModal({ ...tripModal, startDate: e.target.value })} className={`${inputBg} p-2 text-xs font-bold outline-none rounded`} />
            </label>
            <label className="col-span-1 flex flex-col gap-1 text-[10px] font-bold text-slate-400">며칠
              <select value={S(tripModal.days || 4)} onChange={e => setTripModal({ ...tripModal, days: parseInt(e.target.value) })} className={`${inputBg} p-2 text-xs font-bold outline-none rounded`}>
                {Array.from({ length: 30 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}일</option>)}
              </select>
            </label>
          </div>
        )}
        <button onClick={submitTripModal} disabled={isSubmittingTrip} className={`w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold text-xs shadow-md transition-all duration-300 ${isSubmittingTrip ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700 active:scale-95'}`}>확인</button>
      </div>
    </div>
  );
};

export default TripModal;
