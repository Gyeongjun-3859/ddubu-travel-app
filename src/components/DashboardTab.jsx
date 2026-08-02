import React, { useState } from 'react';
import { Wallet, RefreshCw, Globe, Calendar, ListChecks, Backpack, ShoppingBag, Plane, Trash2, MapPin } from 'lucide-react';
import { CURRENCIES } from '../utils/constants';
import { S, getAccommodationTransitFrom } from '../utils/helpers';
import TransitConnector from './TransitConnector';
import TransitRouteViewModal from './TransitRouteViewModal';

const THEME_DEFAULT_PHOTO = {
  '식당': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80',
  '디저트': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=400&q=80',
  '관광지': 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=80',
  '쇼핑': 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80',
  '숙소': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80',
  '기타': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=400&q=80',
};
const getThemeDefaultPhoto = (theme) => THEME_DEFAULT_PHOTO[theme] || THEME_DEFAULT_PHOTO['기타'];

const DashboardTab = ({
  activeTab, textMain, textMuted, isDarkMode, cardBg,
  fetchRealTimeRates, loadingRates, errorRates, ratesUpdatedAt,
  handleOpenGoogleTranslate, setIsExpenseModalOpen, totalExpenseKrw,
  amount, focusedCurrency, setFocusedCurrency, handleInputChange, getInputValue, getPlaceholder,
  renderFlightCards, panelRatio, handleDragStart,
  dashboardDay, setDashboardDay, getDayDateString, activeRegionForDay,
  setIsDashboardPackingOpen, setIsDashboardShoppingOpen,
  tripDays, getWeatherForDay, todayPlans,
  activeMobileCard, setActiveMobileCard, setSelectedPlanInfo,
  handleEditPlanClick, handleDeletePlan, changeTab, displayCityName, openPhotoViewer,
  currentRestaurants,
}) => {
  const [transitView, setTransitView] = useState(null);
  const findPinCoord = (placeName) => {
    const pin = (Array.isArray(currentRestaurants) ? currentRestaurants : []).find(r => r && r.lat && r.lng && S(r.name) === S(placeName));
    return pin ? { lat: pin.lat, lng: pin.lng } : null;
  };
  const openTransitView = (plan, route) => setTransitView({ plan, route });

  return (
    <div className={`p-2 sm:p-4 pt-3 sm:pt-4 pb-4 flex flex-col gap-3 transition-opacity duration-300 ${activeTab === 'dashboard' ? 'block opacity-100 z-10 flex-1' : 'hidden opacity-0 -z-10 pointer-events-none'}`}>
      <div className="flex items-end justify-between px-1 flex-shrink-0">
        <h2 className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 tracking-tight transition-colors duration-300 ${textMain}`}>
          <Wallet className="w-3.5 h-3.5" /> 실시간 동시 환율
          <button onClick={() => fetchRealTimeRates(true)} className={`ml-2 px-2 py-0.5 rounded-md flex items-center space-x-1 border shadow-sm transition-all duration-300 active:scale-95 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-indigo-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-indigo-500 hover:bg-indigo-50'}`}>
            <RefreshCw className={`w-3 h-3 ${loadingRates ? 'animate-spin' : ''}`} />
            <span className="text-[9px] font-bold">업데이트</span>
          </button>
        </h2>
        {errorRates && <span className="text-rose-500 text-[10px] font-bold ml-2 animate-in fade-in">{errorRates}</span>}
        {!errorRates && ratesUpdatedAt && (
          <span className={`text-[9px] font-bold ml-2 ${textMuted}`}>
            {(() => {
              const mins = Math.floor((Date.now() - ratesUpdatedAt) / 60000);
              if (mins < 1) return '방금 업데이트';
              if (mins < 60) return `${mins}분 전 업데이트`;
              return `${Math.floor(mins / 60)}시간 전 업데이트`;
            })()}
          </span>
        )}
        <div className="flex items-center space-x-1.5 ml-auto">
<button onClick={handleOpenGoogleTranslate} className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold flex items-center space-x-1.5 shadow-sm transition-all duration-300 active:scale-95 ${isDarkMode ? 'bg-slate-800 text-indigo-300 border border-slate-700 hover:bg-slate-700' : 'bg-white text-indigo-600 border border-slate-200 hover:bg-indigo-50'}`}>
            <Globe className="w-3.5 h-3.5" />
            <span>AI 번역기</span>
          </button>
          <button onClick={() => setIsExpenseModalOpen(true)} className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold flex items-center space-x-1.5 shadow-sm transition-all duration-300 active:scale-95 ${isDarkMode ? 'bg-rose-900/50 text-rose-400 border border-rose-700 hover:bg-rose-900/70' : 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'}`}>
            <Wallet className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">여행정산</span>
        <span className="sm:hidden">정산</span>
        {totalExpenseKrw > 0 && <span className="font-black">₩{totalExpenseKrw.toLocaleString()}</span>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 w-full gap-1 sm:gap-3 flex-shrink-0 pb-1">
        {CURRENCIES.map(cur => {
          const isFocused = focusedCurrency === cur.code;
          return (
            <div key={cur.code} className={`flex flex-col items-center justify-center p-1 sm:p-3 rounded-lg sm:rounded-xl border transition-all duration-300 relative ${isFocused ? (isDarkMode ? 'border-indigo-400 bg-slate-800 shadow-md' : 'border-indigo-400 bg-indigo-50 shadow-md') : `${cardBg} shadow-sm hover:shadow`}`}>
              <span className={`text-[8px] sm:text-[10px] font-bold mb-0.5 sm:mb-1 uppercase truncate w-full text-center transition-colors duration-300 ${isFocused ? 'text-indigo-500' : textMuted}`}>{cur.label}</span>
              <input
                type="text" inputMode="decimal" value={getInputValue(cur.code)} onChange={(e) => handleInputChange(cur.code, e.target.value)} onFocus={() => setFocusedCurrency(cur.code)} onBlur={() => setFocusedCurrency(null)} placeholder={getPlaceholder(cur.code)}
                className={`w-full bg-transparent border-none outline-none text-center text-[10px] sm:text-base font-black p-0 focus:ring-0 transition-colors duration-300 placeholder:font-medium placeholder:text-slate-400 ${isFocused ? 'text-indigo-600' : textMain}`}
              />
              <span className={`text-[7px] sm:text-[9px] font-bold mt-0.5 sm:mt-1 transition-all duration-300 ${isFocused ? 'text-indigo-400' : (amount ? textMuted : 'opacity-30')}`}>{amount ? cur.sym : '₩'}</span>
            </div>
          );
        })}
      </div>

      {/* 모바일에서만 렌더링되는 항공권 */}
      {renderFlightCards()}

      <div className="flex-1 flex flex-row gap-1 sm:gap-4 overflow-hidden min-h-0 h-full w-full relative" style={{"--mob-left": `${panelRatio}%`}}>

        {/* Left Panel */}
        <div className={`max-md:w-[var(--mob-left)] md:w-[40%] ${cardBg} p-1.5 sm:p-3 flex flex-col min-h-0 h-full relative rounded-2xl sm:rounded-3xl shrink-0 transition-colors duration-300`}>
          <div className={`flex flex-col mb-1.5 sm:mb-3 flex-shrink-0 border-b pb-1.5 relative z-10 transition-colors duration-300 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
            <div className={`flex items-center justify-between space-x-1.5 mb-1 sm:mb-2 transition-colors duration-300 ${textMuted}`}>
              <div className="flex items-center space-x-1.5">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span className="text-[8px] sm:text-[10px] font-bold tracking-tight truncate">{getDayDateString(dashboardDay)}</span>
              </div>
              {activeRegionForDay && (
                <span className={`inline-flex items-center gap-0.5 text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isDarkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
                  <MapPin className="w-2.5 h-2.5" /> {activeRegionForDay}
                </span>
              )}
            </div>
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-1.5">
<div className="flex items-center justify-between w-full">
                <h3 className={`flex items-center gap-1 text-[10px] sm:text-xs font-bold tracking-tight leading-tight truncate mr-1 transition-colors duration-300 ${textMain}`}><ListChecks className="w-3 h-3 flex-shrink-0" /> 오늘의 계획</h3>
                <div className="flex space-x-1 flex-shrink-0">
                  <button onClick={() => setIsDashboardPackingOpen(true)} className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[8px] sm:text-[9px] font-bold transition-all duration-300 active:scale-95 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}><Backpack className="w-3 h-3" /> 준비물</button>
                  <button onClick={() => setIsDashboardShoppingOpen(true)} className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[8px] sm:text-[9px] font-bold transition-all duration-300 active:scale-95 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}><ShoppingBag className="w-3 h-3" /> 쇼핑</button>
                </div>
              </div>
              <div className={`grid gap-0.5 p-0.5 rounded-md w-full xl:w-[120px] overflow-y-auto custom-scrollbar max-h-16 transition-colors duration-300 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`} style={{gridTemplateColumns: `repeat(${Math.min(tripDays.length, 4)}, minmax(0, 1fr))`}}>

                {tripDays.map(d => {
                   const wInfo = getWeatherForDay(d);
                   return (
                     <button key={d} onClick={() => { setDashboardDay(d); }} className={`h-8 sm:h-10 flex flex-col items-center justify-center rounded flex-shrink-0 transition-all duration-300 border ${dashboardDay === d ? 'bg-white text-indigo-600 shadow-sm border-slate-200/50' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                       <span className="text-[7px] sm:text-[8px] font-bold">D{d}</span>
                       {wInfo ? <span className="text-[7px] sm:text-[8px] leading-none mt-0.5">{wInfo[1]}</span> : <div className="h-1 sm:h-2"></div>}
                     </button>
                   );
                })}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col space-y-1 sm:space-y-2 pr-1 relative z-10 scroll-smooth">
            {todayPlans.length === 0 ? (
               <div onClick={(e) => { e.stopPropagation(); changeTab('plan'); }} className={`flex-1 flex flex-col items-center justify-center text-[8px] sm:text-[10px] ${textMuted} font-bold text-center rounded-lg border border-dashed cursor-pointer transition-all duration-300 active:scale-[0.99] ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-indigo-500 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 hover:border-indigo-400 hover:bg-slate-100'}`}>
                 <span>일정이 없습니다.<br/>클릭하여 추가!</span>
               </div>
            ) : (
              todayPlans.map((plan) => {
                const isActive = activeMobileCard === plan.id;
                const cardBorder = isActive ? 'border-indigo-400' : (isDarkMode ? 'border-slate-600 md:hover:border-indigo-400' : 'border-slate-100 md:hover:border-indigo-400');
                // 숙소는 맨 위에 고정 표시되므로, 이 plan에서 출발해 숙소로 가는 이동정보는 숙소 카드가 아니라 여기(출발지) 바로 아래에 붙인다
                const _accomTransit = !plan.isAccommodation ? getAccommodationTransitFrom(plan, todayPlans) : null;

                // [버그 수정 1] 교통편 렌더링 조건 완화 (테마명 포함 시 무조건 전용 카드 적용)
                const isTransportTheme = plan.isTransport || ['교통', '항공', '비행기', '기차', '버스', '배'].some(keyword => S(plan.theme).includes(keyword));
// [버그 수정 1] 교통편 렌더링 조건 완화 (테마명에 교통수단 포함 시 전용 카드 적용)
                if (plan.isTransport || ['교통', '항공', '비행기', '기차', '버스', '배'].some(keyword => S(plan.theme).includes(keyword))) {
                  const isRentalDep = plan.id === 'trans_rental_dep' || S(plan.place).includes('렌터카 대여');
                  const isRentalArr = plan.id === 'trans_rental_arr' || S(plan.place).includes('렌터카 반납');
                  const isRentalCard = isRentalDep || isRentalArr;
                  const rentalMeta = plan.rentalMeta || {};
                  const rentalPlace = isRentalDep ? rentalMeta.depPlace : isRentalArr ? rentalMeta.arrPlace : '';
                  const rentalCompany = rentalMeta.company || S(plan.localName);
                  const rentalCarType = rentalMeta.carType || '';
                  return (
                    <React.Fragment key={plan.id}>
                    <TransitConnector plan={plan} onClick={openTransitView} />
                    <div className={`flex items-center space-x-1 sm:space-x-2 p-1.5 sm:p-2.5 rounded-lg border shadow-sm transition-all duration-300 bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 relative group`}
                         onClick={(e) => {
                           e.stopPropagation();
                           if(isActive) { setSelectedPlanInfo(plan); setActiveMobileCard(null); }
                           else setActiveMobileCard(plan.id);
                         }}>
                      {plan.time !== '99:99' && <div className="bg-indigo-500 text-white font-black text-[7px] sm:text-[9px] px-1 sm:px-1.5 py-0.5 rounded flex-shrink-0 transition-colors">{S(plan.time)}</div>}
                      <div className="flex-1 min-w-0 flex flex-col px-0.5">
                        <span className={`text-[9px] sm:text-[12px] font-black truncate text-indigo-700 dark:text-indigo-300 leading-tight`}>
                          {S(plan.place)}
                        </span>
                        <div className="flex flex-col sm:flex-row sm:items-center mt-0.5 gap-0.5 sm:gap-2">
                          {isRentalCard ? (
                            <>
                              {rentalPlace && <span className="text-[7px] sm:text-[9px] text-slate-500 dark:text-slate-400 font-bold truncate">📍 {rentalPlace}</span>}
                              {(rentalCompany || rentalCarType) && <span className="text-[7px] sm:text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate bg-white dark:bg-slate-800 px-1 rounded shadow-sm inline-block">{[rentalCompany, rentalCarType].filter(Boolean).join(' · ')}</span>}
                            </>
                          ) : (
                            <>
                              {plan.localName && <span className="text-[7px] sm:text-[9px] text-slate-500 dark:text-slate-400 font-bold truncate">🏢 {S(plan.localName)}</span>}
                              {plan.features && <span className="text-[7px] sm:text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate bg-white dark:bg-slate-800 px-1 rounded shadow-sm inline-block">{S(plan.features)}</span>}
                            </>
                          )}
                        </div>
                      </div>
                      <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1 rounded border shadow-sm transition-all duration-300 bg-white/90 dark:bg-slate-700/90 border-slate-200 dark:border-slate-600 ${isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 md:group-hover:opacity-100 pointer-events-none md:group-hover:pointer-events-auto'}`}>
                         <button onClick={(e) => { if (!isActive) return; e.stopPropagation(); handleEditPlanClick(plan); }} className="text-slate-500 hover:text-indigo-600 p-0.5 sm:p-1 transition-colors"><span className="text-[10px] sm:text-xs">✏️</span></button>
                         <button onClick={(e) => { if (!isActive) return; e.stopPropagation(); handleDeletePlan(plan.id); }} className="text-slate-500 hover:text-rose-500 p-0.5 sm:p-1 transition-colors"><span className="text-[10px] sm:text-xs"><Trash2 className="w-[1em] h-[1em] inline" /></span></button>
                      </div>
                    </div>
                    </React.Fragment>
                  )
                }

                return (
                <React.Fragment key={plan.id}>
                {!plan.isAccommodation && <TransitConnector plan={plan} onClick={openTransitView} />}
                <div className={`flex items-center space-x-1 sm:space-x-2 p-1 sm:p-2 rounded-lg border cursor-pointer shadow-sm transition-all duration-300 group relative ${cardBorder} ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-white hover:bg-slate-50'}`} onClick={(e) => {
                   e.stopPropagation();
                   if(isActive) { setSelectedPlanInfo(plan); setActiveMobileCard(null); }
                   else setActiveMobileCard(plan.id);
                }}>
                  {(plan.isAccommodation || plan.time !== '99:99') && <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-[7px] sm:text-[9px] px-1 sm:px-1.5 py-0.5 rounded flex-shrink-0 transition-colors">
                    {plan.isAccommodation ? '🏠 숙소' : S(plan.time)}
                  </div>}
                  <div className="flex-1 min-w-0 flex flex-col px-0.5">
                    <span className={`text-[8px] sm:text-[11px] font-bold truncate transition-colors duration-300 ${textMain}`}>
                      {S(plan.place)} {plan.isAccommodation && '🏠'}
                    </span>
                    {plan.features && <span className={`text-[6px] sm:text-[9px] truncate mt-0.5 transition-colors duration-300 ${textMuted}`}>{S(plan.features)}</span>}
                  </div>

{/* 오늘의 계획 전용: 카드 내부 우측 가로 배치 메뉴 */}
                  <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex flex-row space-x-1.5 p-1 rounded-lg border shadow-md bg-white/95 dark:bg-slate-800/95 border-slate-200 dark:border-slate-600 z-10 transition-all duration-300 ${isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 md:group-hover:opacity-100 pointer-events-none'}`}>
                      <button onClick={(e) => { e.stopPropagation(); handleEditPlanClick(plan); }} className="text-slate-500 hover:text-indigo-600 p-1.5 transition-colors active:scale-90"><span className="text-[10px]">✏️</span></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan.id); }} className="text-slate-500 hover:text-rose-500 p-1.5 transition-colors active:scale-90"><span className="text-[10px]"><Trash2 className="w-[1em] h-[1em] inline" /></span></button>
                  </div>
                </div>
                {_accomTransit && <TransitConnector plan={_accomTransit.plan} route={_accomTransit.route} onClick={openTransitView} />}
                </React.Fragment>
              )})
            )}
          </div>
{/* 대시보드 하단 요약 뷰는 상단 탭 모달로 깔끔하게 통합되었습니다. */}
        </div>

        {/* Drag Handle */}
        <div
           className="w-1.5 bg-slate-200/60 dark:bg-slate-700 hover:bg-indigo-400 rounded-full flex-shrink-0 md:hidden flex items-center justify-center cursor-col-resize active:bg-indigo-500 transition-colors duration-300"
           onMouseDown={handleDragStart}
           onTouchStart={handleDragStart}
        >
          <div className="w-0.5 h-8 bg-slate-400/50 dark:bg-slate-500 rounded-full pointer-events-none"></div>
        </div>

        {/* Right Panel */}
        <div className={`flex-1 ${cardBg} p-1.5 sm:p-3 flex flex-col min-h-0 h-full relative rounded-2xl sm:rounded-3xl transition-colors duration-300`}>
          <div className="flex items-center justify-between mb-1.5 sm:mb-3 flex-shrink-0 relative z-30">
            <h3 className={`text-[10px] sm:text-sm font-bold tracking-tight flex items-center transition-colors duration-300 ${textMain}`}>
              <span className="truncate max-w-[100px] sm:max-w-none flex items-center gap-1"><Plane className="w-3.5 h-3.5 flex-shrink-0" /> 여행 리스트({S(displayCityName)})</span>
            </h3>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <div className={`grid gap-0.5 p-0.5 rounded-md min-w-[70px] sm:min-w-[100px] w-full max-w-[120px] overflow-y-auto custom-scrollbar max-h-16 transition-colors duration-300 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`} style={{gridTemplateColumns: `repeat(${Math.min(tripDays.length, 4)}, minmax(0, 1fr))`}}>
                {tripDays.map(d => (
                   <button key={d} onClick={() => { setDashboardDay(d); }} className={`px-1 py-0.5 text-[7px] sm:text-[8px] font-bold rounded flex-shrink-0 transition-all duration-300 border ${dashboardDay === d ? 'bg-white text-indigo-600 shadow-sm border-slate-200/50' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                     D{d}
                   </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col min-h-0 scroll-smooth">
           {/* 여행 리스트 카드: 컴팩트한 3열 배치 (교통편은 숨기고 오늘의 계획에만 표출) */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-1.5 content-start">
              {(() => {
                // [버그 수정] 여행 리스트 갤러리에서는 교통/항공편 관련 카드를 완전히 필터링하여 레이아웃을 깔끔하게 유지합니다.
                const travelListPlans = todayPlans.filter(plan => !(plan.isTransport || ['교통', '항공', '비행기', '기차', '버스', '배'].some(keyword => S(plan.theme).includes(keyword))));

                if (travelListPlans.length === 0) {
                  return (
                     <div onClick={(e) => { e.stopPropagation(); changeTab('plan'); }} className={`col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed h-20 sm:h-24 cursor-pointer transition-all duration-300 active:scale-[0.99] ${textMuted} ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-indigo-500 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 hover:border-indigo-400 hover:bg-white'}`}>
                       <span className="text-[9px] sm:text-[11px] font-bold">일정이 없습니다. 추가해 보세요!</span>
                     </div>
                  );
                }

                return travelListPlans.map((plan) => {
                  const isActive = activeMobileCard === plan.id;
                  const cardBorder = isActive ? 'border-indigo-400' : (isDarkMode ? 'border-slate-700 md:hover:border-indigo-500' : 'border-slate-200 md:hover:border-indigo-400');

                  return (
                  <div
                    key={plan.id}
                    className={`rounded-lg border shadow-sm overflow-hidden flex flex-col transition-all duration-300 group relative hover:shadow-md ${cardBorder} ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white'}`}
                  >
                    {/* 교통편이 이미 필터링되었으므로 조건부 렌더링을 제거하고 항상 예쁜 사진 영역을 띄웁니다. */}
                    <div className={`w-full h-16 sm:h-20 relative shrink-0 cursor-pointer border-b transition-colors duration-300 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
                         onClick={(e) => { e.stopPropagation(); if(isActive) { setSelectedPlanInfo(plan); setActiveMobileCard(null); } else setActiveMobileCard(plan.id); }}>
                      <img src={plan.photo || (plan.isAccommodation ? THEME_DEFAULT_PHOTO['숙소'] : getThemeDefaultPhoto(plan.theme))} className="w-full h-full object-cover md:group-hover:scale-105 transition-transform duration-500" alt="" onClick={plan.photo ? (e) => { e.stopPropagation(); openPhotoViewer(plan.photos && plan.photos.length > 0 ? plan.photos : [plan.photo]); } : undefined} />
                      {plan.photos && plan.photos.length > 1 && <div className="absolute top-1 right-1 bg-black/60 text-white text-[7px] font-bold px-1 py-0.5 rounded shadow-sm">📸 {plan.photos.length}</div>}
                      {(plan.isAccommodation || plan.time !== '99:99') && <div className="absolute top-1 left-1 bg-indigo-500/90 backdrop-blur text-white text-[7px] sm:text-[8px] font-bold px-1 py-0.5 rounded shadow-sm">
                        {plan.isAccommodation ? '🏠 숙소' : S(plan.time)}
                      </div>}
                      <div className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}><span className="text-white text-[8px] sm:text-[10px] font-bold">터치하여 상세 보기</span></div>
                    </div>

                    <div className={`flex flex-col p-1.5 flex-1 cursor-pointer justify-start min-w-0 transition-colors duration-300 ${isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50/50'}`}
                         onClick={(e) => { e.stopPropagation(); if(isActive) { setSelectedPlanInfo(plan); setActiveMobileCard(null); } else setActiveMobileCard(plan.id); }}>
                      <h4 className={`font-black text-[9px] sm:text-[11px] truncate tracking-tight mb-0.5 transition-colors duration-300 ${textMain}`}>
                        {S(plan.place)} {plan.isAccommodation && '🏠'}
                      </h4>
                      {plan.localName && <p className="text-[7px] sm:text-[9px] text-indigo-500 font-bold truncate mb-0.5 sm:mb-1">{S(plan.localName)}</p>}
                      {plan.features && <p className={`text-[7px] sm:text-[8px] line-clamp-2 leading-tight mt-auto transition-colors duration-300 ${textMuted}`}>{S(plan.features)}</p>}
                    </div>

                    {/* 모바일 탭 & PC 호버 수정/삭제 메뉴 */}
                    <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex flex-col space-y-1 rounded-lg border shadow-md p-0.5 z-10 transition-all duration-300 ${isDarkMode ? 'bg-slate-700/90 border-slate-600' : 'bg-white/90 border-slate-200'} ${isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 md:group-hover:opacity-100 pointer-events-none md:group-hover:pointer-events-auto'}`}>
                       <button onClick={(e) => { if (!isActive) return; e.stopPropagation(); handleEditPlanClick(plan); }} className="text-slate-500 hover:text-indigo-600 p-1 transition-colors"><span className="text-xs">✏️</span></button>
                       <button onClick={(e) => { if (!isActive) return; e.stopPropagation(); handleDeletePlan(plan.id); }} className="text-slate-500 hover:text-rose-500 p-1 transition-colors"><span className="text-xs"><Trash2 className="w-[1em] h-[1em] inline" /></span></button>
                    </div>
                  </div>
                )})
              })()}
            </div>
          </div>
        </div>
      </div>

      <TransitRouteViewModal
        isOpen={Boolean(transitView)}
        plan={transitView?.plan}
        route={transitView?.route}
        onClose={() => setTransitView(null)}
        findPinCoord={findPinCoord}
      />
    </div>
  );
};

export default DashboardTab;
