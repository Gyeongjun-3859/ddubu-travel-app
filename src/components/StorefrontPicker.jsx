import React from 'react';
import { Check, RefreshCw, X } from 'lucide-react';
import TripImg from './TripImg';
import { hasMapillaryToken, findStorefrontCandidates, storefrontCredit, mapillaryPhotoLink } from '../utils/mapillary';

// 핀 등록·수정 창의 '🏪 가게 앞 사진' 칸.
// 위치가 정해지면 근처 거리 사진(Mapillary)을 알아서 찾아 몇 장 보여 주고, 사용자가 맞는 걸 한 번 누르면 끝.
// 맞는 게 없으면 그냥 두면 된다(고르지 않으면 저장 안 함). 실제 복사는 핀을 저장할 때 한다.
//   value: null | 고른 후보 { mapillaryId, thumb, full, author, capturedAt } | 이미 저장된 사진 { url, mapillaryId, author, capturedAt }
const StorefrontPicker = ({ lat, lng, value, onChange, isDarkMode, textMuted }) => {
  const [cands, setCands] = React.useState([]);
  const [status, setStatus] = React.useState('idle'); // idle | loading | done | error
  const [browsing, setBrowsing] = React.useState(!value); // 저장된 사진이 있으면 [다른 사진]을 누를 때만 후보를 찾는다
  const reqRef = React.useRef(0);
  const hasPos = isFinite(lat) && isFinite(lng) && lat !== null && lng !== null;

  React.useEffect(() => {
    if (!hasMapillaryToken() || !hasPos || !browsing) return;
    const reqId = ++reqRef.current;
    setStatus('loading');
    // 검색으로 위치를 바꾸는 중에 요청이 줄줄이 나가지 않게 잠깐 기다렸다가 찾는다
    const t = setTimeout(() => {
      findStorefrontCandidates(lat, lng)
        .then(list => { if (reqId === reqRef.current) { setCands(list); setStatus('done'); } })
        .catch(err => { if (reqId === reqRef.current) { console.warn('[가게 앞 사진 찾기 실패]', err && err.message); setCands([]); setStatus('error'); } });
    }, 400);
    return () => clearTimeout(t);
  }, [lat, lng, browsing, hasPos]);

  if (!hasMapillaryToken()) return null;

  const border = isDarkMode ? 'border-slate-600' : 'border-slate-200';
  const selectedId = value && value.mapillaryId;
  const previewSrc = value ? (value.url || value.full || value.thumb) : '';
  const credit = storefrontCredit(value);

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <label className={`block text-xs font-bold ${textMuted}`}>🏪 가게 앞 사진 <span className="font-medium">(대표 사진)</span></label>
        {value && !browsing && (
          <button type="button" onClick={() => setBrowsing(true)} className="text-[11px] font-bold text-[#007AFF] flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />다른 사진
          </button>
        )}
      </div>

      {/* 고른(또는 저장된) 사진 크게 — 맞는 가게인지 눈으로 확인 */}
      {value && (
        <div className={`relative rounded-2xl overflow-hidden border ${border}`}>
          {value.url
            ? <TripImg src={previewSrc} className="w-full aspect-[4/3] object-cover" alt="가게 앞 사진" />
            : <img src={previewSrc} className="w-full aspect-[4/3] object-cover" alt="가게 앞 사진" />}
          <button type="button" onClick={() => { onChange(null); setBrowsing(true); }} title="빼기"
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-rose-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
          {credit && (
            <a href={mapillaryPhotoLink(value.mapillaryId)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent text-white text-[10px] px-2.5 pt-4 pb-1.5 truncate">
              📷 {credit}
            </a>
          )}
        </div>
      )}

      {browsing && (
        !hasPos ? (
          <p className={`text-[11px] ${textMuted}`}>위치를 정하면 근처에서 찍힌 거리 사진을 찾아 드려요.</p>
        ) : status === 'loading' ? (
          <div className="flex gap-2 overflow-hidden">
            {[0, 1, 2, 3].map(i => <div key={i} className={`shrink-0 w-20 h-20 rounded-xl animate-pulse ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />)}
          </div>
        ) : cands.length === 0 ? (
          <p className={`text-[11px] ${textMuted}`}>{status === 'error' ? '거리 사진을 불러오지 못했어요.' : '근처에서 찍힌 거리 사진이 없어요.'}</p>
        ) : (
          <>
            <p className={`text-[11px] ${textMuted}`}>{value ? '다른 사진을 고르려면 눌러 주세요.' : '가게가 보이는 사진을 눌러 주세요. 맞는 게 없으면 그냥 두셔도 돼요.'}</p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {cands.map(c => {
                const on = c.mapillaryId === selectedId;
                return (
                  <button key={c.mapillaryId} type="button"
                    onClick={() => onChange(on ? null : c)}
                    className={`relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${on ? 'border-[#007AFF] ring-2 ring-[#007AFF]/30' : (isDarkMode ? 'border-slate-700' : 'border-transparent')}`}>
                    <img src={c.thumb} className="w-full h-full object-cover" alt="" loading="lazy" />
                    {on && <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#007AFF] text-white flex items-center justify-center"><Check className="w-3.5 h-3.5" /></span>}
                  </button>
                );
              })}
            </div>
          </>
        )
      )}
    </section>
  );
};

export default StorefrontPicker;
