import React from 'react';
import { X, Wallet, ClipboardList } from 'lucide-react';
import { REGIONS_BY_COUNTRY, COUNTRY_FLAG } from '../utils/constants';
import { S, getFlagForCity } from '../utils/helpers';

const ExpenseModal = ({
  isExpenseModalOpen, setIsExpenseModalOpen,
  expenseAmtModalPlan, setExpenseAmtModalPlan,
  expenseAmtValue, setExpenseAmtValue,
  expenseAmtIsKrw, setExpenseAmtIsKrw,
  isBasicExpAddOpen, setIsBasicExpAddOpen,
  basicExpAddName, setBasicExpAddName,
  basicExpAddAmt, setBasicExpAddAmt,
  basicExpAddCat, setBasicExpAddCat,
  basicExpAddIsKrw, setBasicExpAddIsKrw,
  basicExpAddDay, setBasicExpAddDay,
  expenseFilterDay, setExpenseFilterDay,
  expenseFilterTheme, setExpenseFilterTheme,
  cardBg, textMain, textMuted, inputBg, isDarkMode,
  planTimeline, setPlanTimeline, basicExpenses, setBasicExpenses,
  rates, tripDays, globalPlanCountry, globalPlanRegion, globalManualCountry,
  travelStartDate, safeMaxDay, showToast, saveToDb,
}) => {
  return (
    <>
      {isExpenseModalOpen && (() => {
        // 국가 → 화폐 코드/기호 변환 헬퍼 (country가 지역명으로 잘못 저장된 구버전 데이터도 역추적)
        const resolveCountry = (country, region) => {
          // 1순위: country가 알려진 국가명이면 그대로 사용
          if (country && Object.keys(REGIONS_BY_COUNTRY).includes(country)) return country;
          // 2순위: region으로 국가 역추적
          if (region) { for (const [cn, rs] of Object.entries(REGIONS_BY_COUNTRY)) { if (rs.includes(region)) return cn; } }
          // 3순위: country 자체가 지역명일 수도 있음 (구버전 버그 데이터)
          if (country) { for (const [cn, rs] of Object.entries(REGIONS_BY_COUNTRY)) { if (rs.includes(country)) return cn; } }
          return country || '';
        };
        const getCountryCurrency = (country, region) => {
          const c = resolveCountry(country, region);
          if (c === '한국') return { code: 'KRW', sym: '₩' };
          if (c === '일본') return { code: 'JPY', sym: '¥' };
          if (c === '중국') return { code: 'CNY', sym: '元' };
          if (['프랑스','이탈리아','스페인','독일'].includes(c)) return { code: 'EUR', sym: '€' };
          if (c === '영국') return { code: 'GBP', sym: '£' };
          if (c === '태국') return { code: 'THB', sym: '฿' };
          if (c === '베트남') return { code: 'VND', sym: '₫' };
          if (c === '대만') return { code: 'TWD', sym: 'NT$' };
          if (c === '호주') return { code: 'AUD', sym: 'A$' };
          return { code: 'USD', sym: '$' };
        };
        const toKrw = (localAmt, curCode) => {
          if (!localAmt || isNaN(Number(localAmt))) return 0;
          const r = rates && rates['KRW'] && rates[curCode] ? (rates['KRW'] / rates[curCode]) : 1350;
          return Math.round(Number(localAmt) * r);
        };

        // 일정 일정 목록: 교통편·숙소 제외, D1→ 오름차순
        const allPlans = (Array.isArray(planTimeline) ? planTimeline.filter(Boolean) : [])
          .filter(p => !p.isTransport && !p.isAccommodation)
          .sort((a, b) => (Number(a.day) - Number(b.day)) || S(a.time).localeCompare(S(b.time)));
        const dayFiltered = expenseFilterDay === 'all' ? allPlans : allPlans.filter(p => String(p.day) === String(expenseFilterDay));
        const fullyFiltered = expenseFilterTheme === 'all' ? dayFiltered : dayFiltered.filter(p => (p.theme || '기타') === expenseFilterTheme);
        const planTotalKrw = fullyFiltered.reduce((sum, p) => sum + (Number(p.expenseKrw) || 0), 0);

        // 기본지출: basicExpenses 배열 + 교통편 일정 + 숙소 일정 + 기타지출([기타] prefix)
        const timelinePlans = Array.isArray(planTimeline) ? planTimeline.filter(Boolean) : [];
        // 교통편: outbound/inbound dep 쌍을 왕복카드로 묶기
        const transTypes = ['flight', 'train', 'bus'];
        const transportItems = [];
        transTypes.forEach(type => {
          const dep = timelinePlans.find(p => p.id === `trans_${type}_outbound_dep`);
          const arr = timelinePlans.find(p => p.id === `trans_${type}_inbound_dep`);
          if (dep || arr) {
            const depPlace = dep ? S(dep.place).replace(/[\uD800-\uDFFF☀-⟿️]|출발|도착/g, '').replace(/\(.*?\)/g, '').trim() : '';
            const arrPlace = arr ? S(arr.place).replace(/[\uD800-\uDFFF☀-⟿️]|출발|도착/g, '').replace(/\(.*?\)/g, '').trim() : '';
            const depFlag = getFlagForCity(depPlace) || '';
            const arrFlag = getFlagForCity(arrPlace) || COUNTRY_FLAG[arr?.country] || '';
            const totalKrw = (Number(dep?.expenseKrw) || 0) + (Number(arr?.expenseKrw) || 0);
            transportItems.push({ id: `transport_grouped_${type}`, name: depPlace && arrPlace ? `${depPlace} / ${arrPlace}` : (depPlace || arrPlace || type), depFlag, arrFlag, depPlace, arrPlace, amtKrw: totalKrw, category: '항공권/교통', isFromTimeline: true, isGroupedTransport: true, depPlan: dep, arrPlan: arr });
          } else {
            // 구버전 데이터: isTransport이고 id가 trans_ 형식이 아닌 것들
            timelinePlans.filter(p => p.isTransport && !String(p.id).startsWith('trans_') && !String(p.id).endsWith('_arr'))
              .forEach(p => {
                if (!transportItems.find(t => t.planId === p.id)) {
                  transportItems.push({ id: p.id, name: S(p.place), amtKrw: Number(p.expenseKrw) || 0, category: '항공권/교통', isFromTimeline: true, planId: p.id });
                }
              });
          }
        });
        // 렌터카: dep+arr을 하나의 카드로 그룹핑
        const rentalDep = timelinePlans.find(p => p.id === 'trans_rental_dep');
        const rentalArr = timelinePlans.find(p => p.id === 'trans_rental_arr');
        // planTimeline의 basic-exp- 항목 중 렌터카 관련 항목 추출 → transport_grouped_rental에 합산
        const basicRentalPlans = timelinePlans.filter(p => p.id && String(p.id).startsWith('basic-exp-') && S(p.place).includes('렌터카'));
        const basicRentalKrw = basicRentalPlans.reduce((s, p) => s + (Number(p.expenseKrw) || 0), 0);
        const basicRentalIds = new Set(basicRentalPlans.map(p => p.id));
        if (rentalDep || rentalArr || basicRentalPlans.length > 0) {
          const timelineKrw = (Number(rentalDep?.expenseKrw) || 0) + (Number(rentalArr?.expenseKrw) || 0);
          const totalKrw = timelineKrw + basicRentalKrw;
          const meta = rentalDep?.rentalMeta || rentalArr?.rentalMeta || {};
          transportItems.push({ id: 'transport_grouped_rental', name: `🚗 렌터카${meta.company ? ` (${meta.company})` : ''}`, amtKrw: totalKrw, category: '항공권/교통', isFromTimeline: true, isGroupedTransport: true, depPlan: rentalDep, arrPlan: rentalArr, isRentalGrouped: true });
        }
        const accomItems = timelinePlans
          .filter(p => p.isAccommodation)
          .map(p => ({ id: p.id, name: S(p.place), amtKrw: Number(p.expenseKrw) || 0, category: '숙소', isFromTimeline: true, planId: p.id }));
        const manualItems = timelinePlans
          .filter(p => p.id && String(p.id).startsWith('manual-exp-'))
          .map(p => ({ id: p.id, name: p.place.replace(/^\[기타\]\s*/, ''), amtKrw: Number(p.expenseKrw) || 0, category: '기타', isFromTimeline: true, planId: p.id }));
        const basicExpItems = timelinePlans
          .filter(p => p.id && String(p.id).startsWith('basic-exp-') && !basicRentalIds.has(p.id))
          .map(p => ({ id: p.id, name: S(p.place), amtKrw: Number(p.expenseKrw) || 0, amtLocal: p.expenseLocal || '', sym: p.sym || '', category: S(p.theme || '기타'), isFromTimeline: true, planId: p.id, dayLabel: `D${p.day}` }));
        const basicItems = [...basicExpenses, ...transportItems, ...accomItems, ...manualItems, ...basicExpItems];
        const basicTotalKrw = basicItems.reduce((sum, b) => sum + (Number(b.amtKrw) || 0), 0);

        const grandTotal = planTotalKrw + basicTotalKrw;

        return (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 transition-opacity duration-300" onClick={() => setIsExpenseModalOpen(false)}>
          <div className={`${cardBg} p-5 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]`} onClick={e => e.stopPropagation()}>
            <div className={`flex justify-between items-center mb-3 border-b pb-3 flex-shrink-0 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <h3 className={`font-black text-sm flex items-center gap-1.5 ${textMain}`}><Wallet className="w-4 h-4" /> 여행정산</h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg transition-colors"><X className="w-[1em] h-[1em] inline" /></button>
            </div>

            {/* 총 합계 */}
            <div className={`p-3 rounded-2xl mb-3 flex flex-col items-center border shadow-md flex-shrink-0 ${isDarkMode ? 'bg-indigo-900/30 border-indigo-700' : 'bg-indigo-50 border-indigo-100'}`}>
              <span className={`text-[10px] font-black uppercase tracking-wider mb-0.5 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>Total Expense</span>
              <span className="text-2xl font-black text-rose-500">₩{grandTotal.toLocaleString()}</span>
              <div className={`flex gap-3 mt-1 text-[9px] font-bold ${textMuted}`}>
                <span>일정 ₩{planTotalKrw.toLocaleString()}</span>
                <span>+</span>
                <span>기본지출 ₩{basicTotalKrw.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3 mb-3 scroll-smooth min-h-0">

              {/* ── 기본지출 섹션 ── */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className={`text-[10px] font-black ${textMain}`}>📋 기본지출</h4>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold text-rose-500`}>₩{basicTotalKrw.toLocaleString()}</span>
                    <button onClick={() => {
                      // 오늘 날짜 기준 자동 Day 계산
                      let todayDayNum = 1;
                      if (travelStartDate) {
                        const start = new Date(travelStartDate); start.setHours(0,0,0,0);
                        const today = new Date(); today.setHours(0,0,0,0);
                        const diff = Math.round((today - start) / 86400000) + 1;
                        todayDayNum = (diff >= 1 && diff <= safeMaxDay) ? diff : 1;
                      }
                      setBasicExpAddIsKrw(false); setBasicExpAddName(''); setBasicExpAddAmt(''); setBasicExpAddCat('기타'); setBasicExpAddDay(todayDayNum); setIsBasicExpAddOpen(true);
                    }} className="bg-indigo-600 text-white px-2 py-0.5 text-[9px] font-bold rounded-lg hover:bg-indigo-700 active:scale-95 transition-all">+ 추가</button>
                  </div>
                </div>
                {basicItems.length === 0 ? (
                  <p className={`text-[10px] ${textMuted} text-center py-2`}>기본지출 내역 없음</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {basicItems.map(item => {
                      const hasAmt = Number(item.amtKrw) > 0;
                      const catColor = item.category === '항공권/교통' ? (isDarkMode ? 'bg-sky-900 text-sky-300' : 'bg-sky-500 text-white')
                        : item.category === '숙소' ? (isDarkMode ? 'bg-emerald-900 text-emerald-300' : 'bg-emerald-500 text-white')
                        : (isDarkMode ? 'bg-amber-900 text-amber-300' : 'bg-amber-500 text-white');
                      const openModal = () => {
                        if (item.isGroupedTransport) {
                          // 왕복카드: 항공권은 원화 기본
                          const p = item.depPlan || item.arrPlan;
                          if (p) {
                            const totalKrw = (Number(item.depPlan?.expenseKrw) || 0) + (Number(item.arrPlan?.expenseKrw) || 0);
                            setExpenseAmtModalPlan({ ...p, _groupedTransport: item });
                            setExpenseAmtValue(totalKrw > 0 ? String(totalKrw) : '');
                            setExpenseAmtIsKrw(true); // 항공권은 원화 기본
                          }
                        } else if (item.isFromTimeline) {
                          const p = timelinePlans.find(tp => String(tp.id) === String(item.planId));
                          if (p) {
                            // 숙소/교통 기본지출은 원화 기본
                            const totalKrw = Number(p.expenseKrw) || 0;
                            setExpenseAmtModalPlan(p);
                            setExpenseAmtValue(totalKrw > 0 ? String(totalKrw) : '');
                            setExpenseAmtIsKrw(true);
                          }
                        }
                      };
                      const canOpen = item.isFromTimeline;
                      // 수동 추가 항목은 현지화로 표시 (amtLocal/sym 있으면)
                      const displayBasicAmt = (!item.isFromTimeline && item.amtLocal && item.sym)
                        ? `${item.sym}${Number(item.amtLocal).toLocaleString()}`
                        : `₩${Number(item.amtKrw).toLocaleString()}`;
                      return (
                      <div key={item.id} onClick={canOpen ? openModal : undefined} className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 ${canOpen ? 'cursor-pointer active:scale-[0.98]' : ''} ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-slate-500' : 'bg-white border-slate-100 shadow-sm hover:border-slate-300'}`}>
                        <span className={`text-[7px] font-black px-1.5 py-0.5 rounded flex-shrink-0 ${catColor}`}>{item.category || '기타'}</span>
                        {item.isGroupedTransport && item.depPlace && item.arrPlace ? (
                          <span className={`flex-1 text-[10px] font-bold truncate ${textMain}`}>
                            {item.depFlag && <span>{item.depFlag}</span>}{item.depPlace}
                            <span className="mx-1 text-slate-400 font-black">&#8596;</span>
                            {item.arrFlag && <span>{item.arrFlag}</span>}{item.arrPlace}
                          </span>
                        ) : (
                          <span className={`flex-1 text-[10px] font-bold truncate ${textMain}`}>{item.name}</span>
                        )}
                        <span className={`text-[10px] font-black flex-shrink-0 ${hasAmt ? 'text-rose-500' : textMuted}`}>{displayBasicAmt}</span>
                        <button onClick={e => {
                          e.stopPropagation();
                          if (item.category === '기타' && item.isFromTimeline) {
                            const updated = planTimeline.filter(p => String(p.id) !== String(item.planId));
                            setPlanTimeline(updated); saveToDb({ plan_timeline: updated });
                          } else if (!item.isFromTimeline) {
                            setBasicExpenses(prev => prev.filter(b => b.id !== item.id));
                          }
                        }} className={`text-[10px] transition-colors flex-shrink-0 ${(item.category === '기타' && item.isFromTimeline) || !item.isFromTimeline ? 'text-slate-300 hover:text-rose-400' : 'text-slate-200 cursor-not-allowed opacity-30'}`} title={item.isFromTimeline && item.category !== '기타' ? '일정 탭에서 삭제하세요' : '삭제'}>🗑️</button>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── 여행일정 지출 섹션 ── */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className={`text-[10px] font-black ${textMain}`}>📅 여행일정 지출</h4>
                  <span className={`text-[9px] font-bold text-rose-500`}>₩{planTotalKrw.toLocaleString()}</span>
                </div>
                {/* 필터 */}
                <div className="flex gap-1.5 mb-2">
                  <select value={expenseFilterDay} onChange={e => setExpenseFilterDay(e.target.value)} className={`flex-1 ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'} p-1.5 text-[10px] font-bold outline-none rounded-lg`}>
                    <option value="all">전체 Day</option>
                    {tripDays.map(d => <option key={d} value={d}>Day {d}</option>)}
                  </select>
                  <select value={expenseFilterTheme} onChange={e => setExpenseFilterTheme(e.target.value)} className={`flex-1 ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'} p-1.5 text-[10px] font-bold outline-none rounded-lg`}>
                    <option value="all">전체 테마</option>
                    <option value="식당">식당</option>
                    <option value="디저트">디저트</option>
                    <option value="관광지">관광지</option>
                    <option value="쇼핑">쇼핑</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
                {fullyFiltered.length === 0 ? (
                  <p className={`text-[10px] ${textMuted} text-center py-2`}>일정이 없습니다.</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {fullyFiltered.map(plan => {
                      const cur = getCountryCurrency(plan.country, plan.region);
                      const hasAmount = Number(plan.expenseLocal) > 0 || Number(plan.expenseKrw) > 0;
                      const isKrwCurrency = cur.code === 'KRW';
                      // 항상 현지 화폐 기본 표시 (expenseLocal 있으면 현지화, 없으면 원화)
                      const displayAmt = isKrwCurrency
                        ? `₩${(Number(plan.expenseKrw) || 0).toLocaleString()}`
                        : Number(plan.expenseLocal) > 0
                          ? `${cur.sym}${Number(plan.expenseLocal).toLocaleString()}`
                          : `${cur.sym}0`;
                      const openThisPlan = () => {
                        // 항상 현지화 기본 (한국 여행이면 원화=현지화)
                        const hasLocal = Number(plan.expenseLocal) > 0;
                        setExpenseAmtModalPlan(plan);
                        setExpenseAmtValue(hasLocal ? String(plan.expenseLocal) : "");
                        setExpenseAmtIsKrw(isKrwCurrency); // 한국만 원화, 나머지는 현지화
                      };
                      return (
                        <div key={plan.id} onClick={openThisPlan} className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 cursor-pointer active:scale-[0.98] ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-slate-500' : 'bg-white border-slate-100 shadow-sm hover:border-slate-300'}`}>
                          <span className={`text-[7px] font-black px-1.5 py-0.5 rounded flex-shrink-0 ${isDarkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-600 text-white'}`}>D{plan.day}</span>
                          <span className={`flex-1 text-[10px] font-bold truncate min-w-0 ${textMain}`}>{S(plan.place)}</span>
                          <span className={`text-[10px] font-black flex-shrink-0 ${hasAmount ? 'text-rose-500' : (isDarkMode ? 'text-slate-500' : 'text-slate-300')}`}>{displayAmt}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => setIsExpenseModalOpen(false)} className="w-full bg-indigo-600 text-white rounded-xl py-3 text-xs font-bold shadow-md hover:bg-indigo-700 active:scale-95 transition-all duration-300 flex-shrink-0">닫기</button>
          </div>
        </div>
        );
      })()}

      {/* 금액 수정 모달 */}
      {expenseAmtModalPlan && (() => {
        const plan = expenseAmtModalPlan;
        const isGrouped = !!plan._groupedTransport;
        const resolveCountryAmt = (country, region) => {
          if (country && Object.keys(REGIONS_BY_COUNTRY).includes(country)) return country;
          if (region) { for (const [cn, rs] of Object.entries(REGIONS_BY_COUNTRY)) { if (rs.includes(region)) return cn; } }
          if (country) { for (const [cn, rs] of Object.entries(REGIONS_BY_COUNTRY)) { if (rs.includes(country)) return cn; } }
          return country || '';
        };
        const getCurModal = (country, region) => {
          const c = resolveCountryAmt(country, region);
          if (c === '한국') return { code: 'KRW', sym: '₩' };
          if (c === '일본') return { code: 'JPY', sym: '¥' };
          if (c === '중국') return { code: 'CNY', sym: '元' };
          if (['프랑스','이탈리아','스페인','독일'].includes(c)) return { code: 'EUR', sym: '€' };
          if (c === '영국') return { code: 'GBP', sym: '£' };
          if (c === '태국') return { code: 'THB', sym: '฿' };
          if (c === '베트남') return { code: 'VND', sym: '₫' };
          if (c === '대만') return { code: 'TWD', sym: 'NT$' };
          if (c === '호주') return { code: 'AUD', sym: 'A$' };
          return { code: 'USD', sym: '$' };
        };
        // 전역 여행 국가 기준으로 화폐 결정
        const basePlan = isGrouped ? (plan._groupedTransport.depPlan || plan) : plan;
        const cur = getCurModal(globalPlanCountry || basePlan.country, globalPlanRegion || basePlan.region);
        const isLocalCurrency = !expenseAmtIsKrw && cur.code !== 'KRW';
        const activeSym = expenseAmtIsKrw ? '₩' : cur.sym;
        const activeCode = expenseAmtIsKrw ? 'KRW' : cur.code;
        const toKrwModal = (amt, code) => {
          if (!amt || isNaN(Number(amt))) return 0;
          const r = rates && rates['KRW'] && rates[code] ? (rates['KRW'] / rates[code]) : 1350;
          return Math.round(Number(amt) * r);
        };
        const krwPreview = expenseAmtIsKrw ? Number(expenseAmtValue) : toKrwModal(expenseAmtValue, cur.code);
        const closeModal = () => { setExpenseAmtModalPlan(null); setExpenseAmtValue(""); setExpenseAmtIsKrw(false); };
        const saveAmt = () => {
          const inputAmt = expenseAmtValue;
          const localAmt = expenseAmtIsKrw ? '' : inputAmt;
          const krwAmt = expenseAmtIsKrw ? inputAmt : String(toKrwModal(inputAmt, cur.code));
          let updated = [...(Array.isArray(planTimeline) ? planTimeline : [])];
          if (isGrouped) {
            // 왕복카드: 전체 금액을 dep에 저장, arr는 0 (반반 분배시 홀수 반올림 오차 방지)
            const { depPlan, arrPlan } = plan._groupedTransport;
            updated = updated.map(p => {
              if (depPlan && String(p.id) === String(depPlan.id)) return { ...p, expenseLocal: localAmt, expenseKrw: krwAmt };
              if (arrPlan && String(p.id) === String(arrPlan.id)) return { ...p, expenseLocal: '', expenseKrw: '0' };
              return p;
            });
          } else {
            updated = updated.map(p => String(p.id) === String(plan.id) ? { ...p, expenseLocal: localAmt, expenseKrw: krwAmt } : p);
          }
          setPlanTimeline(updated); saveToDb({ plan_timeline: updated });
          closeModal();
          showToast("💸 금액이 저장되었습니다!");
        };
        const titleLabel = isGrouped ? plan._groupedTransport.name : S(plan.place);
        const subLabel = isGrouped ? '항공권/교통 (왕복)' : `D${plan.day} · ${S(plan.theme || '기타')}`;
        return (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[10000] flex items-center justify-center p-4" onClick={closeModal}>
            <div className={`${cardBg} p-6 rounded-3xl w-full max-w-xs shadow-2xl animate-in zoom-in-95 duration-200`} onClick={e => e.stopPropagation()}>
              <div className={`flex justify-between items-center mb-4 border-b pb-3 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                <h3 className={`font-black text-sm flex items-center gap-1.5 ${textMain}`}><Wallet className="w-4 h-4" /> 금액 입력</h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-lg"><X className="w-[1em] h-[1em] inline" /></button>
              </div>
              <p className={`text-[11px] font-bold mb-1 truncate ${textMuted}`}>📍 {titleLabel}</p>
              <p className={`text-[9px] mb-4 ${textMuted}`}>{subLabel}</p>
              <label className={`text-[9px] font-bold ${textMuted} mb-1 block`}>지출 금액</label>
              <div className="flex items-center gap-2 mb-2">
                {/* 화폐단위 클릭 → 원화/현지화 토글 */}
                {cur.code !== 'KRW' ? (
                  <button
                    onClick={() => { setExpenseAmtIsKrw(p => !p); setExpenseAmtValue(""); }}
                    className={`text-sm font-black px-2 py-1 rounded-lg border transition-all active:scale-95 ${expenseAmtIsKrw ? (isDarkMode ? 'bg-indigo-900 border-indigo-600 text-indigo-300' : 'bg-indigo-50 border-indigo-300 text-indigo-600') : (isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-300 hover:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-300')}`}
                    title={expenseAmtIsKrw ? '현지 화폐로 전환' : '원화로 전환'}
                  >{activeSym}</button>
                ) : (
                  <span className={`text-sm font-black ${textMuted}`}>₩</span>
                )}
                <input
                  type="text"
                  inputMode="numeric"
                  value={expenseAmtValue ? Number(expenseAmtValue).toLocaleString() : ''}
                  onChange={e => { const raw = e.target.value.replace(/,/g, ''); if (raw === '' || /^\d*$/.test(raw)) setExpenseAmtValue(raw); }}
                  onKeyDown={e => e.key === 'Enter' && saveAmt()}
                  autoFocus
                  placeholder="0"
                  className={`flex-1 min-w-0 border rounded-xl p-3 text-lg font-black outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${inputBg} ${isDarkMode ? 'border-slate-600' : 'border-slate-200'}`}
                />
              </div>
              {expenseAmtValue && cur.code !== 'KRW' && !expenseAmtIsKrw && (
                <p className={`text-[10px] font-bold text-center mb-4 ${textMuted}`}>≈ ₩{krwPreview.toLocaleString()} (자동 환산)</p>
              )}
              <div className="flex gap-2 mt-4">
                <button onClick={closeModal} className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${isDarkMode ? 'border-slate-600 text-slate-400 hover:bg-slate-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>취소</button>
                <button onClick={saveAmt} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 active:scale-95 transition-all">확인</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 기본지출 추가 모달 */}
      {isBasicExpAddOpen && (() => {
        const globalCur = (() => {
          const c = globalPlanCountry && globalPlanCountry !== '수동입력' ? globalPlanCountry : globalManualCountry;
          if (c === '한국') return { code: 'KRW', sym: '₩' };
          if (c === '일본') return { code: 'JPY', sym: '¥' };
          if (c === '중국') return { code: 'CNY', sym: '元' };
          if (['프랑스','이탈리아','스페인','독일'].includes(c)) return { code: 'EUR', sym: '€' };
          if (c === '영국') return { code: 'GBP', sym: '£' };
          if (c === '태국') return { code: 'THB', sym: '฿' };
          if (c === '베트남') return { code: 'VND', sym: '₫' };
          if (c === '대만') return { code: 'TWD', sym: 'NT$' };
          if (c === '호주') return { code: 'AUD', sym: 'A$' };
          return { code: 'USD', sym: '$' };
        })();
        const activeSym = basicExpAddIsKrw ? '₩' : globalCur.sym;
        const toKrwAdd = (amt) => {
          if (!amt || isNaN(Number(amt))) return 0;
          if (basicExpAddIsKrw) return Number(amt);
          const r = rates && rates['KRW'] && rates[globalCur.code] ? (rates['KRW'] / rates[globalCur.code]) : 1350;
          return Math.round(Number(amt) * r);
        };
        const cats = ['항공권', '숙소', '교통', '투어', '기타'];
        const closeAdd = () => { setIsBasicExpAddOpen(false); setBasicExpAddName(''); setBasicExpAddAmt(''); setBasicExpAddCat('기타'); setBasicExpAddIsKrw(false); };
        const saveAdd = () => {
          if (!basicExpAddName.trim() || !basicExpAddAmt) { showToast("항목명과 금액을 입력하세요."); return; }
          const krwAmt = toKrwAdd(basicExpAddAmt);
          const localAmt = basicExpAddIsKrw ? '' : basicExpAddAmt;
          const newId = 'basic-exp-' + Date.now();
          // planTimeline에 저장 (시간 없이, 일정 하단에 표시)
          const newPlan = {
            id: newId, day: basicExpAddDay, time: '99:99', // 시간 없이 맨 하단 정렬용
            place: basicExpAddName.trim(), localName: '', features: basicExpAddCat,
            photo: '', photos: [], country: S(globalPlanCountry), region: S(globalPlanRegion),
            isAccommodation: false, isTransport: false, theme: basicExpAddCat,
            expenseLocal: localAmt, expenseKrw: String(krwAmt),
            sym: basicExpAddIsKrw ? '₩' : globalCur.sym, isBasicExp: true
          };
          const updatedTimeline = [...(Array.isArray(planTimeline) ? planTimeline : []), newPlan];
          setPlanTimeline(updatedTimeline);
          saveToDb({ plan_timeline: updatedTimeline });
          showToast("기본지출이 추가되었습니다!");
          closeAdd();
        };
        return (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[10001] flex items-center justify-center p-4" onClick={closeAdd}>
            <div className={`${cardBg} p-6 rounded-3xl w-full max-w-xs shadow-2xl animate-in zoom-in-95 duration-200`} onClick={e => e.stopPropagation()}>
              <div className={`flex justify-between items-center mb-4 border-b pb-3 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                <h3 className={`font-black text-sm flex items-center gap-1.5 ${textMain}`}><ClipboardList className="w-4 h-4" /> 기본지출 추가</h3>
                <button onClick={closeAdd} className="text-slate-400 hover:text-slate-600 text-lg"><X className="w-[1em] h-[1em] inline" /></button>
              </div>
              <div className="space-y-3">
                {/* Day 선택 버튼 */}
                <div>
                  <label className={`text-[9px] font-bold ${textMuted} mb-1 block`}>Day 선택</label>
                  <div className={`grid gap-1 p-1 rounded-lg border ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`} style={{gridTemplateColumns: `repeat(${Math.min(tripDays.length, 4)}, minmax(0, 1fr))`}}>
                    {tripDays.map(d => (
                      <button key={d} onClick={() => setBasicExpAddDay(d)} className={`py-1.5 text-[10px] font-bold rounded transition-all duration-200 ${basicExpAddDay === d ? 'bg-indigo-600 text-white shadow-md' : (isDarkMode ? 'text-slate-400 hover:bg-slate-600' : 'text-slate-400 hover:bg-slate-100')}`}>D{d}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={`text-[9px] font-bold ${textMuted} mb-1 block`}>항목명</label>
                  <input type="text" value={basicExpAddName} onChange={e => setBasicExpAddName(e.target.value)} placeholder="예: 편의점, 택시" autoFocus className={`w-full border rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 ${inputBg} ${isDarkMode ? 'border-slate-600' : 'border-slate-200'}`} />
                </div>
                <div>
                  <label className={`text-[9px] font-bold ${textMuted} mb-1 block`}>카테고리</label>
                  <select value={basicExpAddCat} onChange={e => setBasicExpAddCat(e.target.value)} className={`w-full border rounded-xl p-3 text-xs font-bold outline-none ${inputBg} ${isDarkMode ? 'border-slate-600' : 'border-slate-200'}`}>
                    {cats.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`text-[9px] font-bold ${textMuted} mb-1 block`}>금액</label>
                  <div className="flex items-center gap-2">
                    {globalCur.code !== 'KRW' ? (
                      <button onClick={() => { setBasicExpAddIsKrw(p => !p); setBasicExpAddAmt(''); }} className={`text-sm font-black px-2 py-1 rounded-lg border transition-all active:scale-95 ${basicExpAddIsKrw ? (isDarkMode ? 'bg-indigo-900 border-indigo-600 text-indigo-300' : 'bg-indigo-50 border-indigo-300 text-indigo-600') : (isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600')}`}>{activeSym}</button>
                    ) : (
                      <span className={`text-sm font-black ${textMuted}`}>₩</span>
                    )}
                    <input type="text" inputMode="numeric" value={basicExpAddAmt ? Number(basicExpAddAmt).toLocaleString() : ''} onChange={e => { const raw = e.target.value.replace(/,/g, ''); if (raw === '' || /^\d*$/.test(raw)) setBasicExpAddAmt(raw); }} onKeyDown={e => e.key === 'Enter' && saveAdd()} placeholder="0" className={`flex-1 min-w-0 border rounded-xl p-3 text-lg font-black outline-none focus:ring-2 focus:ring-indigo-500 ${inputBg} ${isDarkMode ? 'border-slate-600' : 'border-slate-200'}`} />
                  </div>
                  {basicExpAddAmt && globalCur.code !== 'KRW' && !basicExpAddIsKrw && (
                    <p className={`text-[10px] font-bold text-center mt-1 ${textMuted}`}>≈ ₩{toKrwAdd(basicExpAddAmt).toLocaleString()} (자동 환산)</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={closeAdd} className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${isDarkMode ? 'border-slate-600 text-slate-400 hover:bg-slate-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>취소</button>
                <button onClick={saveAdd} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 active:scale-95 transition-all">추가</button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
};

export default ExpenseModal;
