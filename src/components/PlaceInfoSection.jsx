import React from 'react';
import { S } from '../utils/helpers';
import { hasGooglePlacesKey, googlePlaceDetails, googlePhotoSrc, googleFindPlaceId } from '../utils/googlePlaces';

const PRICE = { PRICE_LEVEL_FREE: '무료', PRICE_LEVEL_INEXPENSIVE: '₩', PRICE_LEVEL_MODERATE: '₩₩', PRICE_LEVEL_EXPENSIVE: '₩₩₩', PRICE_LEVEL_VERY_EXPENSIVE: '₩₩₩₩' };
// 구글이 주는 요일별 시간은 월요일부터 — 오늘 줄을 굵게 보여 주기 위해 (일요일=0 → 6번째)
const todayIdx = () => (new Date().getDay() + 6) % 7;

// 핀 상세 창의 'ℹ️ 장소 정보' — 누를 때만 구글에서 영업시간·평점·리뷰·사진을 받아 펼친다.
// (리뷰·평점은 비싼 요금 등급이라 창을 열 때 자동으로 부르지 않는다. 구글 사진·리뷰는 저장하지 않고 볼 때마다 불러옴 — 약관)
// 저장된 구글 장소 번호가 없는 옛 핀은 이름 + 위치(300m 안)로 찾는다. 국내 핀은 카카오맵 링크도 같이.
const PlaceInfoSection = ({ pin }) => {
  const [state, setState] = React.useState('idle'); // idle | loading | done | notfound | error
  const [info, setInfo] = React.useState(null);
  const [photoIdx, setPhotoIdx] = React.useState(0);
  const [showHours, setShowHours] = React.useState(false);
  const kakaoUrl = S(pin.kakaoPlaceUrl);
  const hasKey = hasGooglePlacesKey();

  React.useEffect(() => { setState('idle'); setInfo(null); setPhotoIdx(0); setShowHours(false); }, [pin.id]);

  const load = async () => {
    setState('loading');
    try {
      const lat = Number(pin.lat), lng = Number(pin.lng);
      let id = S(pin.googlePlaceId);
      if (!id) id = await googleFindPlaceId(S(pin.localName) || S(pin.name), lat, lng);
      if (!id && pin.localName) id = await googleFindPlaceId(S(pin.name), lat, lng);
      if (!id) { setState('notfound'); return; }
      setInfo(await googlePlaceDetails(id));
      setState('done');
    } catch (e) {
      console.warn('[장소 정보 불러오기 실패]', e && e.message);
      setState('error');
    }
  };

  const kakaoLink = kakaoUrl ? (
    <a href={kakaoUrl} target="_blank" rel="noopener noreferrer"
      className="flex-1 text-center bg-yellow-300 hover:bg-yellow-400 text-slate-900 py-2.5 rounded-xl font-bold text-xs transition-colors">카카오맵에서 보기</a>
  ) : null;

  if (state === 'idle' || state === 'loading') {
    if (!hasKey && !kakaoLink) return null;
    return (
      <div className="flex gap-2 mt-4">
        {hasKey && (
          <button onClick={load} disabled={state === 'loading'}
            className="flex-1 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 py-2.5 rounded-xl font-bold text-xs transition-colors disabled:opacity-60">
            {state === 'loading' ? '불러오는 중…' : 'ℹ️ 장소 정보 (영업시간·리뷰)'}
          </button>
        )}
        {kakaoLink}
      </div>
    );
  }

  if (state !== 'done') {
    return (
      <div className="mt-4 space-y-2">
        <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-3">
          {state === 'notfound' ? '구글 지도에서 이 장소를 찾지 못했어요. (이름이나 위치가 조금 다를 수 있어요)' : '장소 정보를 불러오지 못했어요. 잠시 후 다시 눌러 주세요.'}
        </p>
        <div className="flex gap-2">
          {state === 'error' && <button onClick={load} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold text-xs">다시 시도</button>}
          {kakaoLink}
        </div>
      </div>
    );
  }

  const photos = info.photos || [];
  const ph = photos[photoIdx];
  const ti = todayIdx();
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 overflow-hidden">
      {ph && (
        <div className="relative h-40 bg-slate-100">
          <img src={googlePhotoSrc(ph.name)} alt="" className="w-full h-full object-cover" loading="lazy" />
          {photos.length > 1 && (
            <>
              <button onClick={() => setPhotoIdx(i => (i - 1 + photos.length) % photos.length)} className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/45 text-white text-sm">‹</button>
              <button onClick={() => setPhotoIdx(i => (i + 1) % photos.length)} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/45 text-white text-sm">›</button>
              <span className="absolute top-1.5 right-2 rounded bg-black/50 px-1.5 text-[10px] font-bold text-white">{photoIdx + 1}/{photos.length}</span>
            </>
          )}
          {/* 구글 사진은 올린 사람 이름을 꼭 표시해야 한다 */}
          {ph.author && (
            <a href={ph.authorUrl || undefined} target="_blank" rel="noopener noreferrer"
              className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent text-white text-[10px] px-2.5 pt-4 pb-1 truncate">📷 {ph.author} · Google</a>
          )}
        </div>
      )}
      <div className="p-3 space-y-2 text-xs text-slate-700">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {info.rating !== null && <span className="font-black text-amber-500">★ {info.rating.toFixed(1)} <span className="font-medium text-slate-400">({info.ratingCount.toLocaleString()})</span></span>}
          {PRICE[info.priceLevel] && <span className="font-bold text-slate-500">{PRICE[info.priceLevel]}</span>}
          {info.openNow !== null && <span className={`font-bold ${info.openNow ? 'text-emerald-600' : 'text-rose-500'}`}>{info.openNow ? '● 영업 중' : '● 영업 종료'}</span>}
        </div>
        {info.summary && <p className="text-slate-600 leading-relaxed">{info.summary}</p>}
        {info.hours.length > 0 && (
          <div>
            <button onClick={() => setShowHours(v => !v)} className="font-bold text-slate-600 text-left">🕒 {S(info.hours[ti]) || '영업시간'} <span className="text-slate-400">{showHours ? '▴' : '▾'}</span></button>
            {showHours && (
              <ul className="mt-1 space-y-0.5 pl-5 text-[11px] text-slate-500">
                {info.hours.map((h, i) => <li key={i} className={i === ti ? 'font-bold text-slate-700' : ''}>{h}</li>)}
              </ul>
            )}
          </div>
        )}
        {info.phone && <div>📞 <a href={`tel:${info.phone.replace(/[^\d+]/g, '')}`} className="text-sky-600 font-bold">{info.phone}</a></div>}
        {info.website && <div className="truncate">🌐 <a href={info.website} target="_blank" rel="noopener noreferrer" className="text-sky-600 font-bold">{info.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</a></div>}
        {info.reviews.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-slate-100">
            {info.reviews.map((r, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-2">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400"><span className="text-amber-500 font-bold">{'★'.repeat(Math.round(r.rating))}</span><span className="font-bold text-slate-500">{r.author}</span><span>{r.when}</span></div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600 line-clamp-3">{r.text}</p>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2 pt-1">
          {info.mapsUrl && <a href={info.mapsUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-bold text-[11px]">구글 지도에서 보기</a>}
          {kakaoLink}
        </div>
      </div>
    </div>
  );
};

export default PlaceInfoSection;
