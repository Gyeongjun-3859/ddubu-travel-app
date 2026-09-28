import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Languages as LanguagesIcon, Volume2 } from 'lucide-react';

const PHRASES = [
  { ko: '안녕하세요', label: '인사' },
  { ko: '감사합니다', label: '감사' },
  { ko: '얼마예요?', label: '가격 묻기' },
  { ko: '도와주세요', label: '도움 요청' },
];

// [Chrome 버그 대응] SpeechSynthesisUtterance/Audio를 지역 변수로만 두면 재생 도중 GC(가비지 컬렉션)되어
// 소리 없이 조용히 멈추는 크롬 고질적 버그가 있음 -> 모듈 스코프에 살아있는 참조를 유지해서 방지.
let activeUtterance = null;
let activeAudio = null;

// 기기에 설치된 음성이 없을 때 쓰는 대체 재생: 구글 번역 TTS(무료, 비공식 엔드포인트)로 mp3를 받아 재생.
// 일부 언어(카자흐어 등)는 이 엔드포인트도 지원하지 않아 실패할 수 있음.
function playGoogleTts(text, code) {
  return new Promise((resolve, reject) => {
    try {
      if (activeAudio) { activeAudio.pause(); activeAudio = null; }
      const audio = new Audio(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${code}&client=tw-ob`);
      activeAudio = audio;
      audio.onended = resolve;
      audio.onerror = () => reject(new Error('google-tts-failed'));
      audio.play().catch(reject);
    } catch (e) { reject(e); }
  });
}

// languageList: [{ code, english, native }, ...] — 한 국가에 실제로 통용되는 언어가 여러 개면
// (예: 카자흐스탄=카자흐어+러시아어) 전부 넘어옴. 첫 번째가 기본 선택.
const LanguageModal = ({ isOpen, onClose, isDarkMode, textMain, countryName, languageList }) => {
  const [langIndex, setLangIndex] = useState(0);
  const [translations, setTranslations] = useState({});
  const [speakError, setSpeakError] = useState('');
  const voicesRef = useRef([]);

  const languageInfo = Array.isArray(languageList) ? languageList[langIndex] : null;

  useEffect(() => { if (isOpen) setLangIndex(0); }, [isOpen, countryName]);

  // 음성 목록은 비동기로 늦게 채워지는 경우가 많아, 모달이 열릴 때 미리 로드해둠
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const loadVoices = () => { voicesRef.current = window.speechSynthesis.getVoices(); };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  useEffect(() => {
    if (!isOpen || !languageInfo) return;
    let cancelled = false;
    setTranslations({});
    setSpeakError('');
    (async () => {
      for (const p of PHRASES) {
        let text = '';
        try {
          const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(p.ko)}&langpair=ko|${languageInfo.code}`);
          const data = await res.json();
          text = data?.responseData?.translatedText || '';
        } catch (e) {
          text = '';
        }
        if (cancelled) return;
        setTranslations(prev => ({ ...prev, [p.ko]: text }));
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, languageInfo]);

  const speakWithVoice = (text, lang, voice) => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    if (voice) utter.voice = voice;
    utter.onerror = () => setSpeakError('음성 재생에 실패했어요.');
    activeUtterance = utter; // GC 방지용 참조 유지
    window.speechSynthesis.speak(utter);
  };

  const speak = async (text) => {
    setSpeakError('');
    if (!text || !languageInfo) return;

    const hasSpeechSynthesis = 'speechSynthesis' in window;
    const voices = hasSpeechSynthesis ? (voicesRef.current.length ? voicesRef.current : window.speechSynthesis.getVoices()) : [];
    const exact = voices.find(v => v.lang && v.lang.toLowerCase() === languageInfo.code.toLowerCase());
    const partial = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(languageInfo.code.toLowerCase()));
    const match = exact || partial;

    // 1순위: 기기에 딱 맞는 음성이 있으면 그걸로 재생 (네트워크 불필요, 가장 빠름)
    if (match) {
      try { speakWithVoice(text, languageInfo.code, match); } catch (e) { setSpeakError('음성 재생에 실패했어요.'); }
      return;
    }

    // 2순위: 기기에 맞는 음성이 없으면 구글 번역 TTS로 대체 재생 시도
    try {
      setSpeakError('음성을 불러오는 중...');
      await playGoogleTts(text, languageInfo.code);
      setSpeakError('');
      return;
    } catch (e) {
      // 3순위: 그마저 실패하면 기기에 있는 아무 음성으로라도 재생 (languageInfo.code로 lang을 지정하면
      // 매칭되는 음성이 하나도 없어 완전 무음이 되므로, 실제로 존재하는 음성의 lang을 그대로 사용해야 함)
      const anyVoice = voices.find(v => v.default) || voices[0];
      if (hasSpeechSynthesis && anyVoice) {
        setSpeakError(`이 언어는 지원되는 음성이 없어, ${anyVoice.lang} 발음으로 대신 재생했어요.`);
        try { speakWithVoice(text, anyVoice.lang, anyVoice); } catch (e2) { setSpeakError('이 언어는 음성 재생을 지원하지 않아요.'); }
      } else {
        setSpeakError('이 언어는 음성 재생을 지원하지 않아요.');
      }
    }
  };

  if (!isOpen || !languageInfo) return null;

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[8100] flex items-center justify-center p-4" onClick={onClose}>
      <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} w-full max-w-sm shadow-2xl overflow-hidden rounded-2xl border`} onClick={e => e.stopPropagation()}>
        <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
          <div className="flex flex-col">
            <h3 className={`text-sm font-black flex items-center gap-1.5 ${textMain}`}><LanguagesIcon className="w-4 h-4 text-[#007AFF]" /> {countryName} 현지 언어</h3>
            <span className={`text-[11px] font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{languageInfo.english} ({languageInfo.native})</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0"><X className="w-4 h-4" /></button>
        </div>

        {languageList.length > 1 && (
          <div className={`flex gap-1.5 px-4 pt-3 flex-wrap`}>
            {languageList.map((l, i) => (
              <button
                key={l.code + i}
                onClick={() => setLangIndex(i)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${i === langIndex
                  ? 'bg-[#007AFF] border-[#007AFF] text-white'
                  : (isDarkMode ? 'bg-slate-900/40 border-slate-700 text-slate-300' : 'bg-[#f4f3f8] border-slate-200/50 text-slate-600')}`}
              >
                {l.english}
              </button>
            ))}
          </div>
        )}

        <div className="p-4 space-y-2.5 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {PHRASES.map(p => {
            const translated = translations[p.ko];
            const isLoaded = Object.prototype.hasOwnProperty.call(translations, p.ko);
            return (
              <div key={p.ko} className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 ${isDarkMode ? 'bg-slate-900/40 border-slate-700' : 'bg-[#f4f3f8] border-slate-200/50'}`}>
                <div className="flex-1 min-w-0">
                  <div className={`text-[10px] font-semibold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{p.label} · {p.ko}</div>
                  <div className={`text-[13px] font-bold truncate ${textMain}`}>
                    {!isLoaded ? '번역 중...' : (translated || '번역을 불러오지 못했어요')}
                  </div>
                </div>
                <button
                  onClick={() => speak(translated)}
                  disabled={!translated}
                  className={`shrink-0 p-2 rounded-full transition-colors ${translated ? (isDarkMode ? 'bg-indigo-900/50 text-indigo-300 hover:bg-indigo-900/70' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100') : 'opacity-30 cursor-not-allowed'}`}
                  aria-label="발음 듣기"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
          <p className={`text-[10px] pt-1 ${speakError ? 'text-amber-500' : (isDarkMode ? 'text-slate-500' : 'text-slate-400')}`}>
            {speakError || '🔊 발음은 기기에 해당 언어 음성이 설치돼 있어야 정확히 들려요. 언어에 따라 소리가 안 나올 수 있어요.'}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LanguageModal;
