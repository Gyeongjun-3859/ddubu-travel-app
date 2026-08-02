import React from 'react';

const ConfirmModal = ({ confirmModal, setConfirmModal, cardBg, isDarkMode, textMain }) => {
  if (!confirmModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100000] flex items-center justify-center p-6" onClick={() => { if (confirmModal.onCancel) confirmModal.onCancel(); setConfirmModal(null); }}>
      <div className={`${cardBg} rounded-3xl p-6 w-full max-w-xs shadow-2xl animate-in zoom-in-95 duration-200`} onClick={e => e.stopPropagation()}>
        <p className={`text-sm font-bold text-center leading-relaxed mb-6 whitespace-pre-line ${textMain}`}>{confirmModal.msg}</p>
        {confirmModal.extraBtn ? (
          <div className="flex flex-col gap-2">
            <button onClick={() => { confirmModal.onOk(); setConfirmModal(null); }} className="w-full bg-rose-500 text-white py-3 rounded-2xl text-xs font-bold shadow-md hover:bg-rose-600 active:scale-95 transition-all">{confirmModal.okLabel || '확인'}</button>
            <button onClick={() => { setConfirmModal(null); confirmModal.extraBtn.onClick(); }} className={`w-full py-3 rounded-2xl text-xs font-bold border transition-all active:scale-95 ${isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>{confirmModal.extraBtn.label}</button>
            <button onClick={() => { setConfirmModal(null); }} className={`w-full py-2 rounded-2xl text-[10px] font-bold transition-all active:scale-95 ${isDarkMode ? 'text-slate-500 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'}`}>취소</button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button onClick={() => { if (confirmModal.onCancel) confirmModal.onCancel(); setConfirmModal(null); }} className={`flex-1 py-3 rounded-2xl text-xs font-bold border transition-all active:scale-95 ${isDarkMode ? 'border-slate-600 text-slate-400 hover:bg-slate-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>{confirmModal.cancelLabel || '취소'}</button>
            <button onClick={() => { confirmModal.onOk(); setConfirmModal(null); }} className="flex-1 bg-rose-500 text-white py-3 rounded-2xl text-xs font-bold shadow-md hover:bg-rose-600 active:scale-95 transition-all">{confirmModal.okLabel || '확인'}</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfirmModal;
