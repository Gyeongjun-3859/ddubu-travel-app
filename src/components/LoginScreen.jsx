import React from 'react';
import { S } from '../utils/helpers';

const LoginScreen = ({
  isLoginMode, setIsLoginMode,
  idInput, setIdInput, idError, setIdError,
  pwInput, setPwInput,
  saveCredentials, setSaveCredentials,
  autoLogin, setAutoLogin,
  isLoggingIn, handleLogin, handleSignUp, handleSkipIdSetup,
}) => {
  return (
    <div className="flex h-screen w-full bg-slate-100 items-center justify-center font-sans select-none p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm flex flex-col items-center animate-in zoom-in-95 duration-300">
        <div className="text-4xl mb-4 bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center transition-transform hover:scale-105">🐱</div>
        <h2 className="text-xl font-black text-slate-900 mb-2">{isLoginMode ? "로그인" : "계정 생성"}</h2>
        <p className="text-xs text-slate-500 text-center mb-6">{isLoginMode ? "여행 일정을 다시 확인해보세요!" : "아이디를 만들어 일정을 공유하세요!"}</p>

        <input type="text" placeholder="아이디 (영문/숫자 3자 이상)" value={S(idInput)} onChange={(e) => {setIdInput(e.target.value.replace(/[^a-zA-Z0-9]/g, '')); setIdError("");}} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 transition-all duration-300 mb-3" />
        <input type="password" placeholder="비밀번호 (4자 이상)" value={S(pwInput)} onChange={(e) => {setPwInput(e.target.value); setIdError("");}} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 transition-all duration-300 mb-3" />

        <div className="flex w-full justify-between items-center mb-5 px-1">
          <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-slate-600"><input type="checkbox" checked={saveCredentials} onChange={e => setSaveCredentials(e.target.checked)} className="accent-indigo-600 w-3.5 h-3.5" /><span>ID/PW 저장</span></label>
          <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-slate-600"><input type="checkbox" checked={autoLogin} onChange={e => {setAutoLogin(e.target.checked); if(e.target.checked) setSaveCredentials(true);}} className="accent-indigo-600 w-3.5 h-3.5" /><span>자동 로그인</span></label>
        </div>

        {idError && <p className="text-[10px] text-rose-500 font-bold mb-3 text-center animate-in slide-in-from-top-1">{S(idError)}</p>}

        <div className="flex w-full space-x-2">
          <button onClick={() => setIsLoginMode(!isLoginMode)} disabled={isLoggingIn} className={`flex-1 bg-slate-100 text-slate-600 rounded-xl py-3 text-xs font-bold transition-all duration-300 ${isLoggingIn ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-200'}`}>{isLoginMode ? "회원가입" : "로그인으로"}</button>
          <button onClick={() => isLoginMode ? handleLogin() : handleSignUp()} disabled={isLoggingIn} className={`flex-[2] bg-indigo-600 text-white rounded-xl py-3 text-sm font-bold shadow-md transition-all duration-300 ${isLoggingIn ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700 active:scale-95'}`}>
            {isLoggingIn ? "처리 중..." : (isLoginMode ? "로그인" : "아이디 생성")}
          </button>
        </div>
        <button onClick={handleSkipIdSetup} disabled={isLoggingIn} className="mt-5 text-[10px] text-slate-400 font-bold underline hover:text-slate-600 transition-colors">건너뛰기 (로컬 테스트)</button>
      </div>
    </div>
  );
};

export default LoginScreen;
