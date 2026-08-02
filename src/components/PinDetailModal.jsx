import React from 'react';
import { S, openGoogleMapsNav } from '../utils/helpers';

const PinDetailModal = ({
  selectedPinInfo, setSelectedPinInfo, cardBg, setViewPhoto, handleCopyLocalName, openEditPinModal,
}) => {
  if (!selectedPinInfo) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[8000] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-300" onClick={() => setSelectedPinInfo(null)}>
      <div className={`${cardBg} w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300`} onClick={e => e.stopPropagation()}>
        {selectedPinInfo.img && !S(selectedPinInfo.img).includes("unsplash") && (
          <div className="w-full h-48 relative cursor-pointer" onClick={e => { e.stopPropagation(); const imgs = Array.isArray(selectedPinInfo.imgs) && selectedPinInfo.imgs.length > 0 ? selectedPinInfo.imgs : (Array.isArray(selectedPinInfo.photos) && selectedPinInfo.photos.length > 0 ? selectedPinInfo.photos : [selectedPinInfo.img]); setViewPhoto({ imgs, idx: 0 }); }}>
            <img src={selectedPinInfo.img} className="w-full h-full object-cover" alt="" />
            {selectedPinInfo.isAccommodation && <div className="absolute top-3 left-3 bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded shadow-md">숙소</div>}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
              <span className="opacity-0 hover:opacity-100 text-white text-2xl drop-shadow">🔍</span>
            </div>
          </div>
        )}
        <div className="p-5 flex flex-col">
          <h3 className="text-lg font-black text-slate-900 mb-2">{S(selectedPinInfo.name)} {selectedPinInfo.isAccommodation && !selectedPinInfo.img ? '🏠' : ''}</h3>

          {selectedPinInfo.localName && (
            <div className="flex items-center text-sm font-bold text-indigo-500 mb-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => handleCopyLocalName(e, selectedPinInfo.localName)}>
              <span className="mr-2">📍 {S(selectedPinInfo.localName)}</span>
              <span className="text-[10px] bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">복사</span>
            </div>
          )}

          {selectedPinInfo.signature && S(selectedPinInfo.signature) !== "직접 추가한 장소" ? (
            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">{S(selectedPinInfo.signature)}</p>
          ) : (
            <p className="text-sm text-slate-400 italic">기록된 메모가 없습니다.</p>
          )}

          {selectedPinInfo.lat && selectedPinInfo.lng && (
            <button onClick={() => openGoogleMapsNav(selectedPinInfo.lat, selectedPinInfo.lng, 'driving')} className="w-full mt-4 bg-green-500 hover:bg-green-600 active:scale-95 text-white py-3 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center space-x-2">
              <span>🧭</span><span>구글 네비게이션으로 길 안내</span>
            </button>
          )}
          <div className="flex space-x-2 mt-2">
            <button onClick={() => {
              openEditPinModal(selectedPinInfo);
              setSelectedPinInfo(null);
            }} className="flex-1 bg-indigo-100 text-indigo-600 py-3 rounded-xl font-bold text-sm hover:bg-indigo-200 transition-colors duration-300">정보 수정</button>
            <button onClick={() => setSelectedPinInfo(null)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors duration-300">닫기</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinDetailModal;
