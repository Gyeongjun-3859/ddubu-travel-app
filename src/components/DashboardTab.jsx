import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { RefreshCw, Calendar, Backpack, ShoppingBag, Plane, Trash2, MapPin, Languages, Map as MapIcon, Wallet, ListChecks, Sparkles, X } from 'lucide-react';
import { COUNTRY_LANGUAGE, COUNTRY_CURRENCY } from '../utils/constants';
import { S, getAccommodationTransitFrom } from '../utils/helpers';
import TransitConnector from './TransitConnector';
import TransitRouteViewModal from './TransitRouteViewModal';
import LanguageModal from './LanguageModal';

const THEME_DEFAULT_PHOTO = {
  '식당': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80',
  '디저트': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=400&q=80',
  '관광지': 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=80',
  '쇼핑': 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80',
  '숙소': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80',
  '기타': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=400&q=80',
};
const getThemeDefaultPhoto = (theme) => THEME_DEFAULT_PHOTO[theme] || THEME_DEFAULT_PHOTO['기타'];

// 테마 → 하이라이트 카드 태그(색상/라벨). 새 디자인의 카테고리 색 스캔용
const THEME_TAG = {
  '식당': { bg: 'bg-[#8a2bb9]', label: '식당' },
  '디저트': { bg: 'bg-[#8a2bb9]', label: '디저트' },
  '관광지': { bg: 'bg-[#0ea5e9]', label: '관광' },
  '쇼핑': { bg: 'bg-[#4c4aca]', label: '쇼핑' },
  '숙소': { bg: 'bg-[#007AFF]', label: '숙소' },
  '기타': { bg: 'bg-slate-500', label: '일정' },
};
const getThemeTag = (plan) => plan.isAccommodation ? THEME_TAG['숙소'] : (THEME_TAG[S(plan.theme)] || THEME_TAG['기타']);

const isTransportPlan = (plan) => plan.isTransport || ['교통', '항공', '비행기', '기차', '버스', '배'].some(k => S(plan.theme).includes(k));

const DashboardTab = ({
  activeTab, textMain, textMuted, isDarkMode,
  fetchRealTimeRates, loadingRates, errorRates, ratesUpdatedAt, rates,
  amount, focusedCurrency, setFocusedCurrency, handleInputChange, getInputValue, getPlaceholder,
  handleOpenGoogleTranslate, setIsExpenseModalOpen, totalExpenseKrw,
  renderFlightCards,
  dashboardDay, setDashboardDay, getDayDateString, activeRegionForDay,
  setIsDashboardPackingOpen, setIsDashboardShoppingOpen,
  tripDays, getWeatherForDay, todayPlans,
  activeMobileCard, setActiveMobileCard, setSelectedPlanInfo,
  handleEditPlanClick, handleDeletePlan, changeTab, displayCityName, openPhotoViewer,
  currentRestaurants, setIsSettingsOpen,
  isDomesticTrip, countryTips = [], resolvedGlobalCountry,
}) => {
  const [transitView, setTransitView] = useState(null);
  const [isTipsOpen, setIsTipsOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const findPinCoord = (placeName) => {
    const pin = (Array.isArray(currentRestaurants) ? currentRestaurants : []).find(r => r && r.lat && r.lng && S(r.name) === S(placeName));
    return pin ? { lat: pin.lat, lng: pin.lng } : null;
  };
  const openTransitView = (plan, route) => setTransitView({ plan, route });

  // 새 디자인 공통 스타일
  const panel = `rounded-xl border shadow-[0_2px_10px_rgba(0,0,0,0.03)] ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/70'}`;
  const softBtn = `${isDarkMode ? 'bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-200' : 'bg-[#f4f3f8] border-slate-200/60 hover:bg-slate-200 text-slate-700'}`;

  // 환율 계산기: KRW 또는 외화 어디에 입력해도 나머지가 실시간으로 환산됨
  // 원화 + 달러 + 여행 국가 통화, 이렇게 최대 3개만 보여줌 (국가 통화가 USD면 중복 표시 안 함)
  const tripCurrency = COUNTRY_CURRENCY[resolvedGlobalCountry];
  // 칸 이름은 통화 코드만, 기준 환율은 그 아래 작게 따로 보여준다. (예전엔 "JPY(100)" 칸에 입력 전엔 100엔당 원화,
  // 입력 후엔 실제 엔화 금액이 떠서 같은 칸의 뜻이 바뀌어 헷갈렸다)
  const currencyLabel = (code) => code;
  const foreignCurrencies = [
    { code: 'USD', label: currencyLabel('USD', 1), unit: 1 },
    ...(tripCurrency && tripCurrency.code !== 'USD'
      ? [{ code: tripCurrency.code, label: currencyLabel(tripCurrency.code, tripCurrency.unit), unit: tripCurrency.unit || 1 }]
      : []),
  ];
  // 금액을 입력하기 전엔 칸을 비워 둔다(기준 환율은 아래 캡션에 표시)
  const currencyInputValue = (code, unit) => { if (!amount) return ''; const v = getInputValue(code, unit); return v === '-' ? '' : v; };
  const updatedLabel = (() => {
    if (!ratesUpdatedAt) return '';
    const mins = Math.floor((Date.now() - ratesUpdatedAt) / 60000);
    if (mins < 1) return '방금 업데이트';
    if (mins < 60) return `${mins}분 전`;
    return `${Math.floor(mins / 60)}시간 전`;
  })();

  const highlightPlans = (Array.isArray(todayPlans) ? todayPlans : []).filter(p => p && !isTransportPlan(p));

  const tools = [
    ...(isDomesticTrip ? [] : [{ key: 'translate', label: 'AI 번역기', Icon: Languages, onClick: handleOpenGoogleTranslate }]),
    { key: 'expense', label: '여행정산', Icon: Wallet, onClick: () => setIsExpenseModalOpen(true), badge: totalExpenseKrw > 0 ? `₩${totalExpenseKrw.toLocaleString()}` : null },
    { key: 'packing', label: '준비물', Icon: Backpack, onClick: () => setIsDashboardPackingOpen(true) },
    { key: 'shopping', label: '쇼핑', Icon: ShoppingBag, onClick: () => setIsDashboardShoppingOpen(true) },
    ...(countryTips.length > 0 ? [{ key: 'tips', label: `${resolvedGlobalCountry} 꿀팁`, Icon: Sparkles, onClick: () => setIsTipsOpen(true) }] : []),
    { key: 'map', label: '지도 열기', Icon: MapIcon, onClick: () => changeTab('map'), full: true },
  ];

  return (
    <div
      style={{ fontFamily: "'Be Vietnam Pro', system-ui, -apple-system, sans-serif" }}
      className={`transition-opacity duration-300 ${activeTab === 'dashboard' ? 'block opacity-100 z-10 flex-1' : 'hidden opacity-0 -z-10 pointer-events-none'} ${isDarkMode ? '' : 'bg-[#faf9fe]'}`}
    >
      <div className="mx-auto w-full max-w-3xl px-3 sm:px-4 py-4 flex flex-col gap-4">

        {/* 헤더 */}
        <div className="flex items-center px-1">
          <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${textMain}`}>대시보드</h2>
        </div>

        {/* 항공권 히어로 */}
        {renderFlightCards()}

        {/* 오늘의 하이라이트 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex flex-col">
              <h3 className={`text-[15px] font-bold ${textMain}`}>오늘의 하이라이트</h3>
              <div className={`flex items-center gap-1.5 text-[11px] font-medium ${textMuted}`}>
                <Calendar className="w-3 h-3" />
                <span className="truncate">{getDayDateString(dashboardDay)}</span>
                {activeRegionForDay && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-[#007AFF]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#007AFF]">
                    <MapPin className="w-2.5 h-2.5" /> {activeRegionForDay}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => setIsDashboardPackingOpen(true)} className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold transition-colors ${softBtn}`}>
                <Backpack className="w-3 h-3" /> 준비물
              </button>
              <button onClick={() => setIsDashboardShoppingOpen(true)} className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold transition-colors ${softBtn}`}>
                <ShoppingBag className="w-3 h-3" /> 쇼핑
              </button>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x" style={{ scrollbarWidth: 'none' }}>
            {highlightPlans.length === 0 ? (
              <div
                onClick={(e) => { e.stopPropagation(); changeTab('plan'); }}
                className={`flex h-[184px] w-full items-center justify-center rounded-xl border border-dashed text-[12px] font-semibold cursor-pointer transition-colors ${textMuted} ${isDarkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-white'}`}
              >
                일정이 없습니다. 눌러서 추가하기
              </div>
            ) : highlightPlans.map(plan => {
              const isActive = activeMobileCard === plan.id;
              const tag = getThemeTag(plan);
              const photo = plan.photo || (plan.isAccommodation ? THEME_DEFAULT_PHOTO['숙소'] : getThemeDefaultPhoto(S(plan.theme)));
              return (
                <div
                  key={plan.id}
                  onClick={() => { if (isActive) { setSelectedPlanInfo(plan); setActiveMobileCard(null); } else setActiveMobileCard(plan.id); }}
                  className={`group relative w-[220px] shrink-0 snap-start overflow-hidden rounded-xl border cursor-pointer transition-all ${isDarkMode ? 'bg-slate-800' : 'bg-white'} ${isActive ? 'border-[#007AFF] shadow-md' : (isDarkMode ? 'border-slate-700 md:hover:border-[#007AFF]/50' : 'border-slate-200/70 md:hover:shadow-md md:hover:border-[#007AFF]/40')}`}
                >
                  <div className="relative h-28 bg-slate-100 dark:bg-slate-700">
                    <img
                      src={photo}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 md:group-hover:scale-105"
                      onClick={plan.photo ? (e) => { e.stopPropagation(); openPhotoViewer(plan.photos && plan.photos.length > 0 ? plan.photos : [plan.photo]); } : undefined}
                    />
                    <span className={`absolute left-2 top-2 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white ${tag.bg}`}>{tag.label}</span>
                    {(plan.isAccommodation || plan.time !== '99:99') && (
                      <span className="absolute right-2 top-2 rounded-md bg-white/85 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 backdrop-blur-sm">
                        {plan.isAccommodation ? '숙박' : S(plan.time)}
                      </span>
                    )}
                    {plan.photos && plan.photos.length > 1 && (
                      <span className="absolute bottom-2 left-2 rounded bg-black/60 px-1 py-0.5 text-[9px] font-bold text-white">📸 {plan.photos.length}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 p-3">
                    <h4 className={`truncate text-[13px] font-semibold leading-tight ${isActive ? 'text-[#007AFF]' : textMain}`}>
                      {S(plan.place)} {plan.isAccommodation && '🏠'}
                    </h4>
                    <p className={`truncate text-[11px] ${textMuted}`}>{S(plan.localName) || S(plan.features) || ' '}</p>
                  </div>
                  <div className={`absolute bottom-2 right-2 flex gap-1 rounded-md border shadow-sm transition-opacity duration-200 ${isDarkMode ? 'bg-slate-700/95 border-slate-600' : 'bg-white/95 border-slate-200'} ${isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto'}`}>
                    <button onClick={(e) => { e.stopPropagation(); handleEditPlanClick(plan); }} className="p-1 text-slate-500 hover:text-[#007AFF]"><span className="text-[11px]">✏️</span></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan.id); }} className="p-1 text-slate-500 hover:text-rose-500"><Trash2 className="w-3 h-3 inline" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 오늘의 일정 (수정/삭제 · 이동정보 포함) */}
        <div className={`${panel} p-3 flex flex-col gap-2`}>
          <div className="flex items-center justify-between">
            <h3 className={`flex items-center gap-1.5 text-[13px] font-semibold ${textMain}`}>
              <ListChecks className="w-4 h-4 text-[#007AFF]" /> 오늘의 일정
              <span className={`text-[11px] font-medium ${textMuted}`}>· {S(displayCityName)}</span>
            </h3>
            <div className="flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {tripDays.map(d => {
                const wInfo = getWeatherForDay(d);
                const on = dashboardDay === d;
                return (
                  <button
                    key={d}
                    onClick={() => setDashboardDay(d)}
                    className={`flex flex-col items-center rounded-lg px-2.5 py-1.5 text-[11px] font-semibold shrink-0 transition-colors ${on ? 'bg-[#007AFF] text-white' : (isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-[#f4f3f8] text-slate-500')}`}
                  >
                    <span>D{d}</span>
                    {wInfo ? <span className="mt-0.5 text-[10px] leading-none">{wInfo[1]}</span> : <span className="mt-0.5 block h-2" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            {(!todayPlans || todayPlans.length === 0) ? (
              <div
                onClick={(e) => { e.stopPropagation(); changeTab('plan'); }}
                className={`flex h-20 items-center justify-center rounded-lg border border-dashed text-[11px] font-semibold cursor-pointer transition-colors ${textMuted} ${isDarkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-[#f4f3f8]'}`}
              >
                일정이 없습니다. 눌러서 추가하기
              </div>
            ) : todayPlans.map(plan => {
              const isActive = activeMobileCard === plan.id;
              const isTransport = isTransportPlan(plan);
              const _accomTransit = !plan.isAccommodation ? getAccommodationTransitFrom(plan, todayPlans) : null;

              if (isTransport) {
                return (
                  <React.Fragment key={plan.id}>
                    <TransitConnector plan={plan} onClick={openTransitView} />
                    <div
                      onClick={(e) => { e.stopPropagation(); if (isActive) { setSelectedPlanInfo(plan); setActiveMobileCard(null); } else setActiveMobileCard(plan.id); }}
                      className={`relative flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer transition-colors group ${isDarkMode ? 'bg-[#007AFF]/10 border-[#007AFF]/30' : 'bg-[#007AFF]/5 border-[#007AFF]/20'}`}
                    >
                      {plan.time !== '99:99' && <span className="shrink-0 rounded bg-[#007AFF] px-1.5 py-0.5 text-[10px] font-bold text-white">{S(plan.time)}</span>}
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] font-bold text-[#007AFF]">{S(plan.place)}</span>
                        {(plan.localName || plan.features) && (
                          <span className={`block truncate text-[10px] ${textMuted}`}>{[S(plan.localName), S(plan.features)].filter(Boolean).join(' · ')}</span>
                        )}
                      </div>
                      <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 rounded-md border shadow-sm ${isDarkMode ? 'bg-slate-700/95 border-slate-600' : 'bg-white/95 border-slate-200'} ${isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto'}`}>
                        <button onClick={(e) => { if (!isActive) return; e.stopPropagation(); handleEditPlanClick(plan); }} className="p-1 text-slate-500 hover:text-[#007AFF]"><span className="text-[11px]">✏️</span></button>
                        <button onClick={(e) => { if (!isActive) return; e.stopPropagation(); handleDeletePlan(plan.id); }} className="p-1 text-slate-500 hover:text-rose-500"><Trash2 className="w-3 h-3 inline" /></button>
                      </div>
                    </div>
                  </React.Fragment>
                );
              }

              return (
                <React.Fragment key={plan.id}>
                  {!plan.isAccommodation && <TransitConnector plan={plan} onClick={openTransitView} />}
                  <div
                    onClick={(e) => { e.stopPropagation(); if (isActive) { setSelectedPlanInfo(plan); setActiveMobileCard(null); } else setActiveMobileCard(plan.id); }}
                    className={`relative flex items-center gap-2 rounded-lg border p-2 cursor-pointer transition-colors group ${isActive ? 'border-[#007AFF]' : (isDarkMode ? 'border-slate-700 bg-slate-900/30 md:hover:border-[#007AFF]/40' : 'border-slate-200/70 bg-[#f4f3f8] md:hover:border-[#007AFF]/40')}`}
                  >
                    {(plan.isAccommodation || plan.time !== '99:99') && (
                      <span className="shrink-0 rounded border border-[#007AFF]/20 bg-[#007AFF]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#007AFF]">
                        {plan.isAccommodation ? '🏠 숙소' : S(plan.time)}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className={`block truncate text-[12px] font-semibold ${textMain}`}>{S(plan.place)} {plan.isAccommodation && '🏠'}</span>
                      {plan.features && <span className={`block truncate text-[10px] ${textMuted}`}>{S(plan.features)}</span>}
                    </div>
                    <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 rounded-md border shadow-sm ${isDarkMode ? 'bg-slate-700/95 border-slate-600' : 'bg-white/95 border-slate-200'} ${isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto'}`}>
                      <button onClick={(e) => { e.stopPropagation(); handleEditPlanClick(plan); }} className="p-1 text-slate-500 hover:text-[#007AFF]"><span className="text-[11px]">✏️</span></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan.id); }} className="p-1 text-slate-500 hover:text-rose-500"><Trash2 className="w-3 h-3 inline" /></button>
                    </div>
                  </div>
                  {_accomTransit && <TransitConnector plan={_accomTransit.plan} route={_accomTransit.route} onClick={openTransitView} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* 2열: 실시간 환율 / 빠른 도구 (국내 여행이면 환율 계산기는 숨김) */}
        <div className={`grid grid-cols-1 ${isDomesticTrip ? '' : 'sm:grid-cols-2'} gap-3`}>
          {/* 실시간 환율 (양방향 계산기) */}
          {!isDomesticTrip && (
          <div className={`${panel} p-3 flex flex-col gap-2`}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className={`flex items-center gap-1.5 text-[13px] font-semibold shrink-0 ${textMain}`}>
                <RefreshCw className={`w-4 h-4 text-[#007AFF] ${loadingRates ? 'animate-spin' : ''}`} /> 실시간 환율
              </h3>
              <div className="flex items-center gap-1.5">
                <div className={`flex items-center gap-1 rounded-lg border px-2 py-1 ${isDarkMode ? 'bg-slate-900/40 border-slate-700' : 'bg-[#f4f3f8] border-slate-200/50'}`}>
                  <span className="text-[11px] font-bold text-[#007AFF]">₩</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={currencyInputValue('KRW')}
                    placeholder={getPlaceholder('KRW')}
                    onFocus={() => setFocusedCurrency('KRW')}
                    onBlur={() => setFocusedCurrency(prev => prev === 'KRW' ? null : prev)}
                    onChange={e => handleInputChange('KRW', e.target.value)}
                    className={`w-16 bg-transparent text-right text-xs font-bold outline-none ${textMain}`}
                  />
                </div>
                <button
                  onClick={() => fetchRealTimeRates(true)}
                  className="text-[#007AFF] hover:bg-[#007AFF]/10 rounded-md p-1 transition-colors"
                  aria-label="환율 새로고침"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingRates ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              {foreignCurrencies.map(cur => (
                <div key={cur.code} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${isDarkMode ? 'bg-slate-900/40 border-slate-700' : 'bg-[#f4f3f8] border-slate-200/50'}`}>
                  <span className="flex flex-col leading-tight">
                    <span className={`text-[11px] font-semibold uppercase ${textMuted}`}>{cur.label}</span>
                    <span className={`text-[9px] font-medium ${textMuted}`}>{cur.unit || 1} {cur.code} = ₩{getPlaceholder(cur.code, cur.unit)}</span>
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={currencyInputValue(cur.code, cur.unit)}
                    placeholder="0"
                    onFocus={() => setFocusedCurrency(cur.code)}
                    onBlur={() => setFocusedCurrency(prev => prev === cur.code ? null : prev)}
                    onChange={e => handleInputChange(cur.code, e.target.value)}
                    className={`w-24 bg-transparent text-right text-sm font-bold outline-none ${textMain}`}
                  />
                </div>
              ))}
            </div>
            {errorRates
              ? <span className="text-rose-500 text-[10px] font-semibold">{errorRates}</span>
              : updatedLabel && <span className={`text-[10px] font-medium ${textMuted}`}>{updatedLabel}</span>}
          </div>
          )}

          {/* 빠른 도구 */}
          <div className={`${panel} p-3 flex flex-col gap-2`}>
            <h3 className={`flex items-center gap-1.5 text-[13px] font-semibold ${textMain}`}>
              <ListChecks className="w-4 h-4 text-[#007AFF]" /> 빠른 도구
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {tools.map(({ key, label, Icon, onClick, badge, full }) => (
                <button
                  key={key}
                  onClick={onClick}
                  className={`flex flex-col items-center justify-center gap-1 rounded-lg border py-3 transition-colors active:scale-95 ${softBtn} ${full ? 'col-span-2' : ''}`}
                >
                  <Icon className="w-5 h-5 text-[#007AFF]" />
                  <span className="text-[11px] font-medium">{label}</span>
                  {badge && <span className="text-[10px] font-bold text-[#007AFF]">{badge}</span>}
                </button>
              ))}
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

      {isTipsOpen && createPortal(
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[8000] flex items-center justify-center p-4" onClick={() => setIsTipsOpen(false)}>
          <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} w-full max-w-sm shadow-2xl overflow-hidden rounded-2xl border`} onClick={e => e.stopPropagation()}>
            <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <h3 className={`text-sm font-black flex items-center gap-1.5 ${textMain}`}><Sparkles className="w-4 h-4 text-[#007AFF]" /> {resolvedGlobalCountry} 여행 꿀팁</h3>
              <button onClick={() => setIsTipsOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-2.5 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {countryTips.map((tip, i) => (
                <div key={i} className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 ${isDarkMode ? 'bg-slate-900/40 border-slate-700' : 'bg-[#f4f3f8] border-slate-200/50'}`}>
                  <span className="text-base leading-none">{tip.icon}</span>
                  <span className={`text-[12px] font-medium leading-snug ${textMain}`}>{tip.text}</span>
                </div>
              ))}
              {COUNTRY_LANGUAGE[resolvedGlobalCountry] && (
                <button
                  onClick={() => setIsLanguageOpen(true)}
                  className={`w-full flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-[12px] font-bold transition-colors ${isDarkMode ? 'bg-indigo-900/30 border-indigo-700 text-indigo-300 hover:bg-indigo-900/50' : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'}`}
                >
                  🗣️ 현지 언어 알아보기
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <LanguageModal
        isOpen={isLanguageOpen}
        onClose={() => setIsLanguageOpen(false)}
        isDarkMode={isDarkMode}
        textMain={textMain}
        countryName={resolvedGlobalCountry}
        languageList={COUNTRY_LANGUAGE[resolvedGlobalCountry]}
      />
    </div>
  );
};

export default DashboardTab;
