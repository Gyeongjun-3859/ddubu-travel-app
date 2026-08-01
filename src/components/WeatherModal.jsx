import React from 'react';
import { X, CloudSun } from 'lucide-react';
import { S, getWeatherInfo } from '../utils/helpers';

const WeatherModal = ({
  isOpen, onClose,
  cardBg, isDarkMode, textMain, textMuted,
  displayCityName, globalManualRegion, globalPlanRegion,
  forecast, fetchWeatherData, expandedWeatherDay, onDayClick, isLoadingHourly, hourlyWeatherCache,
  tripDays, getDateStringForDay, planTimeline,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-300" onClick={onClose}>
       <div className={`${cardBg} p-5 rounded-3xl w-full max-w-xs sm:max-w-sm shadow-2xl animate-in zoom-in-95 duration-300`} onClick={e => e.stopPropagation()}>
          <div className={`flex justify-between items-center mb-4 border-b pb-2 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
             <h3 className={`font-black text-sm flex items-center gap-1.5 ${textMain}`}><CloudSun className="w-4 h-4" /> 날씨 예보</h3>
             <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg transition-colors"><X className="w-[1em] h-[1em] inline" /></button>
          </div>
          <div className="space-y-2.5 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1 scroll-smooth">
             {forecast.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 space-y-3">
                   <p className={`text-xs ${textMuted} text-center font-bold`}>
                     날씨 정보를 불러올 수 없습니다.<br/>(일정 탭에서 지역을 선택해주세요)
                   </p>
                   <button onClick={() => fetchWeatherData(displayCityName)} className="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm hover:bg-indigo-200 transition-colors active:scale-95">
                     현재 지역({displayCityName || "없음"}) 날씨 다시 불러오기 🔄
                   </button>
                </div>
             ) : (
                (() => {
                  const effectiveDisplayCity = displayCityName && displayCityName !== '선택된 지역 없음' ? displayCityName : (globalManualRegion || (globalPlanRegion && globalPlanRegion !== '수동입력' ? globalPlanRegion : ''));
                  return tripDays.map((d) => {
                   const targetDateStr = getDateStringForDay(d);
                   const f = forecast.find(fc => fc && fc.date === targetDateStr);
                   const todayStr = new Date().toISOString().split('T')[0];
                   const isToday = targetDateStr === todayStr;

                   if (!f) {
                       const today = new Date();
                       today.setHours(0, 0, 0, 0);
                       const targetDate = targetDateStr ? new Date(targetDateStr) : null;
                       const daysUntil = targetDate ? Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24)) : null;
                       const availableFrom = targetDate ? new Date(targetDate.getTime() - 15 * 24 * 60 * 60 * 1000) : null;
                       const availableFromStr = availableFrom ? `${availableFrom.getMonth() + 1}월 ${availableFrom.getDate()}일` : null;
                       const reason = daysUntil === null ? '날짜 정보 없음'
                         : daysUntil < 0 ? '지난 날짜'
                         : daysUntil > 15 ? `아직 너무 먼 날짜`
                         : '데이터 준비 중';
                       return (
                          <div key={d} className={`flex justify-between items-center p-3 rounded-xl border shadow-sm transition-all duration-300 ${isToday ? (isDarkMode ? 'bg-indigo-900/30 border-indigo-500' : 'bg-indigo-50 border-indigo-300') : (isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100')}`}>
                             <div className="flex flex-col space-y-0.5">
                                <span className={`text-[10px] font-bold ${isToday ? 'text-indigo-500' : textMuted}`}>Day {d} - {effectiveDisplayCity} ({targetDateStr.slice(5)})</span>
                                <span className={`text-xs font-black ${textMuted}`}>예보 없음 <span className="font-normal text-[10px]">({reason})</span></span>
                                {daysUntil > 15 && availableFromStr && (
                                  <span className="text-[10px] text-indigo-400 font-bold">📅 {availableFromStr}부터 날씨 확인 가능</span>
                                )}
                             </div>
                             <div className="text-right flex flex-col justify-center">
                                <span className={`text-[11px] font-bold ${textMuted}`}>-</span>
                             </div>
                          </div>
                       );
                   }

                     const info = getWeatherInfo(f.code);

                     // --- 일정 기반 지역 및 시간 처리 로직 ---
                     const isValidRegion = (r) => r && r !== '수동입력' && r !== '선택된 지역 없음';
                     const dPlans = (Array.isArray(planTimeline) ? planTimeline : [])
                        .filter(p => parseInt(p.day) === d && !p.isAccommodation && !p.isTransport && isValidRegion(p.region) && p.time && p.time !== '99:99')
                        .sort((a, b) => S(a.time).localeCompare(S(b.time)));

                     let mainRegion = effectiveDisplayCity;
                     if (dPlans.length > 0) mainRegion = dPlans[0].region;

                     const getRegionForHour = (hour) => {
                         let currentReg = mainRegion;
                         for (const p of dPlans) {
                             const pTime = p.time || "00:00";
                             const pHour = parseInt(pTime.split(':')[0]);
                             if (hour >= pHour) {
                                 currentReg = p.region;
                             }
                         }
                         return currentReg;
                     };
                     // ----------------------------------------------

                     return (
                        <div key={d} className="flex flex-col space-y-1">
                          <div onClick={() => onDayClick(d)} className={`cursor-pointer flex justify-between items-center p-3 rounded-xl border shadow-sm transition-all duration-300 hover:shadow-md ${isToday ? (isDarkMode ? 'bg-indigo-900/30 border-indigo-500' : 'bg-indigo-50 border-indigo-300') : (isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100')}`}>
                             <div className="flex flex-col">
                                <span className={`text-[10px] font-bold ${isToday ? 'text-indigo-500' : textMuted}`}>Day {d} - {mainRegion} ({f.date.slice(5)})</span>
                                <span className={`text-xs font-black mt-0.5 ${textMain}`}>{info[0]} {info[1]}</span>
                             </div>
                             <div className="text-right flex flex-col items-end">
                                <div className="flex space-x-2">
                                  <span className="text-[11px] font-bold text-rose-500">최고 {f.max}°</span>
                                  <span className="text-[11px] font-bold text-blue-500">최저 {f.min}°</span>
                                </div>
                                <span className={`text-[8px] mt-1 transition-colors duration-300 ${expandedWeatherDay === d ? 'text-indigo-500 font-bold' : 'text-slate-400'}`}>
                                  {expandedWeatherDay === d ? '접기 ▲' : '시간대별 보기 ▼'}
                                </span>
                             </div>
                          </div>

                          {/* 시간대별 날씨 및 지역 동적 변경 (확장 시) - 가로 스크롤 적용 */}
                          {expandedWeatherDay === d && (
                            <div className={`p-2 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'} overflow-x-auto custom-scrollbar animate-in fade-in duration-300 flex space-x-2 snap-x`}>
                              {isLoadingHourly ? (
                                 <div className="text-center py-4 w-full text-[10px] font-bold text-slate-400">
                                    <span className="animate-spin inline-block mr-1">🔄</span> 시간대별 날씨를 분석중입니다...
                                 </div>
                              ) : (
                                 Array.from({length: 24}).map((_, hour) => {
                                    const hRegion = getRegionForHour(hour);
                                    const prevRegion = hour > 0 ? getRegionForHour(hour - 1) : null;

                                    const divider = (hour === 0 || hRegion !== prevRegion) ? (
                                       <div className="flex-shrink-0 flex items-center justify-center px-1">
                                          <span className={`px-2 py-1 rounded-full text-[9px] font-black shadow-sm border whitespace-nowrap ${isDarkMode ? 'bg-indigo-900/50 text-indigo-300 border-indigo-700/50' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>
                                             📍 {hRegion}
                                          </span>
                                       </div>
                                    ) : null;

                                    const regionData = hourlyWeatherCache[hRegion];
                                    let hWeatherCode = null;
                                    let hTemp = null;
                                    if (regionData && regionData.time) {
                                        const targetDateStr2 = getDateStringForDay(d);
                                        const targetTimeStr = `${targetDateStr2}T${String(hour).padStart(2, '0')}:00`;
                                        const idx = regionData.time.indexOf(targetTimeStr);
                                        if (idx !== -1) {
                                            hWeatherCode = regionData.weather_code[idx];
                                            hTemp = Math.round(regionData.temperature_2m[idx]);
                                        }
                                    }

                                    const hInfo = hWeatherCode !== null ? getWeatherInfo(hWeatherCode) : ["-", "☁️"];

                                    return (
                                       <React.Fragment key={hour}>
                                         {divider}
                                         <div className={`flex flex-col items-center justify-center p-2 w-14 flex-shrink-0 snap-center rounded-lg border shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                                            <span className={`text-[9px] font-bold mb-1 ${textMuted}`}>{String(hour).padStart(2, '0')}:00</span>
                                            <span className="text-lg leading-none mb-1">{hInfo[1]}</span>
                                            <span className={`text-[9px] font-black ${textMain}`}>{hInfo[0]}</span>
                                            <span className={`text-[10px] font-bold mt-1 ${hTemp >= 25 ? 'text-rose-500' : hTemp <= 5 ? 'text-blue-500' : textMain}`}>{hTemp !== null ? `${hTemp}°` : '-'}</span>
                                         </div>
                                       </React.Fragment>
                                    );
                                 })
                              )}
                            </div>
                          )}
                        </div>
                     );
                });
                })()
             )}
          </div>
          <button onClick={onClose} className="w-full mt-4 bg-indigo-600 text-white rounded-xl py-2.5 text-xs font-bold shadow-md hover:bg-indigo-700 active:scale-95 transition-all duration-300">확인</button>
       </div>
    </div>
  );
};

export default WeatherModal;
