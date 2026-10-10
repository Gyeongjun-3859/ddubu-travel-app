import React from 'react';
import { X, Check, Copy, Calendar, ArrowUpDown, Camera, Image as ImageIcon, Bookmark, MapPinPlus, Link as LinkIcon } from 'lucide-react';
import { S, compressAndStoreImage, isExpenseRecord, findPinForPlan } from '../utils/helpers';
import { usePlaceSearch } from '../hooks/usePlaceSearch';
import TripImg from './TripImg';
import StorefrontPicker from './StorefrontPicker';

const THEME_OPTIONS = [
  { value: '식당', emoji: '🍽️', label: '식당 · 맛집' },
  { value: '디저트', emoji: '☕', label: '카페 · 디저트' },
  { value: '관광지', emoji: '🏛️', label: '관광 명소' },
  { value: '숙소', emoji: '🏨', label: '숙소' },
  { value: '쇼핑', emoji: '🛍️', label: '쇼핑' },
  { value: '기타', emoji: '📌', label: '기타 핀' },
];

const AddPlaceModal = ({
  isOpen, onClose, cardBg, isDarkMode, textMuted, inputBg, clickedLocation, setClickedLocation,
  isKakaoMap, isKakaoMapLoaded, displayCityName,
  newManualTheme, setNewManualTheme,
  newManualPlaceName, setNewManualPlaceName,
  newManualLocalName, setNewManualLocalName,
  newManualFeature, setNewManualFeature,
  pinLinkDay, setPinLinkDay, pinLinkPlanId, setPinLinkPlanId,
  newManualTime, setNewManualTime, handleTimeInput, handleCopyLocalName,
  tripDays, planTimeline, showToast,
  newManualPhotos, setNewManualPhotos, setNewManualPhoto,
  newManualIsAccommodation, setNewManualIsAccommodation,
  newManualAccommodationDays, setNewManualAccommodationDays,
  manualFileInputRef, supabaseClient, appUserId, activeTripId,
  handleManualPlaceAdd, currentRestaurants, showConfirm, country, onPickArea,
  newManualStorefront, setNewManualStorefront,
}) => {
  // 장소 자동완성은 일정 수정 창과 같은 훅을 쓴다. 해외 장소를 구글에서 고르면 현지어 이름도 (비어 있을 때) 채운다.
  const { suggestions: placeSuggestions, showSuggestions, setShowSuggestions, onQueryChange, select: selectSuggestion } = usePlaceSearch({
    isKakaoMap, isKakaoMapLoaded, country, showToast, biasPins: currentRestaurants,
    myPins: currentRestaurants, excludePinId: clickedLocation?.id,
    onPick: ({ name, lat, lng, localName, area, pin, theme }) => {
      if (pin) {
        // 저장해 둔 내 핀을 골랐으면 그 핀의 내용을 채우고, 저장하면 새 핀 대신 이 핀에 일정이 연결되게 한다
        const pinSf = pin.storefront && pin.storefront.url ? pin.storefront : null;
        const pinImgs = (Array.isArray(pin.imgs) && pin.imgs.length > 0 ? pin.imgs : (pin.img && !S(pin.img).includes('unsplash') ? [S(pin.img)] : []))
          .filter(u => !pinSf || u !== pinSf.url);
        setNewManualPlaceName(S(pin.name));
        setNewManualLocalName(S(pin.localName));
        setNewManualFeature(pin.signature && S(pin.signature) !== "직접 추가한 장소" ? S(pin.signature) : "");
        setNewManualTheme(S(pin.theme) || "기타");
        setNewManualIsAccommodation(Boolean(pin.isAccommodation));
        setNewManualPhotos(pinImgs);
        setNewManualPhoto(pinImgs[0] || "");
        if (typeof setNewManualStorefront === 'function') setNewManualStorefront(pinSf);
        if (typeof onPickArea === 'function') onPickArea(null);
        if (typeof setClickedLocation === 'function') setClickedLocation({ id: pin.id, lat: pin.lat, lng: pin.lng });
        showToast("📍 저장해 둔 핀을 불러왔어요. 저장하면 이 핀에 일정이 연결돼요.");
        return;
      }
      setNewManualPlaceName(name);
      if (typeof onPickArea === 'function') onPickArea(area || null);
      // 다른 장소를 골랐으면 현지어 이름도 그 장소 것으로 (예전엔 비어 있을 때만 채워서 이전 장소 이름이 남았다 — 4차 A)
      setNewManualLocalName(localName || '');
      // 테마는 아직 '기타'일 때만 고른 장소 분류로 (사용자가 직접 고른 테마는 그대로)
      if (theme && theme !== '기타' && (!newManualThemeRef.current || newManualThemeRef.current === '기타')) {
        setNewManualTheme(theme);
        if (theme === '숙소') setNewManualIsAccommodation(true);
      }
      if (!isNaN(lat) && !isNaN(lng) && typeof setClickedLocation === 'function') {
        setClickedLocation(prev => ({ ...(prev || {}), lat, lng }));
      }
    },
  });
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false); // 좁은 화면에서 "등록된 일정" 미리보기 펼침 여부
  const newManualLocalNameRef = React.useRef(newManualLocalName);
  newManualLocalNameRef.current = newManualLocalName;
  const newManualThemeRef = React.useRef(newManualTheme);
  newManualThemeRef.current = newManualTheme;
  // 기존 일정을 불러오기 직전의 위치(지도 클릭 좌표 등) — "새 일정으로"로 되돌릴 때 복원용
  const locationBeforeLoadRef = React.useRef(null);

  if (!isOpen) return null;

  const border = isDarkMode ? 'border-slate-600' : 'border-slate-200';
  const softBg = isDarkMode ? 'bg-slate-900/40' : 'bg-slate-50/70';
  const inputCls = `w-full ${softBg} border ${border} focus:border-[#007AFF] rounded-2xl px-3.5 py-2.5 text-sm font-medium outline-none focus:ring-4 focus:ring-[#007AFF]/10 transition-all ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`;

  const handlePlaceNameChange = (val) => {
    setNewManualPlaceName(val);
    onQueryChange(val);
  };

  const handleSelectSuggestion = (s) => { selectSuggestion(s); };

  const photoCount = newManualPhotos.length;
  const emptySlotCount = Math.max(0, 3 - photoCount - (photoCount < 3 ? 1 : 0));

  const dayExistingPlans = pinLinkDay
    ? (Array.isArray(planTimeline) ? planTimeline : []).filter(p => p && String(p.day) === String(pinLinkDay) && !isExpenseRecord(p)).sort((a, b) => S(a.time).localeCompare(S(b.time)))
    : [];

  // 기존 일정을 불러와 "그 일정(과 연결된 핀)을 수정"하는 모드로 바꾼다.
  // [버그 수정] 예전엔 ⓐ입력 중인 내용을 경고 없이 덮어쓰고 ⓑ기존 일정에 빈 칸이 있으면 새로 입력한
  // 값이 남아 두 데이터가 섞였고 ⓒ연결된 핀을 모른 채 저장해 핀이 중복 생성되면서 직전에 검색한
  // 장소 좌표가 찍혔다. 이제 모든 칸을 그 일정 값으로 통째로 채우고, 같은 이름의 핀을 수정 대상으로 연결한다.
  const applyExistingPlan = (matched) => {
    const isFreshLoad = !pinLinkPlanId || pinLinkPlanId === 'manual';
    if (isFreshLoad) locationBeforeLoadRef.current = clickedLocation || null;
    setPinLinkPlanId(matched.id);
    setNewManualTime(S(matched.time));
    setNewManualPlaceName(S(matched.place));
    setNewManualLocalName(S(matched.localName));
    setNewManualFeature(matched.features && matched.features !== "직접 추가한 장소" ? S(matched.features) : "");
    setNewManualTheme(S(matched.theme) || "기타");
    setNewManualIsAccommodation(Boolean(matched.isAccommodation));
    setNewManualAccommodationDays(Array.isArray(matched.accommodationDays) ? matched.accommodationDays : []);
    const linkedPin = findPinForPlan(matched, currentRestaurants, planTimeline);
    // 연결된 핀에 가게 앞 사진이 있으면 그 칸에 따로 두고, 직접 올린 사진 목록에서는 뺀다(저장할 때 중복 방지)
    const linkedSf = linkedPin && linkedPin.storefront && linkedPin.storefront.url ? linkedPin.storefront : null;
    const matchedImgs = (Array.isArray(matched.photos) && matched.photos.length > 0 ? matched.photos : (matched.photo ? [matched.photo] : []))
      .filter(u => !linkedSf || u !== linkedSf.url);
    setNewManualPhotos(matchedImgs);
    setNewManualPhoto(matchedImgs[0] || "");
    if (typeof setNewManualStorefront === 'function') setNewManualStorefront(linkedSf);
    if (typeof setClickedLocation === 'function') {
      // 불러온 일정에 연결된 핀이 있으면 그 핀을 고친다. 없으면 지금 창의 위치를 그대로 쓴다 —
      // 핀 수정 창에서 연결 안 된 일정을 불러오면 지금 고치던 핀에 그 일정을 연결하고, 지도를 눌러 연 창이면
      // 그 좌표로 핀을 만든다. (예전엔 null로 비워서 좌표 없는 핀이 새로 생기고 고치던 핀은 따로 남았다 — 4차 F)
      setClickedLocation(linkedPin ? { id: linkedPin.id, lat: linkedPin.lat, lng: linkedPin.lng } : (clickedLocation || null));
    }
    showToast("✨ 선택한 일정을 불러왔어요. 고친 뒤 등록하면 이 일정이 수정돼요.");
  };

  const loadExistingPlan = (id) => {
    const matched = planTimeline.find(p => String(p.id) === String(id));
    if (!matched) return;
    const isFreshLoad = !pinLinkPlanId || pinLinkPlanId === 'manual';
    const hasTypedSomething = isFreshLoad && S(newManualPlaceName).trim() !== "";
    if (hasTypedSomething && typeof showConfirm === 'function') {
      showConfirm(`"${S(matched.place)}" 일정을 불러오면
지금 입력한 내용이 그 일정 내용으로 바뀌어요.
불러올까요?`, () => applyExistingPlan(matched), null, { okLabel: '불러오기' });
      return;
    }
    applyExistingPlan(matched);
  };

  // "새 일정으로"로 되돌리기: 불러왔던 일정 내용을 비우고, 불러오기 전 위치(지도 클릭 좌표 등)를 복원
  const resetToNewPlan = () => {
    setPinLinkPlanId('manual');
    setNewManualTime("");
    setNewManualPlaceName("");
    setNewManualLocalName("");
    setNewManualFeature("");
    setNewManualIsAccommodation(false);
    setNewManualAccommodationDays([]);
    setNewManualPhotos([]);
    setNewManualPhoto("");
    if (typeof setNewManualStorefront === 'function') setNewManualStorefront(null);
    if (typeof setClickedLocation === 'function') setClickedLocation(locationBeforeLoadRef.current);
    locationBeforeLoadRef.current = null;
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[9000] backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto transition-opacity duration-300" onClick={onClose}>
      {/* 넓은 화면: 왼쪽 미니 패널 + 오른쪽 등록 창 / 좁은 화면(휴대폰): 미니 패널이 위로 올라가고 목록은 눌러서 펼침
          (예전엔 휴대폰에서도 왼쪽에 좁게 끼어 있어 둘 다 답답했다) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:justify-center gap-2 w-full max-w-sm sm:max-w-[720px] my-auto mx-auto">

        {/* 미니 패널: Day 선택 + 해당 Day에 이미 등록된 일정 미리보기 */}
        <div
          onClick={e => e.stopPropagation()}
          className={`w-full sm:w-[30%] sm:max-w-[180px] min-w-0 shrink rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[40vh] sm:max-h-[92vh] animate-in zoom-in-95 duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
        >
          <div className={`p-2 border-b shrink-0 space-y-1.5 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
            <select
              value={pinLinkDay}
              onChange={e => { setPinLinkDay(e.target.value); setPinLinkPlanId(""); setNewManualTime(""); }}
              className={`w-full ${isDarkMode ? 'bg-slate-900/40' : 'bg-slate-50'} border ${border} rounded-lg px-1.5 py-1.5 text-[10px] sm:text-[11px] font-bold outline-none focus:border-[#007AFF] transition-all ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}
            >
              <option value="">연동 안 함</option>
              {tripDays.map(d => <option key={d} value={d}>Day {d}</option>)}
              <option value="0">보관함</option>
            </select>
            {pinLinkDay && (
              <button type="button" onClick={() => setIsPreviewOpen(o => !o)} className="w-full flex items-center justify-between px-0.5 sm:cursor-default">
                <span className={`text-[10px] font-semibold ${textMuted}`}><span className="sm:hidden">{isPreviewOpen ? '▾ ' : '▸ '}</span>등록된 일정</span>
                <span className="text-[10px] font-bold text-[#007AFF] bg-[#007AFF]/10 px-1.5 py-0.5 rounded-full shrink-0">{dayExistingPlans.length}</span>
              </button>
            )}
          </div>
          <div className={`${isPreviewOpen ? 'block' : 'hidden'} sm:block flex-1 overflow-y-auto custom-scrollbar p-1.5 sm:p-2 space-y-1.5`}>
            {!pinLinkDay ? (
              <p className={`text-center text-[10px] px-1 py-3 ${textMuted}`}>Day를 선택하면<br />일정 미리보기가 나와요</p>
            ) : dayExistingPlans.length === 0 ? (
              <p className={`text-center text-[10px] px-1 py-3 ${textMuted}`}>이 Day엔 아직<br />등록된 일정이 없어요</p>
            ) : dayExistingPlans.map(p => (
              <button
                type="button"
                key={p.id}
                onClick={() => loadExistingPlan(p.id)}
                className={`w-full text-left rounded-lg border px-1.5 sm:px-2 py-1.5 leading-tight transition-colors ${String(pinLinkPlanId) === String(p.id) ? 'border-[#007AFF] bg-[#007AFF]/10' : (isDarkMode ? 'bg-slate-900/40 border-slate-700 hover:border-[#007AFF]/40' : 'bg-slate-50 border-slate-200 hover:border-[#007AFF]/40')}`}
              >
                {p.time && p.time !== '99:99' && <div className="text-[10px] font-bold text-[#007AFF]">{S(p.time)}</div>}
                <div className={`truncate text-[10px] ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{p.isAccommodation ? '🏠 ' : ''}{S(p.place)}</div>
              </button>
            ))}
          </div>
        </div>

      {/* 좁은 화면(세로로 쌓임)에선 '화면 높이 − 위쪽 미리보기 높이'까지만 커지게 해서, 저장 버튼이 항상 화면 안에 보이게 한다
          (예전엔 미리보기 40vh + 입력창 85vh가 쌓여 버튼이 화면 밖으로 밀렸다). 입력 내용은 안에서 스크롤. */}
      <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} w-full sm:w-auto sm:flex-1 min-w-0 max-w-sm ${isPreviewOpen ? 'max-h-[calc(100dvh-40vh-3rem)]' : 'max-h-[calc(100dvh-7.5rem)]'} sm:max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300`} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={`sticky top-0 z-10 ${isDarkMode ? 'bg-slate-800/95 border-slate-700' : 'bg-white/95 border-slate-100'} backdrop-blur-xl border-b px-4 pt-3.5 pb-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full ${isDarkMode ? 'bg-[#007AFF]/20' : 'bg-[#007AFF]/10'} flex items-center justify-center text-[#007AFF]`}>
                <MapPinPlus className="w-[18px] h-[18px]" />
              </div>
              <h3 className={`text-[15px] font-bold tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                {clickedLocation?.id ? '핀 정보 수정' : '새 일정 및 핀 등록'}
              </h3>
            </div>
            <button onClick={onClose} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-200' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}>
              <X className="w-[18px] h-[18px]" />
            </button>
          </div>
          <div className={`flex items-center justify-between mt-2.5 ${isDarkMode ? 'bg-slate-900/40 border-slate-700' : 'bg-slate-50/80 border-slate-200/70'} border px-3 py-1.5 rounded-xl text-[11px] font-medium ${textMuted}`}>
            <span className="flex items-center gap-1.5 text-[#007AFF] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#007AFF] animate-pulse" />
              {displayCityName && displayCityName !== '선택된 지역 없음' ? `${S(displayCityName)} 여행 일정 연동 모드` : '여행 일정 연동 모드'}
            </span>
            <span className={textMuted}>{pinLinkDay ? (pinLinkDay === '0' ? '보관함' : `Day ${pinLinkDay}`) : '미지정'}</span>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-4 custom-scrollbar scroll-smooth">

          {/* 1. 테마 분류 */}
          <section className="space-y-1.5">
            <label className={`block text-[11px] font-bold uppercase tracking-wider ${textMuted}`}>
              테마 분류 <span className="text-[#007AFF]">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {THEME_OPTIONS.map(opt => {
                const selected = S(newManualTheme || '기타') === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setNewManualTheme(opt.value);
                      // 숙소 테마를 고르면 "숙소로 설정"과 지금 Day 숙박을 자동으로 켜 준다 (따로 체크하는 걸 잊기 쉬움)
                      if (opt.value === '숙소' && !newManualIsAccommodation) {
                        setNewManualIsAccommodation(true);
                        const d = parseInt(pinLinkDay);
                        if (!isNaN(d) && (!Array.isArray(newManualAccommodationDays) || newManualAccommodationDays.length === 0)) setNewManualAccommodationDays([d]);
                      }
                    }}
                    className={`flex items-center justify-center gap-1 py-2.5 px-1.5 rounded-xl border text-[11px] font-semibold transition-all ${selected
                      ? 'border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF]'
                      : (isDarkMode ? 'border-slate-600 bg-slate-900/30 text-slate-300 hover:border-slate-500' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300')}`}
                  >
                    <span>{opt.emoji}</span>
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. 장소 이름 */}
          <section className="space-y-1.5">
            <label className={`block text-xs font-bold ${textMuted}`}>
              장소 이름 <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="예: 에펠탑, 사계창펀"
                value={S(newManualPlaceName)}
                onChange={e => handlePlaceNameChange(e.target.value)}
                onFocus={() => { if (placeSuggestions.length > 0) setShowSuggestions(true); }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                className={`${inputCls} pr-9`}
              />
              {newManualPlaceName.trim() && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#007AFF] pointer-events-none">
                  <Check className="w-[18px] h-[18px]" />
                </div>
              )}
              {showSuggestions && placeSuggestions.length > 0 && (
                <div className={`absolute left-0 right-0 top-full mt-1 rounded-xl border shadow-lg z-20 max-h-52 overflow-y-auto custom-scrollbar ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'}`}>
                  {placeSuggestions.map((s, i) => (
                    <button
                      type="button"
                      key={i}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => handleSelectSuggestion(s)}
                      className={`w-full text-left px-3.5 py-2 text-xs transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50'} ${i !== 0 ? `border-t ${border}` : ''}`}
                    >
                      <div className={`font-semibold truncate ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{s.name}</div>
                      {s.address && <div className={`text-[10px] truncate ${textMuted}`}>{s.address}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 3. 일정 동기화 & 시간 배정 */}
          <section className={`${softBg} border ${border} rounded-2xl p-3.5 space-y-3`}>
            <div className={`flex items-center justify-between border-b ${border} pb-2`}>
              <span className={`text-xs font-bold flex items-center gap-1.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                <Calendar className="w-[18px] h-[18px] text-[#007AFF]" />
                일정 동기화 &amp; 시간 배정
              </span>
              <span className="text-[11px] text-[#007AFF] font-medium bg-[#007AFF]/10 px-2 py-0.5 rounded-full border border-[#007AFF]/20">
                타임라인 연동
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>일정 일자</label>
                <select
                  value={pinLinkDay}
                  onChange={e => { setPinLinkDay(e.target.value); setPinLinkPlanId(""); setNewManualTime(""); }}
                  className={`w-full ${isDarkMode ? 'bg-slate-800' : 'bg-white'} border ${border} rounded-xl px-2.5 py-2 text-xs font-semibold outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}
                >
                  <option value="">-- 연동 안 함 --</option>
                  {tripDays.map(d => <option key={d} value={d}>Day {d}</option>)}
                  <option value="0">📦 보관함 (Day 미정)</option>
                </select>
              </div>
              <div>
                <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>방문 예정 시간</label>
                <input
                  type="text"
                  maxLength="5"
                  placeholder="09:00"
                  disabled={!pinLinkDay}
                  value={S(newManualTime)}
                  onChange={e => handleTimeInput(e, setNewManualTime)}
                  className={`w-full ${isDarkMode ? 'bg-slate-800' : 'bg-white'} border ${border} rounded-xl px-2.5 py-2 text-xs font-semibold text-center outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all disabled:opacity-40 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}
                />
              </div>
            </div>
            {pinLinkDay && (
              <div className="animate-in fade-in duration-300">
                <label className={`flex items-center gap-1 text-[11px] font-semibold mb-1 ${textMuted}`}>
                  <ArrowUpDown className="w-3 h-3" /> 기존 일정 불러오기(수정)
                </label>
                <select
                  value={pinLinkPlanId || 'manual'}
                  onChange={e => {
                    const val = e.target.value;
                    if (val !== 'manual' && val !== '') loadExistingPlan(val);
                    else if (pinLinkPlanId && pinLinkPlanId !== 'manual') resetToNewPlan();
                    else { setPinLinkPlanId(val); setNewManualTime(""); }
                  }}
                  className={`w-full ${isDarkMode ? 'bg-slate-800' : 'bg-white'} border ${border} rounded-xl px-2.5 py-2 text-xs font-medium outline-none focus:border-[#007AFF] cursor-pointer transition-all ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}
                >
                  <option value="manual">➕ 새 일정으로 (시간 직접 입력)</option>
                  {planTimeline.filter(p => p && String(p.day) === String(pinLinkDay) && !isExpenseRecord(p)).map(p => (
                    <option key={p.id} value={p.id}>[{p.time}] {S(p.place)}</option>
                  ))}
                </select>
              </div>
            )}
          </section>

          {/* 4. 메모 / 특징 */}
          <section className="space-y-1.5">
            <label className={`block text-xs font-bold ${textMuted}`}>메모 / 특징</label>
            <textarea
              rows="3"
              placeholder="예: 브레이크 타임 확인 필요, 대표 메뉴 등"
              value={S(newManualFeature)}
              onChange={e => setNewManualFeature(e.target.value)}
              className={`${inputCls} resize-none leading-relaxed`}
            />
          </section>

          {/* 5. 현지어 이름 */}
          <section className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`block text-xs font-bold ${textMuted}`}>
                현지어 이름 <span className="font-normal opacity-70">(택시기사 제시 및 검색용)</span>
              </label>
              <button
                type="button"
                onClick={e => handleCopyLocalName && handleCopyLocalName(e, newManualLocalName)}
                className="text-[11px] text-[#007AFF] hover:underline flex items-center gap-0.5 font-medium transition-colors"
              >
                <Copy className="w-3 h-3" /> 복사 테스트
              </button>
            </div>
            <input
              type="text"
              placeholder="예: 四季肠粉, Eiffel Tower"
              value={S(newManualLocalName)}
              onChange={e => setNewManualLocalName(e.target.value)}
              className={`${inputCls} font-mono`}
            />
          </section>

          {/* 5-1. 가게 앞 사진 (근처 거리 사진 중 고르기) — 직접 올린 사진이 없으면 이게 대표 사진 */}
          {typeof setNewManualStorefront === 'function' && (
            <StorefrontPicker
              lat={clickedLocation?.lat} lng={clickedLocation?.lng}
              value={newManualStorefront} onChange={setNewManualStorefront}
              isDarkMode={isDarkMode} textMuted={textMuted}
            />
          )}

          {/* 6. 사진 첨부 */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={`block text-xs font-bold flex items-center gap-1.5 ${textMuted}`}>
                <span>사진 첨부 (최대 3장)</span>
                <span className={`text-[10px] ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'} px-1.5 py-0.5 rounded font-semibold`}>{photoCount}/3</span>
              </label>
              <span className={`text-[11px] ${textMuted}`}>웹 사진 복사 후 붙여넣기 지원</span>
            </div>
            <input type="file" accept="image/*" multiple ref={manualFileInputRef} onChange={(e) => {
              const files = Array.from(e.target.files || []);
              files.forEach(file => {
                compressAndStoreImage(supabaseClient, appUserId, activeTripId, file, (compressed) => {
                  setNewManualPhotos(prev => {
                    if (prev.length >= 3) return prev;
                    const next = [...prev, compressed];
                    setNewManualPhoto(next[0]);
                    return next;
                  });
                });
              });
              e.target.value = '';
            }} className="hidden" />
            <div className="grid grid-cols-3 gap-2.5">
              {newManualPhotos.map((img, i) => (
                <div key={i} className={`relative aspect-square rounded-2xl overflow-hidden border ${border} group cursor-pointer`}
                     onClick={() => {
                       if (i === 0) return;
                       setNewManualPhotos(prev => { const next = [...prev]; const [sel] = next.splice(i, 1); next.unshift(sel); setNewManualPhoto(next[0]); return next; });
                       showToast('⭐ 대표사진으로 설정했습니다!');
                     }}>
                  <TripImg src={img} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" />
                  {i === 0 && <span className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded-md font-medium">대표</span>}
                  <button type="button" onClick={e => { e.stopPropagation(); setNewManualPhotos(prev => { const n = prev.filter((_, j) => j !== i); setNewManualPhoto(n[0] || ''); return n; }); }} className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-rose-500 transition-colors">
                    <X className="w-[14px] h-[14px]" />
                  </button>
                </div>
              ))}
              {photoCount < 3 && (
                <button type="button" onClick={() => manualFileInputRef.current?.click()} className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all ${isDarkMode ? 'border-slate-600 hover:border-[#007AFF] bg-slate-900/30 text-slate-400 hover:text-[#007AFF]' : 'border-slate-300 hover:border-[#007AFF] bg-slate-50/50 hover:bg-[#007AFF]/5 text-slate-400 hover:text-[#007AFF]'}`}>
                  <Camera className="w-6 h-6" />
                  <span className="text-[10px] font-semibold">사진 추가</span>
                </button>
              )}
              {Array.from({ length: emptySlotCount }).map((_, i) => (
                <div key={`empty-${i}`} className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 ${isDarkMode ? 'border-slate-700 bg-slate-900/20 text-slate-600' : 'border-slate-200 bg-slate-50/30 text-slate-300'}`}>
                  <ImageIcon className="w-[22px] h-[22px]" />
                  <span className="text-[10px]">미등록</span>
                </div>
              ))}
            </div>
            {photoCount < 3 && (
              <div className="relative mt-1">
                <input
                  type="text"
                  placeholder="URL 붙여넣기 후 Enter (웹 사진 복사 후 Ctrl+V)"
                  className={`w-full ${softBg} border ${border} rounded-xl px-3 py-2 text-[11px] font-medium outline-none focus:border-[#007AFF] transition-all pr-8 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const url = e.target.value.trim();
                      if (!url) return;
                      setNewManualPhotos(prev => prev.length < 3 ? [...prev, url] : prev);
                      setNewManualPhoto(url);
                      e.target.value = '';
                    }
                  }}
                  onPaste={e => {
                    const items = e.clipboardData?.items;
                    if (!items) return;
                    for (let i = 0; i < items.length; i++) {
                      if (items[i].type.indexOf('image') !== -1) {
                        e.preventDefault();
                        const file = items[i].getAsFile();
                        compressAndStoreImage(supabaseClient, appUserId, activeTripId, file, compressed => {
                          setNewManualPhotos(prev => prev.length < 3 ? [...prev, compressed] : prev);
                          setNewManualPhoto(compressed);
                        });
                        e.target.value = '';
                        return;
                      }
                    }
                  }}
                />
                <LinkIcon className={`w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 ${textMuted}`} />
              </div>
            )}
          </section>

          {/* 7. 숙소 설정 */}
          <section>
            <label className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all ${isDarkMode ? 'border-slate-700 bg-slate-900/30 hover:border-[#007AFF]/50 hover:bg-[#007AFF]/10' : 'border-slate-200/80 bg-slate-50/60 hover:border-[#007AFF]/40 hover:bg-[#007AFF]/5'}`}>
              <input type="checkbox" checked={newManualIsAccommodation} onChange={e => { setNewManualIsAccommodation(e.target.checked); if (!e.target.checked) setNewManualAccommodationDays([]); }} className="accent-[#007AFF] w-4 h-4 rounded cursor-pointer" />
              <div className={`flex items-center gap-1.5 text-xs font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                <span className="text-sm">🏠</span>
                <span>이 장소를 {pinLinkDay && pinLinkDay !== '0' ? `Day ${pinLinkDay} ` : ''}대표 숙소로 설정</span>
              </div>
            </label>
            {newManualIsAccommodation && tripDays.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 px-1">
                <span className={`text-[10px] font-bold ${textMuted}`}>숙박 Day:</span>
                {tripDays.map(d => (
                  <button key={d} type="button"
                    onClick={() => setNewManualAccommodationDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${newManualAccommodationDays.includes(d) ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-sm' : (isDarkMode ? 'bg-slate-700 text-slate-300 border-slate-600' : 'bg-white text-slate-500 border-slate-300')}`}>
                    D{d}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Bottom Sticky Action Bar */}
        <div className={`shrink-0 ${isDarkMode ? 'bg-slate-800/95 border-slate-700' : 'bg-white/95 border-slate-100'} backdrop-blur-xl border-t px-4 py-3 flex items-center gap-2.5`}>
          <button onClick={() => handleManualPlaceAdd(false)} className={`flex-1 py-3 px-3 ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5 active:scale-95`}>
            <Bookmark className="w-[18px] h-[18px]" />
            <span>임시 저장</span>
          </button>
          <button onClick={() => handleManualPlaceAdd(true)} className="flex-[2] py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-1.5 active:scale-95">
            <MapPinPlus className="w-[18px] h-[18px]" />
            <span>일정 &amp; 지도에 핀 등록</span>
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default AddPlaceModal;
