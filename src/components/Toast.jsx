import React from 'react';

const Toast = ({ toastMsg }) => {
  if (!toastMsg) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-full text-xs font-bold shadow-2xl z-[99999] animate-in fade-in slide-in-from-top-4 duration-300">
      {toastMsg}
    </div>
  );
};

export default Toast;
