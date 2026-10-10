import React from 'react';
import { X } from 'lucide-react';
import { S } from '../utils/helpers';
import PlaceInfoSection from './PlaceInfoSection';

// 지도 정보 창의 'ℹ️ 상세 정보' — 아직 핀으로 저장하지 않은 장소의 영업시간·평점·리뷰를 바로 보여 준다.
// (사용자가 직접 눌러서 연 창이라 열자마자 불러온다)
const PlaceInfoModal = ({ place, onClose, cardBg }) => {
  if (!place) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[8000] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className={`${cardBg} w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl p-5 animate-in zoom-in-95 duration-300`} onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-lg font-black text-slate-900 leading-tight">{S(place.name)}</h3>
            {place.localName && <p className="text-sm font-bold text-indigo-500 mt-0.5 truncate">{S(place.localName)}</p>}
          </div>
          <button onClick={onClose} className="shrink-0 p-1 text-slate-400 hover:text-rose-500"><X className="w-5 h-5" /></button>
        </div>
        <PlaceInfoSection pin={place} autoLoad />
        <button onClick={onClose} className="w-full mt-3 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors">닫기</button>
      </div>
    </div>
  );
};

export default PlaceInfoModal;
