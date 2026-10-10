import React from 'react';
import { Check, RefreshCw, X } from 'lucide-react';
import TripImg from './TripImg';
import { hasMapillaryToken, findStorefrontCandidates, storefrontCredit, photoSourceLink, prefetchStorefront, storefrontPrefix } from '../utils/mapillary';
import { findWikiPhoto, findCommonsPhotos } from '../utils/wikiPhoto';
import { googlePlacePhotos } from '../utils/googlePlaces';

const BADGE = { wiki: '대표', google: '구글', commons: '근처', mapillary: '거리' };

// 핀 등록·수정 창의 '🖼️ 대표 사진' 칸.
// 위치가 정해지면 ① 그 장소의 위키백과 대표 사진(유명한 곳) ② 구글 장소 사진(호텔·식당 거의 다 있음, 볼 때마다 불러옴)
// ③ 위키미디어 공용 근처 사진 ④ 근처 거리 사진(Mapillary)을 찾아,
// 사용자가 아무것도 안 해도 가장 그럴듯한 사진을 자동으로 골라 둔다 — "동방명주를 고르고 저장만 하면 동방명주 사진"(사용자 요청).
// 다른 후보를 누르면 바뀌고, ✕로 빼면 사진 없이 저장한다. 실제 복사는 핀을 저장할 때 한다.
//   value: null | 후보 { source:'wiki'|'mapillary', full, thumb, author, link?, mapillaryId?, capturedAt?, auto? }
//          | 이미 저장된 사진 { url, source, … }
// pendingRef: 찾는 중이면 { promise } — 결과(자동으로 고른 사진, 없으면 null)로 끝난다. 장소를 고르자마자 [등록]을 누르면
//   사진을 찾기 전에 저장돼 사진이 빠졌다(사용자 제보: 콕토베·젠코프 성당) → 저장하는 쪽이 이걸 기다렸다가 넣는다.
const StorefrontPicker = ({ lat, lng, name, localName, localLang, googlePlaceId, value, onChange, isDarkMode, textMuted, pendingRef }) => {
  const [cands, setCands] = React.useState([]);
  const [status, setStatus] = React.useState('idle'); // idle | loading | done
  const [browsing, setBrowsing] = React.useState(!(value && value.url)); // 저장된 사진이 있으면 [다른 사진]을 누를 때만 찾는다
  const reqRef = React.useRef(0);
  const nameRef = React.useRef({ name, localName, googlePlaceId });
  nameRef.current = { name, localName, googlePlaceId };
  const valueRef = React.useRef(value);
  valueRef.current = value;
  const hasPos = lat !== null && lng !== null && isFinite(lat) && isFinite(lng);

  React.useEffect(() => {
    if (!hasPos || !browsing) { if (pendingRef) pendingRef.current = null; return; }
    const reqId = ++reqRef.current;
    setStatus('loading');
    let finish;
    const job = { promise: new Promise(r => { finish = r; }) };
    if (pendingRef) pendingRef.current = job;
    const done = (pick) => { finish(pick); if (pendingRef && pendingRef.current === job) pendingRef.current = null; };
    // 위치를 고른 직후 이름·현지어 이름이 채워질 시간을 잠깐 준다(검색 선택과 같은 순간에 바뀜)
    const t = setTimeout(async () => {
      const { name: nm, localName: ln, googlePlaceId: gid } = nameRef.current;
      const [wiki, google, commons, streets] = await Promise.all([
        findWikiPhoto({ name: nm, localName: ln, lat, lng, localLang }).catch(() => null),
        gid ? googlePlacePhotos(gid).catch(() => []) : Promise.resolve([]),
        findCommonsPhotos(lat, lng).catch(() => []),
        hasMapillaryToken() ? findStorefrontCandidates(lat, lng).catch(() => []) : Promise.resolve([]),
      ]);
      if (reqId !== reqRef.current) { done(undefined); return; }
      // 자동 1순위: 위키백과(그 장소 문서) → 구글(그 장소 사진) → 근처 사진 → 거리 사진
      const list = [...(wiki ? [wiki] : []), ...google, ...commons, ...streets.slice(0, 4).map(c => ({ ...c, source: 'mapillary' }))];
      setCands(list);
      setStatus('done');
      // 자동 선택: 아직 아무것도 안 골랐거나, 전에 자동으로 고른 것(위치를 바꾸기 전 것)이면 새 1순위로
      const cur = valueRef.current;
      if (!cur || (cur.auto && !cur.url)) {
        const pick = list[0] ? { ...list[0], auto: true } : null;
        onChange(pick);
        done(pick);
      } else done(cur);
    }, 500);
    return () => { clearTimeout(t); done(undefined); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, browsing, hasPos]);

  // 거리 사진이 골라져 있으면 미리 받아 둔다 → [등록] 때 기다림이 짧아짐
  React.useEffect(() => { if (value && !value.url) prefetchStorefront(value); }, [value]);

  const border = isDarkMode ? 'border-slate-600' : 'border-slate-200';
  const keyOf = (c) => c.source === 'mapillary' || (!c.source && c.mapillaryId) ? `m:${c.mapillaryId}` : `${c.source}:${c.photoName || c.link || c.full}`;
  const selKey = value ? keyOf(value) : '';
  const previewSrc = value ? (value.url || value.full || value.thumb) : '';
  const credit = storefrontCredit(value);

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <label className={`block text-xs font-bold ${textMuted}`}>🖼️ 대표 사진 {value && value.auto && !value.url && <span className="font-medium text-[#007AFF]">· 자동으로 골랐어요</span>}</label>
        {value && value.url && !browsing && (
          <button type="button" onClick={() => setBrowsing(true)} className="text-[11px] font-bold text-[#007AFF] flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />다른 사진
          </button>
        )}
      </div>

      {/* 고른(또는 저장된) 사진 크게 — 맞는 장소인지 눈으로 확인 */}
      {value && (
        <div className={`relative rounded-2xl overflow-hidden border ${border}`}>
          {value.url
            ? <TripImg src={previewSrc} className="w-full aspect-[4/3] object-cover" alt="대표 사진" />
            : <img src={previewSrc} className="w-full aspect-[4/3] object-cover" alt="대표 사진" />}
          <button type="button" onClick={() => { onChange(null); setBrowsing(true); }} title="빼기"
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-rose-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
          {credit && (
            <a href={photoSourceLink(value)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent text-white text-[10px] px-2.5 pt-4 pb-1.5 truncate">
              {storefrontPrefix(value)} {credit}
            </a>
          )}
        </div>
      )}

      {browsing && (
        !hasPos ? (
          <p className={`text-[11px] ${textMuted}`}>위치를 정하면 그 장소 사진을 찾아 자동으로 넣어 드려요.</p>
        ) : status === 'loading' ? (
          <div className="flex gap-2 overflow-hidden">
            {[0, 1, 2, 3].map(i => <div key={i} className={`shrink-0 w-20 h-20 rounded-xl animate-pulse ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />)}
          </div>
        ) : cands.length === 0 ? (
          <p className={`text-[11px] ${textMuted}`}>이 장소 사진을 찾지 못했어요. 직접 사진을 올려 주세요.</p>
        ) : cands.length > 1 || !value ? (
          <>
            <p className={`text-[11px] ${textMuted}`}>{value ? '다른 사진으로 바꾸려면 눌러 주세요.' : '마음에 드는 사진을 눌러 주세요.'}</p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {cands.map(c => {
                const on = keyOf(c) === selKey;
                return (
                  <button key={keyOf(c)} type="button"
                    onClick={() => onChange(on ? null : { ...c, auto: false })}
                    className={`relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${on ? 'border-[#007AFF] ring-2 ring-[#007AFF]/30' : (isDarkMode ? 'border-slate-700' : 'border-transparent')}`}>
                    <img src={c.thumb} className="w-full h-full object-cover" alt="" loading="lazy" />
                    <span className="absolute bottom-0 inset-x-0 bg-black/55 text-white text-[9px] font-bold py-0.5">{BADGE[c.source] || '거리'}</span>
                    {on && <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#007AFF] text-white flex items-center justify-center"><Check className="w-3.5 h-3.5" /></span>}
                  </button>
                );
              })}
            </div>
          </>
        ) : null
      )}
    </section>
  );
};

export default StorefrontPicker;
