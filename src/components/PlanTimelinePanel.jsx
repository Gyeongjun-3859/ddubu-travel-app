import React from 'react';
import { Trash2, Navigation, Star } from 'lucide-react';
import { S, getAccommodationTransitFrom, openGoogleMapsNav, openExternalUrl } from '../utils/helpers';
import TransitConnector from './TransitConnector';

const THEME_EMOJI = {
  '식당': '🍽️', '디저트': '🍰', '관광지': '📸', '쇼핑': '🛍️', '숙소': '🏠', '카페': '☕', '기타': '📍',
};
const getThemeEmoji = (theme) => THEME_EMOJI[S(theme)] || THEME_EMOJI['기타'];

const isTransportPlan = (plan) => plan.isTransport || ['교통', '항공', '비행기', '기차', '버스', '배'].some(k => S(plan.theme).includes(k));

const PlanTimelinePanel = ({
  isDarkMode, textMuted, textMain, currentDay, getDayDateString, planTimeline,
  activeMobileCard, setActiveMobileCard,
  handleEditPlanClick, handleDeletePlan, handleCopyLocalName, openPhotoViewer,
  currentRestaurants, onAddPlace,
}) => {
  const safePT = Array.isArray(planTimeline) ? planTimeline.filter(Boolean) : [];

  const accomsForDay = safePT.filter(p => {
    if (!p.isAccommodation) return false;
    const days = Array.isArray(p.accommodationDays) ? p.accommodationDays : [];
    return days.length === 0 || days.includes(currentDay);
  });

  const hasRental = safePT.some(p => p.id === 'trans_rental_dep' || p.id === 'trans_rental_arr');
  const dayPlans = safePT
    .filter(p => {
      if (p.isAccommodation) return false;
      if (parseInt(p.day || 1) !== currentDay) return false;
      if (hasRental && !String(p.id).startsWith('trans_rental_') && S(p.place).includes('렌터카')) return false;
      return true;
    })
    .sort((a, b) => S(a.time).localeCompare(S(b.time)));

  const isEmpty = accomsForDay.length === 0 && dayPlans.length === 0;

  const card = `rounded-xl border shadow-[0_4px_20px_rgba(0,0,0,0.05)] overflow-hidden transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-slate-200/40'}`;
  const ratingBadge = (plan) => plan.rating > 0 && (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-amber-500">
      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />{Number(plan.rating).toFixed(1)}
    </span>
  );
  const actionBar = (plan, isActive) => (
    <div className={`absolute right-2 top-2 z-10 flex gap-0.5 rounded-md border shadow-sm transition-opacity duration-200 ${isDarkMode ? 'bg-slate-700/95 border-slate-600' : 'bg-white/95 border-slate-200'} ${isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto'}`}>
      <button onClick={(e) => { if (!isActive) return; e.stopPropagation(); handleEditPlanClick(plan); }} className="p-1 text-slate-500 hover:text-[#007AFF]"><span className="text-[11px]">✏️</span></button>
      <button onClick={(e) => { if (!isActive) return; e.stopPropagation(); handleDeletePlan(plan.id); }} className="p-1 text-slate-500 hover:text-rose-500"><Trash2 className="w-3 h-3 inline" /></button>
    </div>
  );

  const openNav = (plan) => {
    const rests = Array.isArray(currentRestaurants) ? currentRestaurants : [];
    const pin = rests.find(r => r && r.lat && r.lng && S(r.name) === S(plan.place));
    if (pin) openGoogleMapsNav(pin.lat, pin.lng);
    else openExternalUrl(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(S(plan.localName) || S(plan.place))}`);
  };

  const handleCardClick = (e, plan) => {
    e.stopPropagation();
    if (activeMobileCard === plan.id) { handleEditPlanClick(plan); setActiveMobileCard(null); }
    else setActiveMobileCard(plan.id);
  };

  return (
    <div className="flex flex-col gap-1">
      <span className={`px-1 text-[11px] font-medium ${textMuted}`}>{getDayDateString(currentDay)}</span>

      {isEmpty ? (
        <div
          onClick={onAddPlace}
          className={`mt-2 flex h-28 flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-[12px] font-semibold cursor-pointer transition-colors ${textMuted} ${isDarkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-white'}`}
        >
          이 날은 일정이 없어요
          <span className="text-[11px] font-medium">눌러서 추가하기</span>
        </div>
      ) : (
        <div className="relative pl-12 pt-2">
          <div className={`absolute left-[11px] top-1 bottom-1 w-[2px] rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />

          {/* 숙소 (상단 고정) */}
          {accomsForDay.map(plan => {
            const isActive = activeMobileCard === plan.id;
            return (
              <div key={plan.id} className="relative mb-6">
                <div className={`absolute -left-12 top-3 z-10 h-3 w-3 rounded-full border-[3px] ${isDarkMode ? 'border-slate-900' : 'border-white'} bg-[#007AFF] shadow-sm`} />
                <div className="absolute -left-12 top-0 -translate-y-4 text-[11px] font-bold text-[#007AFF]">숙소</div>
                <div
                  onClick={(e) => handleCardClick(e, plan)}
                  className={`group relative flex cursor-pointer flex-row ${card} ${isActive ? 'border-[#007AFF]' : ''}`}
                >
                  {plan.photo ? (
                    <div className="w-1/3 h-24 shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-700" onClick={(e) => { e.stopPropagation(); openPhotoViewer(plan.photos && plan.photos.length > 0 ? plan.photos : [plan.photo]); }}>
                      <img src={plan.photo} alt="" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex w-1/3 h-24 shrink-0 items-center justify-center bg-[#007AFF]/10 text-2xl">🏠</div>
                  )}
                  <div className="flex flex-1 flex-col justify-center gap-0.5 p-2.5">
                    <span className="w-fit rounded bg-[#007AFF]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#007AFF]">
                      🏠 숙소{Array.isArray(plan.accommodationDays) && plan.accommodationDays.length > 0 ? ` (D${plan.accommodationDays.join(',D')})` : ''}
                    </span>
                    <h3 className={`text-[14px] font-semibold leading-tight ${textMain}`}>{S(plan.place)}</h3>
                    {plan.localName && (
                      <p className="truncate text-[11px] font-semibold text-[#007AFF]" onClick={(e) => handleCopyLocalName(e, plan.localName)}>📋 {S(plan.localName)}</p>
                    )}
                    {plan.features && <p className={`line-clamp-1 text-[11px] leading-tight ${textMuted}`}>{S(plan.features)}</p>}
                  </div>
                  {actionBar(plan, isActive)}
                </div>
              </div>
            );
          })}

          {/* 일반 일정 */}
          {dayPlans.map((plan, idx) => {
            const isActive = activeMobileCard === plan.id;
            const isFirst = idx === 0 && accomsForDay.length === 0;
            const accomTransit = getAccommodationTransitFrom(plan, accomsForDay);
            const timeLabel = plan.time && plan.time !== '99:99' ? S(plan.time) : '';

            const node = (
              <>
                <div className={`absolute -left-12 top-3 z-10 rounded-full border-[3px] ${isDarkMode ? 'border-slate-900' : 'border-white'} ${isFirst ? 'h-3 w-3 bg-[#007AFF] shadow-sm' : `h-2 w-2 mt-0.5 ml-0.5 ${isDarkMode ? 'bg-slate-600' : 'bg-slate-300'}`}`} />
                {timeLabel && <div className={`absolute -left-12 top-0 -translate-y-4 text-[11px] font-bold ${isFirst ? 'text-[#007AFF]' : textMuted}`}>{timeLabel}</div>}
              </>
            );

            if (isTransportPlan(plan)) {
              return (
                <React.Fragment key={plan.id}>
                  <TransitConnector plan={plan} />
                  <div className="relative mb-3">
                    {node}
                    <div
                      onClick={(e) => handleCardClick(e, plan)}
                      className={`group relative flex cursor-pointer items-center gap-2 rounded-xl border p-3 shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all ${isDarkMode ? 'bg-[#007AFF]/10 border-[#007AFF]/30' : 'bg-[#007AFF]/5 border-[#007AFF]/20'} ${isActive ? 'border-[#007AFF]' : ''}`}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-bold text-[#007AFF]">{S(plan.place)}</span>
                        {(plan.localName || plan.features) && (
                          <span className={`block truncate text-[11px] ${textMuted}`}>{[S(plan.localName), S(plan.features)].filter(Boolean).join(' · ')}</span>
                        )}
                      </div>
                      {actionBar(plan, isActive)}
                    </div>
                  </div>
                  {accomTransit && <TransitConnector plan={accomTransit.plan} route={accomTransit.route} />}
                </React.Fragment>
              );
            }

            return (
              <React.Fragment key={plan.id}>
                <TransitConnector plan={plan} />
                <div className="relative mb-3">
                  {node}

                  {plan.photo ? (
                    <div
                      onClick={(e) => handleCardClick(e, plan)}
                      className={`group relative flex cursor-pointer flex-row ${card} ${isActive ? 'border-[#007AFF]' : ''}`}
                    >
                      <div className="relative w-1/3 h-28 shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-700" onClick={(e) => { e.stopPropagation(); openPhotoViewer(plan.photos && plan.photos.length > 0 ? plan.photos : [plan.photo]); }}>
                        <img src={plan.photo} alt="" className="h-full w-full object-cover" />
                        {plan.photos && plan.photos.length > 1 && <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-bold text-white">📸 {plan.photos.length}</span>}
                      </div>
                      <div className="flex flex-1 flex-col justify-center gap-0.5 p-2.5">
                        <h3 className={`text-[14px] font-semibold leading-tight ${textMain}`}>{S(plan.place)}</h3>
                        <div className={`flex items-center gap-1.5 text-[11px] ${textMuted}`}>
                          {ratingBadge(plan)}
                          {plan.rating > 0 && <span className="opacity-40">•</span>}
                          <span>{getThemeEmoji(plan.theme)} {S(plan.theme) || '기타'}</span>
                          {plan.localName && (<><span className="opacity-40">•</span><span className="truncate text-[#007AFF] font-semibold" onClick={(e) => handleCopyLocalName(e, plan.localName)}>{S(plan.localName)}</span></>)}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); openNav(plan); }}
                          className="mt-0.5 flex w-fit items-center gap-1 rounded-md bg-[#007AFF]/10 px-2 py-1 text-[11px] font-semibold text-[#007AFF]"
                        >
                          <Navigation className="w-3 h-3" /> 길찾기
                        </button>
                      </div>
                      {actionBar(plan, isActive)}
                    </div>
                  ) : (
                    <div
                      onClick={(e) => handleCardClick(e, plan)}
                      className={`group relative flex cursor-pointer items-center gap-3 p-3 ${card} ${isActive ? 'border-[#007AFF]' : ''}`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#007AFF]/10 text-lg">{getThemeEmoji(plan.theme)}</div>
                      <div className="min-w-0 flex-1">
                        <h3 className={`truncate text-[13px] font-semibold ${textMain}`}>{S(plan.place)}</h3>
                        <p className={`flex items-center gap-1 truncate text-[11px] ${textMuted}`}>
                          {ratingBadge(plan)}
                          {plan.rating > 0 && <span className="opacity-40">•</span>}
                          <span className="truncate">
                            {S(plan.theme) || '기타'}
                            {plan.localName && ` · ${S(plan.localName)}`}
                            {plan.features && ` · ${S(plan.features)}`}
                          </span>
                        </p>
                      </div>
                      {actionBar(plan, isActive)}
                    </div>
                  )}
                </div>
                {accomTransit && <TransitConnector plan={accomTransit.plan} route={accomTransit.route} />}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlanTimelinePanel;
