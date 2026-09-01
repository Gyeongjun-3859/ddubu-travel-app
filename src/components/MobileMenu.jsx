import React from 'react';
import { X, Plane, MapPin, Handshake, LogOut, Trash2, Camera, FolderOpen, Pencil, Mail, Undo2, Redo2, Settings } from 'lucide-react';
import { S } from '../utils/helpers';

const MobileMenu = ({
  isOpen, onClose, isDarkMode, appUserId,
  trips, setTrips, activeTripId, travelStartDate, planTimeline, maxDay,
  handleSwitchTrip, setActiveTab, setTripToDelete, showConfirm,
  globalPlanCountry, globalManualCountry, supabaseClient, showToast,
  activeTab, openAddTripModal, openRenameTripModal,
  pendingInvite, handleAcceptInvite, handleRejectInvite,
  handleUndo, handleRedo, historyIndex, history,
  setIsSettingsOpen, handleLogout,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[9500] flex transition-opacity duration-300" onClick={onClose}>
      <div className={`w-64 h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300 ${isDarkMode ? 'bg-slate-900 border-r border-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
        <div className={`p-5 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'} flex items-center justify-between`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-xl">🐱</div>
            <div className="flex flex-col">
              <span className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{appUserId === 'Guest' ? '게스트' : appUserId}</span>
              <span className="text-[10px] text-slate-500 font-bold">환영합니다!</span>
            </div>
          </div>
          <button onClick={onClose} className={`text-xl transition-colors hover:text-rose-500 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}><X className="w-[1em] h-[1em] inline" /></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          <div>
<h3 className={`text-xs font-black mb-3 px-1 flex items-center gap-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>지금 여행중 <Plane className="w-3 h-3" /> <span className="ml-2 inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span></h3>
              <div className="space-y-1.5">
                {trips.filter(t => !t.archived).map(t => {
                  // [고도화된 여행 완료 자동 감지 로직]
                  const isActive = activeTripId === t.id;
                  let isTimeFinished = false;

                  if (isActive && travelStartDate) {
                    const safePlans = Array.isArray(planTimeline) ? planTimeline.filter(p => p && !p.isAccommodation) : [];
                    const lastDay = safePlans.length > 0 ? Math.max(...safePlans.map(p => parseInt(p.day || 1))) : maxDay;
                    const lastTime = safePlans.filter(p => parseInt(p.day) === lastDay).sort((a,b) => S(b.time).localeCompare(S(a.time)))[0]?.time || "23:59";

                    const endDate = new Date(travelStartDate);
                    endDate.setDate(endDate.getDate() + (lastDay - 1));
                    const [hh, mm] = lastTime.split(':');
                    endDate.setHours(parseInt(hh), parseInt(mm), 0);

                    if (endDate < new Date()) isTimeFinished = true;
                  }

return (
                    <div key={t.id} className="group relative">
                      <button
                        onClick={() => {
                          handleSwitchTrip(t.id); // 1. 여행 데이터 교체
                          setActiveTab('dashboard'); // 2. 보관함에서 대시보드로 화면 전환
                          onClose(); // 3. 모바일 사이드바 닫기
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-between border-2 ${
                          isActive
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg transform scale-[1.03] z-10'
                            : (isDarkMode
                                ? 'bg-slate-800 text-slate-300 border-transparent hover:bg-slate-700'
                                : 'bg-white text-slate-600 border-slate-100 shadow-sm hover:border-indigo-200 hover:bg-indigo-50/30')
                        }`}
                      >
                        <span className="truncate flex items-center pr-8">
                          {t.isShared ? <Handshake className="w-3 h-3 mr-1.5 flex-shrink-0" /> : <MapPin className="w-3 h-3 mr-1.5 flex-shrink-0" />}
                          {S(t.name)}
                        </span>

                        {/* 삭제/나가기 버튼 강조 및 위치 고정 */}
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setTripToDelete(t.id);
                          }}
                          className={`absolute right-3 px-1 py-1 rounded-md transition-all duration-200 ${
                            isActive
                              ? 'text-indigo-200 hover:text-white hover:bg-indigo-500'
                              : 'text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          {t.isShared ? <LogOut className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </span>
                      </button>

                      {/* 스마트 완료 버튼: 시간이 지났을 때만 노출 */}
                      {isTimeFinished && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            showConfirm("정말 이 여행을 완료하시겠습니까?\n완료된 여행은 '소중한 여행기록'으로 이동합니다.", async () => {
                              const finishDate = new Date().toISOString();
                              const finalCountry = S((globalPlanCountry === '수동입력') ? globalManualCountry : globalPlanCountry);
                              const newTrips = trips.map(item => item.id === t.id ? { ...item, archived: true, finishDate: finishDate, country: finalCountry } : item);
                              setTrips(newTrips);
                              if(supabaseClient && appUserId !== "Guest") {
                                await supabaseClient.from('profiles').update({ trips: newTrips }).eq('app_user_id', appUserId);
                                await supabaseClient.from('travel_state').update({ archived: true, finish_date: finishDate, shared_users: [] }).eq('id', t.id);
                              }
                              // [보관함 자동 전환] 방금 완료 처리한 여행이 활성 여행이었다면, 보관함(완료된) 여행이
                              // 계속 활성 상태로 남아있지 않도록 다른 진행 중인 여행으로 자동 전환한다.
                              if (t.id === activeTripId) {
                                const nextActive = newTrips.find(item => item && !item.archived);
                                if (nextActive) handleSwitchTrip(nextActive.id);
                              }
                              showToast("축하합니다! 성공적으로 여행을 마쳤습니다. 🏁");
                              setActiveTab('archive');
                            });
                          }}
                          className="w-full mt-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] py-1.5 rounded-lg font-black shadow-lg transition-all animate-in slide-in-from-top-1"
                        >
                          🏁 여행 완료 (기록 보관하기)
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 pt-4 border-t border-dashed border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => { setActiveTab('archive'); onClose(); }}
                  className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl text-xs font-black transition-all duration-300 active:scale-95 ${activeTab === 'archive' ? 'bg-indigo-600 text-white shadow-xl' : 'bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 border border-indigo-100 shadow-sm'}`}
                >
                  <div className="flex items-center">
                    <Camera className="w-5 h-5 mr-2" />
                    <span>소중한 여행기록</span>
                  </div>
                  <FolderOpen className="w-4 h-4 opacity-50" />
                </button>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
               <button onClick={openAddTripModal} className={`py-2 rounded-lg text-[10px] font-bold border border-dashed transition-all duration-300 ${isDarkMode ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-300 text-slate-500 hover:bg-slate-50 active:scale-95'}`}>+ 새 여행</button>
               <button onClick={openRenameTripModal} className={`py-2 rounded-lg text-[10px] font-bold border border-dashed transition-all duration-300 flex items-center justify-center gap-1 ${isDarkMode ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-300 text-slate-500 hover:bg-slate-50 active:scale-95'}`}><Pencil className="w-3 h-3" /> 이름 변경</button>
            </div>
          </div>

          {pendingInvite && (
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 animate-in fade-in duration-300">
              <h3 className="text-[10px] font-black text-indigo-600 mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> 새 초대장 도착!</h3>
              <p className="text-[9px] text-indigo-500 mb-2 truncate">From: {S(pendingInvite.from_id)}</p>
              <div className="flex space-x-1.5">
                <button onClick={handleAcceptInvite} className="flex-1 bg-indigo-600 text-white py-1.5 rounded text-[10px] font-bold shadow-sm hover:bg-indigo-700 transition-colors">수락</button>
                <button onClick={handleRejectInvite} className="flex-1 bg-white text-slate-600 py-1.5 rounded text-[10px] font-bold shadow-sm border hover:bg-slate-50 transition-colors">거절</button>
              </div>
            </div>
          )}
        </div>

        <div className={`p-4 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'} space-y-2`}>
          <div className="flex space-x-2 mb-2">
             <button onClick={handleUndo} disabled={historyIndex <= 0} className={`flex-1 flex items-center justify-center py-2 rounded-xl text-xs font-bold transition-all duration-300 ${historyIndex <= 0 ? 'opacity-30 cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 active:scale-95'}`}>
                <Undo2 className="w-3.5 h-3.5 mr-1" /> 슝
             </button>
             <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className={`flex-1 flex items-center justify-center py-2 rounded-xl text-xs font-bold transition-all duration-300 ${historyIndex >= history.length - 1 ? 'opacity-30 cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800' : 'bg-rose-100 text-rose-600 hover:bg-rose-200 dark:bg-rose-900/50 dark:text-rose-300 active:scale-95'}`}>
                뽕 <Redo2 className="w-3.5 h-3.5 ml-1" />
             </button>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(true); }} className={`w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 active:scale-95 ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            <Settings className="w-3.5 h-3.5" /><span>환경 설정</span>
          </button>
          <button onClick={handleLogout} className={`w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 border border-dashed active:scale-95 ${isDarkMode ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-300 text-slate-500 hover:bg-slate-50'}`}>
            <LogOut className="w-3.5 h-3.5" /><span>로그아웃</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
