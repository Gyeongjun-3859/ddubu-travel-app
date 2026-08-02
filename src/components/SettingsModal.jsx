import React from 'react';
import { X, Settings, MapPin } from 'lucide-react';

const SettingsModal = ({
  isOpen, onClose, cardBg, isDarkMode, textMain, textMuted, inputBg,
  appTheme, handleThemeChange,
  myLocationIcon, setMyLocationIcon,
  appFont, setAppFont,
  appTextColor, setAppTextColor,
  fontScale, handleFontScaleChange, elementScale, handleElementScaleChange,
  appUserId, isMigratingPhotos, handleMigratePhotosToStorage,
  inviteIdInput, setInviteIdInput, handleSendInvite,
  sharedUsers, isTripOwner,
  kickUserTarget, setKickUserTarget,
  supabaseClient, activeTripId, setSharedUsers, showToast,
}) => {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-300" onClick={onClose}>
           <div className={`${cardBg} p-6 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300`} onClick={e => e.stopPropagation()}>
              <div className={`flex justify-between items-center mb-5 border-b pb-3 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                 <h3 className={`font-black text-sm flex items-center gap-1.5 ${textMain}`}><Settings className="w-4 h-4" /> 환경 설정</h3>
                 <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg transition-colors"><X className="w-[1em] h-[1em] inline" /></button>
              </div>

              <div className="space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar pr-2">
                 <div className="flex flex-col space-y-2">
                    <label className={`text-xs font-bold ${textMuted}`}>앱 테마 설정</label>
                    <div className="flex space-x-2">
                       <button onClick={() => handleThemeChange('light')} className={`flex-1 py-2 text-xs font-bold border rounded-lg transition-all duration-300 ${appTheme === 'light' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>기본(Light)</button>
                       <button onClick={() => handleThemeChange('dark')} className={`flex-1 py-2 text-xs font-bold border rounded-lg transition-all duration-300 ${appTheme === 'dark' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}>다크 모드</button>
                       <button onClick={() => handleThemeChange('pastel')} className={`flex-1 py-2 text-xs font-bold border rounded-lg transition-all duration-300 ${appTheme === 'pastel' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100'}`}>파스텔</button>
                    </div>
                 </div>

                 {/* [NEW] 내 위치 캐릭터 아이콘 설정 */}
                 <div className="flex flex-col space-y-2 mt-3 mb-4">
                    <label className={`text-xs font-bold flex items-center gap-1 ${textMuted}`}><MapPin className="w-3.5 h-3.5" /> 내 위치 캐릭터 설정</label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 px-1 pb-1 box-border">
                       {['🚶‍♂️', '🏃‍♀️', '👶', '🚗', '🐎', '🐶', '🐱'].map(icon => (
                          <button key={icon} onClick={() => { setMyLocationIcon(icon); try{localStorage.setItem('my_travel_loc_icon', icon)}catch(e){} }} className={`py-1.5 text-xl rounded-lg transition-all duration-300 border shadow-sm ${myLocationIcon === icon ? 'bg-indigo-100 border-indigo-500 scale-110 z-10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:scale-105'}`}>
                             {icon}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="flex flex-col space-y-2 mt-3">
                    <label className={`text-xs font-bold ${textMuted}`}>폰트 (글꼴) 설정</label>
                    <select value={appFont} onChange={e => { setAppFont(e.target.value); try{localStorage.setItem('my_travel_font', e.target.value)}catch(err){} }} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'} p-2 text-xs font-bold outline-none rounded-lg cursor-pointer transition-colors duration-300`}>
                       <option value="'Pretendard', -apple-system, sans-serif">Pretendard (기본/Mac 추천)</option>
                       <option value="'Malgun Gothic', '맑은 고딕', sans-serif">맑은 고딕 (Windows 기본)</option>
                       <option value="'Noto Sans KR', sans-serif">Noto Sans KR (깔끔한 고딕)</option>
                       <option value="'Nanum Gothic', sans-serif">나눔고딕 (둥근 고딕)</option>
                    </select>
                  </div>

                  {/* [NEW] 앱 글자 색상 설정 UI 수정 */}
                  <div className="flex flex-col space-y-2 mt-3">
                    <label className={`text-xs font-bold ${textMuted}`}>앱 글자 색상 설정</label>
                    <div className="grid grid-cols-2 gap-2">
                       {[
                         { id: 'original', label: '초기 테마 (파랑/회색 혼합)' },
                         { id: 'default', label: '기본 (다크/라이트 자동)', color: isDarkMode ? '#e2e8f0' : '#1e293b', weight: 'font-semibold' },
                         { id: 'high-contrast', label: '고대비 (선명함)', color: isDarkMode ? '#ffffff' : '#000000', weight: 'font-black' },
                         { id: 'monochrome', label: '단색 (부드러움)', color: isDarkMode ? '#94a3b8' : '#64748b', weight: 'font-medium' }
                       ].map(item => (
                         <button key={item.id} onClick={() => { setAppTextColor(item.id); localStorage.setItem('my_travel_text_color', item.id); }} className={`flex items-center space-x-2 p-2 rounded-lg border-2 text-[10px] font-bold transition-all ${appTextColor === item.id ? 'border-indigo-500 bg-indigo-50/20 shadow-inner' : 'border-slate-100 dark:border-slate-700'}`}>
                           {item.id === 'original' ? (
                             <div className="w-6 h-6 rounded-full border border-slate-300 flex-shrink-0" style={{ background: 'linear-gradient(45deg, #4f46e5, #64748b)' }}></div>
                           ) : (
                             <div className={`w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
                               <span className={item.weight} style={{ color: item.color, fontSize: '10px' }}>Aa</span>
                             </div>
                           )}
                           <span>{item.label}</span>
                         </button>
                       ))}
                    </div>
                  </div>

                 <div className="flex flex-col space-y-2 pt-2">
                    <label className={`text-xs font-bold ${textMuted}`}>화면/글자 크기 (글꼴: {fontScale}, 요소: {elementScale})</label>
                    <input type="range" min="0.5" max="1.5" step="0.1" value={fontScale} onChange={handleFontScaleChange} className="w-full accent-indigo-600 transition-all duration-300" />
                    <input type="range" min="0.5" max="1.5" step="0.1" value={elementScale} onChange={handleElementScaleChange} className="w-full accent-indigo-600 mt-2 transition-all duration-300" />
                 </div>

                 {appUserId !== 'Guest' && (
                   <div className={`flex flex-col space-y-2 border-t pt-4 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                      <label className={`text-xs font-bold ${textMuted}`}>사진 최적화</label>
                      <p className={`text-[10px] ${textMuted}`}>예전에 등록한 사진들을 저장소로 옮겨서 여행 불러오는 속도를 빠르게 합니다. 한 번만 눌러주세요.</p>
                      <button onClick={handleMigratePhotosToStorage} disabled={isMigratingPhotos} className={`w-full py-2 rounded-lg text-xs font-bold shadow-sm transition-all duration-300 ${isMigratingPhotos ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'}`}>
                        {isMigratingPhotos ? '정리 중...' : '사진 최적화 실행'}
                      </button>
                   </div>
                 )}

                 <div className={`flex flex-col space-y-3 border-t pt-4 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                    <label className={`text-xs font-bold ${textMuted}`}>🤝 일정 공유 및 관리</label>
                    <div className="space-y-3 animate-in fade-in duration-300">
                       <div className="flex space-x-2">
                          <input type="text" value={inviteIdInput} onChange={e => setInviteIdInput(e.target.value)} placeholder="초대할 친구 아이디 입력" className={`flex-1 ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'} p-2 text-[11px] font-bold rounded-lg outline-none focus:border-indigo-500 transition-colors duration-300`} />
                          <button onClick={handleSendInvite} className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-[10px] font-bold shadow-md hover:bg-indigo-700 active:scale-95 transition-all duration-300 whitespace-nowrap">초대 발송</button>
                       </div>

                       <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                          <p className={`text-[10px] font-bold ${textMuted} mb-2`}>현재 이 일정을 함께 보는 사람</p>
                          <div className="flex flex-wrap gap-1.5">
                             <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 px-2 py-1 rounded text-[9px] font-bold shadow-sm">👑 나 ({appUserId})</span>
                             {sharedUsers.filter(u => u !== appUserId).map((user, idx) => (
                               <div key={idx} className="flex items-center bg-white text-slate-600 dark:bg-slate-700 dark:text-slate-300 border dark:border-slate-600 px-2 py-1 rounded shadow-sm">
                                 <span className="text-[9px] font-bold">👤 {user}</span>
                                 {isTripOwner && (
                                   <button onClick={() => setKickUserTarget(user)} className="ml-1.5 pl-1.5 border-l border-slate-200 dark:border-slate-500 text-rose-500 hover:text-rose-600 text-[9px] font-black transition-colors">강퇴</button>
                                 )}
                               </div>
                             ))}
                             {sharedUsers.filter(u => u !== appUserId).length === 0 && <span className="text-[9px] text-slate-400 py-1 pl-1">아직 참여 중인 친구가 없습니다.</span>}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
              <button onClick={onClose} className={`w-full mt-6 rounded-xl py-3 text-xs font-bold transition-colors duration-300 active:scale-95 ${isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>닫기</button>
           </div>
        </div>
      )}

      {/* 강퇴 확인 모달 */}
      {kickUserTarget && (
        <div className="fixed inset-0 bg-black/60 z-[99999] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-300">
           <div className={`bg-white dark:bg-slate-800 p-6 rounded-3xl max-w-xs w-full text-center shadow-2xl animate-in zoom-in-95 duration-300`}>
              <div className="text-3xl mb-3">⚠️</div>
              <h3 className={`text-sm font-black mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>공유 중단 확인</h3>
              <p className={`text-[11px] font-bold mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} leading-relaxed`}>
                 <span className="text-indigo-500 font-black">[{kickUserTarget}]</span> 사용자와<br/>공유를 중지하시겠습니까?
              </p>
              <div className="flex space-x-2">
                 <button className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-colors duration-300 ${isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} onClick={() => setKickUserTarget(null)}>취소</button>
                 <button className="flex-1 py-2.5 bg-rose-500 text-white rounded-xl font-bold text-xs shadow-md hover:bg-rose-600 active:scale-95 transition-all duration-300" onClick={async () => {
                    const newShared = sharedUsers.filter(u => u !== kickUserTarget);
                    setSharedUsers(newShared);
                    if(supabaseClient) await supabaseClient.from('travel_state').update({ shared_users: newShared }).eq('id', activeTripId);
                    showToast(`${kickUserTarget} 님을 여행에서 내보냈습니다.`);
                    setKickUserTarget(null);
                 }}>중지하기</button>
              </div>
           </div>
        </div>
      )}
    </>
  );
};

export default SettingsModal;
