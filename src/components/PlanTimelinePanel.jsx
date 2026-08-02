import React from 'react';
import { Trash2 } from 'lucide-react';
import { S } from '../utils/helpers';

const PlanTimelinePanel = ({
  isDarkMode, textMuted, textMain, tripDays, getDayDateString, planTimeline,
  activeMobileCard, setActiveMobileCard, guardPlanForm, loadPlanToForm,
  handleEditPlanClick, handleDeletePlan, handleCopyLocalName, openPhotoViewer,
}) => {
  return (
    <div className={`flex-1 min-h-0 p-2 sm:p-4 w-full overflow-y-auto custom-scrollbar transition-colors duration-300 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100/50'}`}>
      <div className="grid gap-2 sm:gap-3 pb-2 auto-rows-fr" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))'}}>
        {tripDays.map(day => (
          <div key={day} className={`flex flex-col rounded-xl border overflow-hidden shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'}`}>
            <div className={`py-1.5 flex flex-col items-center border-b flex-shrink-0 transition-colors duration-300 ${isDarkMode ? 'border-slate-600 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
              <span className={`text-[10px] sm:text-[11px] font-bold leading-tight transition-colors duration-300 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Day {day}
              </span>
              <span className={`text-[7px] sm:text-[8px] mt-0.5 transition-colors duration-300 ${textMuted}`}>{getDayDateString(day)}</span>
            </div>
            <div className={`flex-1 overflow-y-auto custom-scrollbar p-1.5 sm:p-2 space-y-1.5 transition-colors duration-300 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>

              {/* 숙소(isAccommodation) 아이템 상단 고정 렌더링 — Day별 필터 */}
              {planTimeline.filter(p => {
                if (!p || !p.isAccommodation) return false;
                const _days = Array.isArray(p.accommodationDays) ? p.accommodationDays : [];
                return _days.length === 0 || _days.includes(day);
              }).map(plan => {
                const isActive = activeMobileCard === plan.id;
                return (
                  <div key={plan.id} className={`p-1.5 sm:p-2 rounded-lg border shadow-sm bg-yellow-50/50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 relative group cursor-pointer transition-all duration-300 hover:shadow-md ${isActive ? 'border-indigo-400' : ''}`}
                       onClick={(e) => { e.stopPropagation(); guardPlanForm(() => { loadPlanToForm(plan); setActiveMobileCard(plan.id); }); }}>
                     <div className="flex justify-between items-start mb-1">
                       <span className="text-[8px] font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/50 px-1 py-0.5 rounded shadow-sm leading-none">🏠 숙소{Array.isArray(plan.accommodationDays) && plan.accommodationDays.length > 0 ? ` (D${plan.accommodationDays.join(',D')})` : ''}</span>
                        <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex flex-col space-y-1 p-0.5 rounded-lg border shadow-md bg-white/90 dark:bg-slate-700/90 border-slate-200 dark:border-slate-600 z-10 transition-all duration-300 ${isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 md:group-hover:opacity-100 pointer-events-none md:group-hover:pointer-events-auto'}`}>                                   <button onClick={(e) => { if (!isActive) return; e.stopPropagation(); handleEditPlanClick(plan); }} className="text-slate-500 hover:text-indigo-600 p-0.5 transition-colors"><span className="text-[10px]">✏️</span></button>
                         <button onClick={(e) => { if (!isActive) return; e.stopPropagation(); handleDeletePlan(plan.id); }} className="text-slate-500 hover:text-rose-500 p-0.5 transition-colors"><span className="text-[10px]"><Trash2 className="w-[1em] h-[1em] inline" /></span></button>
                       </div>
                     </div>
                     <div className="flex gap-1.5 items-start mt-1">
                       <div className="flex-1 min-w-0 flex flex-col cursor-pointer" >
                         <p className={`text-[9px] sm:text-[10px] font-bold leading-tight line-clamp-2 transition-colors duration-300 ${textMain}`}>{S(plan.place)}</p>
                         {plan.localName && (
                           <p className="text-[7px] text-indigo-500 font-bold mt-0.5 truncate hover:opacity-70 transition-opacity" onClick={(e) => handleCopyLocalName(e, plan.localName)}>
                             📋 {S(plan.localName)}
                           </p>
                         )}
                         {plan.features && <p className={`text-[7px] sm:text-[8px] line-clamp-2 leading-tight mt-0.5 transition-colors duration-300 ${textMuted}`}>{S(plan.features)}</p>}
                       </div>
                       {plan.photo && (
                         <div className="w-8 h-8 sm:w-10 sm:h-10 rounded border border-slate-200 overflow-hidden cursor-pointer relative flex-shrink-0 group-hover:scale-105 transition-transform duration-500" onClick={(e) => { e.stopPropagation(); openPhotoViewer(plan.photos && plan.photos.length > 0 ? plan.photos : [plan.photo]); }}>
                           <img src={plan.photo} className="w-full h-full object-cover transition-opacity" alt="" />
                           {plan.photos && plan.photos.length > 1 && <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[7px] font-bold px-1 leading-tight rounded-tl">{plan.photos.length}</div>}
                         </div>
                       )}
                     </div>
                  </div>
                );
              })}

              {/* 일반 일정 렌더링 로직 */}
              {(() => {
                const _safePT = Array.isArray(planTimeline) ? planTimeline.filter(Boolean) : [];
                const _hasRental = _safePT.some(p => p.id === 'trans_rental_dep' || p.id === 'trans_rental_arr');
                const _dayPlans = _safePT.filter(p => {
                  if (!p || p.isAccommodation) return false;
                  if (parseInt(p.day || 1) !== day) return false;
                  if (_hasRental && !String(p.id).startsWith('trans_rental_') && S(p.place).includes('렌터카')) return false;
                  return true;
                });
                const _hasAccomm = _safePT.some(p => {
                  if (!p || !p.isAccommodation) return false;
                  const _days = Array.isArray(p.accommodationDays) ? p.accommodationDays : [];
                  return _days.length === 0 || _days.includes(day);
                });
                return _dayPlans.length === 0 && !_hasAccomm ? (
                 <div className={`flex flex-col items-center justify-center h-full min-h-[100px] text-[8px] sm:text-[9px] transition-colors duration-300 ${textMuted}`}>
                   <span>일정 없음</span>
                 </div>
                ) : _dayPlans.map((plan) => {
                  const isActive = activeMobileCard === plan.id;

                  // [버그 수정 1] 교통편 렌더링 조건 완화 (테마명 포함 시 무조건 전용 카드 적용)
                  const isTransportTheme = plan.isTransport || ['교통', '항공', '비행기', '기차', '버스', '배'].some(keyword => S(plan.theme).includes(keyword));
                  // [버그 수정 1] 교통/항공권 렌더링 조건 완화 (테마명에 교통수단 포함 시 전용 카드)
                  if (plan.isTransport || ['교통', '항공', '비행기', '기차', '버스', '배'].some(keyword => S(plan.theme).includes(keyword))) {
                    return (
                      <div key={plan.id} className={`flex items-center space-x-1 sm:space-x-2 p-1.5 sm:p-2.5 rounded-lg border shadow-sm transition-all duration-300 bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 relative group cursor-pointer ${isActive ? 'border-indigo-400' : ''}`}
                           onClick={(e) => { e.stopPropagation(); guardPlanForm(() => { loadPlanToForm(plan); setActiveMobileCard(plan.id); }); }}>
                        {plan.time !== '99:99' && <div className="bg-indigo-600 text-white font-black text-[7px] sm:text-[9px] px-1.5 py-0.5 rounded flex-shrink-0 shadow-sm is-tag">{S(plan.time)}</div>}
                        <div className="flex-1 min-w-0 flex flex-col px-0.5">
                          <span className={`text-[9px] sm:text-[12px] font-black truncate text-indigo-700 dark:text-indigo-300 leading-tight`}>
                            {S(plan.place)}
                          </span>
                          <div className="flex flex-col sm:flex-row sm:items-center mt-0.5 gap-0.5 sm:gap-2">
                             {plan.localName && <span className="text-[7px] sm:text-[9px] text-slate-500 dark:text-slate-400 font-bold truncate">🏢 {S(plan.localName)}</span>}
                             {plan.features && <span className="text-[7px] sm:text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate bg-white dark:bg-slate-800 px-1 rounded shadow-sm inline-block">{S(plan.features)}</span>}
                          </div>
                        </div>
                        <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1 rounded border shadow-sm transition-all duration-300 bg-white/90 dark:bg-slate-700/90 border-slate-200 dark:border-slate-600 ${isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 md:group-hover:opacity-100 pointer-events-none md:group-hover:pointer-events-auto'}`}>
                           <button onClick={(e) => { if (!isActive) return; e.stopPropagation(); handleEditPlanClick(plan); }} className="text-slate-500 hover:text-indigo-600 p-0.5 sm:p-1 transition-colors"><span className="text-[10px] sm:text-xs">✏️</span></button>
                           <button onClick={(e) => { if (!isActive) return; e.stopPropagation(); handleDeletePlan(plan.id); }} className="text-slate-500 hover:text-rose-500 p-0.5 sm:p-1 transition-colors"><span className="text-[10px] sm:text-xs"><Trash2 className="w-[1em] h-[1em] inline" /></span></button>
                        </div>
                      </div>
                    )
                  }

                  return (
                  <div key={plan.id} className={`p-1.5 sm:p-2 rounded-lg border relative group transition-all duration-300 hover:shadow-md cursor-pointer ${isDarkMode ? 'bg-slate-700 border-slate-600 hover:bg-slate-600' : 'bg-slate-50 border-slate-100 hover:bg-white'} ${isActive ? 'border-indigo-400' : 'md:hover:border-indigo-300'}`} onClick={(e) => { e.stopPropagation(); guardPlanForm(() => { loadPlanToForm(plan); setActiveMobileCard(plan.id); }); }}>
                    <div className="flex justify-between items-start mb-1">
                      {plan.time !== '99:99' && <span className="text-[8px] font-bold text-white bg-indigo-500 px-1 py-0.5 rounded shadow-sm leading-none transition-transform duration-300 hover:scale-105">{S(plan.time)}</span>}
                      <div className={`transition-all duration-300 flex space-x-1 rounded border absolute top-1 right-1 z-10 shadow-sm ${isDarkMode ? 'bg-slate-700/90 border-slate-600' : 'bg-white/90 border-slate-200'} ${isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 md:group-hover:opacity-100 pointer-events-none md:group-hover:pointer-events-auto'}`}>
                        <button onClick={(e) => { if (!isActive) return; e.stopPropagation(); handleEditPlanClick(plan); }} className="text-slate-500 hover:text-indigo-600 p-0.5 transition-colors"><span className="text-[10px]">✏️</span></button>
                        <button onClick={(e) => { if (!isActive) return; e.stopPropagation(); handleDeletePlan(plan.id); }} className="text-slate-500 hover:text-rose-500 p-0.5 transition-colors"><span className="text-[10px]"><Trash2 className="w-[1em] h-[1em] inline" /></span></button>
                      </div>
                    </div>
                    <div className="flex gap-1.5 items-start mt-1">
                      <div className="flex-1 min-w-0 flex flex-col cursor-pointer" >
                        <p className={`text-[9px] sm:text-[10px] font-bold leading-tight line-clamp-2 transition-colors duration-300 ${textMain}`}>{S(plan.place)}</p>
                        {plan.localName && (
                          <p className="text-[7px] text-indigo-500 font-bold mt-0.5 truncate hover:opacity-70 transition-opacity" onClick={(e) => handleCopyLocalName(e, plan.localName)}>
                            📋 {S(plan.localName)}
                          </p>
                        )}
                        {plan.features && <p className={`text-[7px] sm:text-[8px] line-clamp-2 leading-tight mt-0.5 transition-colors duration-300 ${textMuted}`}>{S(plan.features)}</p>}
                      </div>
                      {plan.photo && !plan.isTransport && (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded border border-slate-200 overflow-hidden cursor-pointer relative flex-shrink-0 group-hover:scale-105 transition-transform duration-500" onClick={(e) => { e.stopPropagation(); openPhotoViewer(plan.photos && plan.photos.length > 0 ? plan.photos : [plan.photo]); }}>
                          <img src={plan.photo} className="w-full h-full object-cover transition-opacity" alt="" />
                          {plan.photos && plan.photos.length > 1 && <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[7px] font-bold px-1 leading-tight rounded-tl">{plan.photos.length}</div>}
                        </div>
                      )}
                    </div>
                  </div>
                )}); })()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanTimelinePanel;
