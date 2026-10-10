import React from 'react';
import { createPortal } from 'react-dom';
import { X, Phone } from 'lucide-react';
import { S } from '../utils/helpers';
import { COUNTRY_EMERGENCY, CONSULAR_CALL_CENTER } from '../utils/constants';
import { LOCAL_LANG_BY_COUNTRY } from '../utils/googlePlaces';
import { PHRASEBOOK } from '../utils/phrasebook';
import DriverCardModal from './DriverCardModal';

// 🆘 긴급 정보 — 사고·분실·아플 때 바로 꺼내 보는 화면. 전부 앱 안에 들어 있어 신호가 없어도 보인다(전화는 통신이 돼야 함).
// 긴급번호 · 외교부 영사콜센터 · 내 숙소(현지어 이름·주소, 기사님 화면) · 현지어 응급 문장
const EmergencyModal = ({ isOpen, onClose, country, accommodations = [], isDarkMode, textMain, showToast, onSaveLocalAddress }) => {
  const [driverPin, setDriverPin] = React.useState(null);
  if (!isOpen) return null;
  const numbers = COUNTRY_EMERGENCY[country] || [];
  const lang = String(LOCAL_LANG_BY_COUNTRY[country] || '').split('-')[0];
  const phrases = (PHRASEBOOK[lang] || []).filter(p => p.group === '응급');
  const box = `rounded-lg border px-3 py-2.5 ${isDarkMode ? 'bg-slate-900/40 border-slate-700' : 'bg-[#f4f3f8] border-slate-200/50'}`;
  const tel = (n) => `tel:${String(n).replace(/[^\d+]/g, '')}`;

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[8100] flex items-center justify-center p-4" onClick={onClose}>
      <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} w-full max-w-sm max-h-[90vh] flex flex-col shadow-2xl overflow-hidden rounded-2xl border`} onClick={e => e.stopPropagation()}>
        <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
          <h3 className={`text-sm font-black ${textMain}`}>🆘 {country} 긴급 정보</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar">
          <section className="space-y-1.5">
            <h4 className={`text-[11px] font-black ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>📞 긴급 전화 (누르면 전화)</h4>
            {numbers.map(n => (
              <a key={n.num + n.label} href={tel(n.num)} className={`${box} flex items-center justify-between`}>
                <span className={`text-[12px] font-semibold ${textMain}`}>{n.label}</span>
                <span className="flex items-center gap-1 text-lg font-black text-rose-600"><Phone className="w-4 h-4" />{n.num}</span>
              </a>
            ))}
            <a href={tel(CONSULAR_CALL_CENTER)} className={`${box} flex items-center justify-between`}>
              <span className="flex flex-col">
                <span className={`text-[12px] font-semibold ${textMain}`}>외교부 영사콜센터 (24시간·한국어)</span>
                <span className="text-[10px] text-slate-400">사건·사고, 여권 분실 — 현지 대사관·총영사관 연결</span>
              </span>
              <span className="text-[13px] font-black text-rose-600 whitespace-nowrap">{CONSULAR_CALL_CENTER}</span>
            </a>
          </section>

          {accommodations.length > 0 && (
            <section className="space-y-1.5">
              <h4 className={`text-[11px] font-black ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>🏨 내 숙소</h4>
              {accommodations.map(a => (
                <div key={a.id} className={box}>
                  <div className={`text-[13px] font-bold ${textMain}`}>{S(a.name)}</div>
                  {a.localName && <div className="text-[12px] font-semibold text-indigo-500">{S(a.localName)}</div>}
                  {a.localAddress && <div className="text-[12px] text-slate-500">{S(a.localAddress)}</div>}
                  <button onClick={() => setDriverPin(a)} className="mt-1.5 w-full rounded-lg bg-indigo-600 py-1.5 text-[12px] font-bold text-white">🚕 기사님께 보여주기</button>
                </div>
              ))}
            </section>
          )}

          {phrases.length > 0 && (
            <section className="space-y-1.5">
              <h4 className={`text-[11px] font-black ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>🗣️ 응급 문장 (화면을 보여 주세요)</h4>
              {phrases.map(p => (
                <div key={p.ko} className={box}>
                  <div className="text-[11px] font-semibold text-slate-500">{p.ko}</div>
                  <div className={`text-[16px] font-black ${textMain}`}>{p.text}</div>
                  <div className="text-[11px] font-semibold text-[#007AFF]">{p.say}</div>
                </div>
              ))}
            </section>
          )}
          <p className="text-[10px] text-slate-400">번호는 출국 전에 외교부 해외안전여행(0404.go.kr)에서 한 번 확인해 두세요.</p>
        </div>
      </div>
      {driverPin && <DriverCardModal pin={driverPin} country={S(driverPin.country) || country} onClose={() => setDriverPin(null)} showToast={showToast} onSaveLocalAddress={onSaveLocalAddress} />}
    </div>,
    document.body
  );
};

export default EmergencyModal;
