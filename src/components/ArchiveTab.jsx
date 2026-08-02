import React from 'react';
import { Camera, ArrowLeft, Trash2 } from 'lucide-react';
import { S } from '../utils/helpers';

const ArchiveTab = ({
  activeTab, trips, archiveFilterLocation, setArchiveFilterLocation,
  textMain, textMuted, cardBg, isDarkMode, activeTripId, handleSwitchTrip, setActiveTab, setTripToDelete,
}) => {
  return (
    <div className={`absolute inset-0 flex flex-col p-2 sm:p-5 overflow-hidden transition-opacity duration-300 ${activeTab === 'archive' ? 'visible opacity-100 z-10' : 'invisible opacity-0 -z-10 pointer-events-none'}`}>
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
          <ArrowLeft className="w-3.5 h-3.5" /> 메인화면으로
        </button>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 flex-shrink-0">
        <div>
          <h2 className={`text-lg font-black flex items-center gap-1.5 ${textMain}`}><Camera className="w-4 h-4" /> 소중한 여행기록 <span className="ml-2 text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{trips.filter(t => t.archived).length}개의 추억</span></h2>
          <p className={`text-[10px] font-bold ${textMuted} mt-0.5`}>완료된 여행들을 이곳에서 다시 꺼내보세요.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shadow-inner">
          {['전체', '국내', '해외'].map(cat => (
            <button key={cat} onClick={() => setArchiveFilterLocation(cat)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${archiveFilterLocation === cat ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{cat}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 scroll-smooth">
        {(() => {
          const archived = trips.filter(t => t.archived).filter(t => {
            if (archiveFilterLocation === '전체') return true;
            if (!t.country) return false; // 국가 정보 없는 옛 기록은 '전체'에서만 노출
            const isDomestic = t.country === '한국';
            return archiveFilterLocation === '국내' ? isDomestic : !isDomestic;
          });
          if (archived.length === 0) return (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-40">
              <span className="text-6xl mb-4">🏜️</span>
              <p className="text-sm font-black">아직 완료된 여행이 없습니다.</p>
              <p className="text-xs font-bold mt-1">지금 여행중인 일정을 완료하면 이곳에 나타납니다!</p>
            </div>
          );

          // 연도별 그룹화 로직
          const years = [...new Set(archived.map(t => new Date(t.finishDate || Date.now()).getFullYear()))].sort((a,b) => b - a);

          return years.map(year => {
            const yearTrips = archived.filter(t => new Date(t.finishDate || Date.now()).getFullYear() === year);
            return (
              <div key={year} className="mb-10 last:mb-0">
                <div className="flex items-center mb-4 space-x-3">
                  <span className="text-lg font-black text-indigo-500">{year}년</span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
{yearTrips.map(trip => (
                    <div
                      key={trip.id}
                      onClick={() => {
                        handleSwitchTrip(trip.id);
                        setActiveTab('dashboard'); // 클릭 시 대시보드로 복귀
                      }}
                      className={`group relative flex flex-col p-4 rounded-3xl border-2 transition-all duration-500 cursor-pointer hover:shadow-2xl hover:-translate-y-1 ${
                        activeTripId === trip.id
                          ? 'border-indigo-500 bg-indigo-50/20 ring-4 ring-indigo-500/10'
                          : `${cardBg} border-transparent hover:border-indigo-200`
                      }`}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); setTripToDelete(trip.id); }}
                        className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        title="여행기록 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">🛫</div>
                        <div className="text-right">
                          <span className="text-[9px] font-black text-slate-400 block mb-0.5">FINISH DATE</span>
                          <span className="text-[10px] font-bold text-slate-500">{new Date(trip.finishDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <h3 className={`text-sm font-black mb-1.5 ${textMain} line-clamp-1`}>{S(trip.name)}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-auto">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded text-[9px] font-bold"># {year}년 추억</span>
                        {activeTripId === trip.id && <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[9px] font-black animate-pulse">현재 선택됨</span>}
                      </div>
                      <div className={`absolute inset-0 bg-indigo-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                    </div>
                  ))}
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
};

export default ArchiveTab;
