import React from 'react';
import { Trash2 } from 'lucide-react';
import { S } from '../utils/helpers';

const PlanDetailModal = ({
  selectedPlanInfo, setSelectedPlanInfo, cardBg, isDarkMode, openPhotoViewer, handleCopyLocalName,
  planTimeline, setPlanTimeline, saveToDb,
  isSettleMode, setIsSettleMode, settleLocal, setSettleLocal, settleKrw, setSettleKrw,
  isDiaryOpen, setIsDiaryOpen, diaryReview, setDiaryReview, diaryRating, setDiaryRating,
  currentRestaurants, setCurrentRestaurants, showToast, rates,
}) => {
  if (!selectedPlanInfo) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[8000] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-300" onClick={() => setSelectedPlanInfo(null)}>
      <div className={`${cardBg} w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300`} onClick={e => e.stopPropagation()}>
        {selectedPlanInfo.photo && (
          <div className="w-full h-48 relative cursor-pointer" onClick={() => openPhotoViewer(selectedPlanInfo.photos && selectedPlanInfo.photos.length > 0 ? selectedPlanInfo.photos : [selectedPlanInfo.photo])}>
            <img src={selectedPlanInfo.photo} className="w-full h-full object-cover" alt="" />
            {selectedPlanInfo.time && selectedPlanInfo.time !== '99:99' && (
              <div className="absolute top-3 left-3 bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded shadow-md">
                {S(selectedPlanInfo.time)}
              </div>
            )}
            {selectedPlanInfo.photos && selectedPlanInfo.photos.length > 1 && (
              <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md">📷 {selectedPlanInfo.photos.length}</div>
            )}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
              <span className="opacity-0 hover:opacity-100 text-white text-xs font-bold bg-black/50 px-3 py-1 rounded-full transition-opacity duration-200">🔍 크게 보기</span>
            </div>
          </div>
        )}
        <div className="p-5 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 leading-tight">
               {S(selectedPlanInfo.place)} {selectedPlanInfo.isAccommodation ? '🏠' : ''}
            </h3>
            {/* 사진 없을 때만 우측에 시간 뱃지 표시 (사진 있을 때는 사진 위 좌측에 이미 표시됨) */}
            {!selectedPlanInfo.photo && selectedPlanInfo.time && selectedPlanInfo.time !== '99:99' && (
              <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-2 py-1 rounded shadow-sm shrink-0 whitespace-nowrap ml-2">{S(selectedPlanInfo.time)}</span>
            )}
          </div>

          {/* 렌터카 대여/반납: 장소 복사 */}
          {(selectedPlanInfo.id === 'trans_rental_dep' || selectedPlanInfo.id === 'trans_rental_arr') && selectedPlanInfo.rentalMeta ? (() => {
            const meta = selectedPlanInfo.rentalMeta;
            const isDep = selectedPlanInfo.id === 'trans_rental_dep';
            const mainPlace = isDep ? meta.depPlace : meta.arrPlace;
            const subPlace = isDep ? meta.arrPlace : meta.depPlace;
            const mainLabel = isDep ? '🚗 대여장소' : '🏁 반납장소';
            const subLabel = isDep ? '🏁 반납장소' : '🚗 대여장소';
            return (
              <div className="flex flex-col gap-1.5 mb-3">
                {mainPlace && (
                  <div className="flex items-center text-sm font-bold text-indigo-500 cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => handleCopyLocalName(e, mainPlace)}>
                    <span className="mr-2">{mainLabel}: {mainPlace}</span>
                    <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/50 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800 shrink-0">복사</span>
                  </div>
                )}
                {subPlace && (
                  <div className="flex items-center text-xs font-bold text-slate-400 cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => handleCopyLocalName(e, subPlace)}>
                    <span className="mr-2">{subLabel}: {subPlace}</span>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-600 shrink-0">복사</span>
                  </div>
                )}
                {meta.carType && <p className="text-xs text-slate-500 font-bold">🚙 {meta.carType}</p>}
                {meta.company && <p className="text-xs text-slate-400 font-bold">🏢 {meta.company}</p>}
              </div>
            );
          })() : selectedPlanInfo.localName && (
            <div className="flex items-center text-sm font-bold text-indigo-500 mb-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => handleCopyLocalName(e, selectedPlanInfo.localName)}>
              <span className="mr-2">📍 {S(selectedPlanInfo.localName)}</span>
              <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/50 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800">복사</span>
            </div>
          )}

<div className="flex justify-between items-center mt-3 mb-1">
          <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">📝 기록된 메모</span>
          <div className="flex space-x-1.5">
            {/* [삭제 버튼] 입력된 금액이 있을 때만 삭제 버튼 노출 */}
            {selectedPlanInfo.expenseLocal && !isSettleMode && (
               <button onClick={() => {
                 const updated = planTimeline.map(p => String(p.id) === String(selectedPlanInfo.id) ? { ...p, expenseLocal: "", expenseKrw: "" } : p);
                 setPlanTimeline(updated); saveToDb({ plan_timeline: updated });
                 setSelectedPlanInfo({ ...selectedPlanInfo, expenseLocal: "", expenseKrw: "" });
                 showToast("정산 내역이 삭제되었습니다.");
               }} className="bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 px-2 py-1 rounded-md text-[9px] font-bold hover:text-rose-500 transition-all active:scale-95 inline-flex items-center gap-1"><Trash2 className="w-3 h-3" /> 삭제</button>
            )}
<button onClick={() => {
              setIsSettleMode(!isSettleMode);
              setSettleLocal(selectedPlanInfo.expenseLocal || "");
              setSettleKrw(selectedPlanInfo.expenseKrw || "");
              setIsDiaryOpen(false); // 정산 열 때 일기는 닫기
            }} className="bg-rose-50 text-rose-500 border border-rose-200 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-400 px-2 py-1 rounded-md text-[9px] font-bold shadow-sm hover:bg-rose-100 transition-all active:scale-95">
              {isSettleMode ? '취소' : '💸 정산'}
            </button>
            <button onClick={() => {
              if (isDiaryOpen) {
                // 닫을 때 현재 작성 중인 내용 자동 저장
                const safeReviewText = diaryReview ? String(diaryReview).trim() : "";
                const updatedTimeline = (planTimeline || []).map(p =>
                  String(p.id) === String(selectedPlanInfo.id)
                    ? { ...p, rating: Number(diaryRating) || 0, review: safeReviewText }
                    : p
                );
                const updatedRests = (currentRestaurants || []).map(r =>
                  S(r.name).trim() === S(selectedPlanInfo.place).trim()
                    ? { ...r, rating: Number(diaryRating) || 0, review: safeReviewText }
                    : r
                );
                setPlanTimeline(updatedTimeline);
                setCurrentRestaurants(updatedRests);
                setSelectedPlanInfo(prev => ({ ...prev, rating: diaryRating, review: safeReviewText }));
                saveToDb({ plan_timeline: updatedTimeline, current_restaurants: updatedRests });
                setIsDiaryOpen(false);
              } else {
                // 열 때 state 초기화 후 현재 일정 값 로드
                setDiaryRating(0);
                setDiaryReview("");
                setDiaryRating(selectedPlanInfo.rating || 0);
                setDiaryReview(selectedPlanInfo.review || "");
                setIsSettleMode(false);
                setIsDiaryOpen(true);
              }
            }} className={`px-2 py-1 rounded-md text-[9px] font-bold shadow-sm transition-all active:scale-95 border ${isDiaryOpen ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>
              {isDiaryOpen ? '닫기' : '📝 일기'}
            </button>
          </div>
        </div>

        {/* 메모 영역 (정산/일기창이 모두 닫혀있을 때만 표시) */}
        {!isSettleMode && !isDiaryOpen && (
          <div className="animate-in fade-in duration-300">
            {selectedPlanInfo.features ? (
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">{S(selectedPlanInfo.features)}</p>
            ) : (
              <p className="text-sm text-slate-400 italic">기록된 메모가 없습니다.</p>
            )}
            {/* [추가] 저장된 별점이 있다면 표시 */}
            {selectedPlanInfo.rating > 0 && (
              <div className="mt-2 flex items-center space-x-1 px-1">
                <span className="text-yellow-400">⭐</span>
                <span className="text-xs font-black text-slate-700 dark:text-slate-300">{selectedPlanInfo.rating}점</span>
                {selectedPlanInfo.review && <span className="text-[10px] text-slate-400 truncate ml-2">"{selectedPlanInfo.review}"</span>}
              </div>
            )}
          </div>
        )}

        {/* --- 여행일기 작성 영역 --- */}
        {isDiaryOpen && (
          <div className={`mt-3 p-3 rounded-xl border shadow-inner animate-in slide-in-from-top-2 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-indigo-50/30 border-indigo-100'}`}>
            <div className="flex flex-col space-y-3">
              {/* 0.5점 단위 별점 UI (스와이프/드래그 지원) */}
              <div className="flex flex-col space-y-1">
                <label className="text-[9px] font-black text-indigo-500">이 장소는 어땠나요? ✨</label>
                <div className="flex items-center">
                  <div
                    className="flex items-center space-x-1.5 cursor-pointer touch-none"
                    style={{ touchAction: 'none' }}
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      const rect = e.currentTarget.getBoundingClientRect();
                      let x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                      setDiaryRating(Math.round((x / rect.width) * 10) / 2);
                    }}
                    onPointerMove={(e) => {
                      if (e.buttons !== 1) return; // 클릭/터치 유지 상태일 때만 작동
                      const rect = e.currentTarget.getBoundingClientRect();
                      let x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                      setDiaryRating(Math.round((x / rect.width) * 10) / 2);
                    }}
                    onPointerUp={(e) => e.currentTarget.releasePointerCapture(e.pointerId)}
                    onPointerCancel={(e) => e.currentTarget.releasePointerCapture(e.pointerId)}
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <div key={num} className="relative w-7 h-7 pointer-events-none">
                        {/* 회색 배경 별 */}
                        <svg className={`w-7 h-7 ${isDarkMode ? 'text-slate-700' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                        </svg>
                        {/* 노란색 채우기 별 (조건부 폭 조절) */}
                        <div className="absolute top-0 left-0 h-full overflow-hidden"
                             style={{ width: diaryRating >= num ? '100%' : (diaryRating >= num - 0.5 ? '50%' : '0%') }}>
                          <svg className="w-7 h-7 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                  <span className="ml-3 text-sm font-black text-indigo-600 w-8 text-right">{diaryRating}점</span>
                </div>
              </div>
              {/* 소감 입력창 */}
              <textarea
                placeholder="여행의 소중한 기억을 한 줄로 남겨보세요!"
                value={diaryReview}
                onChange={e => setDiaryReview(e.target.value)}
                className={`w-full p-2.5 text-xs font-bold rounded-lg border outline-none h-20 resize-none transition-all ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-indigo-200 focus:border-indigo-500 shadow-sm'}`}
              />
              <button onClick={() => {
// 1. 일정(Timeline) 데이터 업데이트
                // [버그 수정 1] 여행 소감(review) 텍스트 명시적 문자열 캐싱 및 DB Payload 누락 방지
                const safeReviewText = diaryReview ? String(diaryReview).trim() : "";

                const updatedTimeline = (planTimeline || []).map(p =>
                  String(p.id) === String(selectedPlanInfo.id)
                    ? { ...p, rating: Number(diaryRating) || 0, review: safeReviewText }
                    : p
                );

                // 2. 장소(Pins) 데이터 업데이트 (장소명이 일치하는 경우 연동)
                const updatedRests = (currentRestaurants || []).map(r =>
                  S(r.name).trim() === S(selectedPlanInfo.place).trim()
                    ? { ...r, rating: Number(diaryRating) || 0, review: safeReviewText }
                    : r
                );

                // 3. 리액트 상태 즉시 반영
                setPlanTimeline(updatedTimeline);
                setCurrentRestaurants(updatedRests);

                // 4. 현재 열려있는 상세 모달 정보도 즉시 갱신
                setSelectedPlanInfo(prev => ({ ...prev, rating: diaryRating, review: diaryReview }));

                // 5. DB 저장 (배열 내부 데이터이므로 배열 전체를 전달)
                saveToDb({
                  plan_timeline: updatedTimeline,
                  current_restaurants: updatedRests
                });

                setIsDiaryOpen(false);
                showToast("기록이 소중하게 저장되었습니다! 📝");
              }} className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-black text-xs shadow-md hover:bg-indigo-700 active:scale-95 transition-all">
                일기 저장하기 ✨
              </button>
            </div>
          </div>
        )}

        {isSettleMode ? (
          <div className={`mt-3 p-3 rounded-xl border shadow-inner animate-in slide-in-from-top-2 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex space-x-2 mb-2">
             <div className="flex-1 min-w-0">
                <label className="text-[9px] font-bold text-slate-500 mb-1 flex justify-between"><span>현지 지출액</span><span className="text-indigo-400 font-black">자동환전 ✨</span></label>
                <input type="text" inputMode="numeric" placeholder="금액 입력" value={settleLocal ? Number(settleLocal).toLocaleString() : ''} onChange={e => {
                  const raw = e.target.value.replace(/,/g, '');
                  if (raw !== '' && !/^\d*$/.test(raw)) return;
                  setSettleLocal(raw);
                  if(raw && !isNaN(raw)) {
                    let curCode = 'USD';
                    const c = selectedPlanInfo.country;
                    if (c === '한국') curCode = 'KRW';
                    else if (c === '일본') curCode = 'JPY';
                    else if (['프랑스', '이탈리아', '스페인', '독일'].includes(c)) curCode = 'EUR';
                    else if (c === '중국') curCode = 'CNY';
                    else if (c === '영국') curCode = 'GBP';
                    else if (c === '호주') curCode = 'AUD';

                    const rate = rates[curCode] || 1;
                    const krwRate = rates['KRW'] || 1350;
                    const krwVal = raw * (krwRate / rate);
                    setSettleKrw(Math.round(krwVal));
                  } else { setSettleKrw(""); }
                }} className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2 text-xs font-bold rounded-md outline-none focus:border-rose-400" />
              </div>
              <div className="flex-1 min-w-0">
                <label className="text-[9px] font-bold text-slate-500 mb-1 block">원화 환산액(₩)</label>
                <input type="text" inputMode="numeric" placeholder="자동계산" value={settleKrw ? Number(settleKrw).toLocaleString() : ''} onChange={e => { const raw = e.target.value.replace(/,/g, ''); if (raw === '' || /^\d*$/.test(raw)) setSettleKrw(raw); }} className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2 text-xs font-bold rounded-md outline-none focus:border-rose-400" />
              </div>
            </div>
            <button onClick={() => {
              const updatedTimeline = planTimeline.map(p => String(p.id) === String(selectedPlanInfo.id) ? { ...p, expenseLocal: settleLocal, expenseKrw: settleKrw } : p);
              setPlanTimeline(updatedTimeline);
              console.log("💸 [DB 저장] 정산 업데이트 데이터:", { plan_timeline: updatedTimeline });
              saveToDb({ plan_timeline: updatedTimeline });
              setSelectedPlanInfo({ ...selectedPlanInfo, expenseLocal: settleLocal, expenseKrw: settleKrw });
              setIsSettleMode(false);
              showToast("정산 금액이 완벽하게 저장되었습니다! 💸");
            }} className="w-full bg-rose-500 text-white py-2 rounded-md text-xs font-bold shadow-sm hover:bg-rose-600 transition-colors active:scale-95">저장하기</button>
          </div>
        ) : (
          (selectedPlanInfo.expenseLocal || selectedPlanInfo.expenseKrw) && (
            /* [통합 지출 카드] 지출 내역과 메모 중복을 하나로 합쳤습니다 */
            <div className={`mt-3 p-3 rounded-xl border animate-in fade-in ${isDarkMode ? 'bg-rose-900/20 border-rose-800' : 'bg-rose-50 border-rose-100'}`}>
              <h4 className="text-[11px] font-black text-rose-500 mb-1.5 flex justify-between items-center">
                <span>💸 지출 내역</span>
                {selectedPlanInfo.theme && <span className="text-[9px] bg-rose-100 text-rose-600 dark:bg-rose-800 dark:text-rose-300 px-1.5 py-0.5 rounded shadow-sm">{selectedPlanInfo.theme}</span>}
              </h4>
              <div className="flex justify-between items-center text-xs font-bold text-rose-600 dark:text-rose-400">
                <span>현지: {(() => {
                    const c = selectedPlanInfo.country;
                    let sym = '$';
                    if (c === '한국') sym = '₩';
                    else if (c === '일본' || c === '중국') sym = '¥';
                    else if (['프랑스','이탈리아','스페인','독일'].includes(c)) sym = '€';
                    else if (c === '영국') sym = '£';
                    return `${sym}${Number(selectedPlanInfo.expenseLocal).toLocaleString()}`;
                })()}</span>
                <span>원화: ₩{Number(selectedPlanInfo.expenseKrw).toLocaleString()}</span>
              </div>
            </div>
          )
        )}

          <button onClick={() => setSelectedPlanInfo(null)} className="mt-5 w-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-3 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-300">닫기</button>
        </div>
      </div>
    </div>
  );
};

export default PlanDetailModal;
