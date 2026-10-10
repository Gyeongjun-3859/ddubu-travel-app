import React from 'react';
import { X, Copy } from 'lucide-react';
import { S } from '../utils/helpers';
import { LOCAL_LANG_BY_COUNTRY, hasGooglePlacesKey, googlePlaceAddressIn, googleFindPlaceId } from '../utils/googlePlaces';
import { DRIVER_PHRASE, hasCyrillic, cyrillicToLatin } from '../utils/phrasebook';
import { hasLocalApps, twoGisPlaceUrl, yandexGoUrl } from '../utils/localApps';

// 🚕 기사님께 보여주기 — 현지어 이름·주소·"여기로 가 주세요"를 화면 가득 큰 글씨로.
// (알마티 택시 기사는 영어가 거의 안 통하고, 한국어 이름으로는 못 알아본다)
// 주소: 핀에 저장된 현지어 주소(localAddress)가 있으면 그걸 바로 — 신호가 없는 산·시골에서도 보이게.
// 없으면 구글에서 현지어로 받아 오고(핀의 장소 번호, 없으면 이름+위치로 찾기) onSaveLocalAddress로 핀에 저장해 다음부턴 오프라인에서도.
const DriverCardModal = ({ pin, country, onClose, showToast, onSaveLocalAddress }) => {
  const lang = LOCAL_LANG_BY_COUNTRY[country] || 'en';
  const [local, setLocal] = React.useState({ name: '', address: '' });
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!pin) return undefined;
    let cancelled = false;
    setLocal({ name: '', address: '' });
    if (S(pin.localAddress) || !hasGooglePlacesKey()) return undefined;
    setLoading(true);
    (async () => {
      try {
        let id = S(pin.googlePlaceId);
        if (!id) id = await googleFindPlaceId(S(pin.localName) || S(pin.name), Number(pin.lat), Number(pin.lng));
        if (!id) return;
        const r = await googlePlaceAddressIn(id, lang);
        if (!cancelled) setLocal(r);
        if (r.address && typeof onSaveLocalAddress === 'function') onSaveLocalAddress(pin.id, r.address, id);
      } catch (e) {
        console.warn('[현지어 주소 불러오기 실패]', e && e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [pin, lang]);

  if (!pin) return null;
  const name = S(pin.localName) || local.name || S(pin.name);
  const address = S(pin.localAddress) || local.address;
  const phrase = DRIVER_PHRASE[lang] || DRIVER_PHRASE[String(lang).split('-')[0]] || DRIVER_PHRASE.en;
  const reading = hasCyrillic(name) ? cyrillicToLatin(name) : '';
  const hasPos = pin.lat && pin.lng;

  const copy = async () => {
    const text = [name, address].filter(Boolean).join('\n');
    try { await navigator.clipboard.writeText(text); if (showToast) showToast('📋 현지어 이름·주소를 복사했어요'); }
    catch (e) { if (showToast) showToast('복사하지 못했어요'); }
  };

  return (
    <div className="fixed inset-0 z-[8600] bg-white flex flex-col" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-4 pt-4">
        <span className="text-xs font-bold text-slate-400">🚕 기사님께 보여주세요 · {S(pin.name)}</span>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500" aria-label="닫기"><X className="w-6 h-6" /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col justify-center gap-5 text-slate-900">
        <p className="text-2xl font-bold text-indigo-600 leading-snug">{phrase}</p>
        <div>
          <p className="text-4xl sm:text-5xl font-black leading-tight break-words">{name}</p>
          {reading && <p className="mt-1 text-sm font-semibold text-slate-400">{reading}</p>}
        </div>
        {address
          ? <p className="text-2xl font-bold leading-snug text-slate-700 break-words">{address}</p>
          : loading && <p className="text-sm text-slate-400">주소를 불러오는 중…</p>}
      </div>
      <div className="px-4 pb-6 pt-2 grid grid-cols-2 gap-2">
        <button onClick={copy} className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-700"><Copy className="w-4 h-4" /> 이름·주소 복사</button>
        {hasPos && hasLocalApps(country) && (
          <>
            <a href={yandexGoUrl(pin.lat, pin.lng)} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-yellow-400 py-3 text-center text-sm font-black text-slate-900">🚕 Yandex Go로 부르기</a>
            <a href={twoGisPlaceUrl(pin.lat, pin.lng, name)} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-emerald-500 py-3 text-center text-sm font-black text-white">🗺️ 2GIS에서 열기</a>
          </>
        )}
      </div>
    </div>
  );
};

export default DriverCardModal;
