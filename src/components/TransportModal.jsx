import React from 'react';
import { X } from 'lucide-react';
import { compressAndStoreImage } from '../utils/helpers';

const initialTransState = { airline: '', flightNum: '', seatNum: '', dep: '', arr: '', depTime: '', arrTime: '', day: 1 };

const TransportModal = ({
  isOpen, onClose, isDarkMode, textMuted, inputBg,
  transType, setTransType, transDir, setTransDir,
  modalTransData, setModalTransData, tripDays, handleTimeInput,
  rentalCarData, setRentalCarData, rentalFileInputRef,
  supabaseClient, appUserId, activeTripId, handleSaveTransport,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[8000] flex items-center justify-center p-4 transition-opacity duration-300" onClick={onClose}>
      <div className={`${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white'} w-full max-w-sm shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 rounded-2xl`} onClick={e => e.stopPropagation()}>
        <div className={`flex items-center justify-between p-3 border-b ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'}`}>
          <div className="flex items-center space-x-2">
            <span className="text-indigo-500 text-sm">✈️</span>
            <h3 className="text-xs font-bold">교통권 등록</h3>
          </div>
          <button onClick={onClose} className={`p-1 rounded transition-colors ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700'}`}><X className="w-[1em] h-[1em] inline" /></button>
        </div>

        <div className="p-4 space-y-3">
          <div className={`grid grid-cols-4 gap-1 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'} p-1 rounded-lg`}>
             <button onClick={() => {setTransType('flight'); setTransDir('outbound');}} className={`py-1.5 text-[10px] font-bold rounded transition-colors duration-300 ${transType === 'flight' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>✈️ 항공권</button>
             <button onClick={() => {setTransType('train'); setTransDir('outbound');}} className={`py-1.5 text-[10px] font-bold rounded transition-colors duration-300 ${transType === 'train' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>🚆 기차</button>
             <button onClick={() => {setTransType('bus'); setTransDir('outbound');}} className={`py-1.5 text-[10px] font-bold rounded transition-colors duration-300 ${transType === 'bus' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>🚌 버스</button>
             <button onClick={() => setTransType('rental')} className={`py-1.5 text-[10px] font-bold rounded transition-colors duration-300 ${transType === 'rental' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>🚗 렌터카</button>
          </div>

          {transType !== 'rental' && (
          <div className="flex space-x-2 items-center">
             <button onClick={() => setTransDir('outbound')} className={`flex-1 py-1 text-[10px] font-bold border-b-2 transition-colors duration-300 ${transDir === 'outbound' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>가는 편 (Outbound)</button>
             <button onClick={() => setTransDir('inbound')} className={`flex-1 py-1 text-[10px] font-bold border-b-2 transition-colors duration-300 ${transDir === 'inbound' ? 'border-rose-500 text-rose-500' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>오는 편 (Inbound)</button>
             <button onClick={() => setModalTransData(prev => ({...prev, [transType]: {...prev[transType], [transDir]: {...initialTransState}}}))} className="px-2 py-1 text-[9px] font-bold bg-slate-100 text-slate-500 rounded border hover:bg-slate-200 transition-colors duration-300">초기화</button>
          </div>
          )}

          {transType !== 'rental' ? (
          <>
          <div className="flex flex-col space-y-1 animate-in fade-in duration-300">
             <label className={`text-[9px] font-bold ${textMuted} px-1`}>일차 선택 (Day)</label>
             <select value={modalTransData[transType][transDir].day} onChange={e => setModalTransData(prev => ({...prev, [transType]: {...prev[transType], [transDir]: {...prev[transType][transDir], day: parseInt(e.target.value)}}}))} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-xs font-bold outline-none rounded-lg cursor-pointer transition-all duration-300`}>
                {tripDays.map(d => <option key={d} value={d}>Day {d}</option>)}
             </select>
          </div>

          <div className="flex space-x-2">
            <div className="flex flex-col space-y-1 w-1/3">
              <label className={`text-[9px] font-bold ${textMuted} px-1`}>{transType === 'flight' ? '항공사' : (transType === 'train' ? '기차 종류' : '버스 회사')}</label>
              <input type="text" placeholder={transType === 'flight' ? '대한항공' : 'KTX, 고속버스'} value={modalTransData[transType][transDir].airline} onChange={e => setModalTransData(prev => ({...prev, [transType]: {...prev[transType], [transDir]: {...prev[transType][transDir], airline: e.target.value}}}))} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-xs font-bold rounded-lg transition-all duration-300 focus:border-indigo-500 outline-none`} />
            </div>
            <div className="flex flex-col space-y-1 w-1/3">
              <label className={`text-[9px] font-bold ${textMuted} px-1`}>{transType === 'flight' ? '항공편명' : '편명/번호'}</label>
              <input type="text" placeholder={transType === 'flight' ? 'KE001' : '102호'} value={modalTransData[transType][transDir].flightNum} onChange={e => setModalTransData(prev => ({...prev, [transType]: {...prev[transType], [transDir]: {...prev[transType][transDir], flightNum: e.target.value}}}))} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-xs font-bold rounded-lg transition-all duration-300 focus:border-indigo-500 outline-none`} />
            </div>
            <div className="flex flex-col space-y-1 w-1/3">
              <label className={`text-[9px] font-bold ${textMuted} px-1`}>좌석번호</label>
              <input type="text" placeholder="12A" value={modalTransData[transType][transDir].seatNum} onChange={e => setModalTransData(prev => ({...prev, [transType]: {...prev[transType], [transDir]: {...prev[transType][transDir], seatNum: e.target.value}}}))} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-xs font-bold rounded-lg transition-all duration-300 focus:border-indigo-500 outline-none`} />
            </div>
          </div>

          <div className="flex space-x-2 items-center">
            <div className="flex flex-col space-y-1 w-[45%]">
              <label className={`text-[9px] font-bold ${textMuted} px-1`}>출발지</label>
              <input type="text" placeholder={transType === 'flight' ? 'ICN' : '서울역'} value={modalTransData[transType][transDir].dep} onChange={e => setModalTransData(prev => ({...prev, [transType]: {...prev[transType], [transDir]: {...prev[transType][transDir], dep: e.target.value}}}))} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-xs font-bold rounded-lg transition-all duration-300 focus:border-indigo-500 outline-none`} />
              <input type="text" maxLength="5" placeholder="10:00" value={modalTransData[transType][transDir].depTime} onChange={e => handleTimeInput(e, val => setModalTransData(prev => ({...prev, [transType]: {...prev[transType], [transDir]: {...prev[transType][transDir], depTime: val}}})))} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-xs font-bold rounded-lg mt-1 transition-all duration-300 focus:border-indigo-500 outline-none`} />
            </div>
            <div className="flex flex-col items-center justify-center text-slate-400 font-bold w-[10%]">➔</div>
            <div className="flex flex-col space-y-1 w-[45%]">
              <label className={`text-[9px] font-bold ${textMuted} px-1`}>도착지</label>
              <input type="text" placeholder={transType === 'flight' ? 'NRT' : '부산역'} value={modalTransData[transType][transDir].arr} onChange={e => setModalTransData(prev => ({...prev, [transType]: {...prev[transType], [transDir]: {...prev[transType][transDir], arr: e.target.value}}}))} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-xs font-bold rounded-lg transition-all duration-300 focus:border-indigo-500 outline-none`} />
              <input type="text" maxLength="5" placeholder="12:00" value={modalTransData[transType][transDir].arrTime} onChange={e => handleTimeInput(e, val => setModalTransData(prev => ({...prev, [transType]: {...prev[transType], [transDir]: {...prev[transType][transDir], arrTime: val}}})))} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-xs font-bold rounded-lg mt-1 transition-all duration-300 focus:border-indigo-500 outline-none`} />
            </div>
          </div>
          </>
          ) : (
          /* 렌터카 폼 */
          <div className="space-y-3 animate-in fade-in duration-300">
            <div>
              <label className={`text-[9px] font-bold ${textMuted} px-1 mb-1 block`}>렌터카 사용 기간 (Day 선택, 복수 선택 가능)</label>
              <div className={`grid gap-1 p-1 rounded-lg border ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`} style={{gridTemplateColumns: `repeat(${Math.min(tripDays.length, 4)}, minmax(0, 1fr))`}}>
                {tripDays.map(d => (
                  <button key={d} type="button" onClick={() => setRentalCarData(prev => ({ ...prev, days: prev.days.includes(d) ? prev.days.filter(x => x !== d) : [...prev.days, d].sort((a,b)=>a-b) }))} className={`py-1.5 text-[10px] font-bold rounded transition-all duration-200 ${rentalCarData.days.includes(d) ? 'bg-indigo-600 text-white shadow-md' : (isDarkMode ? 'text-slate-400 hover:bg-slate-600' : 'text-slate-400 hover:bg-slate-100')}`}>D{d}</button>
                ))}
              </div>
            </div>
            <div className="flex space-x-2">
              <div className="flex flex-col space-y-1 flex-1">
                <label className={`text-[9px] font-bold ${textMuted} px-1`}>렌터카 업체</label>
                <input type="text" placeholder="Toyota Rent a Car" value={rentalCarData.company} onChange={e => setRentalCarData(prev => ({...prev, company: e.target.value}))} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-xs font-bold rounded-lg focus:border-indigo-500 outline-none`} />
              </div>
              <div className="flex flex-col space-y-1 flex-1">
                <label className={`text-[9px] font-bold ${textMuted} px-1`}>차종</label>
                <input type="text" placeholder="Toyota Yaris" value={rentalCarData.carType} onChange={e => setRentalCarData(prev => ({...prev, carType: e.target.value}))} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-xs font-bold rounded-lg focus:border-indigo-500 outline-none`} />
              </div>
            </div>
            <div className="flex space-x-2">
              <div className="flex flex-col space-y-1 flex-1">
                <label className={`text-[9px] font-bold ${textMuted} px-1`}>🚗 대여 장소</label>
                <input type="text" placeholder="공항 렌터카 센터" value={rentalCarData.depPlace} onChange={e => setRentalCarData(prev => ({...prev, depPlace: e.target.value}))} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-xs font-bold rounded-lg focus:border-indigo-500 outline-none`} />
                <input type="text" maxLength="5" placeholder="10:00" value={rentalCarData.depTime} onChange={e => handleTimeInput(e, val => setRentalCarData(prev => ({...prev, depTime: val})))} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-xs font-bold rounded-lg mt-1 focus:border-indigo-500 outline-none`} />
              </div>
              <div className="flex flex-col items-center justify-center text-slate-400 font-bold w-8 pt-4">→</div>
              <div className="flex flex-col space-y-1 flex-1">
                <label className={`text-[9px] font-bold ${textMuted} px-1`}>🏁 반납 장소</label>
                <input type="text" placeholder="공항 렌터카 센터" value={rentalCarData.arrPlace} onChange={e => setRentalCarData(prev => ({...prev, arrPlace: e.target.value}))} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-xs font-bold rounded-lg focus:border-indigo-500 outline-none`} />
                <input type="text" maxLength="5" placeholder="18:00" value={rentalCarData.arrTime} onChange={e => handleTimeInput(e, val => setRentalCarData(prev => ({...prev, arrTime: val})))} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-xs font-bold rounded-lg mt-1 focus:border-indigo-500 outline-none`} />
              </div>
            </div>
            {/* 사진 추가 */}
            <div>
              <label className={`text-[9px] font-bold ${textMuted} px-1 mb-1 block`}>사진 (최대 3장)</label>
              <input type="file" accept="image/*" multiple ref={rentalFileInputRef} className="hidden" onChange={e => {
                const files = Array.from(e.target.files || []);
                files.forEach(file => compressAndStoreImage(supabaseClient, appUserId, activeTripId, file, compressed => {
                  setRentalCarData(prev => prev.photos.length < 3 ? { ...prev, photos: [...prev.photos, compressed] } : prev);
                }));
                e.target.value = '';
              }} />
              <div className="flex gap-1.5">
                {(rentalCarData.photos || []).map((img, i) => (
                  <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 flex-shrink-0">
                    <img src={img} className="w-full h-full object-cover" alt="" />
                    <button type="button" onClick={() => setRentalCarData(prev => ({ ...prev, photos: prev.photos.filter((_, idx) => idx !== i) }))} className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px]"><X className="w-[1em] h-[1em] inline" /></button>
                  </div>
                ))}
                {(rentalCarData.photos || []).length < 3 && (
                  <button type="button" onClick={() => rentalFileInputRef.current?.click()} className={`w-14 h-14 rounded-lg border-dashed border-2 flex flex-col items-center justify-center gap-0.5 flex-shrink-0 transition-colors ${isDarkMode ? 'border-slate-500 text-slate-400 hover:bg-slate-700' : 'border-slate-300 text-slate-400 hover:bg-slate-50'}`}>
                    <span className="text-lg leading-none">+</span>
                    <span className="text-[7px] font-bold">사진</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          )}

          <button onClick={handleSaveTransport} className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 text-xs font-bold shadow-md active:scale-95 transition-all duration-300 mt-2`}>
            일괄 등록하기 ✨
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransportModal;
