import React from 'react';
import { S, openGoogleMapsNav } from '../utils/helpers';
import TripImg from './TripImg';
import { storefrontCredit, photoSourceLink, storefrontPrefix } from '../utils/mapillary';
import PlaceInfoSection from './PlaceInfoSection';
import DriverCardModal from './DriverCardModal';
import { hasCyrillic, cyrillicToLatin } from '../utils/phrasebook';
import { hasLocalApps, twoGisPlaceUrl, yandexGoUrl } from '../utils/localApps';

const PinDetailModal = ({
  selectedPinInfo, setSelectedPinInfo, cardBg, setViewPhoto, handleCopyLocalName, openEditPinModal,
  isDomesticTrip, tripCountry, showToast,
}) => {
  const [driverOpen, setDriverOpen] = React.useState(false);
  React.useEffect(() => { setDriverOpen(false); }, [selectedPinInfo && selectedPinInfo.id]);
  if (!selectedPinInfo) return null;
  const pinCountry = S(selectedPinInfo.country) || S(tripCountry);
  const hasPos = selectedPinInfo.lat && selectedPinInfo.lng;
  const hasPhoto = selectedPinInfo.img && !S(selectedPinInfo.img).includes("unsplash");
  // 대표 사진이 가게 앞 사진(Mapillary)이면 출처(찍은 사람·날짜)를 사진 위에 표시해야 한다 (CC BY-SA 조건)
  const sf = selectedPinInfo.storefront;
  const showCredit = sf && sf.url && S(selectedPinInfo.img) === S(sf.url);

  return (
    <div className="fixed inset-0 bg-black/60 z-[8000] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-300" onClick={() => setSelectedPinInfo(null)}>
      <div className={`${cardBg} w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-300`} onClick={e => e.stopPropagation()}>
        {selectedPinInfo.img && !S(selectedPinInfo.img).includes("unsplash") && (
          <div className="w-full h-48 shrink-0 relative cursor-pointer" onClick={e => { e.stopPropagation(); const imgs = Array.isArray(selectedPinInfo.imgs) && selectedPinInfo.imgs.length > 0 ? selectedPinInfo.imgs : (Array.isArray(selectedPinInfo.photos) && selectedPinInfo.photos.length > 0 ? selectedPinInfo.photos : [selectedPinInfo.img]); setViewPhoto({ imgs, idx: 0 }); }}>
            <TripImg src={selectedPinInfo.img} className="w-full h-full object-cover" alt="" />
            {selectedPinInfo.isAccommodation && <div className="absolute top-3 left-3 bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded shadow-md">숙소</div>}
            {showCredit && (
              <a href={photoSourceLink(sf)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                className="absolute bottom-0 inset-x-0 z-10 bg-gradient-to-t from-black/70 to-transparent text-white text-[10px] px-3 pt-5 pb-1.5 truncate">
                {storefrontPrefix(sf)} {storefrontCredit(sf)}
              </a>
            )}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
              <span className="opacity-0 hover:opacity-100 text-white text-2xl drop-shadow">🔍</span>
            </div>
          </div>
        )}
        <div className="p-5 flex flex-col">
          <h3 className="text-lg font-black text-slate-900 mb-2">{S(selectedPinInfo.name)} {selectedPinInfo.isAccommodation && !selectedPinInfo.img ? '🏠' : ''}</h3>

          {selectedPinInfo.localName && (
            <div className="flex items-center text-sm font-bold text-indigo-500 mb-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => handleCopyLocalName(e, selectedPinInfo.localName)}>
              <span className="mr-2">📍 {S(selectedPinInfo.localName)}</span>
              <span className="text-[10px] bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">복사</span>
            </div>
          )}
          {/* 키릴 문자 이름은 읽는 법(로마자)을 같이 — 'Кок-Тобе' → 'Kok-Tobe' */}
          {hasCyrillic(selectedPinInfo.localName) && <p className="-mt-2 mb-3 pl-6 text-[11px] font-semibold text-slate-400">{cyrillicToLatin(selectedPinInfo.localName)}</p>}

          {/* 해외: 택시 기사에게 보여 줄 큰 글씨 화면 / 중앙아시아: 2GIS·Yandex Go */}
          {!isDomesticTrip && (
            <button onClick={() => setDriverOpen(true)}
              className="w-full mb-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-sm transition-colors">
              🚕 기사님께 보여주기 (현지어 크게)
            </button>
          )}
          {!isDomesticTrip && hasPos && hasLocalApps(pinCountry) && (
            <div className="flex gap-2 mb-3">
              <a href={twoGisPlaceUrl(selectedPinInfo.lat, selectedPinInfo.lng, S(selectedPinInfo.localName) || S(selectedPinInfo.name))} target="_blank" rel="noopener noreferrer"
                className="flex-1 text-center bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 py-2 rounded-xl font-bold text-xs">🗺️ 2GIS에서 보기</a>
              <a href={yandexGoUrl(selectedPinInfo.lat, selectedPinInfo.lng)} target="_blank" rel="noopener noreferrer"
                className="flex-1 text-center bg-yellow-50 hover:bg-yellow-100 border border-yellow-300 text-yellow-800 py-2 rounded-xl font-bold text-xs">🚕 Yandex Go 택시</a>
            </div>
          )}

          {selectedPinInfo.signature && S(selectedPinInfo.signature) !== "직접 추가한 장소" ? (
            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">{S(selectedPinInfo.signature)}</p>
          ) : (
            <p className="text-sm text-slate-400 italic">기록된 메모가 없습니다.</p>
          )}

          {/* 영업시간·평점·리뷰·구글 사진 — 누를 때만 불러온다 */}
          {selectedPinInfo.lat && selectedPinInfo.lng && <PlaceInfoSection pin={selectedPinInfo} />}

          {/* 사진이 하나도 없는 핀: 근처 거리 사진에서 가게 앞 사진을 고를 수 있게 수정 창으로 */}
          {!hasPhoto && selectedPinInfo.lat && selectedPinInfo.lng && (
            <button onClick={() => { openEditPinModal(selectedPinInfo); setSelectedPinInfo(null); }}
              className="w-full mt-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-xs transition-colors">
              🖼️ 대표 사진 넣기
            </button>
          )}

          {!isDomesticTrip && selectedPinInfo.lat && selectedPinInfo.lng && (
            <button onClick={() => openGoogleMapsNav(selectedPinInfo.lat, selectedPinInfo.lng, 'driving')} className="w-full mt-4 bg-green-500 hover:bg-green-600 active:scale-95 text-white py-3 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center space-x-2">
              <span>🧭</span><span>구글 네비게이션으로 길 안내</span>
            </button>
          )}
          <div className="flex space-x-2 mt-2">
            <button onClick={() => {
              openEditPinModal(selectedPinInfo);
              setSelectedPinInfo(null);
            }} className="flex-1 bg-indigo-100 text-indigo-600 py-3 rounded-xl font-bold text-sm hover:bg-indigo-200 transition-colors duration-300">정보 수정</button>
            <button onClick={() => setSelectedPinInfo(null)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors duration-300">닫기</button>
          </div>
        </div>
      </div>
      {driverOpen && <DriverCardModal pin={selectedPinInfo} country={pinCountry} onClose={() => setDriverOpen(false)} showToast={showToast} />}
    </div>
  );
};

export default PinDetailModal;
