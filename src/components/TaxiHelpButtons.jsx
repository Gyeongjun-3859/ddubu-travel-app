import React from 'react';
import { S } from '../utils/helpers';
import DriverCardModal from './DriverCardModal';
import { hasLocalApps, twoGisPlaceUrl, yandexGoUrl } from '../utils/localApps';

// 해외 장소의 '🚕 기사님께 보여주기' + (중앙아시아면) 2GIS·Yandex Go 버튼 묶음.
// 핀 상세 창과 일정 상세 창에서 같이 쓴다 (여행 중엔 일정 탭을 주로 보니까).
// pin: 위치·현지어 이름·구글 장소 번호·저장된 현지어 주소(localAddress)가 든 핀
const TaxiHelpButtons = ({ pin, country, showToast, onSaveLocalAddress }) => {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => { setOpen(false); }, [pin && pin.id]);
  if (!pin) return null;
  const hasPos = pin.lat && pin.lng;
  return (
    <>
      <button onClick={() => setOpen(true)}
        className="w-full mb-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-sm transition-colors">
        🚕 기사님께 보여주기 (현지어 크게)
      </button>
      {hasPos && hasLocalApps(country) && (
        <div className="flex gap-2 mb-3">
          <a href={twoGisPlaceUrl(pin.lat, pin.lng, S(pin.localName) || S(pin.name))} target="_blank" rel="noopener noreferrer"
            className="flex-1 text-center bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 py-2 rounded-xl font-bold text-xs">🗺️ 2GIS에서 보기</a>
          <a href={yandexGoUrl(pin.lat, pin.lng)} target="_blank" rel="noopener noreferrer"
            className="flex-1 text-center bg-yellow-50 hover:bg-yellow-100 border border-yellow-300 text-yellow-800 py-2 rounded-xl font-bold text-xs">🚕 Yandex Go 택시</a>
        </div>
      )}
      {open && <DriverCardModal pin={pin} country={country} onClose={() => setOpen(false)} showToast={showToast} onSaveLocalAddress={onSaveLocalAddress} />}
    </>
  );
};

export default TaxiHelpButtons;
