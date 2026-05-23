import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

/*
  =============================================================================
  [모바일 최적화 및 Vercel 빌드 무결성 100% 코드]
  - 1. 모바일 환율창 가로 스크롤 제거 및 자동 리사이징 Grid 적용
  - 2. 모바일 대시보드 좌우 병렬 배치 및 드래그형 크기 조절바(Resizer) 구현
  - 3. 모바일 일정(Plan) 탭 개별 스크롤 제거 -> 전체 화면 스크롤 통합
  - 4. 대시보드 전용 준비물 확인 모달 분리 및 퀵 버튼 추가
  - 5. 헤더 날씨 버튼 레이어(Z-index) 오류 수정 및 클릭 활성화
  - 6. 날씨 상세 정보 모달창 추가 및 여행 날짜 기반 날씨 동기화 로직 적용
  - 7. 요소/글자 개별 크기 조절 분리 및 슝/뽕 롤백 기능 추가
  - 8. 국가/지역 선택 데이터 로컬/DB 영구 저장 및 재접속 시 자동 복구 로직 추가
  - 9. 교통/항공권 일괄 등록 및 모바일 Hover 대체 기능 적용
  - 10. 중복 렌더링 블록 제거 및 JSX 태그 매칭 오류 완벽 수정 (HOTFIX)
  - 11. 클립보드 이미지 Paste 전역 지원 및 여행 간 전환/생성 시 데이터 꼬임 방지 로직 적용
  - 12. 메뉴 창 유지 및 더블클릭 생성 버그 차단, 전역 모션 스무딩(최적화)
  - 13. 교통편 상태 완벽 분리, 항공권 병렬 배치 및 좌석 번호 표시, 잘림 오류 완벽 복구
  - 14. [FIX] 윈도우 사용자 배려 폰트(맑은 고딕 등) 설정 기능 추가
  - 15. [FIX] 모바일 가로모드(Landscape) 대응 동적 스크롤(min-h) 최적화
  - 16. [FIX] 공유 여행 영구 리스트업 및 '내 일정으로 가져오기(복사/업데이트)' 기능 추가
  - 17. [FIX] 공유 참여자 '강퇴(중지)' 기능 및 커스텀 확인 모달 구현 완료
  - 18. [NEW] 숙박 일정 모든 일차 최상단 연박 고정 렌더링 및 개별 수정 적용
  - 19. [NEW] 핀 기존 일정 연동 시 데이터 자동 채움 및 수동입력 UI 스무딩 적용
  - 20. [NEW] 내 핀 목록 Day별 / 미지정 필터 탭 추가 및 [일단 저장하기] 분리
  - 21. [NEW] ResizeObserver 기반 Leaflet 지도 탭 전환 잔상 오류 100% 최적화
  - 22. [NEW] 미지정 일정 [보관함(Day 0)] 등록 기능 및 3열 팝업 모달 적용
  - 23. [NEW] 사진 등록 영역 (URL/복붙창 vs 파일첨부버튼) 반반 분할 UI 적용
  - 24. [NEW] 항공권 타임라인 자동 등록 및 모든 교통편(버스/기차) 출/도착 시간 반영
  - 25. [NEW] 교통편 타임라인 상세 조회(Click) 및 개별 자유 수정(Edit) 활성화
  =============================================================================
*/

const SUPABASE_URL = "https://xpvzziofihamhavulwbz.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_nWReXsVlfI4QM0bOuw1A2g_uikm8CVl";

const CURRENCIES = [
  { code: 'KRW', label: 'KRW', sym: '₩', unit: 1 },
  { code: 'USD', label: 'USD', sym: '$', unit: 1 },
  { code: 'JPY', label: 'JPY(100)', sym: '¥', unit: 100 },
  { code: 'EUR', label: 'EUR', sym: '€', unit: 1 },
  { code: 'CNY', label: 'CNY', sym: '元', unit: 1 }
];

const REGIONS_BY_COUNTRY = {
  "한국": ["서울", "부산", "제주", "인천", "경주", "순천"],
  "일본": ["도쿄", "오사카", "후쿠오카", "교토", "삿포로", "구마모토", "나고야", "히로시마", "나라", "요코하마", "고베", "센다이", "가나자와", "오키나와"],
  "프랑스": ["파리", "니스", "마르세유", "리옹"],
  "미국": ["뉴욕", "로스앤젤레스", "시카고", "하와이", "샌프란시스코"],
  "대만": ["타이베이", "가오슝", "타이중"],
  "이탈리아": ["로마", "밀라노", "베네치아", "피렌체"],
  "태국": ["방콕", "치앙마이", "푸껫", "파타야"],
  "베트남": ["다낭", "하노이", "호찌민", "나트랑"],
  "중국": ["베이징", "상하이", "칭다오", "청두", "대련"],
  "영국": ["런던", "에든버러", "맨체스터", "리버풀"],
  "스페인": ["바르셀로나", "마드리드", "세비야"],
  "독일": ["베를린", "뮌헨", "프랑크푸르트"],
  "호주": ["시드니", "멜버른", "브리즈번"]
};

// 외부 URL 열기 - 네이티브는 Browser 플러그인, 웹은 window.open
async function openExternalUrl(url) {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url });
  } else {
    window.open(url, '_blank');
  }
}

// 구글 맵 길 안내 실행
function openGoogleMapsNav(lat, lng, mode = 'driving') {
  const dest = `${lat},${lng}`;
  const dirMode = mode === 'driving' ? 'driving' : mode === 'transit' ? 'transit' : 'walking';
  const url = `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=${dirMode}`;
  openExternalUrl(url);
}

const CITY_NAME_TO_EN = {
  "서울": "Seoul", "부산": "Busan", "제주": "Jeju", "인천": "Incheon", "경주": "Gyeongju", "순천": "Suncheon",
  "도쿄": "Tokyo", "오사카": "Osaka", "후쿠오카": "Fukuoka", "교토": "Kyoto", "삿포로": "Sapporo",
  "구마모토": "Kumamoto", "나고야": "Nagoya", "히로시마": "Hiroshima", "나라": "Nara",
  "요코하마": "Yokohama", "고베": "Kobe", "센다이": "Sendai", "가나자와": "Kanazawa", "오키나와": "Okinawa",
  "파리": "Paris", "니스": "Nice", "마르세유": "Marseille", "리옹": "Lyon",
  "뉴욕": "New York", "로스앤젤레스": "Los Angeles", "시카고": "Chicago", "하와이": "Honolulu", "샌프란시스코": "San Francisco",
  "타이베이": "Taipei", "가오슝": "Kaohsiung", "타이중": "Taichung",
  "로마": "Rome", "밀라노": "Milan", "베네치아": "Venice", "피렌체": "Florence",
  "방콕": "Bangkok", "치앙마이": "Chiang Mai", "푸껫": "Phuket", "파타야": "Pattaya",
  "다낭": "Da Nang", "하노이": "Hanoi", "호찌민": "Ho Chi Minh City", "나트랑": "Nha Trang",
  "베이징": "Beijing", "상하이": "Shanghai", "칭다오": "Qingdao", "청두": "Chengdu", "대련": "Dalian",
  "런던": "London", "에든버러": "Edinburgh", "맨체스터": "Manchester", "리버풀": "Liverpool",
  "바르셀로나": "Barcelona", "마드리드": "Madrid", "세비야": "Seville",
  "베를린": "Berlin", "뮌헨": "Munich", "프랑크푸르트": "Frankfurt",
  "시드니": "Sydney", "멜버른": "Melbourne", "브리즈번": "Brisbane"
};

function S(val) {
  try {
    if (val === null || val === undefined) return "";
    if (typeof val === 'object') {
      if (val.text && val.icon) return `${val.icon} ${val.text}`; 
      return ""; 
    }
    return String(val);
  } catch (e) {
    return "";
  }
}

function getWeatherInfo(code) {
  if (code === 0) return ["맑음", "☀️"];
  if ([1, 2, 3].includes(code)) return ["흐림", "🌤️"];
  if ([45, 48].includes(code)) return ["안개", "🌫️"];
  if (code >= 51 && code <= 67) return ["비", "☔"];
  if (code >= 71 && code <= 77) return ["눈", "❄️"];
  if (code >= 80 && code <= 99) return ["폭우/뇌우", "⛈️"];
  return ["평온", "☁️"];
}

function compressImage(file, callback) {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (e) => {
    const img = new Image();
    img.src = e.target.result;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scaleSize = 500 / img.width;
      canvas.width = 500;
      canvas.height = img.height * scaleSize;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      callback(canvas.toDataURL('image/jpeg', 0.6));
    }
  };
}

const SelectOrInput = ({ value, manualValue, onChangeSelect, onChangeManual, onCancelManual, options, placeholder, isDarkMode, appTheme, inputId }) => {
  let textColorClass = "text-slate-900";
  let placeholderClass = "placeholder-slate-400";
  
  if (appTheme === 'dark') { textColorClass = "text-white"; placeholderClass = "placeholder-slate-500"; }
  else if (appTheme === 'pastel') { textColorClass = "text-pink-900"; placeholderClass = "placeholder-pink-300"; }
  else if (appTheme === 'clean') { textColorClass = "text-zinc-900"; placeholderClass = "placeholder-zinc-400"; }

  const handleSelect = (e) => {
    onChangeSelect(e);
    if (e.target.value === '수동입력') {
      setTimeout(() => {
        const el = document.getElementById(inputId);
        if (el) el.focus();
      }, 50);
    }
  };

  if (value === '수동입력') {
    return (
      <div className="relative w-full h-full flex items-center">
        <input 
          id={inputId}
          type="text" 
          value={S(manualValue)} 
          onChange={e => onChangeManual(e.target.value)} 
          placeholder={placeholder || "직접입력"} 
          className={`w-full bg-transparent text-[10px] font-bold outline-none ${textColorClass} ${placeholderClass} pr-5 transition-all duration-300`}
        />
        <button onClick={onCancelManual} className={`absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center h-full px-2 text-xs ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'} transition-colors duration-300`}>✕</button>
      </div>
    );
  }
  return (
    <select 
      value={S(value)} 
      onChange={handleSelect} 
      disabled={options === null}
      className={`w-full bg-transparent text-[10px] font-bold outline-none ${textColorClass} cursor-pointer appearance-none pr-3 transition-all duration-300`}
    >
      <option value="">선택</option>
      {options && Array.isArray(options) && options.map(o => <option key={S(o)} value={S(o)}>{S(o)}</option>)}
      <option value="수동입력">수동입력</option>
    </select>
  );
};

const MainApp = () => {
  const [supabaseClient, setSupabaseClient] = useState(null);
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const [appUserId, setAppUserId] = useState(null);
  
  const [showIdSetup, setShowIdSetup] = useState(true);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false); 
  const [idInput, setIdInput] = useState("");
  const [pwInput, setPwInput] = useState("");
  const [idError, setIdError] = useState("");
  const [saveCredentials, setSaveCredentials] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const [trips, setTrips] = useState([{ id: 'default', name: '🛫 나의 첫 번째 여행' }]);
  const [activeTripId, setActiveTripId] = useState('default');
  const [sharedTripId, setSharedTripId] = useState(null);
  const [pendingInvite, setPendingInvite] = useState(null);
  const [inviteIdInput, setInviteIdInput] = useState("");
  const [sharedUsers, setSharedUsers] = useState([]);
  const [isSubmittingTrip, setIsSubmittingTrip] = useState(false); 
  const [kickUserTarget, setKickUserTarget] = useState(null); 

  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [expandedWeatherDay, setExpandedWeatherDay] = useState(null);
  const [hourlyWeatherCache, setHourlyWeatherCache] = useState({});
  const [isLoadingHourly, setIsLoadingHourly] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [appTheme, setAppTheme] = useState('light');
  
  const [elementScale, setElementScale] = useState(1);
  const [fontScale, setFontScale] = useState(1);
  
const [appFont, setAppFont] = useState("'Pretendard', -apple-system, sans-serif");
  const [appTextColor, setAppTextColor] = useState("default"); // [NEW] 앱 글자 색상 상태 추가
  const [myLocationIcon, setMyLocationIcon] = useState("🚗"); // [NEW] 배민 스타일 위치 캐릭터 상태
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tripModal, setTripModal] = useState({ isOpen: false, mode: 'add', name: '' });
  const [tripToDelete, setTripToDelete] = useState(null);

  const [rates, setRates] = useState({ USD: 1, KRW: 1350, JPY: 150, EUR: 0.92, CNY: 7.2 });
  const [loadingRates, setLoadingRates] = useState(false);
  const [errorRates, setErrorRates] = useState(null);
  const [focusedCurrency, setFocusedCurrency] = useState(null);
  const [activeCurrency, setActiveCurrency] = useState('KRW'); 
  const [amount, setAmount] = useState('');

  const [planTimeline, setPlanTimeline] = useState([]);
  const [currentRestaurants, setCurrentRestaurants] = useState([]);
  const currentRestaurantsRef = useRef(currentRestaurants); 
  const [displayCityName, setDisplayCityName] = useState("선택된 지역 없음");
  const [travelStartDate, setTravelStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [maxDay, setMaxDay] = useState(4);
  const [dashboardDay, setDashboardDay] = useState(1);
  
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoingRef = useRef(false);
  const [isReadyToTrack, setIsReadyToTrack] = useState(false);

  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const [globalPlanCountry, setGlobalPlanCountry] = useState("");
  const [globalPlanRegion, setGlobalPlanRegion] = useState("");
  const [globalManualCountry, setGlobalManualCountry] = useState("");
  const [globalManualRegion, setGlobalManualRegion] = useState("");

  const [newDay, setNewDay] = useState(1);
  const [newTime, setNewTime] = useState("");
  const [newPlace, setNewPlace] = useState("");
  const [newLocalName, setNewLocalName] = useState("");
  const [newFeatures, setNewFeatures] = useState("");
  const [newPhoto, setNewPhoto] = useState("");
  const [newIsAccommodation, setNewIsAccommodation] = useState(false);
  const [planCountry, setPlanCountry] = useState("");
  const [planRegion, setPlanRegion] = useState("");
  const [manualCountry, setManualCountry] = useState("");
  const [manualRegion, setManualRegion] = useState("");
  const planFileInputRef = useRef(null);

  const [editingPlan, setEditingPlan] = useState(null);
  const editFileInputRef = useRef(null);

  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylinesRef = useRef([]);
  const [isPinMode, setIsPinMode] = useState(false);
  const isPinModeRef = useRef(isPinMode);
  
  const [movingPinId, setMovingPinId] = useState(null);
  const movingPinIdRef = useRef(movingPinId);
  const [pendingMove, setPendingMove] = useState(null);

  const [markerSearchQuery, setMarkerSearchQuery] = useState("");
  const [showMapLabels, setShowMapLabels] = useState(false); 
  const [showMapPhotos, setShowMapPhotos] = useState(false); 
  const [showMapRoute, setShowMapRoute] = useState(false);
  const [mapActiveDays, setMapActiveDays] = useState(['all']);
  const [myPinsFilter, setMyPinsFilter] = useState('all');
  const [myPinsThemeFilter, setMyPinsThemeFilter] = useState('all');
  const [newManualTheme, setNewManualTheme] = useState('기타');
 

  const toggleMapDay = useCallback((day) => {
    setMapActiveDays(prev => {
      if (day === 'all') return ['all'];
      let newDays = prev.filter(d => d !== 'all');
      if (newDays.includes(day)) {
        newDays = newDays.filter(d => d !== day);
      } else {
        newDays.push(day);
      }
      if (newDays.length === 0) return ['all'];
      return newDays;
    });
  }, []);

  const [isAddPlaceModalOpen, setIsAddPlaceModalOpen] = useState(false);
  const [isMyPinsModalOpen, setIsMyPinsModalOpen] = useState(false);
  const [isNavModalOpen, setIsNavModalOpen] = useState(false);
  const [navOrigin, setNavOrigin] = useState(null);
  const [navDest, setNavDest] = useState(null);
  const [navWaypoints, setNavWaypoints] = useState([]);
  const [navSelectingFor, setNavSelectingFor] = useState(null); // 'origin' | 'dest' | number(waypoint index)
  const [clickedLocation, setClickedLocation] = useState(null);
  const [newManualPlaceName, setNewManualPlaceName] = useState("");
  const [newManualLocalName, setNewManualLocalName] = useState("");
  const [newManualFeature, setNewManualFeature] = useState("");
  const [newManualPhoto, setNewManualPhoto] = useState("");
  const [newManualTime, setNewManualTime] = useState(""); 
  const [newManualIsAccommodation, setNewManualIsAccommodation] = useState(false);
  const [newManualIsLandmark, setNewManualIsLandmark] = useState(false);
  const [pinLinkDay, setPinLinkDay] = useState("");
  const [pinLinkPlanId, setPinLinkPlanId] = useState("");
  const manualFileInputRef = useRef(null);

  const [viewPhoto, setViewPhoto] = useState(null);
  const mapInitFlyDoneRef = useRef(false); // 지도 최초 자동 이동 완료 여부
  
  const [selectedPlanInfo, setSelectedPlanInfo] = useState(null); 
  const [selectedPinInfo, setSelectedPinInfo] = useState(null);
  const [pinQuickView, setPinQuickView] = useState(null);
  const [isSettleMode, setIsSettleMode] = useState(false);
  const [newTheme, setNewTheme] = useState("기타");
  const [pinSelectOpen, setPinSelectOpen] = useState(false);
  const [settleLocal, setSettleLocal] = useState("");
  const [settleKrw, setSettleKrw] = useState("");

  const [flights, setFlights] = useState({ outbound: null, inbound: null });
  const [packingList, setPackingList] = useState([]);
  const [isDashboardPackingOpen, setIsDashboardPackingOpen] = useState(false);
  const [expenseFilterDay, setExpenseFilterDay] = useState('all');
  const [expenseFilterTheme, setExpenseFilterTheme] = useState('all'); 
  const [shoppingList, setShoppingList] = useState([]);
  const [isShoppingModalOpen, setIsShoppingModalOpen] = useState(false);
  const [newShoppingItem, setNewShoppingItem] = useState("");
  const [newShoppingPhoto, setNewShoppingPhoto] = useState(""); // [NEW] 쇼핑 사진 첨부 상태
  const shoppingFileInputRef = useRef(null); // [NEW] 쇼핑 사진 DOM Ref
  const [refreshTrigger, setRefreshTrigger] = useState(0); // [NEW] 당겨서 새로고침 (PTR) 트리거
  const [pullDistance, setPullDistance] = useState(0); // [NEW] 당겨서 새로고침 거리
  const [isRefreshing, setIsRefreshing] = useState(false); // [NEW] 새로고침 중 상태
  const [shoppingLinkPlanId, setShoppingLinkPlanId] = useState("");
  const [shoppingItemDay, setShoppingItemDay] = useState("");
  const [shoppingItemTheme, setShoppingItemTheme] = useState("쇼핑");
  const [showAllShopping, setShowAllShopping] = useState(true);
  const [shoppingFilterTheme, setShoppingFilterTheme] = useState("all");
  const [isDashboardShoppingOpen, setIsDashboardShoppingOpen] = useState(false);
  const [dashShowAllShopping, setDashShowAllShopping] = useState(false);
  const [dashShoppingFilterTheme, setDashShoppingFilterTheme] = useState("all");
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isTransportModalOpen, setIsTransportModalOpen] = useState(false);
  const [transType, setTransType] = useState('flight'); 
  const [transDir, setTransDir] = useState('outbound'); 
  
  const initialTransState = { airline: '', flightNum: '', seatNum: '', dep: '', arr: '', depTime: '', arrTime: '', day: 1 };
  const [modalTransData, setModalTransData] = useState({
    flight: { outbound: { ...initialTransState }, inbound: { ...initialTransState } },
    train: { outbound: { ...initialTransState }, inbound: { ...initialTransState } },
    bus: { outbound: { ...initialTransState }, inbound: { ...initialTransState } }
  });

  const [panelRatio, setPanelRatio] = useState(50); 
  const dragRef = useRef(false);

const [activeMobileCard, setActiveMobileCard] = useState(null);
  // [추가] 여행일기 작성을 위한 상태 변수
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);
  const [diaryRating, setDiaryRating] = useState(0);
  const [diaryReview, setDiaryReview] = useState("");
// [정리 완료] 중복 선언을 제거하고 하나로 합쳤습니다.
// [정리 완료] 중복 선언 에러 해결: 변수들을 하나씩만 정의했습니다.
  const [isPackingModalOpen, setIsPackingModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null); // [NEW] 길게 눌러 수정 중인 아이디
  const longPressTimer = useRef(null);

  // [NEW] 길게 누르기 감지 공통 함수
  const startLongPress = (id) => {
    longPressTimer.current = setTimeout(() => {
      setEditingItemId(id);
      showToast("✏️ 편집 모드가 활성화되었습니다.");
    }, 600); // 0.6초간 누르면 활성화
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };  const [archiveFilterYear, setArchiveFilterYear] = useState('all');
  const [archiveFilterLocation, setArchiveFilterLocation] = useState('all');
  const isDarkMode = appTheme === 'dark';

  const DAY_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#a855f7', '#ec4899', '#06b6d4', '#f97316', '#8b5cf6'];
  const getDayColor = useCallback((day) => DAY_COLORS[(parseInt(day) - 1) % DAY_COLORS.length], [DAY_COLORS]);

  const activeContextRef = useRef({ editingPlan, isAddPlaceModalOpen, activeTab });
  useEffect(() => {
    activeContextRef.current = { editingPlan, isAddPlaceModalOpen, activeTab };
  }, [editingPlan, isAddPlaceModalOpen, activeTab]);

  // 일기 자동저장용: 항상 최신 값을 ref로 추적
  const prevDiaryPlanIdRef = useRef(null);
  const diaryRatingRef = useRef(0);
  const diaryReviewRef = useRef("");
  const planTimelineRef = useRef([]);
  const currentRestaurantsRef2 = useRef([]);

  useEffect(() => {
    currentRestaurantsRef.current = currentRestaurants;
  }, [currentRestaurants]);

  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      let imageFile = null;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          imageFile = items[i].getAsFile();
          break;
        }
      }

      if (imageFile) {
        compressImage(imageFile, (compressedBase64) => {
          const ctx = activeContextRef.current;
          if (ctx.editingPlan) {
            setEditingPlan(prev => ({...prev, photo: compressedBase64}));
            showToast("📋 복사된 이미지가 붙여넣기 되었습니다!");
          } else if (ctx.isAddPlaceModalOpen) {
            setNewManualPhoto(compressedBase64);
            showToast("📋 핀 사진에 이미지가 붙여넣어 졌습니다!");
          } else if (ctx.activeTab === 'plan') {
            setNewPhoto(compressedBase64);
            showToast("📋 스케줄 사진에 이미지가 붙여넣어 졌습니다!");
          }
        });
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const syncCountryRegionFromCityName = useCallback((cityName, timeline = []) => {
    if (!cityName || cityName === "선택된 지역 없음") return;
    let matchedCountry = "";
    for (const [c, rArray] of Object.entries(REGIONS_BY_COUNTRY)) {
        if (rArray.includes(cityName)) {
            matchedCountry = c;
            break;
        }
    }
    if (matchedCountry) {
        setGlobalPlanCountry(matchedCountry);
        setGlobalPlanRegion(cityName);
        setGlobalManualCountry("");
        setGlobalManualRegion("");
    } else {
        setGlobalPlanRegion("수동입력");
        setGlobalManualRegion(cityName);
        const plan = (timeline || []).find(p => p && p.region === cityName);
        if (plan && plan.country) {
            if (Object.keys(REGIONS_BY_COUNTRY).includes(plan.country)) {
               setGlobalPlanCountry(plan.country);
               setGlobalManualCountry("");
            } else {
               setGlobalPlanCountry("수동입력");
               setGlobalManualCountry(plan.country);
            }
        } else {
            setGlobalPlanCountry("수동입력");
        }
    }
  }, []);
  
  function getDateStringForDay(dayIndex) {
    if (!travelStartDate) return "";
    const targetDate = new Date(travelStartDate);
    targetDate.setDate(targetDate.getDate() + (parseInt(dayIndex) - 1));
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const getWeatherForDay = useCallback((dayIndex) => {
    if (!travelStartDate || !Array.isArray(forecast) || forecast.length === 0) return null;
    const targetDateStr = getDateStringForDay(dayIndex);
    const found = forecast.find(f => f && f.date === targetDateStr);
    return found ? getWeatherInfo(found.code) : null;
  }, [travelStartDate, forecast]);

  function showToast(msg) {
    setToastMsg(S(msg));
    setTimeout(() => setToastMsg(""), 3000);
  }

  function getDayDateString(dayNum) {
    if (dayNum === 0) return "미지정 (보관함)";
    if (!travelStartDate) return "";
    const date = new Date(travelStartDate);
    date.setDate(date.getDate() + (parseInt(dayNum) - 1));
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    return `${date.getMonth() + 1}/${date.getDate()}(${dayNames[date.getDay()]})`;
  }

  function handleCopyLocalName(e, text) {
    if (e) e.stopPropagation();
    if (!text) {
      showToast("복사할 현지어가 없습니다.");
      return;
    }
    const safeText = S(text);
    const textArea = document.createElement("textarea");
    textArea.value = safeText;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showToast(`'${safeText}' 현지어가 복사되었습니다! 📋`);
    } catch (err) {
      showToast("복사에 실패했습니다.");
    }
    textArea.remove();
  }

  function openEditPinModal(pin) {
    if (!pin) return;
    setClickedLocation({ lat: pin.lat, lng: pin.lng, id: pin.id });
    setNewManualPlaceName(S(pin.name));
    setNewManualLocalName(S(pin.localName));
    setNewManualFeature(pin.signature === "직접 추가한 장소" ? "" : S(pin.signature));
    setNewManualPhoto(pin.img && !S(pin.img).includes("unsplash") ? S(pin.img) : "");
    setNewManualIsAccommodation(Boolean(pin.isAccommodation));
    setNewManualIsLandmark(Boolean(pin.isLandmark));
    setNewManualTheme(pin.theme ? S(pin.theme) : "기타");

    const safePlanTimeline = Array.isArray(planTimeline) ? planTimeline.filter(Boolean) : [];
    const linkedPlan = safePlanTimeline.find(p => p && S(p.place) === S(pin.name));
    
    if (linkedPlan) {
      setPinLinkDay(S(linkedPlan.day));
      setPinLinkPlanId(S(linkedPlan.id));
      setNewManualTime(S(linkedPlan.time));
    } else {
      setPinLinkDay("");
      setPinLinkPlanId("");
      setNewManualTime("");
    }

    setIsAddPlaceModalOpen(true);
  }

  async function fetchRealTimeRates(isManual = false) {
    try {
      setLoadingRates(true);
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!res.ok) throw new Error('Data fetch failed');
      const data = await res.json();
      setRates({ USD: 1, KRW: data.rates.KRW, JPY: data.rates.JPY, EUR: data.rates.EUR, CNY: data.rates.CNY });
      setErrorRates(null);
      if (isManual) showToast("💱 최신 환율로 동기화되었습니다.");
    } catch (e) {
      setErrorRates("환율 서버 연결 실패");
      if (isManual) showToast("환율 동기화에 실패했습니다.");
    } finally {
      setLoadingRates(false);
    }
  }

const fetchWeatherData = useCallback(async (cityName) => {
    console.log("🌤️ [1] 날씨 호출 시작. 타겟 지역:", cityName);
    
    // 객체 충돌 방지 및 문자열 변환
    const safeCityName = typeof cityName === 'string' ? cityName : S(cityName);

    if (!safeCityName || safeCityName === "선택된 지역 없음" || safeCityName === "글로벌" || safeCityName === "수동입력") {
      setWeather(null); setForecast([]); 
      console.log("🚨 [2] 유효하지 않은 지역명으로 호출 중단됨.");
      return;
    }

    try {
      const queryName = CITY_NAME_TO_EN[safeCityName] || safeCityName;
      console.log(`🌤️ [3] '${safeCityName}' → '${queryName}' 좌표 검색 중...`);
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryName)}&limit=1&accept-language=en`);
      const geoData = await geoRes.json();

      // [핵심 버그 수정] 좌표를 못 찾았을 때 조용히 죽는 문제 해결
      if (!geoData || geoData.length === 0) {
          console.warn(`🚨 [4] 에러: '${safeCityName}'의 위도/경도 좌표를 찾을 수 없습니다! (영어로 적거나 지역명을 변경해보세요)`);
          setWeather(null); 
          setForecast([]); 
          return;
      }

      const { lat, lon } = geoData[0];
      console.log(`🌤️ [5] 좌표 획득 성공! 위도:${lat}, 경도:${lon}. 날씨 API 요청 시작.`);

      if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([parseFloat(lat), parseFloat(lon)], 13);
      }

      const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=16`);
      const wData = await wRes.json();
      
      console.log("🌤️ [6] 날씨 API 응답 성공 데이터:", wData); 
      
      if (wData.current) setWeather({ temp: Math.round(wData.current.temperature_2m), code: wData.current.weather_code });
      
      if (wData.daily && Array.isArray(wData.daily.time)) {
        setForecast(wData.daily.time.map((t, i) => ({
          date: S(t), code: wData.daily.weather_code[i], max: Math.round(wData.daily.temperature_2m_max[i]), min: Math.round(wData.daily.temperature_2m_min[i])
        })));
        console.log("🌤️ [7] 화면에 날씨 데이터 세팅 완료!");
      }
    } catch (e) { 
      console.error("🚨 [8] 치명적 에러 발생:", e); 
    }
  }, []);

    // [NEW] 특정 지역의 시간대별 날씨를 캐싱 및 호출
  const fetchRegionHourlyWeather = async (regionName) => {
      if (!regionName || regionName === "수동입력" || regionName === "선택된 지역 없음" || regionName === "글로벌") return null;
      if (hourlyWeatherCache[regionName]) return hourlyWeatherCache[regionName]; 
      try {
          const queryRegion = CITY_NAME_TO_EN[S(regionName)] || S(regionName);
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryRegion)}&limit=1&accept-language=en`);
          const geoData = await geoRes.json();
          if (!geoData.length) return null;
          const { lat, lon } = geoData[0];
          const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weather_code&timezone=auto&forecast_days=16`);
          const wData = await wRes.json();
          setHourlyWeatherCache(prev => ({ ...prev, [regionName]: wData.hourly }));
          return wData.hourly;
      } catch (e) { console.error(e); return null; }
  };

  // [NEW] 날씨 일자 클릭 시, 일정 타임라인을 분석해 여러 지역의 날씨를 동시 로드
  const handleWeatherDayClick = async (day) => {
      if (expandedWeatherDay === day) {
          setExpandedWeatherDay(null);
          return;
      }
      setExpandedWeatherDay(day);
      setIsLoadingHourly(true);

      const dayPlans = (Array.isArray(planTimeline) ? planTimeline : [])
          .filter(p => parseInt(p.day) === day && p.region && p.region !== '수동입력')
          .sort((a, b) => S(a.time).localeCompare(S(b.time)));

      let uniqueRegions = new Set();
      let defaultRegion = displayCityName;
      if (dayPlans.length > 0) defaultRegion = dayPlans[0].region;
      uniqueRegions.add(defaultRegion);
      dayPlans.forEach(p => uniqueRegions.add(p.region));

      for (const region of uniqueRegions) {
          await fetchRegionHourlyWeather(region);
      }
      setIsLoadingHourly(false);
  };

const saveToDb = useCallback(async (updates) => {
    console.log("💾 [DB 저장] Supabase로 전송되는 최종 Payload 데이터:", updates);
    const targetId = activeTripId;
    try {
      const allStr = localStorage.getItem('my_travel_states') || '{}';
      const all = JSON.parse(allStr);
      all[targetId] = { ...(all[targetId] || {}), ...updates };
      localStorage.setItem('my_travel_states', JSON.stringify(all));
    } catch (e) {
      console.error("Local save error", e);
    }

    if (supabaseClient && appUserId && appUserId !== "Guest") {
      try {
        const { error } = await supabaseClient.from('travel_state').update(updates).eq('id', targetId);
        if (error && error.code === '42703') {
           const safeUpdates = {};
           if ('display_city_name' in updates) safeUpdates.display_city_name = updates.display_city_name;
           if ('travel_start_date' in updates) safeUpdates.travel_start_date = updates.travel_start_date;
           if ('current_restaurants' in updates) safeUpdates.current_restaurants = updates.current_restaurants;
           if ('plan_timeline' in updates) safeUpdates.plan_timeline = updates.plan_timeline;
           if (Object.keys(safeUpdates).length > 0) {
              await supabaseClient.from('travel_state').update(safeUpdates).eq('id', targetId);
           }
        }
      } catch (err) { console.error(err); }
    }
  }, [activeTripId, supabaseClient, appUserId]);

  function handleForceSave() {
    saveToDb({
      display_city_name: displayCityName,
      travel_start_date: travelStartDate,
      current_restaurants: currentRestaurants,
      plan_timeline: planTimeline,
      flights: flights,
      packing_list: packingList, shopping_list: shoppingList
    });
    showToast("💾 전체 일정이 문서함(내 여행 목록)에 안전하게 저장되었습니다!");
  }

  async function handleCloneSharedTrip() {
    let cloneTripId = null;
    const existingClone = trips.find(t => t.cloned_from === activeTripId);
    
    if (existingClone) {
        cloneTripId = existingClone.id;
    } else {
        cloneTripId = `trip_${appUserId}_${Date.now()}`;
        const currentTrip = trips.find(t => t.id === activeTripId);
        const newName = `[복사본] ${currentTrip ? currentTrip.name.replace('🤝 ', '').split(' (')[0] : '여행'}`;
        const newTrips = [...trips, { id: cloneTripId, name: newName, cloned_from: activeTripId }];
        setTrips(newTrips);
        if(supabaseClient) await supabaseClient.from('profiles').update({ trips: newTrips }).eq('app_user_id', appUserId);
    }

    const payload = {
        id: cloneTripId,
        display_city_name: displayCityName,
        travel_start_date: travelStartDate,
        current_restaurants: currentRestaurants,
        plan_timeline: planTimeline,
        flights: flights,
        packing_list: packingList,
        shared_users: [] 
    };
    
    if(supabaseClient) {
       const { error } = await supabaseClient.from('travel_state').upsert(payload);
       if (error && error.code === '42703') {
           await supabaseClient.from('travel_state').upsert({ id: cloneTripId, display_city_name: displayCityName, travel_start_date: travelStartDate, current_restaurants: currentRestaurants, plan_timeline: planTimeline });
       }
    }
    showToast("✅ 내 일정(문서함)으로 성공적으로 복사(업데이트) 되었습니다!");
  }

  async function fetchCityRestaurants(shortName) {
    if (!shortName) return;
    const cleanName = S(shortName).split(',')[0].trim();
    setDisplayCityName(cleanName);
    saveToDb({ display_city_name: cleanName });
    setShowCountrySuggestions(false);
    setGlobalSearchQuery("");
  }

  function handleGlobalSearchEnter(e) {
    if (e.key === 'Enter') {
      if (!globalSearchQuery.trim() || globalSearchQuery === "전체보기") {
        setDisplayCityName("선택된 지역 없음");
        saveToDb({ display_city_name: "선택된 지역 없음" });
      } else {
        const shortName = S(globalSearchQuery).split(',')[0].trim();
        setDisplayCityName(shortName);
        saveToDb({ display_city_name: shortName });
      }
    }
  }

  function openAddTripModal() {
    if (!supabaseClient || appUserId === "Guest") { showToast("로그인이 필요한 기능입니다."); return; }
    setTripModal({ isOpen: true, mode: 'add', name: '' });
  }

  function openRenameTripModal() {
    if (!supabaseClient || appUserId === "Guest") return;
    const safeTrips = Array.isArray(trips) ? trips : [];
    const currentTrip = safeTrips.find(t => t && S(t.id) === S(activeTripId));
    setTripModal({ isOpen: true, mode: 'rename', name: S(currentTrip?.name) });
  }

  async function submitTripModal() {
    if (!supabaseClient) return;
    if (!tripModal.name.trim()) { showToast("이름을 입력해주세요."); return; }
    if (isSubmittingTrip) return; 
    
    setIsSubmittingTrip(true);
    const safeTrips = Array.isArray(trips) ? trips.filter(Boolean) : [];

    if (tripModal.mode === 'add') {
      const newId = `trip_${appUserId}_${Date.now()}`;
      const updatedTrips = [...safeTrips, { id: newId, name: S(tripModal.name) }];
      setTrips(updatedTrips);
      
      if (appUserId !== "Guest") {
        const insertPayload = {
          id: newId, display_city_name: "선택된 지역 없음", travel_start_date: new Date().toISOString().split('T')[0],
          current_restaurants: [], plan_timeline: [], flights: { outbound: null, inbound: null }, packing_list: []
        };
        const { error: insErr } = await supabaseClient.from('travel_state').insert(insertPayload);
        if (insErr && insErr.code === '42703') {
           await supabaseClient.from('travel_state').insert({ id: newId, display_city_name: "선택된 지역 없음", travel_start_date: new Date().toISOString().split('T')[0], current_restaurants: [], plan_timeline: [] });
        }
        await supabaseClient.from('profiles').update({ trips: updatedTrips, activeTripId: newId }).eq('app_user_id', appUserId);
      } else {
        try {
          const allStr = localStorage.getItem('my_travel_states') || '{}';
          const all = JSON.parse(allStr);
          all[newId] = { display_city_name: "선택된 지역 없음", travel_start_date: new Date().toISOString().split('T')[0], current_restaurants: [], plan_timeline: [], flights: { outbound: null, inbound: null }, packing_list: [] };
          localStorage.setItem('my_travel_states', JSON.stringify(all));
          localStorage.setItem('my_travel_guest_trips', JSON.stringify(updatedTrips));
          localStorage.setItem('my_travel_guest_active_trip', newId);
        } catch(e) {}
      }

      setActiveTripId(newId);
      showToast(`'${tripModal.name}' 일정을 시작합니다.`);
    } else {
      const updatedTrips = safeTrips.map(t => t && S(t.id) === S(activeTripId) ? { ...t, name: S(tripModal.name) } : t);
      setTrips(updatedTrips);
      if (appUserId !== "Guest") {
        await supabaseClient.from('profiles').update({ trips: updatedTrips }).eq('app_user_id', appUserId);
      } else {
        localStorage.setItem('my_travel_guest_trips', JSON.stringify(updatedTrips));
      }
      showToast("여행 이름이 변경되었습니다.");
    }
    
    setTripModal({ isOpen: false, mode: 'add', name: '' });
    setIsSubmittingTrip(false);
  }

  async function handleSwitchTrip(tripId) {
    if (!supabaseClient || appUserId === "Guest") {
      setActiveTripId(S(tripId));
      localStorage.setItem('my_travel_guest_active_trip', tripId);
      showToast("여행 일정을 불러왔습니다.");
      return;
    }

    if (activeTripId === tripId) return;

    mapInitFlyDoneRef.current = false; // 여행 전환 시 지도 초기 이동 재실행
    setActiveTripId(S(tripId));
    showToast("여행 일정을 불러왔습니다.");
    await supabaseClient.from('profiles').update({ activeTripId: tripId }).eq('app_user_id', appUserId);
  }

async function confirmDeleteTrip() {
  if (!window.confirm("이 여행 데이터를 내 목록에서 정말 삭제(또는 나가기) 하시겠습니까?")) return;
  if (trips.length <= 1) {
        showToast("최소 1개의 여행 일정은 남겨두어야 합니다.");
        setTripToDelete(null);
        return;
    }
    
    const tripToRemove = trips.find(t => t.id === tripToDelete);
    const updatedTrips = trips.filter(t => t.id !== tripToDelete);
    setTrips(updatedTrips);
    
    try {
        if (supabaseClient && appUserId !== "Guest") {
            await supabaseClient.from('profiles').update({ trips: updatedTrips }).eq('app_user_id', appUserId);
            
            if (tripToRemove?.isShared) {
               const { data } = await supabaseClient.from('travel_state').select('shared_users').eq('id', tripToDelete).single();
               if (data && Array.isArray(data.shared_users)) {
                  const newShared = data.shared_users.filter(u => u !== appUserId);
                  await supabaseClient.from('travel_state').update({ shared_users: newShared }).eq('id', tripToDelete);
               }
            } else {
               await supabaseClient.from('travel_state').delete().eq('id', tripToDelete);
            }
        } else {
            localStorage.setItem('my_travel_guest_trips', JSON.stringify(updatedTrips));
        }
        
        if (activeTripId === tripToDelete) {
            setActiveTripId(updatedTrips[0].id);
            if (supabaseClient && appUserId !== "Guest") {
                await supabaseClient.from('profiles').update({ activeTripId: updatedTrips[0].id }).eq('app_user_id', appUserId);
            } else {
                localStorage.setItem('my_travel_guest_active_trip', updatedTrips[0].id);
            }
        }
    } catch(err) {
        console.error("여행 삭제 중 오류:", err);
    }
    
    setTripToDelete(null);
    showToast(tripToRemove?.isShared ? "공유된 여행 목록에서 나갔습니다." : "여행이 정상적으로 삭제되었습니다.");
  }

  function handleElementScaleChange(e) {
    const scale = parseFloat(e.target.value);
    setElementScale(scale);
    try { localStorage.setItem('my_travel_element_scale', scale.toString()); } catch(e){}
  }

  function handleFontScaleChange(e) {
    const scale = parseFloat(e.target.value);
    setFontScale(scale);
    try { localStorage.setItem('my_travel_font_scale', scale.toString()); } catch(e){}
  }

  function handleThemeChange(themeName) {
    setAppTheme(S(themeName));
    try { localStorage.setItem('my_travel_theme', S(themeName)); } catch(e){}
  }

  const handleUndo = () => {
      if (historyIndex > 0) {
          isUndoingRef.current = true;
          const prevState = history[historyIndex - 1];
          setHistoryIndex(historyIndex - 1);
          
          setPlanTimeline(prevState.planTimeline || []);
          setCurrentRestaurants(prevState.currentRestaurants || []);
          setPackingList(prevState.packingList || []);
          setFlights(prevState.flights || { outbound: null, inbound: null });
          
          saveToDb({
              plan_timeline: prevState.planTimeline,
              current_restaurants: prevState.currentRestaurants,
              packing_list: prevState.packingList,
              flights: prevState.flights
          });
          showToast("⏪ 슝! 이전 상태로 되돌렸습니다.");
      } else {
          showToast("더 이상 되돌릴 수 없습니다.");
      }
  };

  const handleRedo = () => {
      if (historyIndex < history.length - 1) {
          isUndoingRef.current = true;
          const nextState = history[historyIndex + 1];
          setHistoryIndex(historyIndex + 1);
          
          setPlanTimeline(nextState.planTimeline || []);
          setCurrentRestaurants(nextState.currentRestaurants || []);
          setPackingList(nextState.packingList || []);
          setFlights(nextState.flights || { outbound: null, inbound: null });
          
          saveToDb({
              plan_timeline: nextState.planTimeline,
              current_restaurants: nextState.currentRestaurants,
              packing_list: nextState.packingList,
              flights: nextState.flights
          });
          showToast("⏩ 뽕! 다시 실행했습니다.");
      } else {
          showToast("더 이상 다시 실행할 수 없습니다.");
      }
  };

  function handleLoginSuccess(id, pw) {
    setAppUserId(id);
    setShowIdSetup(false);
    setIdError("");
    setIsLoggingIn(false);
    
    try {
      const authPrefs = { id: id, pw: pw, saveIdPw: saveCredentials, autoLogin: autoLogin };
      if (autoLogin) { localStorage.setItem('my_travel_auth', JSON.stringify(authPrefs)); } 
      else if (saveCredentials) { localStorage.setItem('my_travel_auth', JSON.stringify({...authPrefs, autoLogin: false})); } 
      else { localStorage.removeItem('my_travel_auth'); }
    } catch(e){}
  }

  async function handleSignUp() {
    if (idInput.trim().length < 3) { setIdError("아이디는 3자 이상 입력하세요."); return; }
    if (pwInput.trim().length < 4) { setIdError("비밀번호는 4자 이상 입력하세요."); return; }
    
    setIsLoggingIn(true);
    const cleanId = S(idInput).trim().toLowerCase();
    
    if (!supabaseClient) { setIdError("서버에 연결할 수 없습니다. 키를 확인해주세요."); setIsLoggingIn(false); return; }

    try {
      const { data, error } = await supabaseClient.from('profiles').select('app_user_id').eq('app_user_id', cleanId).single();
      if (error && error.code === '42P01') {
        setIdError("테이블이 없습니다. Supabase SQL Editor에서 생성 쿼리를 실행해주세요!");
        setIsLoggingIn(false);
        return;
      }
      
      if (data) { 
        setIdError("이미 사용 중인 아이디입니다."); 
        setIsLoggingIn(false);
      } else {
        const defaultTripId = `trip_${cleanId}_${Date.now()}`;
        const initialTrips = [{ id: defaultTripId, name: '🛫 나의 첫 번째 여행' }];
        
        await supabaseClient.from('profiles').insert({ app_user_id: cleanId, password: S(pwInput), trips: initialTrips, activeTripId: defaultTripId });
        
        const insertPayload = { 
          id: defaultTripId, display_city_name: "선택된 지역 없음", travel_start_date: new Date().toISOString().split('T')[0], 
          current_restaurants: [], plan_timeline: [], flights: { outbound: null, inbound: null }, packing_list: [] 
        };
        const { error: insErr } = await supabaseClient.from('travel_state').insert(insertPayload);
        if (insErr && insErr.code === '42703') {
           await supabaseClient.from('travel_state').insert({ id: defaultTripId, display_city_name: "선택된 지역 없음", travel_start_date: new Date().toISOString().split('T')[0], current_restaurants: [], plan_timeline: [] });
        }
        
        handleLoginSuccess(cleanId, S(pwInput));
      }
    } catch (e) { setIdError("서버 오류가 발생했습니다."); setIsLoggingIn(false); }
  }

  async function handleLogin(overrideId = null, overridePw = null) {
    setIsLoggingIn(true);
    const currentId = S(overrideId || idInput).trim().toLowerCase();
    const currentPw = S(overridePw || pwInput);

    if (!currentId || !currentPw) { setIdError("아이디와 비밀번호를 입력해주세요."); setIsLoggingIn(false); return; }
    if (!supabaseClient) { setIdError("서버에 연결할 수 없습니다. 키를 확인해주세요."); setIsLoggingIn(false); return; }

    try {
      const { data, error } = await supabaseClient.from('profiles').select('*').eq('app_user_id', currentId).single();
      if (error && error.code === '42P01') {
        setIdError("테이블이 없습니다. Supabase SQL Editor에서 생성 쿼리를 실행해주세요!");
        setIsLoggingIn(false);
        return;
      }

      if (data && data.password === currentPw) {
        if (data.trips && Array.isArray(data.trips)) setTrips(data.trips);
        if (data.activeTripId) setActiveTripId(S(data.activeTripId));
        handleLoginSuccess(currentId, currentPw);
      } else {
        setIdError("아이디 또는 비밀번호가 일치하지 않습니다.");
        setIsLoggingIn(false);
      }
    } catch (e) { setIdError("서버 오류가 발생했습니다."); setIsLoggingIn(false); }
  }

  function handleSkipIdSetup() { 
    setAppUserId("Guest"); 
    setShowIdSetup(false); 
    showToast("로컬 모드로 진입했습니다. 브라우저에 임시 저장됩니다.");
  }

  function handleLogout() {
    setAppUserId(null);
    setTrips([{ id: 'default', name: '🛫 나의 첫 번째 여행' }]);
    setActiveTripId('default');
    setShowIdSetup(true);
    setIsSettingsOpen(false);
    setAutoLogin(false);
    try { localStorage.removeItem('my_travel_auth'); } catch(e){}
    showToast("로그아웃 되었습니다.");
  }

  async function handleSendInvite() {
    if (!inviteIdInput.trim() || !supabaseClient) return;
    const targetId = S(inviteIdInput).trim().toLowerCase();
    if (targetId === appUserId) { showToast("본인은 초대할 수 없습니다."); return; }
    
    const { data } = await supabaseClient.from('profiles').select('app_user_id').eq('app_user_id', targetId).single();
    if (!data) { showToast("존재하지 않는 사용자입니다."); return; }
    
    await supabaseClient.from('invites').upsert({ target_id: targetId, from_id: appUserId, trip_id: activeTripId, timestamp: Date.now() });
    showToast(`초대장을 보냈습니다.`); setInviteIdInput(""); setIsSettingsOpen(false);
  }

  async function handleAcceptInvite() {
    if (pendingInvite) {
      const targetTripId = S(pendingInvite.trip_id);
      const ownerId = S(pendingInvite.from_id);

      let tripName = "공유된 여행";
      try {
         const { data } = await supabaseClient.from('profiles').select('trips').eq('app_user_id', ownerId).single();
         if (data && data.trips) {
            const ownerTrip = data.trips.find(t => t.id === targetTripId);
            if (ownerTrip) tripName = ownerTrip.name;
         }
      } catch(e) {}

      const newSharedTrip = { id: targetTripId, name: `🤝 ${tripName} (${ownerId})`, isShared: true, owner: ownerId };
      const updatedTrips = [...trips.filter(t => t.id !== targetTripId), newSharedTrip];
      setTrips(updatedTrips);
      
      await supabaseClient.from('profiles').update({ trips: updatedTrips, activeTripId: targetTripId }).eq('app_user_id', appUserId);
      
      try {
        const { data } = await supabaseClient.from('travel_state').select('shared_users').eq('id', targetTripId).single();
        const currentShared = Array.isArray(data?.shared_users) ? data.shared_users : [];
        if (!currentShared.includes(appUserId)) {
          const { error } = await supabaseClient.from('travel_state').update({ shared_users: [...currentShared, appUserId] }).eq('id', targetTripId);
          if (error && error.code === '42703') {} // fallback if column not added
        }
      } catch(e) { }

      await supabaseClient.from('invites').delete().eq('target_id', appUserId);
      
      setPendingInvite(null); 
      setActiveTripId(targetTripId);
      showToast(`공유된 일정에 접속했습니다.`);
    }
  }

  async function handleRejectInvite() {
    await supabaseClient.from('invites').delete().eq('target_id', appUserId);
    setPendingInvite(null);
  }

  function handleOpenGoogleTranslate() { window.open(`https://translate.google.com/?sl=auto&tl=ko`, '_blank'); }

  function handleManualPlaceAdd(isFromMap = true) {
    if (!newManualPlaceName.trim()) { showToast("장소 이름을 적어주세요!"); return; }
    
    let pLat = clickedLocation?.lat || null;
    let pLng = clickedLocation?.lng || null;

    const safeCurrentRestaurants = Array.isArray(currentRestaurants) ? currentRestaurants.filter(Boolean) : [];

    if (clickedLocation?.id) { 
      const existing = safeCurrentRestaurants.find(r => r && S(r.id) === S(clickedLocation.id));
      pLat = existing?.lat || null;
      pLng = existing?.lng || null;
    }

    const placeId = clickedLocation?.id || `manual-${Date.now()}`;
    const newPlace = {
      id: S(placeId), lat: pLat, lng: pLng, country: S(displayCityName), city: S(displayCityName),
      name: S(newManualPlaceName), localName: S(newManualLocalName), signature: newManualFeature ? S(newManualFeature) : "직접 추가한 장소",
      img: newManualPhoto ? S(newManualPhoto) : "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=400&q=80",
      rating: 5.0, isAccommodation: Boolean(newManualIsAccommodation), isLandmark: Boolean(newManualIsLandmark), theme: S(newManualTheme) || "기타"
    };

    let updatedRests;
    if (clickedLocation?.id) {
      updatedRests = safeCurrentRestaurants.map(r => r && S(r.id) === S(clickedLocation.id) ? newPlace : r);
    } else {
      updatedRests = [newPlace, ...safeCurrentRestaurants];
    }
    setCurrentRestaurants(updatedRests);

    const safePlanTimeline = Array.isArray(planTimeline) ? planTimeline.filter(Boolean) : [];
    let updatedTimeline = [...safePlanTimeline];
    
    if (pinLinkDay) {
      // [NEW] 핀에 저장된 지역 정보 확인 (없으면 기존 글로벌 설정값 사용)
      const existingPin = safeCurrentRestaurants.find(r => r && S(r.id) === S(clickedLocation?.id));
      const targetCountry = existingPin?.country || S(globalPlanCountry);
      const targetRegion = existingPin?.city || S(globalPlanRegion);

      if (pinLinkPlanId && pinLinkPlanId !== 'manual') {
        updatedTimeline = updatedTimeline.map(p => p && String(p.id) === String(pinLinkPlanId) ? {
          ...p, day: parseInt(pinLinkDay), time: S(newManualTime), place: S(newManualPlaceName),
          localName: S(newManualLocalName), features: S(newManualFeature), photo: S(newManualPhoto),
          isAccommodation: Boolean(newManualIsAccommodation),
          country: targetCountry, region: targetRegion // 핀 정보 연동 업데이트
        } : p).sort((a, b) => S(a?.time).localeCompare(S(b?.time)));
      } else {
        const newPlan = {
          id: Date.now().toString() + "_plan",
          day: parseInt(pinLinkDay), time: S(newManualTime), place: S(newManualPlaceName),
          localName: S(newManualLocalName), features: S(newManualFeature), photo: S(newManualPhoto),
          country: targetCountry, region: targetRegion, // 핀 정보로 자동 연동
          isAccommodation: Boolean(newManualIsAccommodation)
        };
        updatedTimeline = [...updatedTimeline, newPlan].sort((a, b) => S(a?.time).localeCompare(S(b?.time)));
      }
      setPlanTimeline(updatedTimeline);
    }

console.log("🚀 Supabase로 저장 요청하는 핀 데이터:", updatedRests);
    saveToDb({ current_restaurants: updatedRests, plan_timeline: updatedTimeline });

    if (isFromMap) {
       if (pLat && pLng && mapInstanceRef.current) {
         mapInstanceRef.current.flyTo([pLat, pLng], 16);
         showToast("지도에 핀이 등록/수정 되었습니다.");
       } else {
         showToast("핀 목록에 저장되었습니다. 나중에 위치를 지정해주세요."); 
       }
       setClickedLocation(null); setIsAddPlaceModalOpen(false); 
    } else {
       showToast("📍 장소가 핀 보관함에 일단 저장되었습니다!");
       setIsAddPlaceModalOpen(false);
    }
    
    setNewManualPlaceName(""); setNewManualLocalName(""); setNewManualFeature(""); setNewManualPhoto(""); setNewManualTime(""); setNewManualIsAccommodation(false); setNewManualIsLandmark(false); setNewManualTheme("기타");
    setPinLinkDay(""); setPinLinkPlanId(""); 
  }

  function handleManualPhotoUpload(e) {
    const file = e.target.files?.[0]; if (!file) return;
    compressImage(file, (compressed) => setNewManualPhoto(S(compressed)));
  }

  function handleFindMyLocation() {
    if (!navigator.geolocation) { showToast("위치 기능을 지원하지 않습니다."); return; }
    showToast("현재 위치를 확인 중입니다... (최초 권한 동의가 필요할 수 있습니다)");

    // 이전 watchPosition 정리
    if (window.myLocWatchId != null) {
      navigator.geolocation.clearWatch(window.myLocWatchId);
      window.myLocWatchId = null;
    }
    if (window.myLocOrientationHandler) {
      window.removeEventListener('deviceorientation', window.myLocOrientationHandler);
      window.myLocOrientationHandler = null;
    }

    // 최신 좌표를 ref로 관리해 클로저 고정 문제 해결
    const locRef = { lat: null, lng: null, heading: null };
    let mapFlown = false;

    const renderLocMarker = (lat, lng, head) => {
      if (!mapInstanceRef.current || !window.L) return;
      if (window.myLocMarker) window.myLocMarker.remove();

      const arrowHtml = (head !== null && head !== undefined && !isNaN(head))
        ? `<div style="position:absolute; top:-12px; left:50%; transform:translateX(-50%) rotate(${head}deg); transform-origin: 50% 34px; transition: transform 0.3s ease-out; z-index: 1;">
              <div style="width:0; height:0; border-left:8px solid transparent; border-right:8px solid transparent; border-bottom:16px solid rgba(79, 70, 229, 0.9); filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.3));"></div>
           </div>`
        : '';

      const html = `
        <div style="position:relative; width:44px; height:44px; display:flex; align-items:center; justify-content:center;">
            ${arrowHtml}
            <div style="position:relative; z-index:2; animation: baemin-bounce 0.6s infinite alternate cubic-bezier(0.5, 0.05, 1, 0.5); filter: drop-shadow(0px 6px 4px rgba(0,0,0,0.4)); font-size: 32px; line-height: 1;">
                ${myLocationIcon}
            </div>
            <div style="position:absolute; bottom:2px; left:50%; transform:translateX(-50%); width:20px; height:6px; background:rgba(0,0,0,0.3); border-radius:50%; filter:blur(2px); animation: baemin-shadow 0.6s infinite alternate cubic-bezier(0.5, 0.05, 1, 0.5); z-index:1;"></div>
        </div>
      `;
      const customLocIcon = window.L.divIcon({ html, className: '', iconSize: [44, 44], iconAnchor: [22, 40] });
      window.myLocMarker = window.L.marker([lat, lng], { icon: customLocIcon, zIndexOffset: 1000 })
        .addTo(mapInstanceRef.current)
        .bindPopup(`<div style="text-align:center; font-weight:bold; font-size:12px;">내 현재 위치 (설정에서 변경 가능)</div>`);
    };

    // watchPosition으로 실시간 위치 추적
    window.myLocWatchId = navigator.geolocation.watchPosition((pos) => {
      const { latitude, longitude, heading } = pos.coords;
      locRef.lat = latitude;
      locRef.lng = longitude;
      // GPS heading이 유효하면 우선 사용 (이동 중에만 정확)
      if (heading !== null && !isNaN(heading)) locRef.heading = heading;

      if (!mapFlown && mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([latitude, longitude], 16);
        mapFlown = true;
      }
      renderLocMarker(locRef.lat, locRef.lng, locRef.heading);
    }, (error) => {
      if (error.code === 1) showToast("위치 권한이 거부되었습니다. 스마트폰/브라우저의 위치 권한을 허용해주세요.");
      else if (error.code === 2) showToast("위치 정보를 사용할 수 없습니다. GPS를 켜주세요.");
      else if (error.code === 3) showToast("위치 요청 시간이 초과되었습니다.");
      else showToast("위치 접근 중 알 수 없는 오류가 발생했습니다.");
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });

    // 나침반 방향 — locRef로 항상 최신 좌표 참조
    if (window.DeviceOrientationEvent) {
      const handleOrientation = (e) => {
        if (locRef.lat === null) return;
        let h;
        if (e.webkitCompassHeading != null) {
          // iOS: 진북 기준 정확한 값
          h = e.webkitCompassHeading;
        } else if (e.alpha != null) {
          // Android: alpha는 기기 초기 방향 기준이므로 360에서 빼서 진북 기준으로 보정
          h = (360 - e.alpha) % 360;
        } else {
          return;
        }
        locRef.heading = h;
        renderLocMarker(locRef.lat, locRef.lng, locRef.heading);
      };
      window.myLocOrientationHandler = handleOrientation;
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(res => {
          if (res === 'granted') window.addEventListener('deviceorientation', handleOrientation);
        }).catch(err => console.error(err));
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
      }
    }
  }

  // [버그 수정 3] 환경설정에서 마커 캐릭터 변경 시 지도에 즉각 반영되도록 반응성(Reactivity) 의존성 추가
  useEffect(() => {
    if (window.myLocMarker && isLeafletLoaded && mapInstanceRef.current) {
      handleFindMyLocation(); // 마커 상태(myLocationIcon)가 바뀔 때마다 내 위치 함수를 재호출하여 즉각 렌더링
    }
  }, [myLocationIcon]);

  function handleMarkerSearchSelect(marker) {
    if (mapInstanceRef.current && marker && marker.lat) mapInstanceRef.current.flyTo([marker.lat, marker.lng], 17);
    setMarkerSearchQuery("");
  }

  function handleSavePlan() {
    if (!newTime.trim() && !newIsAccommodation) { showToast("시간을 적어주세요."); return; }
    if (!newPlace.trim()) { showToast("장소를 적어주세요."); return; }
    
    const finalCountry = planCountry === "수동입력" ? manualCountry : planCountry;
    const finalRegion = planRegion === "수동입력" ? manualRegion : planRegion;

    const safePlanTimeline = Array.isArray(planTimeline) ? planTimeline.filter(Boolean) : [];
    let updatedTimeline = [...safePlanTimeline];

    const planData = { 
      id: Date.now().toString(), day: newDay, time: S(newTime), place: S(newPlace), localName: S(newLocalName), features: S(newFeatures), photo: newPhoto ? S(newPhoto) : "", 
      country: S(finalCountry), region: S(finalRegion), isAccommodation: Boolean(newIsAccommodation), theme: S(newTheme)
    };

    updatedTimeline.push(planData);
    showToast(newIsAccommodation ? "🏠 전 일정 숙소로 등록되었습니다!" : "스케줄에 등록 성공! ✨");

    updatedTimeline.sort((a, b) => S(a?.time).localeCompare(S(b?.time)));
    setPlanTimeline(updatedTimeline); 
    
    let updates = { plan_timeline: updatedTimeline };
    
    const safeCurrentRestaurants = Array.isArray(currentRestaurants) ? currentRestaurants.filter(Boolean) : [];
    const matchedIndex = safeCurrentRestaurants.findIndex(r => r && S(r.name) === S(newPlace));
    if (matchedIndex !== -1) {
        const updatedRests = [...safeCurrentRestaurants];
        updatedRests[matchedIndex] = {
            ...updatedRests[matchedIndex],
            localName: newLocalName ? S(newLocalName) : updatedRests[matchedIndex].localName,
            signature: newFeatures ? S(newFeatures) : updatedRests[matchedIndex].signature,
            img: newPhoto ? S(newPhoto) : updatedRests[matchedIndex].img,
            isAccommodation: newIsAccommodation ? true : updatedRests[matchedIndex].isAccommodation
        };
        setCurrentRestaurants(updatedRests);
        updates.current_restaurants = updatedRests;
    }

    if (finalRegion && finalRegion !== displayCityName) {
      setDisplayCityName(S(finalRegion));
      updates.display_city_name = S(finalRegion);
    }
    saveToDb(updates); 
    resetPlanForm();
  }
  
  function handlePlanPhotoUpload(e, isEdit = false) {
    const file = e.target.files?.[0]; if (!file) return;
    compressImage(file, (compressedBase64) => { 
      if(isEdit && editingPlan) setEditingPlan({...editingPlan, photo: S(compressedBase64)});
      else setNewPhoto(S(compressedBase64)); 
    });
  }
  
  function handleEditPlanClick(p) { 
    if (!p) return;

    // [버그 수정] 구버전/신버전 상관없이 테마가 교통편이면 무조건 전용 모달 띄우기
    const isTransportTheme = p.isTransport || ['교통', '항공', '비행기', '기차', '버스', '배'].some(keyword => S(p.theme).includes(keyword));

    if (isTransportTheme) {
        let type = 'flight';
        let dir = 'outbound';
        let depPlaceText = "";
        let arrPlaceText = "";
        let flightNum = "";
        let seatNum = "";
        let depTime = p.time || "";
        let arrTime = "";

        if (p.id && String(p.id).startsWith('trans_')) {
            // --- 1. 최신 버전 데이터 (출발/도착 분리형) 완벽 파싱 ---
            const parts = String(p.id).split('_');
            if (parts.length >= 4) {
                type = parts[1];
                dir = parts[2];
                const safeTimeline = Array.isArray(planTimeline) ? planTimeline : [];
                const depItem = safeTimeline.find(item => item.id === `trans_${type}_${dir}_dep`) || p;
                const arrItem = safeTimeline.find(item => item.id === `trans_${type}_${dir}_arr`) || p;

                depPlaceText = depItem.place.replace(/[^\uAC00-\uD7A3a-zA-Z0-9\s]/g, '').replace('출발', '').trim();
                arrPlaceText = arrItem.place.replace(/[^\uAC00-\uD7A3a-zA-Z0-9\s]/g, '').replace('도착', '').trim();
                depTime = depItem.time || '';
                arrTime = arrItem.time || '';

                const match = (depItem.features || '').match(/:\s*(.*?)(?:\s*\|\s*좌석:\s*(.*?))?\s*\|/);
                if (match) {
                    flightNum = match[1]?.trim() || '';
                    seatNum = match[2]?.trim() || '';
                }
            }
        } else {
            // --- 2. 구버전 및 수동 데이터 스마트 역추적 파싱 ---
            const placeStr = S(p.place);
            const featStr = S(p.features);
            
            // 종류 추론
            if (placeStr.includes('기차') || placeStr.includes('🚆') || S(p.localName).includes('기차') || S(p.localName).includes('KTX')) type = 'train';
            else if (placeStr.includes('버스') || placeStr.includes('🚌') || S(p.localName).includes('버스')) type = 'bus';

            // 방향 추론
            if (featStr.includes('오는 편') || featStr.includes('오는편') || featStr.includes('inbound')) dir = 'inbound';

            // 장소명 추론 ("순천터미널 -> 인천공항 T2" 분리)
            const placeParts = placeStr.split(/➔|->|->/);
            if (placeParts.length === 2) {
                depPlaceText = placeParts[0].replace(/[^\uAC00-\uD7A3a-zA-Z0-9\s]/g, '').trim();
                arrPlaceText = placeParts[1].replace(/[^\uAC00-\uD7A3a-zA-Z0-9\s]/g, '').trim();
            } else {
                depPlaceText = placeStr.replace(/[^\uAC00-\uD7A3a-zA-Z0-9\s]/g, '').trim();
            }

            // 메모 추론 ("버스 번호: 3번홈 | 좌석: 01, 02 (도착예정: 06:11)")
            const numMatch = featStr.match(/(?:번호|항공편):\s*([^|]+)/);
            if (numMatch) flightNum = numMatch[1].trim();
            
            const seatMatch = featStr.match(/좌석:\s*([^|(]+)/);
            if (seatMatch) seatNum = seatMatch[1].trim();

            const timeMatch = featStr.match(/도착.*?:?\s*([0-9:]+)/);
            if (timeMatch) arrTime = timeMatch[1].replace(/[^0-9:]/g, '').trim();
        }

        setTransType(type);
        setTransDir(dir);
        setModalTransData(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [dir]: {
                    airline: p.localName || '',
                    flightNum: flightNum,
                    seatNum: seatNum,
                    dep: depPlaceText,
                    arr: arrPlaceText,
                    depTime: depTime,
                    arrTime: arrTime,
                    day: p.day || 1
                }
            }
        }));
        setIsTransportModalOpen(true);
        return; // 일반 수정 모달 띄우기 완벽 차단
    }

    const c = S(p.country || "");
    const r = S(p.region || "");
    const isStandardCountry = Object.keys(REGIONS_BY_COUNTRY).includes(c) || c === "";
    const isStandardRegion = (isStandardCountry && c && REGIONS_BY_COUNTRY[c]?.includes(r)) || r === "";
    
    setEditingPlan({ ...p, countrySelect: isStandardCountry ? c : "수동입력", manualCountry: isStandardCountry ? "" : c, regionSelect: isStandardRegion ? r : "수동입력", manualRegion: isStandardRegion ? "" : r, isAccommodation: Boolean(p.isAccommodation), localName: S(p.localName || ""), features: S(p.features || ""), time: S(p.time || ""), place: S(p.place || ""), theme: S(p.theme || "기타") });  
  }
  
function handleDeletePlan(id) {
  if (!window.confirm("이 일정을 정말 삭제하시겠습니까?")) return;
  const safePlanTimeline = Array.isArray(planTimeline) ? planTimeline.filter(Boolean) : [];
    const updated = safePlanTimeline.filter(p => p && S(p.id) !== S(id)); 
    setPlanTimeline(updated); saveToDb({ plan_timeline: updated });
    showToast("일정이 삭제되었습니다.");
  }
  
  function resetPlanForm() {
    setNewTime(""); setNewPlace(""); setNewLocalName(""); setNewFeatures(""); setNewPhoto(""); setNewIsAccommodation(false); setNewTheme("기타"); setPinSelectOpen(false);
    setPlanCountry(globalPlanCountry); setPlanRegion(globalPlanRegion);
    setManualCountry(globalPlanCountry === "수동입력" ? globalManualCountry : ""); setManualRegion(globalPlanRegion === "수동입력" ? globalManualRegion : "");
  }

  function handleTimeInput(e, setter) {
    let val = S(e.target.value).replace(/\D/g, '');
    if (val.length > 4) val = val.slice(0, 4);
    if (val.length >= 3) { val = val.slice(0, 2) + ':' + val.slice(2); }
    setter(val);
  }

  function changeTab(tabId) {
    setActiveTab(S(tabId));
    setIsMobileMenuOpen(false);
  }

  function handleInputChange(code, rawValue) {
    const numericValue = S(rawValue).replace(/,/g, '').replace(/[^\d.]/g, '');
    setActiveCurrency(S(code));
    setAmount(numericValue);
  }

  function formatForDisplay(val) {
    if (!val) return '';
    const parts = S(val).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join('.');
  }

  function formatCalculated(val, curCode) {
    const num = parseFloat(val);
    if (isNaN(num)) return '';
    const maxDecimals = (curCode === 'KRW' || curCode === 'JPY') ? 0 : 2;
    return num.toLocaleString('en-US', { maximumFractionDigits: maxDecimals });
  }

  function getInputValue(curCode) {
    if (amount) {
      if (activeCurrency === curCode) return formatForDisplay(amount);
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount)) return '';
      const usdAmount = numAmount / rates[activeCurrency];
      const targetAmount = usdAmount * rates[curCode];
      return formatCalculated(targetAmount, curCode);
    }
    if (focusedCurrency === curCode) return '';
    if (curCode === 'KRW') return '-';
    const unit = CURRENCIES.find(c => c.code === curCode).unit;
    const krwPerUnit = (rates.KRW / rates[curCode]) * unit;
    return Math.round(krwPerUnit).toLocaleString();
  }

  function getPlaceholder(curCode) {
    if (loadingRates) return '...';
    if (curCode === 'KRW') return '0';
    const unit = CURRENCIES.find(c => c.code === curCode).unit;
    const krwPerUnit = (rates.KRW / rates[curCode]) * unit;
    return Math.round(krwPerUnit).toLocaleString();
  }

  function addDay() { setMaxDay(d => d + 1); }
  function removeDay() { if (maxDay > 1) setMaxDay(d => d - 1); }

  function handleSaveTransport() {
    let hasAnyData = false;
    let updatedTimeline = [...(Array.isArray(planTimeline) ? planTimeline.filter(Boolean) : [])];
    let newFlights = { ...flights };

    const types = ['flight', 'train', 'bus'];
    const dirs = ['outbound', 'inbound'];

    types.forEach(type => {
      dirs.forEach(dir => {
        const data = modalTransData[type][dir];
        if (data.dep && data.arr) {
          hasAnyData = true;
          if (type === 'flight') newFlights[dir] = { ...data };

          const isFlight = type === 'flight';
          const emojiDep = isFlight ? '🛫' : (type === 'train' ? '🚆' : '🚌');
          const emojiArr = isFlight ? '🛬' : (type === 'train' ? '🚆' : '🚌');
          const typeLabel = isFlight ? '항공편' : (type === 'train' ? '기차' : '버스');
          const dirLabel = dir === 'outbound' ? '가는 편' : '오는 편';

          // [버그 수정 2] 출발/도착 시간 비교로 자정을 넘기는 경우 도착 Day +1 계산
          const depTime = S(data.depTime) || "00:00";
          const arrTime = S(data.arrTime) || "00:00";
          let arrDay = parseInt(data.day);
          const dH = parseInt(depTime.split(':')[0] || 0);
          const aH = parseInt(arrTime.split(':')[0] || 0);
          if (aH < dH) arrDay += 1; // 도착 시간이 출발 시간보다 앞서면 다음 날로 간주

          // [버그 수정 3] 중복 생성 방지를 위해 예측 가능한 고유 ID 부여 및 기존 데이터 필터링 제거
          const depId = `trans_${type}_${dir}_dep`;
          const arrId = `trans_${type}_${dir}_arr`;
          updatedTimeline = updatedTimeline.filter(p => p.id !== depId && p.id !== arrId);

          // 1. 출발 스케줄 아이템 (출발 Day에 할당)
          updatedTimeline.push({ 
            id: depId, 
            day: parseInt(data.day), 
            time: depTime, 
            place: `${emojiDep} ${data.dep} 출발`, 
            localName: S(data.airline), 
            // 파싱 호환성을 위해 형식을 엄격히 맞춤
            features: `[${dirLabel}] ${typeLabel}: ${data.flightNum}${data.seatNum ? ` | 좌석: ${data.seatNum}` : ''} | 도착: ${arrTime} (${data.arr})`, 
            photo: "", country: S(globalPlanCountry), region: S(globalPlanRegion), isAccommodation: false, isTransport: true, theme: '교통편'
          });

          // 2. 도착 스케줄 아이템 (도착 Day에 할당)
          updatedTimeline.push({ 
            id: arrId, 
            day: arrDay, 
            time: arrTime, 
            place: `${emojiArr} ${data.arr} 도착`, 
            localName: S(data.airline), 
            // 파싱 호환성을 위해 형식을 엄격히 맞춤
            features: `[${dirLabel}] ${typeLabel}: ${data.flightNum}${data.seatNum ? ` | 좌석: ${data.seatNum}` : ''} | 출발: ${depTime} (${data.dep})`, 
            photo: "", country: S(globalPlanCountry), region: S(globalPlanRegion), isAccommodation: false, isTransport: true, theme: '교통편'
          });
        }
      });
    });

    if (!hasAnyData) {
       showToast("출발지와 도착지를 한 방향 이상 입력해주세요.");
       return;
    }

    setFlights(newFlights);
    updatedTimeline.sort((a, b) => S(a?.time).localeCompare(S(b?.time)));
    setPlanTimeline(updatedTimeline);
    saveToDb({ flights: newFlights, plan_timeline: updatedTimeline });

    showToast("교통편이 날짜별로 완벽하게 분리되어 등록되었습니다! ✨");
    setIsTransportModalOpen(false);
    setModalTransData({
      flight: { outbound: { ...initialTransState }, inbound: { ...initialTransState } },
      train: { outbound: { ...initialTransState }, inbound: { ...initialTransState } },
      bus: { outbound: { ...initialTransState }, inbound: { ...initialTransState } }
    });
  }
  
  function handleEditFlight(dir) {
    setTransType('flight');
    setTransDir(dir);
    setModalTransData(prev => ({
      ...prev,
      flight: {
        outbound: flights.outbound || { ...initialTransState },
        inbound: flights.inbound || { ...initialTransState }
      }
    }));
    setIsTransportModalOpen(true);
  }

  function handleDeleteFlight(dir) {
    const newFlights = { ...flights, [dir]: null };
    setFlights(newFlights);
    saveToDb({ flights: newFlights });
    showToast(`${dir === 'outbound' ? '가는 편' : '오는 편'} 항공권이 삭제되었습니다.`);
  }

function handleAddPackingItem(e) {
    if (e.nativeEvent.isComposing) return; 
    if (e.key === 'Enter' && e.target.value.trim()) {
      // 개인용/공동용 여부 확인 (화면에 추가될 select 박스 활용)
      const isPersonal = document.getElementById('packType')?.value === 'personal';
      const newItem = { id: Date.now().toString(), text: e.target.value.trim(), isChecked: false, isPersonal: isPersonal, userId: appUserId };
      const newList = [...packingList, newItem];
      setPackingList(newList);
      saveToDb({ packing_list: newList });
      e.target.value = '';
    }
  }
  function togglePackingItem(id) {
    const newList = packingList.map(item => item.id === id ? { ...item, isChecked: !item.isChecked } : item);
    setPackingList(newList);
    saveToDb({ packing_list: newList });
  }
function deletePackingItem(id) {
  if (!window.confirm("이 준비물을 목록에서 정말 삭제하시겠습니까?")) return;
  const newList = packingList.filter(item => item.id !== id);
    setPackingList(newList);
    saveToDb({ packing_list: newList });
  }

  const handleDragMove = useCallback((e) => {
    if (!dragRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const ratio = (clientX / window.innerWidth) * 100;
    if (ratio > 20 && ratio < 80) setPanelRatio(ratio);
  }, []);

  const handleDragEnd = useCallback(() => {
    dragRef.current = false;
    document.body.style.cursor = 'default';
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('touchend', handleDragEnd);
  }, [handleDragMove]);

  const handleDragStart = (e) => {
    dragRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
  };

  /* ===================== 3. UseEffect 파트 ===================== */

  useEffect(() => {
      if (isDbLoaded && activeTripId) {
          const timer = setTimeout(() => setIsReadyToTrack(true), 1500);
          return () => clearTimeout(timer);
      }
  }, [isDbLoaded, activeTripId]);

  useEffect(() => {
      if (!isReadyToTrack) return;
      if (isUndoingRef.current) {
          isUndoingRef.current = false;
          return;
      }
      
      const currentState = { planTimeline, currentRestaurants, packingList, flights };
      setHistory(prev => {
          const newHistory = prev.slice(0, historyIndex + 1);
          if (newHistory.length > 0) {
              const last = newHistory[newHistory.length - 1];
              if (JSON.stringify(last) === JSON.stringify(currentState)) {
                  return prev; 
              }
          }
          return [...newHistory, currentState];
      });
      setHistoryIndex(prev => prev + 1);
  }, [planTimeline, currentRestaurants, packingList, flights, isReadyToTrack]);

  useEffect(() => {
      setIsReadyToTrack(false);
      setHistory([]);
      setHistoryIndex(-1);
  }, [activeTripId]);
  
  useEffect(() => {
    if (appUserId === "Guest") {
      try {
        const savedTrips = localStorage.getItem('my_travel_guest_trips');
        if (savedTrips) setTrips(JSON.parse(savedTrips));
        const savedActive = localStorage.getItem('my_travel_guest_active_trip');
        if (savedActive) setActiveTripId(savedActive);
      } catch(e) {}
    }
  }, [appUserId]);

  useEffect(() => {
    if (appUserId === "Guest") {
      try {
        const targetId = S(activeTripId);
        const allStatesStr = localStorage.getItem('my_travel_states');
        let loaded = false;
        
        if (allStatesStr) {
          const allStates = JSON.parse(allStatesStr);
          if (allStates && typeof allStates === 'object' && allStates[targetId]) {
            const data = allStates[targetId];
            if (data && typeof data === 'object') {
              setDisplayCityName(data.display_city_name ? S(data.display_city_name) : "선택된 지역 없음");
              syncCountryRegionFromCityName(data.display_city_name ? S(data.display_city_name) : "선택된 지역 없음", data.plan_timeline);
              setTravelStartDate(data.travel_start_date ? S(data.travel_start_date) : new Date().toISOString().split('T')[0]);
              setFlights(data.flights || { outbound: null, inbound: null });
              setPackingList(Array.isArray(data.packing_list) ? data.packing_list : []);
              setShoppingList(Array.isArray(data.shopping_list) ? data.shopping_list : []);
              setSharedUsers(Array.isArray(data.shared_users) ? data.shared_users : []);
              
              if (Array.isArray(data.current_restaurants)) {
              setCurrentRestaurants(data.current_restaurants.filter(r => r && typeof r === 'object').map(r => ({ id: S(r.id), name: S(r.name), localName: S(r.localName), signature: S(r.signature), img: S(r.img), country: S(r.country), city: S(r.city), lat: r.lat, lng: r.lng, isAccommodation: Boolean(r.isAccommodation), isLandmark: Boolean(r.isLandmark), theme: S(r.theme) || "기타", rating: r.rating || 0, review: r.review || "" })));              } else { setCurrentRestaurants([]); }
              
              if (Array.isArray(data.plan_timeline)) {
               setPlanTimeline(data.plan_timeline.filter(p => p && typeof p === 'object').map(p => ({ id: S(p.id), day: p.day, time: S(p.time), place: S(p.place), localName: S(p.localName), features: S(p.features), photo: S(p.photo), country: S(p.country), region: S(p.region), isAccommodation: Boolean(p.isAccommodation), isTransport: Boolean(p.isTransport), theme: S(p.theme) || "기타", expenseLocal: p.expenseLocal || "", expenseKrw: p.expenseKrw || "", rating: p.rating || 0, review: p.review || "" })));              } else { setPlanTimeline([]); }
              
              loaded = true;
            }
          }
        }

        if (!loaded) {
          setDisplayCityName("선택된 지역 없음");
          setCurrentRestaurants([]);
          setPlanTimeline([]);
          setFlights({ outbound: null, inbound: null });
          setPackingList([]);
          setTravelStartDate(new Date().toISOString().split('T')[0]);
        }
      } catch (e) {
        console.error("Local data load error", e);
        setDisplayCityName("선택된 지역 없음");
        setCurrentRestaurants([]);
        setPlanTimeline([]);
        setFlights({ outbound: null, inbound: null });
        setPackingList([]);
      }
    }
  }, [appUserId, activeTripId, syncCountryRegionFromCityName]);

  useEffect(() => {
    movingPinIdRef.current = movingPinId;
  }, [movingPinId]);

  useEffect(() => {
    if (pendingMove) {
      const safeCurrentRestaurants = Array.isArray(currentRestaurants) ? currentRestaurants.filter(Boolean) : [];
      const updated = safeCurrentRestaurants.map(r => r && S(r.id) === S(pendingMove.id) ? { ...r, lat: pendingMove.lat, lng: pendingMove.lng } : r);
      setCurrentRestaurants(updated);
      saveToDb({ current_restaurants: updated });
      setMovingPinId(null);
      setIsPinMode(false);
      setPendingMove(null);
      showToast("📍 핀 위치가 성공적으로 지정되었습니다!");
    }
  }, [pendingMove, currentRestaurants, saveToDb]);

  useEffect(() => {
    const handlePinClick = (e) => {
      const pinId = S(e.detail);
      const safeCurrentRestaurants = Array.isArray(currentRestaurantsRef.current) ? currentRestaurantsRef.current.filter(Boolean) : [];
      const pin = safeCurrentRestaurants.find(r => r && S(r.id) === pinId);
      if (pin) setSelectedPinInfo(pin);
    };
    window.addEventListener('onPinClick', handlePinClick);
    return () => window.removeEventListener('onPinClick', handlePinClick);
  }, []);

  useEffect(() => {
    window.openPinDetails = (id) => {
      window.dispatchEvent(new CustomEvent('onPinClick', { detail: S(id) }));
    };
    return () => { delete window.openPinDetails; };
  }, []);

  useEffect(() => {
    if (window.L) {
      setIsLeafletLoaded(true);
      return;
    }
    const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script'); script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true; 
    script.onload = () => setIsLeafletLoaded(true);
    document.head.appendChild(script);
  }, []);

  // 핀 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    if (!pinSelectOpen) return;
    const handler = () => setPinSelectOpen(false);
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [pinSelectOpen]);

  // 숙소→현재일정→지역→현위치 순서로 지도 위치를 스마트하게 이동하는 공통 함수
  // 반환값: 핀/지역 데이터가 있어서 위치 이동을 확정했으면 true, 데이터가 없어서 미확정이면 false
  const flyToSmartPosition = useCallback((map, rests, plans) => {
    const safeRests = Array.isArray(rests) ? rests.filter(Boolean) : [];
    const safePlans = Array.isArray(plans) ? plans.filter(Boolean) : [];

    if (safeRests.length === 0) {
      const cityForMap = displayCityName !== '선택된 지역 없음' ? displayCityName : null;
      if (cityForMap) {
        const queryName = CITY_NAME_TO_EN[cityForMap] || cityForMap;
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryName)}&limit=1&accept-language=en`)
          .then(r => r.json())
          .then(data => {
            if (data && data[0] && mapInstanceRef.current) {
              mapInstanceRef.current.setView([parseFloat(data[0].lat), parseFloat(data[0].lon)], 12);
            }
          })
          .catch(() => {});
        return true; // 도시명 기반 이동 시도 → 완료로 간주
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          mapInstanceRef.current && mapInstanceRef.current.setView([pos.coords.latitude, pos.coords.longitude], 13);
        }, () => {});
        return true; // 현재 위치 기반 이동 시도 → 완료로 간주
      }
      return false; // 데이터도 도시명도 없음 → 아직 미완료
    } else {
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const startD = new Date(travelStartDate); startD.setHours(0,0,0,0);
      const todayD = new Date(now); todayD.setHours(0,0,0,0);
      const diff = Math.round((todayD - startD) / 86400000);
      const todayDay = diff + 1;
      let targetPin = null;
      if (diff >= 0 && safePlans.some(p => parseInt(p.day) === todayDay)) {
        const todayPlans = safePlans.filter(p => parseInt(p.day) === todayDay && p.time && !p.isTransport).sort((a,b) => S(a.time).localeCompare(S(b.time)));
        const passed = todayPlans.filter(p => { const [h,m] = p.time.split(':').map(Number); return h*60+m <= nowMin; });
        const mp = passed.length > 0 ? passed[passed.length-1] : todayPlans[0];
        if (mp) targetPin = safeRests.find(r => S(r.name) === S(mp.place));
      }
      if (!targetPin) targetPin = safeRests.find(r => r.isAccommodation && r.lat && r.lng);
      if (!targetPin) targetPin = safeRests.find(r => r.lat && r.lng);
      if (targetPin?.lat) map.setView([targetPin.lat, targetPin.lng], 15);
      return true; // 핀 데이터 있음 → 완료
    }
  }, [displayCityName, travelStartDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // [NEW] 지도 탭 전환 시 잔상 해결 + 최초 1회 자동 위치 이동
  useEffect(() => {
    if (activeTab !== 'map' || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    map.invalidateSize(true);
    const timers = [10, 50, 150, 350, 500].map(t => setTimeout(() => map.invalidateSize(true), t));

    if (!mapInitFlyDoneRef.current) {
      const done = flyToSmartPosition(map, currentRestaurants, planTimeline);
      if (done) mapInitFlyDoneRef.current = true;
    }

    return () => timers.forEach(clearTimeout);
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!travelStartDate) return;
    const todayDate = new Date();
    const start = new Date(travelStartDate);
    todayDate.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    const diffTime = todayDate.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
const safeMax = (typeof maxDay === 'number' && maxDay > 0) ? maxDay : 4;
    // [스마트 Day 자동 인식 로직]
    if (diffDays < 1) {
      setDashboardDay(1); // 여행 전이면 무조건 Day 1
    } else if (diffDays > safeMax) {
      setDashboardDay(safeMax); // 여행 후면 마지막 Day 고정
    } else {
      setDashboardDay(diffDays); // 여행 중이면 해당 일차 표시
    }
    console.log(`📅 오늘 날짜를 분석하여 Day ${dashboardDay}를 자동으로 활성화했습니다.`);
  }, [travelStartDate, maxDay]);

  useEffect(() => {
    if (!editingPlan) {
      setPlanCountry(globalPlanCountry);
      setPlanRegion(globalPlanRegion);
      setManualCountry(globalPlanCountry === "수동입력" ? globalManualCountry : "");
      setManualRegion(globalPlanRegion === "수동입력" ? globalManualRegion : "");
    }
  }, [globalPlanCountry, globalPlanRegion, globalManualCountry, globalManualRegion, editingPlan]);

// 일기 자동저장용 ref 동기화
  useEffect(() => { diaryRatingRef.current = diaryRating; }, [diaryRating]);
  useEffect(() => { diaryReviewRef.current = diaryReview; }, [diaryReview]);
  useEffect(() => { planTimelineRef.current = planTimeline; }, [planTimeline]);
  useEffect(() => { currentRestaurantsRef2.current = currentRestaurants; }, [currentRestaurants]);

// 다른 일정 클릭 시 이전 일정 자동 저장 후 새 일정으로 초기화
  useEffect(() => {
    const prevId = prevDiaryPlanIdRef.current;
    const newId = selectedPlanInfo?.id ?? null;

    // 이전 일정이 있었고 다른 일정으로 바뀐 경우 → 이전 값 자동 저장
    if (prevId && prevId !== newId) {
      const rating = Number(diaryRatingRef.current) || 0;
      const review = diaryReviewRef.current ? String(diaryReviewRef.current).trim() : "";
      const updatedTimeline = (planTimelineRef.current || []).map(p =>
        String(p.id) === String(prevId)
          ? { ...p, rating, review }
          : p
      );
      const prevPlan = (planTimelineRef.current || []).find(p => String(p.id) === String(prevId));
      const updatedRests = (currentRestaurantsRef2.current || []).map(r =>
        prevPlan && S(r.name).trim() === S(prevPlan.place).trim()
          ? { ...r, rating, review }
          : r
      );
      setPlanTimeline(updatedTimeline);
      setCurrentRestaurants(updatedRests);
      saveToDb({ plan_timeline: updatedTimeline, current_restaurants: updatedRests });
    }

    prevDiaryPlanIdRef.current = newId;
    setIsDiaryOpen(false);
    setDiaryRating(selectedPlanInfo?.rating || 0);
    setDiaryReview(selectedPlanInfo?.review || "");
  }, [selectedPlanInfo?.id]);

// [NEW] 날씨 데이터 호출 트리거 (전역 지역명 + 개별 일정 지역명 하이브리드 연동)
  useEffect(() => {
    console.log("💡 날씨 연동 로직 시작. 현재 전역 지역명:", displayCityName);
    let targetCity = displayCityName;
    
    // 전역 지역명이 없거나 초기 상태일 경우, 회원님의 가설대로 '개별 일정(planTimeline)'에서 지역명 추출
    if (!targetCity || targetCity === "선택된 지역 없음" || targetCity === "수동입력") {
      const validPlan = Array.isArray(planTimeline) ? planTimeline.find(p => p && p.region && p.region !== "수동입력" && p.region !== "선택된 지역 없음") : null;
      if (validPlan) {
        targetCity = validPlan.region;
        console.log("💡 [자동 복구 완료] 개별 일정 카드에서 지역명을 찾아 대체합니다:", targetCity);
      }
    }
    
    fetchWeatherData(targetCity); 
  }, [displayCityName, planTimeline, fetchWeatherData]);
  useEffect(() => {
    fetchRealTimeRates();
    const interval = setInterval(() => fetchRealTimeRates(false), 300000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.async = true;
    
    script.onload = async () => {
      try {
        if (window.supabase) {
          const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
          setSupabaseClient(client);

          const savedAuthStr = localStorage.getItem('my_travel_auth');
          if (savedAuthStr) {
            const savedAuth = JSON.parse(savedAuthStr);
            const { id, pw, autoLogin, saveIdPw } = savedAuth;
            
            if (saveIdPw) { setIdInput(S(id)); setPwInput(S(pw)); setSaveCredentials(true); }
            if (autoLogin) {
              try {
                const { data } = await client.from('profiles').select('*').eq('app_user_id', S(id)).single();
                if (data && data.password === S(pw)) {
                  setAppUserId(S(id));
                  if (data.trips && Array.isArray(data.trips)) setTrips(data.trips);
                  if (data.activeTripId) setActiveTripId(S(data.activeTripId));
                  setAutoLogin(true);
                  setShowIdSetup(false);
                }
              } catch(e) { console.error("Auto login check failed", e); }
            }
          }
          setIsDbLoaded(true);
        }
      } catch (err) {
        console.error("Supabase init error:", err);
        setIsDbLoaded(true);
      }
    };
    
    script.onerror = () => setIsDbLoaded(true);
    document.head.appendChild(script);

    try {
      const savedElementScale = localStorage.getItem('my_travel_element_scale');
      let parsedElementScale = parseFloat(savedElementScale);
      if (isNaN(parsedElementScale) || parsedElementScale < 0.3 || parsedElementScale > 3) parsedElementScale = 1;
      setElementScale(parsedElementScale);

      const savedFontScale = localStorage.getItem('my_travel_font_scale');
      let parsedFontScale = parseFloat(savedFontScale);
      if (isNaN(parsedFontScale) || parsedFontScale < 0.5 || parsedFontScale > 2) parsedFontScale = 1;
      setFontScale(parsedFontScale);

      const savedTheme = localStorage.getItem('my_travel_theme');
      if (savedTheme) setAppTheme(S(savedTheme));

      const savedFont = localStorage.getItem('my_travel_font');
      if (savedFont) setAppFont(savedFont);
      
      const savedTextColor = localStorage.getItem('my_travel_text_color');
      if (savedTextColor) setAppTextColor(savedTextColor);

      // [NEW] 내 위치 아이콘 로컬스토리지 복구
      const savedLocIcon = localStorage.getItem('my_travel_loc_icon');
      if (savedLocIcon) setMyLocationIcon(savedLocIcon);
    } catch(e){}
  }, []);

  useEffect(() => {
    if (!supabaseClient || !appUserId || appUserId === "Guest") return;
    
    const profileChannel = supabaseClient.channel(`profiles_${appUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `app_user_id=eq.${appUserId}` }, (payload) => {
        if (payload.new) {
          if (payload.new.trips && Array.isArray(payload.new.trips)) setTrips(payload.new.trips);
        }
      }).subscribe();

    const targetId = activeTripId;
    
    let ignore = false;
    const fetchTrip = async () => {
      try {
        const { data } = await supabaseClient.from('travel_state').select('*').eq('id', targetId).single();
        if (ignore) return;
        if (data) {
          const cName = data.display_city_name ? S(data.display_city_name) : "선택된 지역 없음";
          setDisplayCityName(cName);
          syncCountryRegionFromCityName(cName, data.plan_timeline);
          setTravelStartDate(data.travel_start_date ? S(data.travel_start_date) : new Date().toISOString().split('T')[0]);
          setFlights(data.flights || { outbound: null, inbound: null });
          setPackingList(Array.isArray(data.packing_list) ? data.packing_list : []);
          setShoppingList(Array.isArray(data.shopping_list) ? data.shopping_list : []);
          setSharedUsers(Array.isArray(data.shared_users) ? data.shared_users : []);
          
          // [버그 수정 2] F5 새로고침 시 DB에서 rating과 review 필드 복원 (Fetch 매핑 로직 추가)
          if (Array.isArray(data.current_restaurants)) {
          setCurrentRestaurants(data.current_restaurants.filter(r => r && typeof r === 'object').map(r => ({ id: S(r.id), name: S(r.name), localName: S(r.localName), signature: S(r.signature), img: S(r.img), country: S(r.country), city: S(r.city), lat: r.lat, lng: r.lng, isAccommodation: Boolean(r.isAccommodation), isLandmark: Boolean(r.isLandmark), theme: S(r.theme) || "기타", rating: r.rating || 0, review: r.review || "" })));          } else { setCurrentRestaurants([]); }
          
          if (Array.isArray(data.plan_timeline)) {
          setPlanTimeline(data.plan_timeline.filter(p => p && typeof p === 'object').map(p => ({ id: S(p.id), day: p.day, time: S(p.time), place: S(p.place), localName: S(p.localName), features: S(p.features), photo: S(p.photo), country: S(p.country), region: S(p.region), isAccommodation: Boolean(p.isAccommodation), isTransport: Boolean(p.isTransport), theme: S(p.theme) || "기타", expenseLocal: p.expenseLocal || "", expenseKrw: p.expenseKrw || "", rating: p.rating || 0, review: p.review || "" })));          } else { setPlanTimeline([]); }
        } else {
           setDisplayCityName("선택된 지역 없음");
           setCurrentRestaurants([]);
           setPlanTimeline([]);
           setFlights({ outbound: null, inbound: null });
           setPackingList([]);
           setTravelStartDate(new Date().toISOString().split('T')[0]);
        }
      } catch(e) { console.error(e); }
    };
    fetchTrip();

    const tripChannel = supabaseClient.channel(`trip_${targetId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'travel_state', filter: `id=eq.${targetId}` }, (payload) => {
        if (payload.new) {
          if (payload.new.display_city_name) {
             setDisplayCityName(S(payload.new.display_city_name));
             syncCountryRegionFromCityName(S(payload.new.display_city_name), payload.new.plan_timeline);
          }
          if (payload.new.travel_start_date) setTravelStartDate(S(payload.new.travel_start_date));
          if (payload.new.flights) setFlights(payload.new.flights);
          if (payload.new.packing_list && Array.isArray(payload.new.packing_list)) setPackingList(payload.new.packing_list);
          
          if (payload.new.shared_users && Array.isArray(payload.new.shared_users)) {
             setSharedUsers(payload.new.shared_users);
             const isOwner = activeTripId.startsWith(`trip_${appUserId}_`);
             if (!isOwner && !payload.new.shared_users.includes(appUserId)) {
                showToast("⚠️ 관리자에 의해 공유가 중단되었습니다.");
                setTrips(prev => {
                   const filtered = prev.filter(t => t.id !== activeTripId);
                   supabaseClient.from('profiles').update({ trips: filtered, activeTripId: filtered[0]?.id }).eq('app_user_id', appUserId).then();
                   setActiveTripId(filtered[0]?.id || 'default');
                   return filtered;
                });
             }
          }
          
          if (Array.isArray(payload.new.current_restaurants)) {
            const cleanRests = payload.new.current_restaurants.filter(r => r && typeof r === 'object').map(r => ({ id: S(r.id), name: S(r.name), localName: S(r.localName), signature: S(r.signature), img: S(r.img), country: S(r.country), city: S(r.city), lat: r.lat, lng: r.lng, isAccommodation: Boolean(r.isAccommodation), isLandmark: Boolean(r.isLandmark), theme: S(r.theme) || '기타', rating: r.rating || 0, review: r.review || "" }));
            setCurrentRestaurants(cleanRests);
          }
          if (Array.isArray(payload.new.plan_timeline)) {
            const cleanPlans = payload.new.plan_timeline.filter(p => p && typeof p === 'object').map(p => ({ id: S(p.id), day: p.day, time: S(p.time), place: S(p.place), localName: S(p.localName), features: S(p.features), photo: S(p.photo), country: S(p.country), region: S(p.region), isAccommodation: Boolean(p.isAccommodation), isTransport: Boolean(p.isTransport), theme: S(p.theme) || "기타", expenseLocal: p.expenseLocal || "", expenseKrw: p.expenseKrw || "", rating: p.rating || 0, review: p.review || "" }));
            setPlanTimeline(cleanPlans);
          }
        }
      }).subscribe();

    const fetchInvites = async () => {
      try {
        const { data } = await supabaseClient.from('invites').select('*').eq('target_id', appUserId).single();
        if (data) setPendingInvite(data);
      } catch(e) { console.error(e); }
    };
    fetchInvites();
    
    const inviteChannel = supabaseClient.channel(`invites_${appUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invites', filter: `target_id=eq.${appUserId}` }, (payload) => {
        if (payload.eventType === 'DELETE') setPendingInvite(null);
        else setPendingInvite(payload.new);
      }).subscribe();

    return () => {
      ignore = true;
      supabaseClient.removeChannel(profileChannel);
      supabaseClient.removeChannel(tripChannel);
      supabaseClient.removeChannel(inviteChannel);
    };
  }, [supabaseClient, appUserId, activeTripId, syncCountryRegionFromCityName, refreshTrigger]); // [NEW] refreshTrigger 의존성 추가

  // (기존 전역 PTR 이벤트 리스너 제거 완료 - 메인 컨테이너 인라인 터치 이벤트로 이관됨)

  useEffect(() => {
    isPinModeRef.current = isPinMode; 
    
    if (!isLeafletLoaded || !mapContainerRef.current || !window.L) return;

    if (!mapInstanceRef.current) {
      if (mapContainerRef.current._leaflet_id) mapContainerRef.current._leaflet_id = null;

      // 초기 좌표는 기본값(서울)으로 설정 — 실제 이동은 데이터 로드 후 useEffect에서 처리
      const initialLat = 37.5665;
      const initialLng = 126.9780;

      try {
        const map = window.L.map(mapContainerRef.current, { zoomControl: false }).setView([initialLat || 37.5665, initialLng || 126.9780], 13);
        window.L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}').addTo(map);

        map.on('click', (e) => {
          if (movingPinIdRef.current) {
            setPendingMove({ id: movingPinIdRef.current, lat: e.latlng.lat, lng: e.latlng.lng });
            return;
          }
          if (!isPinModeRef.current) {
            return; 
          }
          setClickedLocation(e.latlng);
          setNewManualPlaceName("");
          setNewManualLocalName("");
          setNewManualFeature("");
          setNewManualPhoto("");
          setNewManualIsAccommodation(false);
          setPinLinkDay("");
          setPinLinkPlanId("");
          setNewManualTime("");
          setIsAddPlaceModalOpen(true);
        });

        mapInstanceRef.current = map;

        // 초기 위치 이동은 데이터 로드 완료 후 처리
      } catch (err) {
        console.error("Leaflet initialization failed", err);
      }
    }

    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // 지도 인스턴스 준비 + 데이터 로드 완료 시점에 최초 1회 위치 이동
    if (!mapInitFlyDoneRef.current && activeTab === 'map') {
      const done = flyToSmartPosition(map, currentRestaurants, planTimeline);
      if (done) mapInitFlyDoneRef.current = true;
    }
    
    polylinesRef.current.forEach(p => p.remove());
    polylinesRef.current = [];
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const safeCurrentRestaurants = Array.isArray(currentRestaurants) ? currentRestaurants.filter(Boolean) : [];
    const safePlanTimeline = Array.isArray(planTimeline) ? planTimeline.filter(Boolean) : [];

    const routeMap = {}; 
    const coordsByDay = {};

    tripDays.forEach(d => {
      const dayPlans = safePlanTimeline.filter(p => !p.isAccommodation && parseInt(p.day) === d && !p.isTransport).sort((a,b) => S(a.time).localeCompare(S(b.time)));
      coordsByDay[d] = [];
      let routeIndex = 1;
      dayPlans.forEach((p) => {
        const rest = safeCurrentRestaurants.find(r => r && S(r.name) === S(p.place));
        if (rest && rest.lat && rest.lng) {
           coordsByDay[d].push([rest.lat, rest.lng]);
           const key = `${S(p.place)}_${d}`;
           if (!routeMap[key]) {
              routeMap[key] = routeIndex; 
              routeIndex++;
           }
        }
      });
    });

    if (showMapRoute) {
       tripDays.forEach(d => {
          if (mapActiveDays.includes('all') || mapActiveDays.includes(d)) {
             if (coordsByDay[d] && coordsByDay[d].length > 1) {
                const polyline = window.L.polyline(coordsByDay[d], { color: getDayColor(d), weight: 3, opacity: 0.8, dashArray: '5, 8' }).addTo(map);
                polylinesRef.current.push(polyline);
             }
          }
       });
    }

// [지도 마커 필터링 수정] Day와 테마 필터링이 모두 적용된 filteredMyPins 변수를 참조하도록 변경
    const filteredRestaurants = filteredMyPins;

    filteredRestaurants.forEach((rest) => {
      if (!rest || !rest.lat || !rest.lng) return;
      const linkedPlans = safePlanTimeline.filter(p => p && S(p.place) === S(rest.name) && !p.isTransport);
      
      let primaryPlan = null;
      if (mapActiveDays.includes('all')) {
         primaryPlan = linkedPlans[0];
      } else {
         primaryPlan = linkedPlans.find(p => mapActiveDays.includes(parseInt(p.day)));
      }

      let routeNumberStr = '';
      if (primaryPlan) {
         const rNum = routeMap[`${S(rest.name)}_${primaryPlan.day}`];
         routeNumberStr = rNum ? String(rNum) : '📌';
      }

      const isAcc = Boolean(rest.isAccommodation) || linkedPlans.some(p => Boolean(p.isAccommodation));
      const isLand = Boolean(rest.isLandmark);
      
      const pinColor = primaryPlan ? getDayColor(primaryPlan.day) : '#94a3b8'; 
      
      let html = '';
// [추가됨] 지도 핀을 완전히 숨기는 마법의 필터 로직
      const mapSafeTimeline = Array.isArray(planTimeline) ? planTimeline.filter(Boolean) : [];
      const mapPinNameClean = S(rest.name).trim();
      const mapLinkedPlans = mapSafeTimeline.filter(p => S(p.place).trim() === mapPinNameClean);
      
      let mapPassDay = true;
      if (!mapActiveDays.includes('all')) {
         // [버그 수정] 미지정 핀(unlinked)과 일반 Day 복수 선택 가능하도록 조건 병합
         const hasUnlinked = mapActiveDays.includes('unlinked') && mapLinkedPlans.length === 0;
         const hasDay = mapLinkedPlans.some(p => mapActiveDays.includes(parseInt(p.day)));
         mapPassDay = hasUnlinked || hasDay;
      }
      
      let mapPassTheme = true;
      if (typeof myPinsThemeFilter !== 'undefined' && !myPinsThemeFilter.includes('all')) {
         const mapEffectiveTheme = mapLinkedPlans[0]?.theme || rest.theme || "기타";
         const mapRawPinTheme = S(mapEffectiveTheme).replace(/[^\uAC00-\uD7A3a-zA-Z]/g, '').trim();
         // [버그 수정] 테마 복수 선택(배열) 지원
         mapPassTheme = myPinsThemeFilter.some(filterTheme => mapRawPinTheme === S(filterTheme).replace(/[^\uAC00-\uD7A3a-zA-Z]/g, '').trim());
      }
      
      // 이 마커가 조건에 안 맞으면 여기서 바로 건너뜁니다! (회색 핀 원천 차단)
      if (!mapPassDay || !mapPassTheme) return;
      if (isLand) {
        html = `<div style="background-color:#fbbf24;width:32px;height:32px;border-radius:50%;border:3px solid #b45309;box-shadow:0 0 10px rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;transition:transform 0.2s; position:relative;"><span style="font-size:16px; filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.5));">👑</span><div style="position:absolute; bottom:-12px; left:50%; transform:translateX(-50%); width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:10px solid #b45309;"></div></div>`;
      } else {
        html = `<div style="background-color:${pinColor};width:${isAcc?'24px':'18px'};height:${isAcc?'24px':'18px'};border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;transition:transform 0.2s;">${isAcc?'<span style="font-size:12px;">🏠</span>':(primaryPlan?`<span style="color:white;font-size:10px;font-weight:bold;">${routeNumberStr}</span>`:'')}</div>`;
      }

      if (showMapPhotos && rest.img && !S(rest.img).includes("unsplash")) {
        if (isLand) {
            html = `<div style="width:44px;height:44px;border-radius:50%;border:4px solid #fbbf24;background-image:url(${S(rest.img)});background-size:cover;background-position:center;position:relative;box-shadow:0 0 10px rgba(0,0,0,0.6);"><div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:white;border-radius:50%;font-size:14px;padding:2px;box-shadow:0 0 4px black;display:flex;align-items:center;justify-content:center; z-index:10;">👑</div><div style="position:absolute; bottom:-12px; left:50%; transform:translateX(-50%); width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:10px solid #fbbf24;"></div></div>`;
        } else {
            html = `<div style="width:34px;height:34px;border-radius:50%;border:3px solid ${pinColor};background-image:url(${S(rest.img)});background-size:cover;background-position:center;position:relative;box-shadow:0 0 6px rgba(0,0,0,0.5);">${isAcc?'<div style="position:absolute;bottom:-6px;right:-6px;background:white;border-radius:50%;font-size:12px;padding:2px;box-shadow:0 0 4px black;display:flex;align-items:center;justify-content:center;">🏠</div>':(primaryPlan?`<div style="position:absolute;top:-6px;left:-6px;background:${pinColor};color:white;border-radius:50%;font-size:8px;font-weight:bold;width:14px;height:14px;display:flex;align-items:center;justify-content:center;border:1px solid white;">${routeNumberStr}</div>`:'')}</div>`;
        }
      }
      try {
        const icon = window.L.divIcon({ html, className: '', iconSize: isLand ? (showMapPhotos ? [44,44] : [32,32]) : [24,24], iconAnchor: isLand ? (showMapPhotos ? [22,22] : [16,16]) : [12,12] });
        const marker = window.L.marker([rest.lat, rest.lng], { icon }).addTo(map);
        if (showMapLabels) marker.bindTooltip(S(rest.name), { permanent: true, direction: 'bottom', className: 'text-[9px] font-bold bg-white/90 px-1 py-0.5 border rounded shadow-sm', offset: [0, 10] });
        
        let popup = `
          <div style="text-align:center; cursor:pointer; padding: 2px; width: 110px;" onclick="window.openPinDetails('${S(rest.id)}')">
            ${rest.img && !S(rest.img).includes("unsplash") ? `<img src="${S(rest.img)}" style="width:100%; height:60px; object-fit:cover; border-radius:6px; margin-bottom:4px;" alt=""/>` : ''}
            <b style="font-size:11px; display:block; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${S(rest.name)}</b>
            ${rest.localName ? `<span style="font-size:9px; color:#6b7280; display:block; margin-bottom:4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">(${S(rest.localName)})</span>` : ''}
            <span style="font-size:9px; color:#4f46e5; font-weight:bold; background:#eef2ff; padding:2px 6px; border-radius:4px; display:inline-block;">상세보기 👆</span>
          </div>
        `;
        marker.bindPopup(popup);
        markersRef.current.push(marker);
      } catch (err) {}
    });
  }, [isLeafletLoaded, activeTab, currentRestaurants, planTimeline, showMapLabels, showMapPhotos, showMapRoute, isPinMode, movingPinId, mapActiveDays, getDayColor]);

  /* ===================== UI 및 변수 계산 ===================== */

  const safeCurrentRestaurants = Array.isArray(currentRestaurants) ? currentRestaurants.filter(Boolean) : [];
  const filteredMarkers = markerSearchQuery 
    ? safeCurrentRestaurants.filter(r => r && S(r.name).toLowerCase().includes(S(markerSearchQuery).toLowerCase())) : safeCurrentRestaurants;
  
// [NEW] 내 핀 목록 탭 필터링 로직 (스마트 룩업: 일정표 데이터와 실시간 연동)
// [교차 필터링 버그 수정 완료] 일정표(Plan)를 실시간으로 역추적하여 테마를 매칭합니다.
const filteredMyPins = filteredMarkers.filter(pin => {
  const safeTimeline = Array.isArray(planTimeline) ? planTimeline.filter(Boolean) : [];
  const pinNameClean = S(pin.name).trim();
  const linkedPlans = safeTimeline.filter(p => S(p.place).trim() === pinNameClean);
  
  // 1. [Day 필터]
  let passDay = true;
  if (myPinsFilter !== 'all') {
    if (myPinsFilter === 'unlinked') passDay = linkedPlans.length === 0;
    else passDay = linkedPlans.some(p => parseInt(p.day) === parseInt(myPinsFilter));
  }

  // 2. [테마 필터 - 스마트 룩업]
  let passTheme = true;
  if (!myPinsThemeFilter.includes('all')) {
    // 일정표 테마가 1순위, 핀 테마가 2순위
    const effectiveTheme = linkedPlans[0]?.theme || pin.theme || "기타";
    const rawPinTheme = S(effectiveTheme).replace(/[^\uAC00-\uD7A3a-zA-Z]/g, '').trim();
    passTheme = myPinsThemeFilter.some(filterTheme => rawPinTheme === S(filterTheme).replace(/[^\uAC00-\uD7A3a-zA-Z]/g, '').trim());
  }

  return passDay && passTheme;
});
console.log("✅ 필터링된 데이터 개수:", filteredMyPins.length, filteredMyPins);

// [개발자 도구 확인용 로그] 현재 불러온 전체 핀과 필터링된 결과 확인
console.log("✅ 현재 핀 전체 데이터:", currentRestaurants);
if (currentRestaurants && currentRestaurants.length > 0) {
  console.log("🔍 데이터 1개 샘플 구조:", currentRestaurants[0]);
}
console.log("✅ 필터링 완료된 데이터:", filteredMyPins);

  let appBg = "bg-slate-50", textMain = "text-slate-900", textMuted = "text-slate-500", cardBg = "bg-white border-slate-200 shadow-sm", inputBg = "bg-white text-slate-900 border-slate-200";
  if (appTheme === 'dark') { appBg = "bg-slate-900"; textMain = "text-slate-100"; textMuted = "text-slate-400"; cardBg = "bg-slate-800 border-slate-700"; inputBg = "bg-slate-700 text-white border-slate-600"; }
  else if (appTheme === 'pastel') { appBg = "bg-orange-50"; textMain = "text-orange-950"; textMuted = "text-orange-600"; cardBg = "bg-white/80 border-orange-200 shadow-md backdrop-blur-md"; inputBg = "bg-white text-orange-900 border-orange-200"; }
  else if (appTheme === 'clean') { appBg = "bg-zinc-100"; textMain = "text-zinc-900"; textMuted = "text-zinc-500"; cardBg = "bg-white border-2 border-zinc-200 rounded-none"; inputBg = "bg-zinc-50 text-zinc-900 border-2 border-zinc-200 rounded-none"; }

  const safePlanTimeline = Array.isArray(planTimeline) ? planTimeline.filter(Boolean) : [];
  const safeDashboardDay = (typeof dashboardDay === 'number' && dashboardDay > 0) ? dashboardDay : 1;
  
  // [NEW] 데일리 일정 필터링 방식 혁신: 숙소 연박 무조건 포함 + 일반일정 시간순 정렬
  const dayAccoms = safePlanTimeline.filter(p => p && p.isAccommodation);
  const dayPlans = safePlanTimeline.filter(p => p && !p.isAccommodation && parseInt(p.day || 1) === safeDashboardDay).sort((a,b) => S(a?.time).localeCompare(S(b?.time)));
  const todayPlans = [...dayAccoms, ...dayPlans];
  
  const safeMaxDay = (typeof maxDay === 'number' && maxDay > 0 && maxDay < 100) ? maxDay : 4;
  const tripDays = Array.from({length: safeMaxDay}, (_, i) => i + 1);

  const isSharedTripActive = trips.find(t => t.id === activeTripId)?.isShared;
  const isTripOwner = activeTripId.startsWith(`trip_${appUserId}_`) || trips.find(t => t.id === activeTripId && !t.isShared);

  let headerForecastDateStr = "";
  if (travelStartDate) {
    const todayDate = new Date();
    const start = new Date(travelStartDate);
    todayDate.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    const diffTime = todayDate.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays < 1) {
      headerForecastDateStr = getDateStringForDay(1);
    } else if (diffDays >= 1 && diffDays <= safeMaxDay) {
      headerForecastDateStr = getDateStringForDay(diffDays);
    } else {
      const year = todayDate.getFullYear();
      const month = String(todayDate.getMonth() + 1).padStart(2, '0');
      const day = String(todayDate.getDate()).padStart(2, '0');
      headerForecastDateStr = `${year}-${month}-${day}`;
    }
  }
  const headerForecast = forecast.find(fc => fc && fc.date === headerForecastDateStr);
  const headerWeatherInfo = headerForecast ? getWeatherInfo(headerForecast.code) : (weather ? getWeatherInfo(weather.code) : null);
  const headerTemp = headerForecast ? `${headerForecast.max}°` : (weather ? `${weather.temp}°` : '-');

  const renderFlightCards = () => {
    if (!flights.outbound && !flights.inbound) return null;
    
    const wrapperClass = `flex flex-row gap-1.5 sm:gap-2 mb-2 w-full shrink-0`; 

    const getCardUX = (dirId) => {
      const isActive = activeMobileCard === `flight_${dirId}`;
      const baseBorder = isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white';
      const activeBorder = dirId === 'outbound' ? 'border-indigo-400' : 'border-rose-400';
      const finalBorder = isActive ? activeBorder : baseBorder;
      const hoverLogic = isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 md:group-hover:opacity-100 pointer-events-none md:group-hover:pointer-events-auto';
      return { finalBorder, hoverLogic, isActive };
    };

    return (
      <div className={wrapperClass}>
        {flights.outbound && (() => {
          const ux = getCardUX('outbound');
          return (
          <div onClick={(e) => {
             e.stopPropagation();
             if (ux.isActive) { handleEditFlight('outbound'); setActiveMobileCard(null); }
             else setActiveMobileCard('flight_outbound');
          }} className={`flex-1 flex flex-col justify-center p-2 rounded-lg border shadow-sm relative cursor-pointer md:hover:border-indigo-400 transition-all duration-300 group ${ux.finalBorder}`}>
            <div className="flex justify-between items-center w-full absolute top-1 left-0 right-0 px-1.5">
               <span className="text-[6px] sm:text-[8px] font-bold text-indigo-500 bg-indigo-100 px-1 rounded">가는 편 🛫</span>
               <div className="flex items-center space-x-1 relative">
                 <span className={`text-[6px] sm:text-[7px] font-bold text-slate-400 bg-slate-100/80 dark:bg-slate-700/80 px-1.5 py-0.5 rounded transition-opacity duration-300 ${ux.isActive ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'}`}>
                    {flights.outbound.flightNum || '편명미상'} {flights.outbound.seatNum ? `| ${flights.outbound.seatNum}` : ''}
                 </span>
                 <div className={`flex space-x-1 bg-white/90 dark:bg-slate-700/90 rounded border border-slate-200 dark:border-slate-600 shadow-sm transition-opacity duration-300 absolute right-0 top-0 ${ux.hoverLogic}`}>
                   <button onClick={(e) => { if (!ux.isActive) return; e.stopPropagation(); handleEditFlight('outbound'); }} className="text-slate-500 hover:text-indigo-600 p-0.5"><span className="text-[10px]">✏️</span></button>
                   <button onClick={(e) => { if (!ux.isActive) return; e.stopPropagation(); handleDeleteFlight('outbound'); }} className="text-slate-500 hover:text-rose-500 p-0.5"><span className="text-[10px]">🗑️</span></button>
                 </div>
               </div>
            </div>
            <div className="flex w-full items-center justify-between mt-3 sm:mt-4 px-1">
              <div className="flex flex-col w-[30%]"><span className="text-[10px] sm:text-sm font-black text-slate-700 dark:text-slate-200 truncate">{flights.outbound.dep}</span><span className="text-[7px] sm:text-[8px] font-bold text-slate-400">{flights.outbound.depTime}</span></div>
              <div className="flex flex-col items-center flex-1 px-0.5 sm:px-1">
                <span className="text-[6px] sm:text-[8px] text-slate-300 w-full flex items-center before:flex-1 before:border-t before:border-dashed before:border-slate-300 after:flex-1 after:border-t after:border-dashed after:border-slate-300"><span className="px-0.5 sm:px-1">✈️</span></span>
                <span className="text-[6px] sm:text-[8px] font-bold text-indigo-400 truncate w-full text-center">{flights.outbound.airline}</span>
              </div>
              <div className="flex flex-col text-right w-[30%]"><span className="text-[10px] sm:text-sm font-black text-slate-700 dark:text-slate-200 truncate">{flights.outbound.arr}</span><span className="text-[7px] sm:text-[8px] font-bold text-slate-400">{flights.outbound.arrTime}</span></div>
            </div>
          </div>
        )})()}
        {flights.inbound && (() => {
          const ux = getCardUX('inbound');
          return (
          <div onClick={(e) => {
             e.stopPropagation();
             if (ux.isActive) { handleEditFlight('inbound'); setActiveMobileCard(null); }
             else setActiveMobileCard('flight_inbound');
          }} className={`flex-1 flex flex-col justify-center p-2 rounded-lg border shadow-sm relative cursor-pointer md:hover:border-rose-400 transition-all duration-300 group ${ux.finalBorder}`}>
            <div className="flex justify-between items-center w-full absolute top-1 left-0 right-0 px-1.5">
               <span className="text-[6px] sm:text-[8px] font-bold text-rose-500 bg-rose-100 px-1 rounded">오는 편 🛬</span>
               <div className="flex items-center space-x-1 relative">
                 <span className={`text-[6px] sm:text-[7px] font-bold text-slate-400 bg-slate-100/80 dark:bg-slate-700/80 px-1.5 py-0.5 rounded transition-opacity duration-300 ${ux.isActive ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'}`}>
                    {flights.inbound.flightNum || '편명미상'} {flights.inbound.seatNum ? `| ${flights.inbound.seatNum}` : ''}
                 </span>
                 <div className={`flex space-x-1 bg-white/90 dark:bg-slate-700/90 rounded border border-slate-200 dark:border-slate-600 shadow-sm transition-opacity duration-300 absolute right-0 top-0 ${ux.hoverLogic}`}>
                   <button onClick={(e) => { if (!ux.isActive) return; e.stopPropagation(); handleEditFlight('inbound'); }} className="text-slate-500 hover:text-indigo-600 p-0.5"><span className="text-[10px]">✏️</span></button>
                   <button onClick={(e) => { if (!ux.isActive) return; e.stopPropagation(); handleDeleteFlight('inbound'); }} className="text-slate-500 hover:text-rose-500 p-0.5"><span className="text-[10px]">🗑️</span></button>
                 </div>
               </div>
            </div>
            <div className="flex w-full items-center justify-between mt-3 sm:mt-4 px-1">
              <div className="flex flex-col w-[30%]"><span className="text-[10px] sm:text-sm font-black text-slate-700 dark:text-slate-200 truncate">{flights.inbound.dep}</span><span className="text-[7px] sm:text-[8px] font-bold text-slate-400">{flights.inbound.depTime}</span></div>
              <div className="flex flex-col items-center flex-1 px-0.5 sm:px-1">
                <span className="text-[6px] sm:text-[8px] text-slate-300 w-full flex items-center before:flex-1 before:border-t before:border-dashed before:border-slate-300 after:flex-1 after:border-t after:border-dashed after:border-slate-300"><span className="px-0.5 sm:px-1">✈️</span></span>
                <span className="text-[6px] sm:text-[8px] font-bold text-rose-400 truncate w-full text-center">{flights.inbound.airline}</span>
              </div>
              <div className="flex flex-col text-right w-[30%]"><span className="text-[10px] sm:text-sm font-black text-slate-700 dark:text-slate-200 truncate">{flights.inbound.arr}</span><span className="text-[7px] sm:text-[8px] font-bold text-slate-400">{flights.inbound.arrTime}</span></div>
            </div>
          </div>
        )})()}
      </div>
    );
  };

  const finalElementScale = (typeof elementScale === 'number' && !isNaN(elementScale) && elementScale > 0.3) ? elementScale : 1;

  /* ===================== 메인 렌더링 블록 ===================== */

  if (!isDbLoaded) return <div className="h-screen w-full flex items-center justify-center bg-slate-50"><span className="text-2xl animate-spin inline-block">🔄</span></div>;

  if (showIdSetup) {
    return (
      <div className="flex h-screen w-full bg-slate-100 items-center justify-center font-sans select-none p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm flex flex-col items-center animate-in zoom-in-95 duration-300">
          <div className="text-4xl mb-4 bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center transition-transform hover:scale-105">🐱</div>
          <h2 className="text-xl font-black text-slate-900 mb-2">{isLoginMode ? "로그인" : "계정 생성"}</h2>
          <p className="text-xs text-slate-500 text-center mb-6">{isLoginMode ? "여행 일정을 다시 확인해보세요!" : "아이디를 만들어 일정을 공유하세요!"}</p>
          
          <input type="text" placeholder="아이디 (영문/숫자 3자 이상)" value={S(idInput)} onChange={(e) => {setIdInput(e.target.value.replace(/[^a-zA-Z0-9]/g, '')); setIdError("");}} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 transition-all duration-300 mb-3" />
          <input type="password" placeholder="비밀번호 (4자 이상)" value={S(pwInput)} onChange={(e) => {setPwInput(e.target.value); setIdError("");}} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 transition-all duration-300 mb-3" />

          <div className="flex w-full justify-between items-center mb-5 px-1">
            <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-slate-600"><input type="checkbox" checked={saveCredentials} onChange={e => setSaveCredentials(e.target.checked)} className="accent-indigo-600 w-3.5 h-3.5" /><span>ID/PW 저장</span></label>
            <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-slate-600"><input type="checkbox" checked={autoLogin} onChange={e => {setAutoLogin(e.target.checked); if(e.target.checked) setSaveCredentials(true);}} className="accent-indigo-600 w-3.5 h-3.5" /><span>자동 로그인</span></label>
          </div>

          {idError && <p className="text-[10px] text-rose-500 font-bold mb-3 text-center animate-in slide-in-from-top-1">{S(idError)}</p>}
          
          <div className="flex w-full space-x-2">
            <button onClick={() => setIsLoginMode(!isLoginMode)} disabled={isLoggingIn} className={`flex-1 bg-slate-100 text-slate-600 rounded-xl py-3 text-xs font-bold transition-all duration-300 ${isLoggingIn ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-200'}`}>{isLoginMode ? "회원가입" : "로그인으로"}</button>
            <button onClick={() => isLoginMode ? handleLogin() : handleSignUp()} disabled={isLoggingIn} className={`flex-[2] bg-indigo-600 text-white rounded-xl py-3 text-sm font-bold shadow-md transition-all duration-300 ${isLoggingIn ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700 active:scale-95'}`}>
              {isLoggingIn ? "처리 중..." : (isLoginMode ? "로그인" : "아이디 생성")}
            </button>
          </div>
          <button onClick={handleSkipIdSetup} disabled={isLoggingIn} className="mt-5 text-[10px] text-slate-400 font-bold underline hover:text-slate-600 transition-colors">건너뛰기 (로컬 테스트)</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ zoom: finalElementScale, width: '100vw', maxWidth: '100vw' }} className={`flex flex-col h-[100dvh] ${appBg} ${textMain} overflow-hidden select-none relative transition-colors duration-300`} onClick={() => setActiveMobileCard(null)}>
      
      {/* 네이티브 당겨서 새로고침 (Pull-to-Refresh) 숨겨진 배경 애니메이션 */}
      {/* [버그 수정] 컨테이너 높이를 당긴 거리만큼 동기화하고, 안의 내용을 바닥(justify-end)에 붙여 짤림 현상 완벽 제거 */}
      <div className="absolute top-0 left-0 w-full flex flex-col items-center justify-end z-0 pointer-events-none overflow-hidden" style={{ height: `${isRefreshing ? 80 : pullDistance}px` }}>
        <div className={`transition-all duration-150 flex flex-col items-center pb-4 ${isRefreshing ? 'animate-bounce opacity-100' : 'opacity-100'}`}>
          <span className="text-3xl drop-shadow-md mb-1.5">{isRefreshing ? '🚀' : '✈️'}</span>
          <span className="text-[11px] font-black text-indigo-600 bg-indigo-50/90 dark:bg-indigo-900/80 dark:text-indigo-300 px-4 py-1.5 rounded-full shadow-sm backdrop-blur-sm border border-indigo-100 dark:border-indigo-800 whitespace-nowrap">
            {isRefreshing ? "영차 영차! 새로운 정보를 불러오는 중! ✨" : "아래로 쭈욱 당겨서 동기화..."}
          </span>
        </div>
      </div>

      {/* --- 모달 및 팝업 영역 --- */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-full text-xs font-bold shadow-2xl z-[99999] animate-in fade-in slide-in-from-top-4 duration-300">
          {toastMsg}
        </div>
      )}

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-[9500] flex transition-opacity duration-300" onClick={() => setIsMobileMenuOpen(false)}>
          <div className={`w-64 h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300 ${isDarkMode ? 'bg-slate-900 border-r border-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className={`p-5 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'} flex items-center justify-between`}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-xl">🐱</div>
                <div className="flex flex-col">
                  <span className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{appUserId === 'Guest' ? '게스트' : appUserId}</span>
                  <span className="text-[10px] text-slate-500 font-bold">환영합니다!</span>
                </div>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className={`text-xl transition-colors hover:text-rose-500 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
              <div>
<h3 className={`text-xs font-black mb-3 px-1 flex items-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>지금 여행중 ✈️ <span className="ml-2 inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span></h3>
                  <div className="space-y-1.5">
                    {trips.filter(t => !t.archived).map(t => {
                      // [고도화된 여행 완료 자동 감지 로직]
                      const isActive = activeTripId === t.id;
                      let isTimeFinished = false;
                      
                      if (isActive && travelStartDate) {
                        const safePlans = Array.isArray(planTimeline) ? planTimeline.filter(p => p && !p.isAccommodation) : [];
                        const lastDay = safePlans.length > 0 ? Math.max(...safePlans.map(p => parseInt(p.day || 1))) : maxDay;
                        const lastTime = safePlans.filter(p => parseInt(p.day) === lastDay).sort((a,b) => S(b.time).localeCompare(S(a.time)))[0]?.time || "23:59";
                        
                        const endDate = new Date(travelStartDate);
                        endDate.setDate(endDate.getDate() + (lastDay - 1));
                        const [hh, mm] = lastTime.split(':');
                        endDate.setHours(parseInt(hh), parseInt(mm), 0);
                        
                        if (endDate < new Date()) isTimeFinished = true;
                      }
                      
return (
                        <div key={t.id} className="group relative">
                          <button 
                            onClick={() => {
                              handleSwitchTrip(t.id); // 1. 여행 데이터 교체
                              setActiveTab('dashboard'); // 2. 보관함에서 대시보드로 화면 전환
                              setIsMobileMenuOpen(false); // 3. 모바일 사이드바 닫기
                            }} 
                            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-between border-2 ${
                              isActive 
                                ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg transform scale-[1.03] z-10' 
                                : (isDarkMode 
                                    ? 'bg-slate-800 text-slate-300 border-transparent hover:bg-slate-700' 
                                    : 'bg-white text-slate-600 border-slate-100 shadow-sm hover:border-indigo-200 hover:bg-indigo-50/30')
                            }`}
                          >
                            <span className="truncate flex items-center pr-8">
                              {t.isShared ? <span className="mr-1.5 text-[10px]">🤝</span> : <span className="mr-1.5 text-[10px]">📍</span>}
                              {S(t.name)}
                            </span>
                            
                            {/* 삭제/나가기 버튼 강조 및 위치 고정 */}
                            <span 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setTripToDelete(t.id); 
                              }} 
                              className={`absolute right-3 px-1 py-1 rounded-md transition-all duration-200 ${
                                isActive 
                                  ? 'text-indigo-200 hover:text-white hover:bg-indigo-500' 
                                  : 'text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100'
                              }`}
                            >
                              {t.isShared ? '🚪' : '🗑️'}
                            </span>
                          </button>
                          
                          {/* 스마트 완료 버튼: 시간이 지났을 때만 노출 */}
                          {isTimeFinished && (
                            <button 
                              onClick={async (e) => {
                                e.stopPropagation();
                                if(!window.confirm("정말 이 여행을 완료하시겠습니까?\n완료된 여행은 '소중한 여행기록'으로 이동합니다.")) return;
                                
                                const finishDate = new Date().toISOString();
                                const newTrips = trips.map(item => item.id === t.id ? { ...item, archived: true, finishDate: finishDate } : item);
                                setTrips(newTrips);
                                
                                if(supabaseClient && appUserId !== "Guest") {
                                  await supabaseClient.from('profiles').update({ trips: newTrips }).eq('app_user_id', appUserId);
                                  await supabaseClient.from('travel_state').update({ archived: true, finish_date: finishDate, shared_users: [] }).eq('id', t.id);
                                }
                                showToast("축하합니다! 성공적으로 여행을 마쳤습니다. 🏁");
                                setActiveTab('archive');
                              }}
                              className="w-full mt-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] py-1.5 rounded-lg font-black shadow-lg transition-all animate-in slide-in-from-top-1"
                            >
                              🏁 여행 완료 (기록 보관하기)
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-8 pt-4 border-t border-dashed border-slate-200 dark:border-slate-700">
                    <button 
                      onClick={() => { setActiveTab('archive'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl text-xs font-black transition-all duration-300 active:scale-95 ${activeTab === 'archive' ? 'bg-indigo-600 text-white shadow-xl' : 'bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 border border-indigo-100 shadow-sm'}`}
                    >
                      <div className="flex items-center">
                        <span className="text-lg mr-2">📷</span>
                        <span>소중한 여행기록</span>
                      </div>
                      <span className="opacity-50">📂</span>
                    </button>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2">
                   <button onClick={openAddTripModal} className={`py-2 rounded-lg text-[10px] font-bold border border-dashed transition-all duration-300 ${isDarkMode ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-300 text-slate-500 hover:bg-slate-50 active:scale-95'}`}>+ 새 여행</button>
                   <button onClick={openRenameTripModal} className={`py-2 rounded-lg text-[10px] font-bold border border-dashed transition-all duration-300 ${isDarkMode ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-300 text-slate-500 hover:bg-slate-50 active:scale-95'}`}>✏️ 이름 변경</button>
                </div>
              </div>

              {pendingInvite && (
                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 animate-in fade-in duration-300">
                  <h3 className="text-[10px] font-black text-indigo-600 mb-1">💌 새 초대장 도착!</h3>
                  <p className="text-[9px] text-indigo-500 mb-2 truncate">From: {S(pendingInvite.from_id)}</p>
                  <div className="flex space-x-1.5">
                    <button onClick={handleAcceptInvite} className="flex-1 bg-indigo-600 text-white py-1.5 rounded text-[10px] font-bold shadow-sm hover:bg-indigo-700 transition-colors">수락</button>
                    <button onClick={handleRejectInvite} className="flex-1 bg-white text-slate-600 py-1.5 rounded text-[10px] font-bold shadow-sm border hover:bg-slate-50 transition-colors">거절</button>
                  </div>
                </div>
              )}
            </div>
            
            <div className={`p-4 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'} space-y-2`}>
              <div className="flex space-x-2 mb-2">
                 <button onClick={handleUndo} disabled={historyIndex <= 0} className={`flex-1 flex items-center justify-center py-2 rounded-xl text-xs font-bold transition-all duration-300 ${historyIndex <= 0 ? 'opacity-30 cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 active:scale-95'}`}>
                    <span className="mr-1">⏪</span> 슝
                 </button>
                 <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className={`flex-1 flex items-center justify-center py-2 rounded-xl text-xs font-bold transition-all duration-300 ${historyIndex >= history.length - 1 ? 'opacity-30 cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800' : 'bg-rose-100 text-rose-600 hover:bg-rose-200 dark:bg-rose-900/50 dark:text-rose-300 active:scale-95'}`}>
                    뽕 <span className="ml-1">⏩</span>
                 </button>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(true); }} className={`w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 active:scale-95 ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                <span>⚙️ 환경 설정</span>
              </button>
              <button onClick={handleLogout} className={`w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 border border-dashed active:scale-95 ${isDarkMode ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-300 text-slate-500 hover:bg-slate-50'}`}>
                <span>🚪 로그아웃</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-300" onClick={() => setIsSettingsOpen(false)}>
           <div className={`${cardBg} p-6 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300`} onClick={e => e.stopPropagation()}>
              <div className={`flex justify-between items-center mb-5 border-b pb-3 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                 <h3 className={`font-black text-sm ${textMain}`}>⚙️ 환경 설정</h3>
                 <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg transition-colors">✕</button>
              </div>
              
              <div className="space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar pr-2">
                 <div className="flex flex-col space-y-2">
                    <label className={`text-xs font-bold ${textMuted}`}>앱 테마 설정</label>
                    <div className="flex space-x-2">
                       <button onClick={() => handleThemeChange('light')} className={`flex-1 py-2 text-xs font-bold border rounded-lg transition-all duration-300 ${appTheme === 'light' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>기본(Light)</button>
                       <button onClick={() => handleThemeChange('dark')} className={`flex-1 py-2 text-xs font-bold border rounded-lg transition-all duration-300 ${appTheme === 'dark' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}>다크 모드</button>
                       <button onClick={() => handleThemeChange('pastel')} className={`flex-1 py-2 text-xs font-bold border rounded-lg transition-all duration-300 ${appTheme === 'pastel' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100'}`}>파스텔</button>
                    </div>
                 </div>

                 {/* [NEW] 내 위치 캐릭터 아이콘 설정 */}
                 <div className="flex flex-col space-y-2 mt-3 mb-4">
                    <label className={`text-xs font-bold ${textMuted}`}>📍 내 위치 캐릭터 설정</label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 px-1 pb-1 box-border">
                       {['🚶‍♂️', '🏃‍♀️', '👶', '🚗', '🐎', '🐶', '🐱'].map(icon => (
                          <button key={icon} onClick={() => { setMyLocationIcon(icon); try{localStorage.setItem('my_travel_loc_icon', icon)}catch(e){} }} className={`py-1.5 text-xl rounded-lg transition-all duration-300 border shadow-sm ${myLocationIcon === icon ? 'bg-indigo-100 border-indigo-500 scale-110 z-10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:scale-105'}`}>
                             {icon}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="flex flex-col space-y-2 mt-3">
                    <label className={`text-xs font-bold ${textMuted}`}>폰트 (글꼴) 설정</label>
                    <select value={appFont} onChange={e => { setAppFont(e.target.value); try{localStorage.setItem('my_travel_font', e.target.value)}catch(err){} }} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'} p-2 text-xs font-bold outline-none rounded-lg cursor-pointer transition-colors duration-300`}>
                       <option value="'Pretendard', -apple-system, sans-serif">Pretendard (기본/Mac 추천)</option>
                       <option value="'Malgun Gothic', '맑은 고딕', sans-serif">맑은 고딕 (Windows 기본)</option>
                       <option value="'Noto Sans KR', sans-serif">Noto Sans KR (깔끔한 고딕)</option>
                       <option value="'Nanum Gothic', sans-serif">나눔고딕 (둥근 고딕)</option>
                    </select>
                  </div>

                  {/* [NEW] 앱 글자 색상 설정 UI 수정 */}
                  <div className="flex flex-col space-y-2 mt-3">
                    <label className={`text-xs font-bold ${textMuted}`}>앱 글자 색상 설정</label>
                    <div className="grid grid-cols-2 gap-2">
                       {[
                         { id: 'original', label: '초기 테마 (파랑/회색 혼합)', color: 'linear-gradient(45deg, #4f46e5, #64748b)' },
                         { id: 'default', label: '기본 (다크/라이트 자동)', color: isDarkMode ? '#f1f5f9' : '#0f172a' },
                         { id: 'high-contrast', label: '고대비 (선명함)', color: isDarkMode ? '#ffffff' : '#000000' },
                         { id: 'monochrome', label: '단색 (부드러움)', color: isDarkMode ? '#e2e8f0' : '#1e293b' }
                       ].map(item => (
                         <button key={item.id} onClick={() => { setAppTextColor(item.id); localStorage.setItem('my_travel_text_color', item.id); }} className={`flex items-center space-x-2 p-2 rounded-lg border-2 text-[10px] font-bold transition-all ${appTextColor === item.id ? 'border-indigo-500 bg-indigo-50/20 shadow-inner' : 'border-slate-100 dark:border-slate-700'}`}>                           <div className="w-3 h-3 rounded-full border border-slate-300" style={{ background: item.color }}></div>
                           <span>{item.label}</span>
                         </button>
                       ))}
                    </div>
                  </div>
                 
                 <div className="flex flex-col space-y-2 pt-2">
                    <label className={`text-xs font-bold ${textMuted}`}>화면/글자 크기 (글꼴: {fontScale}, 요소: {elementScale})</label>
                    <input type="range" min="0.5" max="1.5" step="0.1" value={fontScale} onChange={handleFontScaleChange} className="w-full accent-indigo-600 transition-all duration-300" />
                    <input type="range" min="0.5" max="1.5" step="0.1" value={elementScale} onChange={handleElementScaleChange} className="w-full accent-indigo-600 mt-2 transition-all duration-300" />
                 </div>

                 <div className={`flex flex-col space-y-3 border-t pt-4 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                    <label className={`text-xs font-bold ${textMuted}`}>🤝 일정 공유 및 관리</label>
                    <div className="space-y-3 animate-in fade-in duration-300">
                       <div className="flex space-x-2">
                          <input type="text" value={inviteIdInput} onChange={e => setInviteIdInput(e.target.value)} placeholder="초대할 친구 아이디 입력" className={`flex-1 ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'} p-2 text-[11px] font-bold rounded-lg outline-none focus:border-indigo-500 transition-colors duration-300`} />
                          <button onClick={handleSendInvite} className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-[10px] font-bold shadow-md hover:bg-indigo-700 active:scale-95 transition-all duration-300 whitespace-nowrap">초대 발송</button>
                       </div>
                       
                       <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                          <p className={`text-[10px] font-bold ${textMuted} mb-2`}>현재 이 일정을 함께 보는 사람</p>
                          <div className="flex flex-wrap gap-1.5">
                             <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 px-2 py-1 rounded text-[9px] font-bold shadow-sm">👑 나 ({appUserId})</span>
                             {sharedUsers.filter(u => u !== appUserId).map((user, idx) => (
                               <div key={idx} className="flex items-center bg-white text-slate-600 dark:bg-slate-700 dark:text-slate-300 border dark:border-slate-600 px-2 py-1 rounded shadow-sm">
                                 <span className="text-[9px] font-bold">👤 {user}</span>
                                 {isTripOwner && (
                                   <button onClick={() => setKickUserTarget(user)} className="ml-1.5 pl-1.5 border-l border-slate-200 dark:border-slate-500 text-rose-500 hover:text-rose-600 text-[9px] font-black transition-colors">강퇴</button>
                                 )}
                               </div>
                             ))}
                             {sharedUsers.filter(u => u !== appUserId).length === 0 && <span className="text-[9px] text-slate-400 py-1 pl-1">아직 참여 중인 친구가 없습니다.</span>}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className={`w-full mt-6 rounded-xl py-3 text-xs font-bold transition-colors duration-300 active:scale-95 ${isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>닫기</button>
           </div>
        </div>
      )}

      {/* 강퇴 확인 모달 */}
      {kickUserTarget && (
        <div className="fixed inset-0 bg-black/60 z-[99999] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-300">
           <div className={`bg-white dark:bg-slate-800 p-6 rounded-3xl max-w-xs w-full text-center shadow-2xl animate-in zoom-in-95 duration-300`}>
              <div className="text-3xl mb-3">⚠️</div>
              <h3 className={`text-sm font-black mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>공유 중단 확인</h3>
              <p className={`text-[11px] font-bold mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} leading-relaxed`}>
                 <span className="text-indigo-500 font-black">[{kickUserTarget}]</span> 사용자와<br/>공유를 중지하시겠습니까?
              </p>
              <div className="flex space-x-2">
                 <button className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-colors duration-300 ${isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} onClick={() => setKickUserTarget(null)}>취소</button>
                 <button className="flex-1 py-2.5 bg-rose-500 text-white rounded-xl font-bold text-xs shadow-md hover:bg-rose-600 active:scale-95 transition-all duration-300" onClick={async () => {
                    const newShared = sharedUsers.filter(u => u !== kickUserTarget);
                    setSharedUsers(newShared);
                    if(supabaseClient) await supabaseClient.from('travel_state').update({ shared_users: newShared }).eq('id', activeTripId);
                    showToast(`${kickUserTarget} 님을 여행에서 내보냈습니다.`);
                    setKickUserTarget(null);
                 }}>중지하기</button>
              </div>
           </div>
        </div>
      )}

      {viewPhoto && (
        <div className="fixed inset-0 bg-black/90 z-[99998] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-300" onClick={() => setViewPhoto(null)}>
          <img src={viewPhoto} className="max-w-full max-h-full object-contain rounded-md shadow-2xl animate-in zoom-in-95 duration-300" alt="" onClick={e => e.stopPropagation()} />
          <button className="absolute top-4 right-4 text-white bg-black/50 px-3 py-1 rounded-full hover:bg-black/80 transition-colors" onClick={() => setViewPhoto(null)}>✕</button>
        </div>
      )}

      {tripToDelete && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-300">
           <div className={`bg-white dark:bg-slate-800 p-6 rounded-3xl max-w-xs w-full text-center shadow-2xl animate-in zoom-in-95 duration-300`}>
              <div className="text-3xl mb-3">{trips.find(t=>t.id===tripToDelete)?.isShared ? '🚪' : '🗑️'}</div>
              <h3 className={`text-sm font-black mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                 {trips.find(t=>t.id===tripToDelete)?.isShared ? '공유 목록에서 나가기' : '여행 삭제'}
              </h3>
              <p className={`text-[11px] font-bold mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} leading-relaxed`}>
                 {trips.find(t=>t.id===tripToDelete)?.isShared 
                   ? '이 공유 여행을 내 문서함 목록에서 지우시겠습니까?' 
                   : '정말 이 여행을 삭제하시겠습니까?\n삭제된 데이터는 절대 복구할 수 없습니다.'}
              </p>
              <div className="flex space-x-2">
                 <button className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-colors duration-300 ${isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} onClick={() => setTripToDelete(null)}>취소</button>
                 <button className="flex-1 py-2.5 bg-rose-500 text-white rounded-xl font-bold text-xs shadow-md hover:bg-rose-600 active:scale-95 transition-all duration-300" onClick={confirmDeleteTrip}>
                    {trips.find(t=>t.id===tripToDelete)?.isShared ? '나가기' : '삭제하기'}
                 </button>
              </div>
           </div>
        </div>
      )}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 transition-opacity duration-300" onClick={() => setIsExpenseModalOpen(false)}>
          <div className={`${cardBg} p-5 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]`} onClick={e => e.stopPropagation()}>
            <div className={`flex justify-between items-center mb-4 border-b pb-3 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <h3 className={`font-black text-sm ${textMain}`}>💸 여행정산</h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg transition-colors">✕</button>
            </div>

{/* [수정됨] 기타 지출 수동 등록 및 스마트 Day 자동 계산 섹션 */}
            <div className={`p-3 mb-4 rounded-xl border border-dashed shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-slate-50 border-slate-300'}`}>
              <h4 className="text-[10px] font-black text-indigo-500 mb-2 flex justify-between items-center">
                <span>기타 지출 💸</span>
                <span className="text-[8px] opacity-70 bg-indigo-50 dark:bg-indigo-900/50 px-1.5 py-0.5 rounded">오늘 날짜 자동 연동 ✨</span>
              </h4>
              <div className="flex space-x-1.5">
                <input id="manualExpName" type="text" placeholder="지출 내용 (예: 간식)" className={`flex-[2] ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'} p-1.5 text-[10px] font-bold outline-none rounded-md`} />
                <input id="manualExpAmt" type="number" placeholder="금액" className={`flex-[1] ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'} p-1.5 text-[10px] font-bold outline-none rounded-md`} />
                <button onClick={() => {
const name = document.getElementById('manualExpName').value;
                  const amt = document.getElementById('manualExpAmt').value;
                  if(!name || !amt) { showToast("내용과 금액을 입력하세요."); return; }
                  
                  // [국가 기반 자동 환전 및 Day 계산 로직]
                  let autoDay = 1;
                  if (travelStartDate) {
                    const today = new Date(); today.setHours(0,0,0,0);
                    const start = new Date(travelStartDate); start.setHours(0,0,0,0);
                    const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;
                    autoDay = diff < 1 ? 1 : (diff > maxDay ? maxDay : diff);
                  }

                  // 현재 설정된 지역의 국가 찾기
                  let targetCountry = "";
                  for (const [country, regions] of Object.entries(REGIONS_BY_COUNTRY)) {
                    if (regions.includes(displayCityName)) { targetCountry = country; break; }
                  }
                  
                  let curCode = 'USD';
                  if (targetCountry === '한국') curCode = 'KRW'; 
                  else if (targetCountry === '일본') curCode = 'JPY'; 
                  else if (['프랑스','이탈리아','스페인','독일'].includes(targetCountry)) curCode = 'EUR'; 
                  else if (targetCountry === '중국') curCode = 'CNY'; 
                  else if (targetCountry === '미국') curCode = 'USD';
                  else if (targetCountry === '영국') curCode = 'GBP';

                  const krwVal = Math.round(amt * ((rates['KRW']||1350) / (rates[curCode]||1)));
                  
                  const newExp = {
                      id: "manual-exp-" + Date.now(), day: autoDay, time: "상시", place: `[기타] ${name}`, theme: "기타", 
                      expenseLocal: amt, expenseKrw: krwVal, isAccommodation: false, isTransport: false,
                      country: targetCountry // 국가 정보 함께 저장하여 화폐 기호 연동
                  };
                  const updatedTimeline = [...planTimeline, newExp];
                  setPlanTimeline(updatedTimeline);
                  saveToDb({ plan_timeline: updatedTimeline });
                  showToast(`Day ${autoDay} 지출이 ${targetCountry} 환율로 기록되었습니다! 💸`);
                  document.getElementById('manualExpName').value = ''; document.getElementById('manualExpAmt').value = '';
                }} className="bg-indigo-600 text-white px-3 py-1.5 text-[10px] font-bold rounded-md shadow-sm hover:bg-indigo-700 active:scale-95 transition-all">등록</button>
              </div>
            </div>

            <div className="flex space-x-2 mb-3">
              <select value={expenseFilterDay} onChange={e => setExpenseFilterDay(e.target.value)} className={`flex-1 ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'} p-2 text-xs font-bold outline-none rounded-lg shadow-sm transition-colors duration-300`}>
                <option value="all">모든 일차 (Day 전체)</option>
                {tripDays.map(d => <option key={d} value={d}>Day {d}</option>)}
              </select>
              <select value={expenseFilterTheme} onChange={e => setExpenseFilterTheme(e.target.value)} className={`flex-1 ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'} p-2 text-xs font-bold outline-none rounded-lg shadow-sm transition-colors duration-300`}>
                <option value="all">모든 테마</option>
                <option value="교통편">교통편</option>
                <option value="식당">식당</option>
                <option value="디저트">디저트</option>
                <option value="관광지">관광지</option>
                <option value="쇼핑">쇼핑</option>
                <option value="기타">기타</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2 mb-4 scroll-smooth">
              {(() => {
                const expensePlans = (Array.isArray(planTimeline) ? planTimeline.filter(Boolean) : []).filter(p => Number(p.expenseLocal) > 0 || Number(p.expenseKrw) > 0);
                const dayFiltered = expenseFilterDay === 'all' ? expensePlans : expensePlans.filter(p => String(p.day) === String(expenseFilterDay));
                const fullyFiltered = expenseFilterTheme === 'all' ? dayFiltered : dayFiltered.filter(p => (p.theme || '기타') === expenseFilterTheme);

                const totalKrw = fullyFiltered.reduce((sum, p) => sum + (Number(p.expenseKrw) || 0), 0);
                const totalLocal = fullyFiltered.reduce((sum, p) => sum + (Number(p.expenseLocal) || 0), 0);

const getLocalSym = (c) => {
                  if (c === '한국') return '₩'; if (c === '일본' || c === '중국') return '¥'; if (['프랑스','이탈리아','스페인','독일'].includes(c)) return '€'; if (c === '영국') return '£'; return '$';
                };

                return (
                  <div className="flex flex-col h-full">
                    <div className={`p-4 rounded-2xl mb-4 flex flex-col items-center justify-center border shadow-md transition-all ${isDarkMode ? 'bg-indigo-900/30 border-indigo-700' : 'bg-indigo-50 border-indigo-100'}`}>
                      <span className={`text-[10px] font-black ${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'} mb-1 uppercase tracking-wider`}>Total Expense</span>
                      <span className="text-2xl font-black text-rose-500 mb-1">₩{totalKrw.toLocaleString()}</span>
                      <span className={`text-[10px] font-bold ${textMuted}`}>필터링된 지출 합계</span>
                    </div>

                    {fullyFiltered.length === 0 ? (
                      <p className={`text-xs ${textMuted} text-center py-10 font-bold`}>기록된 지출 내역이 없습니다.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
{fullyFiltered.map(plan => {
                          const isCardActive = activeMobileCard === plan.id;
                          return (
                          <div key={plan.id} 
                            onClick={(e) => { e.stopPropagation(); setActiveMobileCard(isCardActive ? null : plan.id); }}
                            className={`flex flex-col p-2.5 rounded-xl border relative transition-all duration-300 cursor-pointer overflow-hidden ${isCardActive ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/10' : (isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm')} hover:shadow-md`}
                          >
                            <div className="flex flex-row items-center justify-between mb-2 w-full flex-nowrap">
                               <div className="flex items-center space-x-1 flex-shrink-0 min-w-0">
                                 <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase whitespace-nowrap ${isDarkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-600 text-white'}`}>D{plan.day}</span>
                                 <span className={`text-[8px] font-bold truncate opacity-80 ${textMuted}`}>{plan.theme}</span>
                               </div>
                               
                               {/* [수정됨] 이모지 버튼 & 레이아웃 최적화 */}
                               <div className={`flex space-x-1 flex-shrink-0 transition-all duration-300 ${isCardActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                  <button onClick={(e) => { 
                                      e.stopPropagation(); 
                                      setSelectedPlanInfo(plan); setIsExpenseModalOpen(false); setActiveMobileCard(null);
                                  }} className="text-[11px] bg-indigo-100 dark:bg-indigo-900/50 p-1 rounded-md shadow-sm active:scale-75 transition-transform" title="수정">✏️</button>
                                  <button onClick={(e) => {
                                      e.stopPropagation();
                                      const updated = planTimeline.map(p => String(p.id) === String(plan.id) ? { ...p, expenseLocal: "", expenseKrw: "" } : p);
                                      setPlanTimeline(updated); saveToDb({ plan_timeline: updated });
                                      setActiveMobileCard(null);
                                      showToast("지출 내역이 삭제되었습니다.");
                                  }} className="text-[11px] bg-rose-100 dark:bg-rose-900/50 p-1 rounded-md shadow-sm active:scale-75 transition-transform" title="삭제">🗑️</button>
                               </div>
                            </div>

                            <h4 className={`text-[10.5px] font-black truncate mb-2 leading-tight ${textMain}`}>{S(plan.place)}</h4>

                            <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100 dark:border-slate-700 w-full flex-nowrap gap-1">
                               <span className={`text-[9px] font-bold whitespace-nowrap overflow-hidden text-ellipsis ${textMuted}`}>
                                 {getLocalSym(plan.country)}{Number(plan.expenseLocal).toLocaleString()}
                               </span>
                               <span className="text-[11px] font-black text-rose-500 whitespace-nowrap flex-shrink-0">
                                 ₩{Number(plan.expenseKrw).toLocaleString()}
                               </span>
                            </div>
                          </div>
                        )})}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            <button onClick={() => setIsExpenseModalOpen(false)} className="w-full bg-indigo-600 text-white rounded-xl py-3 text-xs font-bold shadow-md hover:bg-indigo-700 active:scale-95 transition-all duration-300">닫기</button>
          </div>
        </div>
      )}
      
      {isWeatherModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-300" onClick={() => setIsWeatherModalOpen(false)}>
           <div className={`${cardBg} p-5 rounded-3xl w-full max-w-xs sm:max-w-sm shadow-2xl animate-in zoom-in-95 duration-300`} onClick={e => e.stopPropagation()}>
              <div className={`flex justify-between items-center mb-4 border-b pb-2 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                 <h3 className={`font-black text-sm ${textMain}`}>⛅ 날씨 예보</h3>
                 <button onClick={() => setIsWeatherModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg transition-colors">✕</button>
              </div>
<div className="space-y-2.5 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1 scroll-smooth">
                 {/* [디버깅] 날씨 창이 열릴 때 현재 지역명과 데이터 상태를 F12 콘솔에 출력합니다 */}
                 {console.log("🌤️ 날씨 모달이 인식한 지역명:", displayCityName)}
                 {console.log("🌤️ 날씨 모달이 가진 예보 데이터:", forecast)}

                 {forecast.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 space-y-3">
                       <p className={`text-xs ${textMuted} text-center font-bold`}>
                         날씨 정보를 불러올 수 없습니다.<br/>(일정 탭에서 지역을 선택해주세요)
                       </p>
                       <button onClick={() => fetchWeatherData(displayCityName)} className="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm hover:bg-indigo-200 transition-colors active:scale-95">
                         현재 지역({displayCityName || "없음"}) 날씨 다시 불러오기 🔄
                       </button>
                    </div>
                 ) : (
                    tripDays.map((d) => {
                       const targetDateStr = getDateStringForDay(d);
                       const f = forecast.find(fc => fc && fc.date === targetDateStr);
                       const todayStr = new Date().toISOString().split('T')[0];
                       const isToday = targetDateStr === todayStr;

                       if (!f) {
                           const today = new Date();
                           today.setHours(0, 0, 0, 0);
                           const targetDate = targetDateStr ? new Date(targetDateStr) : null;
                           const daysUntil = targetDate ? Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24)) : null;
                           const availableFrom = targetDate ? new Date(targetDate.getTime() - 15 * 24 * 60 * 60 * 1000) : null;
                           const availableFromStr = availableFrom ? `${availableFrom.getMonth() + 1}월 ${availableFrom.getDate()}일` : null;
                           const reason = daysUntil === null ? '날짜 정보 없음'
                             : daysUntil < 0 ? '지난 날짜'
                             : daysUntil > 15 ? `아직 너무 먼 날짜`
                             : '데이터 준비 중';
                           return (
                              <div key={d} className={`flex justify-between items-center p-3 rounded-xl border shadow-sm transition-all duration-300 ${isToday ? (isDarkMode ? 'bg-indigo-900/30 border-indigo-500' : 'bg-indigo-50 border-indigo-300') : (isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100')}`}>
                                 <div className="flex flex-col space-y-0.5">
                                    <span className={`text-[10px] font-bold ${isToday ? 'text-indigo-500' : textMuted}`}>Day {d} - {displayCityName} ({targetDateStr.slice(5)})</span>
                                    <span className={`text-xs font-black ${textMuted}`}>예보 없음 <span className="font-normal text-[10px]">({reason})</span></span>
                                    {daysUntil > 15 && availableFromStr && (
                                      <span className="text-[10px] text-indigo-400 font-bold">📅 {availableFromStr}부터 날씨 확인 가능</span>
                                    )}
                                 </div>
                                 <div className="text-right flex flex-col justify-center">
                                    <span className={`text-[11px] font-bold ${textMuted}`}>-</span>
                                 </div>
                              </div>
                           );
                       }

                         const info = getWeatherInfo(f.code);
                         
                         // --- [NEW] 일정 기반 지역 및 시간 처리 로직 ---
                         const dPlans = (Array.isArray(planTimeline) ? planTimeline : [])
                            .filter(p => parseInt(p.day) === d && p.region && p.region !== '수동입력')
                            .sort((a, b) => S(a.time).localeCompare(S(b.time)));
                         
                         let mainRegion = displayCityName;
                         if (dPlans.length > 0) mainRegion = dPlans[0].region;

                         const getRegionForHour = (hour) => {
                             let currentReg = mainRegion;
                             for (const p of dPlans) {
                                 const pTime = p.time || "00:00";
                                 const pHour = parseInt(pTime.split(':')[0]);
                                 if (hour >= pHour) {
                                     currentReg = p.region;
                                 }
                             }
                             return currentReg;
                         };
                         // ----------------------------------------------

                         return (
                            <div key={d} className="flex flex-col space-y-1">
                              <div onClick={() => handleWeatherDayClick(d)} className={`cursor-pointer flex justify-between items-center p-3 rounded-xl border shadow-sm transition-all duration-300 hover:shadow-md ${isToday ? (isDarkMode ? 'bg-indigo-900/30 border-indigo-500' : 'bg-indigo-50 border-indigo-300') : (isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100')}`}>
                                 <div className="flex flex-col">
                                    <span className={`text-[10px] font-bold ${isToday ? 'text-indigo-500' : textMuted}`}>Day {d} - {mainRegion} ({f.date.slice(5)})</span>
                                    <span className={`text-xs font-black mt-0.5 ${textMain}`}>{info[0]} {info[1]}</span>
                                 </div>
                                 <div className="text-right flex flex-col items-end">
                                    <div className="flex space-x-2">
                                      <span className="text-[11px] font-bold text-rose-500">최고 {f.max}°</span>
                                      <span className="text-[11px] font-bold text-blue-500">최저 {f.min}°</span>
                                    </div>
                                    <span className={`text-[8px] mt-1 transition-colors duration-300 ${expandedWeatherDay === d ? 'text-indigo-500 font-bold' : 'text-slate-400'}`}>
                                      {expandedWeatherDay === d ? '접기 ▲' : '시간대별 보기 ▼'}
                                    </span>
                                 </div>
                              </div>
                              
{/* 시간대별 날씨 및 지역 동적 변경 (확장 시) - 가로 스크롤 적용 */}
                              {expandedWeatherDay === d && (
                                <div className={`p-2 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'} overflow-x-auto custom-scrollbar animate-in fade-in duration-300 flex space-x-2 snap-x`}>
                                  {isLoadingHourly ? (
                                     <div className="text-center py-4 w-full text-[10px] font-bold text-slate-400">
                                        <span className="animate-spin inline-block mr-1">🔄</span> 시간대별 날씨를 분석중입니다...
                                     </div>
                                  ) : (
                                     Array.from({length: 24}).map((_, hour) => {
                                        const hRegion = getRegionForHour(hour);
                                        const prevRegion = hour > 0 ? getRegionForHour(hour - 1) : null;
                                        
                                        const divider = (hour === 0 || hRegion !== prevRegion) ? (
                                           <div className="flex-shrink-0 flex items-center justify-center px-1">
                                              <span className={`px-2 py-1 rounded-full text-[9px] font-black shadow-sm border whitespace-nowrap ${isDarkMode ? 'bg-indigo-900/50 text-indigo-300 border-indigo-700/50' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>
                                                 📍 {hRegion}
                                              </span>
                                           </div>
                                        ) : null;

                                        const regionData = hourlyWeatherCache[hRegion];
                                        let hWeatherCode = null;
                                        let hTemp = null;
                                        if (regionData && regionData.time) {
                                            const targetDateStr = getDateStringForDay(d);
                                            const targetTimeStr = `${targetDateStr}T${String(hour).padStart(2, '0')}:00`;
                                            const idx = regionData.time.indexOf(targetTimeStr);
                                            if (idx !== -1) {
                                                hWeatherCode = regionData.weather_code[idx];
                                                hTemp = Math.round(regionData.temperature_2m[idx]);
                                            }
                                        }
                                        
                                        const hInfo = hWeatherCode !== null ? getWeatherInfo(hWeatherCode) : ["-", "☁️"];

                                        return (
                                           <React.Fragment key={hour}>
                                             {divider}
                                             <div className={`flex flex-col items-center justify-center p-2 w-14 flex-shrink-0 snap-center rounded-lg border shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                                                <span className={`text-[9px] font-bold mb-1 ${textMuted}`}>{String(hour).padStart(2, '0')}:00</span>
                                                <span className="text-lg leading-none mb-1">{hInfo[1]}</span>
                                                <span className={`text-[9px] font-black ${textMain}`}>{hInfo[0]}</span>
                                                <span className={`text-[10px] font-bold mt-1 ${hTemp >= 25 ? 'text-rose-500' : hTemp <= 5 ? 'text-blue-500' : textMain}`}>{hTemp !== null ? `${hTemp}°` : '-'}</span>
                                             </div>
                                           </React.Fragment>
                                        );
                                     })
                                  )}
                                </div>
                              )}
                            </div>
                         );
                    })
                 )}
              </div>
              <button onClick={() => setIsWeatherModalOpen(false)} className="w-full mt-4 bg-indigo-600 text-white rounded-xl py-2.5 text-xs font-bold shadow-md hover:bg-indigo-700 active:scale-95 transition-all duration-300">확인</button>
           </div>
        </div>
      )}

      {isDashboardPackingOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[8000] flex items-center justify-center p-4 transition-opacity duration-300" onClick={() => setIsDashboardPackingOpen(false)}>
          <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 rounded-2xl`} onClick={e => e.stopPropagation()}>
             <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                <h3 className={`text-sm font-black flex items-center ${textMain}`}><span className="mr-2">🎒</span> 이번 여행 준비물 목록</h3>
                <button onClick={() => setIsDashboardPackingOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg transition-colors">✕</button>
             </div>
             <div className="p-4 space-y-4 max-h-[60vh] flex flex-col min-h-[30vh]">
                {packingList.some(item => item.isChecked) && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-lg text-[11px] font-bold text-center animate-in fade-in shrink-0 border border-emerald-100 dark:border-emerald-800/50 duration-300">
                     ✨ 앗! 준비물을 하나씩 채우고 계시군요. 완벽한 여행이 될 거예요!
                  </div>
                )}
                <div className="flex flex-wrap gap-2 overflow-y-auto custom-scrollbar flex-1 pb-2 content-start">
                      {packingList.map(item => (
                        <div key={item.id} onClick={() => togglePackingItem(item.id)} className={`cursor-pointer flex items-center space-x-2 px-3 py-1.5 rounded-full border shadow-sm transition-all duration-300 ${item.isChecked ? (isDarkMode ? 'bg-slate-700 text-slate-400 border-slate-600 line-through' : 'bg-slate-200 border-slate-300 text-slate-500 line-through') : (isDarkMode ? 'bg-indigo-900/50 border-indigo-500/50 text-indigo-300 hover:bg-indigo-900/70' : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100')}`}>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-300 ${item.isChecked ? 'bg-indigo-500 border-indigo-500 scale-110' : 'border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-800'}`}>
                            {item.isChecked && <span className="text-white text-[10px] font-black leading-none mt-0.5">✓</span>}
                          </div>
                          <span className={`text-[11px] font-bold truncate max-w-[250px]`}>{item.text}</span>
                        </div>
                      ))}
                  {packingList.length === 0 && (
                    <div className="text-center w-full py-10">
                       <p className="text-xs text-slate-400 font-bold">등록된 준비물이 없습니다.</p>
                       <p className="text-[10px] text-slate-400 mt-2">일정 탭에서 등록해 주세요!</p>
                    </div>
                  )}
                </div>
             </div>
          </div>
        </div>
      )}
      {isShoppingModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[8000] flex items-center justify-center p-4 transition-opacity duration-300" onClick={() => setIsShoppingModalOpen(false)}>
          <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 rounded-2xl`} onClick={e => e.stopPropagation()}>
             <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                <h3 className={`text-sm font-black flex items-center ${textMain}`}><span className="mr-2 text-pink-500">🛍️</span> 쇼핑리스트</h3>
                <button onClick={() => setIsShoppingModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg transition-colors">✕</button>
             </div>
             <div className="p-4 space-y-4 max-h-[60vh] flex flex-col min-h-[30vh]">
                <div className="flex flex-col space-y-2 shrink-0">
<div className="flex space-x-1.5">
                    <select value={shoppingItemDay} onChange={e => { setShoppingItemDay(e.target.value); setShoppingLinkPlanId("manual"); }} className={`flex-[1] ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'} p-2 text-[10px] font-bold outline-none rounded-lg shadow-sm transition-colors duration-300`}>
                       <option value="">미지정</option>
                       {tripDays.map(d => <option key={d} value={d}>Day {d}</option>)}
                    </select>
                    <select value={shoppingItemTheme} onChange={e => setShoppingItemTheme(e.target.value)} className={`flex-[1.2] ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'} p-2 text-[10px] font-bold outline-none rounded-lg shadow-sm transition-colors duration-300`}>
                       <option value="쇼핑">쇼핑 🛍️</option>
                       <option value="식당">식당 🍽️</option>
                       <option value="관광지">관광지 📸</option>
                       <option value="숙소">숙소 🏠</option>
                       <option value="기타">기타 📌</option>
                    </select>
{/* [NEW] 쇼핑리스트 세부 일정 콤보박스: Day + Theme 완벽 교차 필터링 적용 */}
                    <select value={shoppingLinkPlanId} onChange={e => setShoppingLinkPlanId(e.target.value)} className={`flex-[1.5] ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'} p-2 text-[10px] font-bold outline-none rounded-lg shadow-sm transition-colors duration-300`}>
                       <option value="manual">➕ 수동입력</option>
                       {planTimeline.filter(p => {
                          const matchDay = !shoppingItemDay || String(p.day) === String(shoppingItemDay);
                          // 이모지나 띄어쓰기로 인한 필터링 누락 방지 (순수 텍스트만 비교)
                          const rawPlanTheme = S(p.theme || '기타').replace(/[^\uAC00-\uD7A3a-zA-Z]/g, '').trim();
                          const rawShopTheme = S(shoppingItemTheme).replace(/[^\uAC00-\uD7A3a-zA-Z]/g, '').trim();
                          const matchTheme = !shoppingItemTheme || shoppingItemTheme === 'all' || rawPlanTheme === rawShopTheme;
                          return matchDay && matchTheme;
                       }).map(p => (
                          <option key={p.id} value={p.id}>[{p.time || '종일'}] {S(p.place)}</option>
                       ))}
                    </select>
                  </div>
<div className="flex flex-col space-y-1.5">
                    <div className="flex space-x-1.5">
                      <select id="shopType" className={`w-20 ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'} px-1 py-2.5 text-[10px] font-bold outline-none rounded-lg shadow-sm`}>
                        <option value="shared">공동용 👨‍👩‍👧‍👦</option>
                        <option value="personal">개인용 🔒</option>
                      </select>
                      <input type="text" placeholder="살 물건 입력 후 우측 등록버튼" value={newShoppingItem} onChange={e => setNewShoppingItem(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') document.getElementById('addShopBtn')?.click(); }} className={`flex-1 ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'} px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-pink-500 outline-none rounded-lg shadow-sm transition-all duration-300`} />
                      <button id="addShopBtn" onClick={() => {
                        // [버그 수정] 사진만 넣어도 저장되도록 예외 처리
                        if (!newShoppingItem.trim() && !newShoppingPhoto) {
                          showToast("물건 이름이나 사진을 최소 하나는 입력해주세요!");
                          return;
                        }
                        const itemName = newShoppingItem.trim() || "사진 첨부 아이템";
                        let targetDay = shoppingItemDay;
                        let targetPlace = null;
                        let dbUpdates = {};
                        
                        // [수정 완료] 쇼핑 리스트 등록 시 핀 목록(currentRestaurants) 연동 제거
                        if (shoppingLinkPlanId !== 'manual' && shoppingLinkPlanId) {
                            const linkedPlan = planTimeline.find(p => String(p.id) === String(shoppingLinkPlanId));
                            if (linkedPlan) {
                                targetDay = linkedPlan.day;
                                targetPlace = linkedPlan.place;
                            }
                        } else {
                            targetPlace = itemName;
                        }

                        const isPersonal = document.getElementById('shopType')?.value === 'personal';
                        // [NEW] 쇼핑 아이템에 img 필드 추가
                        const newItem = { id: Date.now().toString(), text: newShoppingItem.trim(), isChecked: false, day: targetDay, theme: shoppingItemTheme, linkedPlace: targetPlace, isPersonal: isPersonal, userId: appUserId, img: newShoppingPhoto };
                        const newList = [...shoppingList, newItem];
                        setShoppingList(newList); 
                        dbUpdates.shopping_list = newList;
                        
                        saveToDb(dbUpdates);
                        setNewShoppingItem("");
                        setNewShoppingPhoto(""); // 입력 완료 후 사진 초기화
                      }} className="bg-pink-500 text-white px-3 py-2.5 rounded-lg text-[10px] font-bold shadow-sm hover:bg-pink-600 active:scale-95 transition-all">등록</button>
                    </div>
                    {/* [NEW] 사진 첨부 영역 */}
                    <div className="flex space-x-1.5">
                      <input type="file" accept="image/*" ref={shoppingFileInputRef} onChange={(e) => { const file = e.target.files?.[0]; if(file) compressImage(file, (compressed) => setNewShoppingPhoto(S(compressed))); }} className="hidden" />
                      <button type="button" onClick={() => shoppingFileInputRef.current?.click()} className={`flex-shrink-0 px-2 py-1.5 text-[9px] font-bold rounded-lg border transition-all duration-300 flex items-center justify-center ${newShoppingPhoto ? 'bg-pink-50 border-pink-300 text-pink-600 shadow-sm' : (isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100')}`}>
                        📸 파일
                      </button>
                      <input type="text" placeholder="또는 이미지 URL 복붙" value={newShoppingPhoto} onChange={e => setNewShoppingPhoto(e.target.value)} className={`flex-1 ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'} px-2 py-1.5 text-[9px] font-bold outline-none rounded-lg shadow-sm`} />
                    </div>
                  </div>
<div className="flex items-center justify-between px-1 mt-2">
                    <select value={shoppingFilterTheme} onChange={e => setShoppingFilterTheme(e.target.value)} className={`w-24 ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'} p-1 text-[9px] font-bold outline-none rounded-md shadow-sm transition-colors duration-300`}>
                       <option value="all">테마 전체</option>
                       <option value="쇼핑">쇼핑</option>
                       <option value="식당">식당</option>
                       <option value="관광지">관광지</option>
                       <option value="숙소">숙소</option>
                       <option value="기타">기타</option>
                    </select>
                    <label className="flex items-center space-x-1.5 cursor-pointer group">
                      <input type="checkbox" checked={showAllShopping} onChange={e => setShowAllShopping(e.target.checked)} className="accent-pink-500 w-3 h-3 cursor-pointer" />
                      <span className={`text-[10px] font-bold ${textMuted}`}>모든 Day 보기</span>
                    </label>
                  </div>
                </div>

<div className="flex flex-wrap gap-2 overflow-y-auto custom-scrollbar flex-1 pb-2 content-start">
                  {(() => {
                    {/* [교차 필터링 핵심 로직] */}
                    const filteredList = shoppingList.filter(item => {
                      const dayMatch = showAllShopping || String(item.day) === String(shoppingItemDay || "");
                      const themeMatch = shoppingFilterTheme === 'all' || item.theme === shoppingFilterTheme;
                      return dayMatch && themeMatch;
                    });
                    
                    if (shoppingList.length === 0) return <p className="text-center text-xs text-slate-400 py-10 font-bold w-full">기록된 항목이 없습니다.</p>;
                    if (filteredList.length === 0) return <p className="text-center text-xs text-slate-400 py-10 font-bold w-full">해당 Day와 테마에 맞는 정보가 없습니다.</p>;

                    return filteredList.map(item => {
                      const isEditing = editingItemId === item.id;
                      return (
                       <div 
                         key={item.id} 
                         onMouseDown={() => startLongPress(item.id)}
                         onMouseUp={cancelLongPress}
                         onTouchStart={() => startLongPress(item.id)}
                         onTouchEnd={cancelLongPress}
                         className={`group cursor-pointer flex flex-col justify-center px-3 py-2 rounded-xl border shadow-sm transition-all duration-300 w-full ${isEditing ? 'border-pink-500 ring-2 ring-pink-500 bg-white dark:bg-slate-800' : (item.isChecked ? (isDarkMode ? 'bg-slate-700 text-slate-400 border-slate-600 line-through' : 'bg-slate-200 border-slate-300 text-slate-500 line-through') : (isDarkMode ? 'bg-pink-900/30 border-pink-500/50 text-pink-300 hover:bg-pink-900/50' : 'bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100'))}`} 
                         onClick={() => {
                            if (isEditing) return;
                            const newList = shoppingList.map(s => s.id === item.id ? { ...s, isChecked: !s.isChecked } : s);
                            setShoppingList(newList); saveToDb({ shopping_list: newList });
                         }}
                       >
                         {isEditing ? (
                           <div className="space-y-2 py-1 no-recolor" onClick={e => e.stopPropagation()}>
                             <input 
                               autoFocus
                               className="w-full text-xs font-black p-1 border-b border-pink-300 bg-transparent outline-none" 
                               value={item.text} 
                               onChange={(e) => {
                                 const newList = shoppingList.map(s => s.id === item.id ? { ...s, text: e.target.value } : s);
                                 setShoppingList(newList);
                               }}
                             />
                             <div className="flex space-x-2">
                               <select 
                                 className="flex-1 text-[10px] p-1 rounded bg-pink-50 border border-pink-200"
                                 value={item.theme}
                                 onChange={(e) => {
                                   const newList = shoppingList.map(s => s.id === item.id ? { ...s, theme: e.target.value } : s);
                                   setShoppingList(newList);
                                 }}
                               >
                                 {['쇼핑', '식당', '디저트', '관광지', '숙소', '기타'].map(t => <option key={t} value={t}>{t}</option>)}
                               </select>
                               <button 
                                 onClick={() => { setEditingItemId(null); saveToDb({ shopping_list: shoppingList }); }}
                                 className="bg-pink-500 text-white px-3 py-1 rounded text-[10px] font-black"
                               >완료</button>
                             </div>
                           </div>
                         ) : (
                           <>
                             <div className="flex items-center justify-between w-full">
                               <span className="text-[11px] font-bold truncate max-w-[200px]">{item.text}</span>
                               <button onClick={(e) => { e.stopPropagation(); const newList = shoppingList.filter(s => s.id !== item.id); setShoppingList(newList); saveToDb({ shopping_list: newList }); }} className={`ml-2 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${item.isChecked ? 'text-slate-400 hover:text-slate-600' : 'text-pink-400 hover:text-pink-600'}`}>✕</button>
                             </div>
                             <div className="flex items-center space-x-1 mt-0.5 opacity-60">
                               <span className="text-[8px] font-bold bg-black/5 px-1 rounded">{item.linkedPlace ? `📍 ${item.linkedPlace}` : (item.day ? `Day ${item.day}` : '미지정')}</span>
                               <span className="text-[8px] font-bold bg-black/5 px-1 rounded">{item.theme || '기타'}</span>
                             </div>
                           </>
                         )}
                       </div>
                    )});
                  })()}
                </div>
             </div>
          </div>
        </div>
      )}

      {isDashboardShoppingOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[8000] flex items-center justify-center p-4 transition-opacity duration-300" onClick={() => setIsDashboardShoppingOpen(false)}>
          <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 rounded-2xl`} onClick={e => e.stopPropagation()}>
             <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                <h3 className={`text-sm font-black flex items-center ${textMain}`}><span className="mr-2">🛍️</span> 이번 여행 쇼핑리스트</h3>
                <button onClick={() => setIsDashboardShoppingOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg transition-colors">✕</button>
             </div>
             
<div className={`p-2 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
                <select value={dashShoppingFilterTheme} onChange={e => setDashShoppingFilterTheme(e.target.value)} className={`w-24 ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'} p-1 text-[9px] font-bold outline-none rounded-md shadow-sm transition-colors duration-300`}>
                   <option value="all">테마 전체</option>
                   <option value="쇼핑">쇼핑</option>
                   <option value="식당">식당</option>
                   <option value="관광지">관광지</option>
                   <option value="숙소">숙소</option>
                   <option value="기타">기타</option>
                </select>
                <label className="flex items-center space-x-1.5 cursor-pointer group">
                  <input type="checkbox" checked={dashShowAllShopping} onChange={e => setDashShowAllShopping(e.target.checked)} className="accent-pink-500 w-3 h-3 cursor-pointer" />
                  <span className={`text-[10px] font-bold ${textMuted}`}>모든 Day 보기</span>
                </label>
             </div>

             <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar flex flex-col min-h-[30vh]">
                {shoppingList.length === 0 && (
                  <div className="text-center w-full py-10">
                     <p className="text-xs text-slate-400 font-bold">등록된 쇼핑 항목이 없습니다.</p>
                  </div>
                )}
                
                {(() => {
                  const baseDisplayedList = dashShowAllShopping ? shoppingList : shoppingList.filter(item => String(item.day) === String(dashboardDay) || !item.day);
                  const displayedList = dashShoppingFilterTheme === 'all' ? baseDisplayedList : baseDisplayedList.filter(item => item.theme === dashShoppingFilterTheme);
                  if (shoppingList.length > 0 && displayedList.length === 0) {
                     return <p className="text-center text-[10px] text-slate-400 font-bold py-5">현재 일차(Day {dashboardDay})에 등록된 쇼핑 항목이 없습니다.<br/>'전체 일정 보기'를 체크해 보세요.</p>;
                  }

                  const grouped = displayedList.reduce((acc, item) => {
                     const d = item.day ? `Day ${item.day}` : '미지정 (공통)';
                     const t = item.theme || '기타';
                     if (!acc[d]) acc[d] = {};
                     if (!acc[d][t]) acc[d][t] = [];
                     acc[d][t].push(item);
                     return acc;
                  }, {});

                  return Object.keys(grouped).sort((a,b) => {
                     if(a==='미지정 (공통)') return 1; if(b==='미지정 (공통)') return -1;
                     return a.localeCompare(b);
                  }).map(dayKey => (
                     <div key={dayKey} className="mb-4 last:mb-0">
                        <h4 className={`text-xs font-black mb-2 pb-1 border-b ${isDarkMode ? 'text-indigo-400 border-slate-700' : 'text-indigo-600 border-slate-200'}`}>{dayKey}</h4>
                        {Object.keys(grouped[dayKey]).sort().map(themeKey => (
                           <div key={themeKey} className="mb-3 last:mb-0 pl-2">
                              <h5 className={`text-[10px] font-bold mb-1.5 ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`}>• {themeKey}</h5>
                              {/* [수정 완료] 쇼핑 리스트 4~5열 병렬 촘촘한 그리드 적용 */}
                              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-2">
                                 {grouped[dayKey][themeKey].map(item => (
                                    <div key={item.id} onClick={() => {
                                        const newList = shoppingList.map(s => s.id === item.id ? { ...s, isChecked: !s.isChecked } : s);
                                        setShoppingList(newList); saveToDb({ shopping_list: newList });
                                    }} className={`cursor-pointer flex flex-col rounded-lg border shadow-sm overflow-hidden transition-all duration-300 ${item.isChecked ? (isDarkMode ? 'bg-slate-800 border-slate-700 opacity-50 grayscale' : 'bg-slate-100 border-slate-200 opacity-50 grayscale') : (isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200')}`}>
                                      <div className="w-full aspect-square relative bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center overflow-hidden">
                                        {item.img && !S(item.img).includes("unsplash") ? (
                                          <img src={item.img} alt={item.text} className="w-full h-full object-cover" />
                                        ) : (
                                          <span className="text-xl opacity-40">{themeKey === '쇼핑' ? '🛍️' : themeKey === '식당' ? '🍽️' : themeKey === '관광지' ? '📸' : themeKey === '숙소' ? '🏠' : '🎁'}</span>
                                        )}
                                        <div className={`absolute top-1 left-1 w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all duration-300 shadow-sm bg-white/80 dark:bg-slate-800/80 ${item.isChecked ? 'border-pink-500 bg-pink-500 text-white' : 'border-slate-300'}`}>
                                          {item.isChecked && <span className="text-[7px] font-black">✓</span>}
                                        </div>
                                      </div>
                                      <div className={`p-1 text-center transition-all duration-300 ${item.isChecked ? 'line-through text-slate-400' : (isDarkMode ? 'text-slate-200' : 'text-slate-800')}`}>
                                        <span className="text-[8px] font-black block truncate w-full no-recolor">{item.text}</span>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                           </div>
                        ))}
                     </div>
                  ));
                })()}
             </div>
          </div>
        </div>
      )}

      {isPackingModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[8000] flex items-center justify-center p-4 transition-opacity duration-300" onClick={() => setIsPackingModalOpen(false)}>
          <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 rounded-2xl`} onClick={e => e.stopPropagation()}>
             <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                <h3 className={`text-sm font-black flex items-center ${textMain}`}><span className="mr-2">🎒</span> 준비물 챙기기</h3>
                <button onClick={() => setIsPackingModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg transition-colors">✕</button>
             </div>
<div className="p-4 space-y-4 max-h-[60vh] flex flex-col min-h-[30vh]">
                <div className="flex space-x-2 shrink-0">
                  {/* [NEW] 개인용/공동용 선택 드롭다운 추가 */}
                  <select id="packType" className={`w-24 ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'} px-2 py-2.5 text-[10px] font-bold outline-none rounded-lg shadow-sm`}>
                    <option value="shared">공동용 👨‍👩‍👧‍👦</option>
                    <option value="personal">개인용 🔒</option>
                  </select>
                  <input type="text" placeholder="챙길 물건 입력 후 엔터키" onKeyDown={handleAddPackingItem} className={`flex-1 ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'} px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none rounded-lg shadow-sm transition-all duration-300`} />
                </div>

                {packingList.some(item => item.isChecked) && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-lg text-[11px] font-bold text-center animate-in fade-in shrink-0 border border-emerald-100 dark:border-emerald-800/50 duration-300">
                     ✨ 앗! 준비물을 하나씩 채우고 계시군요. 완벽한 여행이 될 거예요!
                  </div>
                )}

                <div className="flex flex-wrap gap-2 overflow-y-auto custom-scrollbar flex-1 pb-2 content-start">
                  {/* [NEW] 개인용 아이템은 작성자 본인(appUserId)에게만 보이도록 필터링 로직 추가 */}
                  {packingList.filter(item => !item.isPersonal || item.userId === appUserId).map(item => {
                    const isEditing = editingItemId === item.id;
                    return (
                     <div 
                       key={item.id} 
                       onMouseDown={() => startLongPress(item.id)}
                       onMouseUp={cancelLongPress}
                       onTouchStart={() => startLongPress(item.id)}
                       onTouchEnd={cancelLongPress}
                       className={`group cursor-pointer flex items-center px-3 py-1.5 rounded-full border shadow-sm transition-all duration-300 ${isEditing ? 'border-indigo-500 ring-2 ring-indigo-500 bg-white dark:bg-slate-800' : (item.isChecked ? (isDarkMode ? 'bg-slate-700 text-slate-400 border-slate-600 line-through' : 'bg-slate-200 border-slate-300 text-slate-500 line-through') : (isDarkMode ? 'bg-indigo-900/50 border-indigo-500/50 text-indigo-300 hover:bg-indigo-900/70' : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'))}`}
                       onClick={() => {
                          if (isEditing) return;
                          togglePackingItem(item.id);
                       }}
                     >
                       {isEditing ? (
                         <div className="flex items-center space-x-2 no-recolor" onClick={e => e.stopPropagation()}>
                           <input 
                             autoFocus
                             className="text-xs font-black bg-transparent outline-none border-b border-indigo-300 w-24" 
                             value={item.text} 
                             onChange={(e) => {
                               const newList = packingList.map(p => p.id === item.id ? { ...p, text: e.target.value } : p);
                               setPackingList(newList);
                             }}
                             onKeyDown={e => e.key === 'Enter' && setEditingItemId(null)}
                           />
                           <button onClick={() => { setEditingItemId(null); saveToDb({ packing_list: packingList }); }} className="text-[10px] font-black text-indigo-600">저장</button>
                         </div>
                       ) : (
                         <>
                           <span className="text-[11px] font-bold truncate max-w-[200px]">{item.text}</span>
                           <button onClick={(e) => { e.stopPropagation(); deletePackingItem(item.id); }} className={`ml-2 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${item.isChecked ? 'text-slate-400 hover:text-slate-600' : 'text-indigo-400 hover:text-indigo-600'}`}>✕</button>
                         </>
                       )}
                     </div>
                  )})}
                  {packingList.length === 0 && (
                    <p className="text-center text-xs text-slate-400 py-10 font-bold w-full">아직 등록된 준비물이 없습니다.</p>
                  )}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* 일정 상세 모달 */}
      {selectedPlanInfo && (
        <div className="fixed inset-0 bg-black/60 z-[8000] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-300" onClick={() => setSelectedPlanInfo(null)}>
          <div className={`${cardBg} w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300`} onClick={e => e.stopPropagation()}>
            {selectedPlanInfo.photo && !selectedPlanInfo.isTransport && (
              <div className="w-full h-48 relative cursor-pointer" onClick={() => setViewPhoto(selectedPlanInfo.photo)}>
                <img src={selectedPlanInfo.photo} className="w-full h-full object-cover" alt="" />
                <div className="absolute top-3 left-3 bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded shadow-md">
                  {S(selectedPlanInfo.time)}
                </div>
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
                  <span className="opacity-0 hover:opacity-100 text-white text-xs font-bold bg-black/50 px-3 py-1 rounded-full transition-opacity duration-200">🔍 크게 보기</span>
                </div>
              </div>
            )}
            <div className="p-5 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 leading-tight">
                   {S(selectedPlanInfo.place)} {selectedPlanInfo.isAccommodation ? '🏠' : ''}
                </h3>
                {(!selectedPlanInfo.photo || selectedPlanInfo.isTransport) && <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-2 py-1 rounded shadow-sm shrink-0 whitespace-nowrap ml-2">{S(selectedPlanInfo.time)}</span>}
              </div>
              
              {selectedPlanInfo.localName && (
                <div className="flex items-center text-sm font-bold text-indigo-500 mb-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => handleCopyLocalName(e, selectedPlanInfo.localName)}>
                  <span className="mr-2">📍 {S(selectedPlanInfo.localName)}</span>
                  <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/50 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800">복사</span>
                </div>
              )}
              
<div className="flex justify-between items-center mt-3 mb-1">
              <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">📝 기록된 메모</span>
              <div className="flex space-x-1.5">
                {/* [삭제 버튼] 입력된 금액이 있을 때만 삭제 버튼 노출 */}
                {selectedPlanInfo.expenseLocal && !isSettleMode && (
                   <button onClick={() => {
                     const updated = planTimeline.map(p => String(p.id) === String(selectedPlanInfo.id) ? { ...p, expenseLocal: "", expenseKrw: "" } : p);
                     setPlanTimeline(updated); saveToDb({ plan_timeline: updated });
                     setSelectedPlanInfo({ ...selectedPlanInfo, expenseLocal: "", expenseKrw: "" });
                     showToast("정산 내역이 삭제되었습니다.");
                   }} className="bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 px-2 py-1 rounded-md text-[9px] font-bold hover:text-rose-500 transition-all active:scale-95">🗑️ 삭제</button>
                )}
<button onClick={() => {
                  setIsSettleMode(!isSettleMode);
                  setSettleLocal(selectedPlanInfo.expenseLocal || "");
                  setSettleKrw(selectedPlanInfo.expenseKrw || "");
                  setIsDiaryOpen(false); // 정산 열 때 일기는 닫기
                }} className="bg-rose-50 text-rose-500 border border-rose-200 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-400 px-2 py-1 rounded-md text-[9px] font-bold shadow-sm hover:bg-rose-100 transition-all active:scale-95">
                  {isSettleMode ? '취소' : '💸 정산'}
                </button>
                <button onClick={() => {
                  if (isDiaryOpen) {
                    // 닫을 때 현재 작성 중인 내용 자동 저장
                    const safeReviewText = diaryReview ? String(diaryReview).trim() : "";
                    const updatedTimeline = (planTimeline || []).map(p =>
                      String(p.id) === String(selectedPlanInfo.id)
                        ? { ...p, rating: Number(diaryRating) || 0, review: safeReviewText }
                        : p
                    );
                    const updatedRests = (currentRestaurants || []).map(r =>
                      S(r.name).trim() === S(selectedPlanInfo.place).trim()
                        ? { ...r, rating: Number(diaryRating) || 0, review: safeReviewText }
                        : r
                    );
                    setPlanTimeline(updatedTimeline);
                    setCurrentRestaurants(updatedRests);
                    setSelectedPlanInfo(prev => ({ ...prev, rating: diaryRating, review: safeReviewText }));
                    saveToDb({ plan_timeline: updatedTimeline, current_restaurants: updatedRests });
                    setIsDiaryOpen(false);
                  } else {
                    // 열 때 state 초기화 후 현재 일정 값 로드
                    setDiaryRating(0);
                    setDiaryReview("");
                    setDiaryRating(selectedPlanInfo.rating || 0);
                    setDiaryReview(selectedPlanInfo.review || "");
                    setIsSettleMode(false);
                    setIsDiaryOpen(true);
                  }
                }} className={`px-2 py-1 rounded-md text-[9px] font-bold shadow-sm transition-all active:scale-95 border ${isDiaryOpen ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>
                  {isDiaryOpen ? '닫기' : '📝 일기'}
                </button>
              </div>
            </div>

            {/* 메모 영역 (정산/일기창이 모두 닫혀있을 때만 표시) */}
            {!isSettleMode && !isDiaryOpen && (
              <div className="animate-in fade-in duration-300">
                {selectedPlanInfo.features ? (
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">{S(selectedPlanInfo.features)}</p>
                ) : (
                  <p className="text-sm text-slate-400 italic">기록된 메모가 없습니다.</p>
                )}
                {/* [추가] 저장된 별점이 있다면 표시 */}
                {selectedPlanInfo.rating > 0 && (
                  <div className="mt-2 flex items-center space-x-1 px-1">
                    <span className="text-yellow-400">⭐</span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300">{selectedPlanInfo.rating}점</span>
                    {selectedPlanInfo.review && <span className="text-[10px] text-slate-400 truncate ml-2">"{selectedPlanInfo.review}"</span>}
                  </div>
                )}
              </div>
            )}

            {/* --- 여행일기 작성 영역 --- */}
            {isDiaryOpen && (
              <div className={`mt-3 p-3 rounded-xl border shadow-inner animate-in slide-in-from-top-2 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-indigo-50/30 border-indigo-100'}`}>
                <div className="flex flex-col space-y-3">
                  {/* 0.5점 단위 별점 UI (스와이프/드래그 지원) */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[9px] font-black text-indigo-500">이 장소는 어땠나요? ✨</label>
                    <div className="flex items-center">
                      <div 
                        className="flex items-center space-x-1.5 cursor-pointer touch-none"
                        style={{ touchAction: 'none' }}
                        onPointerDown={(e) => {
                          e.currentTarget.setPointerCapture(e.pointerId);
                          const rect = e.currentTarget.getBoundingClientRect();
                          let x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                          setDiaryRating(Math.round((x / rect.width) * 10) / 2);
                        }}
                        onPointerMove={(e) => {
                          if (e.buttons !== 1) return; // 클릭/터치 유지 상태일 때만 작동
                          const rect = e.currentTarget.getBoundingClientRect();
                          let x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                          setDiaryRating(Math.round((x / rect.width) * 10) / 2);
                        }}
                        onPointerUp={(e) => e.currentTarget.releasePointerCapture(e.pointerId)}
                        onPointerCancel={(e) => e.currentTarget.releasePointerCapture(e.pointerId)}
                      >
                        {[1, 2, 3, 4, 5].map((num) => (
                          <div key={num} className="relative w-7 h-7 pointer-events-none">
                            {/* 회색 배경 별 */}
                            <svg className={`w-7 h-7 ${isDarkMode ? 'text-slate-700' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                            </svg>
                            {/* 노란색 채우기 별 (조건부 폭 조절) */}
                            <div className="absolute top-0 left-0 h-full overflow-hidden" 
                                 style={{ width: diaryRating >= num ? '100%' : (diaryRating >= num - 0.5 ? '50%' : '0%') }}>
                              <svg className="w-7 h-7 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                              </svg>
                            </div>
                          </div>
                        ))}
                      </div>
                      <span className="ml-3 text-sm font-black text-indigo-600 w-8 text-right">{diaryRating}점</span>
                    </div>
                  </div>
                  {/* 소감 입력창 */}
                  <textarea 
                    placeholder="여행의 소중한 기억을 한 줄로 남겨보세요!"
                    value={diaryReview}
                    onChange={e => setDiaryReview(e.target.value)}
                    className={`w-full p-2.5 text-xs font-bold rounded-lg border outline-none h-20 resize-none transition-all ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-indigo-200 focus:border-indigo-500 shadow-sm'}`}
                  />
                  <button onClick={() => {
// 1. 일정(Timeline) 데이터 업데이트
                    // [버그 수정 1] 여행 소감(review) 텍스트 명시적 문자열 캐싱 및 DB Payload 누락 방지
                    const safeReviewText = diaryReview ? String(diaryReview).trim() : "";
                    
                    const updatedTimeline = (planTimeline || []).map(p => 
                      String(p.id) === String(selectedPlanInfo.id) 
                        ? { ...p, rating: Number(diaryRating) || 0, review: safeReviewText } 
                        : p
                    );
                    
                    // 2. 장소(Pins) 데이터 업데이트 (장소명이 일치하는 경우 연동)
                    const updatedRests = (currentRestaurants || []).map(r => 
                      S(r.name).trim() === S(selectedPlanInfo.place).trim() 
                        ? { ...r, rating: Number(diaryRating) || 0, review: safeReviewText } 
                        : r
                    );

                    // 3. 리액트 상태 즉시 반영
                    setPlanTimeline(updatedTimeline);
                    setCurrentRestaurants(updatedRests);
                    
                    // 4. 현재 열려있는 상세 모달 정보도 즉시 갱신
                    setSelectedPlanInfo(prev => ({ ...prev, rating: diaryRating, review: diaryReview }));

                    // 5. DB 저장 (배열 내부 데이터이므로 배열 전체를 전달)
                    saveToDb({ 
                      plan_timeline: updatedTimeline, 
                      current_restaurants: updatedRests 
                    });

                    setIsDiaryOpen(false);
                    showToast("기록이 소중하게 저장되었습니다! 📝");
                  }} className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-black text-xs shadow-md hover:bg-indigo-700 active:scale-95 transition-all">
                    일기 저장하기 ✨
                  </button>
                </div>
              </div>
            )}

            {isSettleMode ? (
              <div className={`mt-3 p-3 rounded-xl border shadow-inner animate-in slide-in-from-top-2 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="flex space-x-2 mb-2">
                 <div className="flex-1">
                    <label className="text-[9px] font-bold text-slate-500 mb-1 flex justify-between"><span>현지 지출액</span><span className="text-indigo-400 font-black">자동환전 ✨</span></label>
                    <input type="number" placeholder="금액 입력" value={settleLocal} onChange={e => {
                      const val = e.target.value;
                      setSettleLocal(val);
                      if(val && !isNaN(val)) {
                        let curCode = 'USD';
                        const c = selectedPlanInfo.country;
                        if (c === '한국') curCode = 'KRW';
                        else if (c === '일본') curCode = 'JPY';
                        else if (['프랑스', '이탈리아', '스페인', '독일'].includes(c)) curCode = 'EUR';
                        else if (c === '중국') curCode = 'CNY';
                        else if (c === '영국') curCode = 'GBP';
                        else if (c === '호주') curCode = 'AUD';
                        
                        const rate = rates[curCode] || 1;
                        const krwRate = rates['KRW'] || 1350;
                        const krwVal = val * (krwRate / rate);
                        setSettleKrw(Math.round(krwVal));
                      } else { setSettleKrw(""); }
                    }} className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2 text-xs font-bold rounded-md outline-none focus:border-rose-400" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[9px] font-bold text-slate-500 mb-1 block">원화 환산액(₩)</label>
                    <input type="number" placeholder="자동계산" value={settleKrw} onChange={e => setSettleKrw(e.target.value)} className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-2 text-xs font-bold rounded-md outline-none focus:border-rose-400" />
                  </div>
                </div>
                <button onClick={() => {
                  const updatedTimeline = planTimeline.map(p => String(p.id) === String(selectedPlanInfo.id) ? { ...p, expenseLocal: settleLocal, expenseKrw: settleKrw } : p);
                  setPlanTimeline(updatedTimeline);
                  console.log("💸 [DB 저장] 정산 업데이트 데이터:", { plan_timeline: updatedTimeline });
                  saveToDb({ plan_timeline: updatedTimeline });
                  setSelectedPlanInfo({ ...selectedPlanInfo, expenseLocal: settleLocal, expenseKrw: settleKrw });
                  setIsSettleMode(false);
                  showToast("정산 금액이 완벽하게 저장되었습니다! 💸");
                }} className="w-full bg-rose-500 text-white py-2 rounded-md text-xs font-bold shadow-sm hover:bg-rose-600 transition-colors active:scale-95">저장하기</button>
              </div>
            ) : (
              (selectedPlanInfo.expenseLocal || selectedPlanInfo.expenseKrw) && (
                /* [통합 지출 카드] 지출 내역과 메모 중복을 하나로 합쳤습니다 */
                <div className={`mt-3 p-3 rounded-xl border animate-in fade-in ${isDarkMode ? 'bg-rose-900/20 border-rose-800' : 'bg-rose-50 border-rose-100'}`}>
                  <h4 className="text-[11px] font-black text-rose-500 mb-1.5 flex justify-between items-center">
                    <span>💸 지출 내역</span>
                    {selectedPlanInfo.theme && <span className="text-[9px] bg-rose-100 text-rose-600 dark:bg-rose-800 dark:text-rose-300 px-1.5 py-0.5 rounded shadow-sm">{selectedPlanInfo.theme}</span>}
                  </h4>
                  <div className="flex justify-between items-center text-xs font-bold text-rose-600 dark:text-rose-400">
                    <span>현지: {(() => {
                        const c = selectedPlanInfo.country;
                        let sym = '$';
                        if (c === '한국') sym = '₩'; 
                        else if (c === '일본' || c === '중국') sym = '¥'; 
                        else if (['프랑스','이탈리아','스페인','독일'].includes(c)) sym = '€'; 
                        else if (c === '영국') sym = '£';
                        return `${sym}${Number(selectedPlanInfo.expenseLocal).toLocaleString()}`;
                    })()}</span>
                    <span>원화: ₩{Number(selectedPlanInfo.expenseKrw).toLocaleString()}</span>
                  </div>
                </div>
              )
            )}
              
              <button onClick={() => setSelectedPlanInfo(null)} className="mt-5 w-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-3 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-300">닫기</button>
            </div>
          </div>
        </div>
      )}

      {selectedPinInfo && (
        <div className="fixed inset-0 bg-black/60 z-[8000] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-300" onClick={() => setSelectedPinInfo(null)}>
          <div className={`${cardBg} w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300`} onClick={e => e.stopPropagation()}>
            {selectedPinInfo.img && !S(selectedPinInfo.img).includes("unsplash") && (
              <div className="w-full h-48 relative">
                <img src={selectedPinInfo.img} className="w-full h-full object-cover" alt="" />
                {selectedPinInfo.isAccommodation && <div className="absolute top-3 left-3 bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded shadow-md">숙소</div>}
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
              
              {selectedPinInfo.signature && S(selectedPinInfo.signature) !== "직접 추가한 장소" ? (
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">{S(selectedPinInfo.signature)}</p>
              ) : (
                <p className="text-sm text-slate-400 italic">기록된 메모가 없습니다.</p>
              )}
              
              {selectedPinInfo.lat && selectedPinInfo.lng && (
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
        </div>
      )}

      {tripModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9998] backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300">
          <div className={`${cardBg} w-full max-w-xs p-5 flex flex-col animate-in zoom-in-95 z-[9999] duration-300`} onClick={e => e.stopPropagation()}>
            <div className={`flex items-center justify-between pb-3 border-b mb-4 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <h2 className="text-sm font-black text-indigo-500">{tripModal.mode === 'add' ? '새 여행 만들기 ✈️' : '여행 이름 변경 ✏️'}</h2>
              <button onClick={() => setTripModal({ ...tripModal, isOpen: false })} className="transition-colors hover:text-slate-500">✕</button>
            </div>
            <input 
              type="text" 
              value={S(tripModal.name)} 
              onChange={e => setTripModal({ ...tripModal, name: e.target.value })} 
              placeholder="여행 이름을 입력하세요" 
              className={`w-full ${inputBg} p-3 text-xs font-bold outline-none mb-4 transition-all duration-300 focus:ring-2 focus:ring-indigo-500 rounded`}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && submitTripModal()}
            />
            <button onClick={submitTripModal} disabled={isSubmittingTrip} className={`w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold text-xs shadow-md transition-all duration-300 ${isSubmittingTrip ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700 active:scale-95'}`}>확인</button>
          </div>
        </div>
      )}

      {isTransportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[8000] flex items-center justify-center p-4 transition-opacity duration-300" onClick={() => setIsTransportModalOpen(false)}>
          <div className={`${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white'} w-full max-w-sm shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 rounded-2xl`} onClick={e => e.stopPropagation()}>
            <div className={`flex items-center justify-between p-3 border-b ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'}`}>
              <div className="flex items-center space-x-2">
                <span className="text-indigo-500 text-sm">✈️</span>
                <h3 className="text-xs font-bold">교통권 등록</h3>
              </div>
              <button onClick={() => setIsTransportModalOpen(false)} className={`p-1 rounded transition-colors ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700'}`}>✕</button>
            </div>
            
            <div className="p-4 space-y-3">
              <div className={`grid grid-cols-3 gap-1 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'} p-1 rounded-lg`}>
                 <button onClick={() => {setTransType('flight'); setTransDir('outbound');}} className={`py-1.5 text-[10px] font-bold rounded transition-colors duration-300 ${transType === 'flight' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>✈️ 항공권</button>
                 <button onClick={() => {setTransType('train'); setTransDir('outbound');}} className={`py-1.5 text-[10px] font-bold rounded transition-colors duration-300 ${transType === 'train' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>🚆 기차</button>
                 <button onClick={() => {setTransType('bus'); setTransDir('outbound');}} className={`py-1.5 text-[10px] font-bold rounded transition-colors duration-300 ${transType === 'bus' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>🚌 버스</button>
              </div>

              <div className="flex space-x-2 items-center">
                 <button onClick={() => setTransDir('outbound')} className={`flex-1 py-1 text-[10px] font-bold border-b-2 transition-colors duration-300 ${transDir === 'outbound' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>가는 편 (Outbound)</button>
                 <button onClick={() => setTransDir('inbound')} className={`flex-1 py-1 text-[10px] font-bold border-b-2 transition-colors duration-300 ${transDir === 'inbound' ? 'border-rose-500 text-rose-500' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>오는 편 (Inbound)</button>
                 <button onClick={() => setModalTransData(prev => ({...prev, [transType]: {...prev[transType], [transDir]: {...initialTransState}}}))} className="px-2 py-1 text-[9px] font-bold bg-slate-100 text-slate-500 rounded border hover:bg-slate-200 transition-colors duration-300">초기화</button>
              </div>

              <div className="flex flex-col space-y-1 animate-in fade-in duration-300">
                 <label className={`text-[9px] font-bold ${textMuted} px-1`}>일차 선택 (Day)</label>
                 <select value={modalTransData[transType][transDir].day} onChange={e => setModalTransData(prev => ({...prev, [transType]: {...prev[transType], [transDir]: {...prev[transType][transDir], day: parseInt(e.target.value)}}}))} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-xs font-bold outline-none rounded-lg cursor-pointer transition-all duration-300`}>
                    {tripDays.map(d => <option key={d} value={d}>Day {d}</option>)}
                 </select>
              </div>

              <div className="flex space-x-2">
                <div className="flex flex-col space-y-1 w-1/3">
                  <label className={`text-[9px] font-bold ${textMuted} px-1`}>{transType === 'flight' ? '항공사' : (transType === 'train' ? '기차 종류' : '버스 회사')}</label>
                  <input type="text" placeholder={transType === 'flight' ? '대한항공' : 'KTX, 고속버스'} value={modalTransData[transType][transDir].airline} onChange={e => setModalTransData(prev => ({...prev, [transType]: {...prev[transType], [transDir]: {...prev[transType][transDir], airline: e.target.value}}}))} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-xs font-bold rounded-lg transition-all duration-300 focus:border-indigo-500 outline-none`} />
                </div>
                <div className="flex flex-col space-y-1 w-1/3">
                  <label className={`text-[9px] font-bold ${textMuted} px-1`}>{transType === 'flight' ? '항공편명' : '편명/번호'}</label>
                  <input type="text" placeholder={transType === 'flight' ? 'KE001' : '102호'} value={modalTransData[transType][transDir].flightNum} onChange={e => setModalTransData(prev => ({...prev, [transType]: {...prev[transType], [transDir]: {...prev[transType][transDir], flightNum: e.target.value}}}))} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-xs font-bold rounded-lg transition-all duration-300 focus:border-indigo-500 outline-none`} />
                </div>
                <div className="flex flex-col space-y-1 w-1/3">
                  <label className={`text-[9px] font-bold ${textMuted} px-1`}>좌석번호</label>
                  <input type="text" placeholder="12A" value={modalTransData[transType][transDir].seatNum} onChange={e => setModalTransData(prev => ({...prev, [transType]: {...prev[transType], [transDir]: {...prev[transType][transDir], seatNum: e.target.value}}}))} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-xs font-bold rounded-lg transition-all duration-300 focus:border-indigo-500 outline-none`} />
                </div>
              </div>

              <div className="flex space-x-2 items-center">
                <div className="flex flex-col space-y-1 w-[45%]">
                  <label className={`text-[9px] font-bold ${textMuted} px-1`}>출발지</label>
                  <input type="text" placeholder={transType === 'flight' ? 'ICN' : '서울역'} value={modalTransData[transType][transDir].dep} onChange={e => setModalTransData(prev => ({...prev, [transType]: {...prev[transType], [transDir]: {...prev[transType][transDir], dep: e.target.value}}}))} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-xs font-bold rounded-lg transition-all duration-300 focus:border-indigo-500 outline-none`} />
                  <input type="text" maxLength="5" placeholder="10:00" value={modalTransData[transType][transDir].depTime} onChange={e => handleTimeInput(e, val => setModalTransData(prev => ({...prev, [transType]: {...prev[transType], [transDir]: {...prev[transType][transDir], depTime: val}}})))} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-xs font-bold rounded-lg mt-1 transition-all duration-300 focus:border-indigo-500 outline-none`} />
                </div>
                <div className="flex flex-col items-center justify-center text-slate-400 font-bold w-[10%]">➔</div>
                <div className="flex flex-col space-y-1 w-[45%]">
                  <label className={`text-[9px] font-bold ${textMuted} px-1`}>도착지</label>
                  <input type="text" placeholder={transType === 'flight' ? 'NRT' : '부산역'} value={modalTransData[transType][transDir].arr} onChange={e => setModalTransData(prev => ({...prev, [transType]: {...prev[transType], [transDir]: {...prev[transType][transDir], arr: e.target.value}}}))} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-xs font-bold rounded-lg transition-all duration-300 focus:border-indigo-500 outline-none`} />
                  <input type="text" maxLength="5" placeholder="12:00" value={modalTransData[transType][transDir].arrTime} onChange={e => handleTimeInput(e, val => setModalTransData(prev => ({...prev, [transType]: {...prev[transType], [transDir]: {...prev[transType][transDir], arrTime: val}}})))} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-xs font-bold rounded-lg mt-1 transition-all duration-300 focus:border-indigo-500 outline-none`} />
                </div>
              </div>

              <button onClick={handleSaveTransport} className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 text-xs font-bold shadow-md active:scale-95 transition-all duration-300 mt-2`}>
                일괄 등록하기 ✨
              </button>
            </div>
          </div>
        </div>
      )}

      {editingPlan && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[6000] flex items-center justify-center p-4 transition-opacity duration-300" onClick={() => setEditingPlan(null)}>
          <div className={`${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white'} w-full max-w-sm shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 rounded-2xl`} onClick={e => e.stopPropagation()}>
            <div className={`flex items-center justify-between p-3 border-b ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'}`}>
              <div className="flex items-center space-x-2">
                <span className="text-orange-500 text-sm">✏️</span>
                <h3 className="text-xs font-bold">일정 수정하기</h3>
              </div>
              <button onClick={() => setEditingPlan(null)} className={`p-1 rounded transition-colors ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700'}`}>✕</button>
            </div>
            
            <div className="p-4 space-y-3">
              <div className={`grid grid-cols-4 gap-1 ${isDarkMode ? 'bg-slate-700' : 'bg-white'} border border-slate-200/80 rounded-lg p-1 shadow-sm`}>
                {tripDays.map(d => (
                  <button key={d} onClick={() => setEditingPlan({...editingPlan, day: d})} className={`flex-1 text-[10px] font-bold py-1.5 rounded transition-all duration-300 border border-transparent ${editingPlan.day === d ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600'}`}>D{d}</button>
                ))}
              </div>

              <div className="flex space-x-2">
                <div className="flex flex-col space-y-1 w-1/2">
                  <label className={`text-[9px] font-bold ${textMuted} px-1`}>국가 🌍</label>
                  <div className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} px-2 py-1.5 shadow-sm h-8 flex items-center transition-colors duration-300`}>
                    <SelectOrInput 
                      inputId="edit-country-input"
                      value={editingPlan.countrySelect} manualValue={editingPlan.manualCountry} isDarkMode={isDarkMode} appTheme={appTheme}
                      options={Object.keys(REGIONS_BY_COUNTRY)}
                      onChangeSelect={e => setEditingPlan({...editingPlan, countrySelect: e.target.value, regionSelect: "", manualCountry: "", manualRegion: ""})}
                      onChangeManual={val => setEditingPlan({...editingPlan, manualCountry: val})}
                      onCancelManual={() => setEditingPlan({...editingPlan, countrySelect: "", manualCountry: ""})}
                    />
                  </div>
                </div>
                <div className="flex flex-col space-y-1 w-1/2">
                  <label className={`text-[9px] font-bold ${textMuted} px-1`}>지역 📍</label>
                  <div className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} px-2 py-1.5 shadow-sm h-8 flex items-center transition-colors duration-300`}>
                    <SelectOrInput 
                      inputId="edit-region-input"
                      value={editingPlan.regionSelect} manualValue={editingPlan.manualRegion} isDarkMode={isDarkMode} appTheme={appTheme}
                      options={(!editingPlan.countrySelect || editingPlan.countrySelect === '수동입력') ? null : REGIONS_BY_COUNTRY[editingPlan.countrySelect]}
                      onChangeSelect={e => setEditingPlan({...editingPlan, regionSelect: e.target.value, manualRegion: ""})}
                      onChangeManual={val => setEditingPlan({...editingPlan, manualRegion: val})}
                      onCancelManual={() => setEditingPlan({...editingPlan, regionSelect: "", manualRegion: ""})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 items-end">
                <div className="flex flex-col space-y-1 w-1/3">
                  <label className={`text-[9px] font-bold ${textMuted} px-1`}>시간 ⏰</label>
                  <input type="text" maxLength="5" value={S(editingPlan.time)} onChange={(e) => handleTimeInput(e, (val) => setEditingPlan({...editingPlan, time: val}))} placeholder="09:00" className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-1.5 text-[10px] font-bold focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm transition-all duration-300`} />
                </div>
                <div className="flex flex-col space-y-1 flex-1 relative">
                  <label className={`text-[9px] font-bold ${textMuted} px-1`}>장소 📍</label>
                  <input type="text" placeholder="장소 이름 입력" value={S(editingPlan.place)} onChange={(e) => setEditingPlan({...editingPlan, place: e.target.value})} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-1.5 text-[10px] font-bold focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm pr-6 transition-all duration-300`} />
                </div>
              </div>

              <div className="flex space-x-2 items-end">
                <div className="flex flex-col space-y-1 flex-1">
                  <label className={`text-[9px] font-bold ${textMuted} px-1`}>현지어(복사용)</label>
                  <input type="text" placeholder="현지어 입력" value={S(editingPlan.localName)} onChange={(e) => setEditingPlan({...editingPlan, localName: e.target.value})} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-1.5 text-[10px] font-bold focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm transition-all duration-300`} />
                </div>
<div className="flex flex-col space-y-1 flex-1">
                  <label className={`text-[9px] font-bold ${textMuted} px-1`}>메모 📝</label>
                  <input type="text" placeholder="메모 입력" value={S(editingPlan.features)} onChange={(e) => setEditingPlan({...editingPlan, features: e.target.value})} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-1.5 text-[10px] font-bold rounded outline-none transition-all duration-300`} />
                </div>
              </div>

              {/* [NEW] 테마 분류 선택 드롭다운 추가 */}
{/* [수정됨] 통합된 테마 분류 섹션 (필수 문구 제거 및 디자인 통일) */}
              <div className="flex flex-col space-y-1 w-full mb-3">
                <label className={`text-[9px] font-black ${textMuted} px-1 flex justify-between`}>
                  <span>테마 분류 📌</span>
                  <span className="text-[7px] opacity-50">미선택 시 '기타' 자동 지정</span>
                </label>
                <select 
                  value={S(editingPlan.theme || "기타")} 
                  onChange={e => setEditingPlan({...editingPlan, theme: e.target.value})} 
                  className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2.5 text-xs font-bold rounded-xl outline-none cursor-pointer shadow-sm focus:border-indigo-400 transition-all duration-300`}
                >
                  <option value="교통">교통 🚌</option>
                  <option value="식당">식당 🍽️</option>
                  <option value="디저트">디저트 🍰</option>
                  <option value="관광지">관광지 📸</option>
                  <option value="쇼핑">쇼핑 🛍️</option>
                  <option value="숙소">숙소 🏠</option>
                  <option value="기타">기타 📌</option>
                </select>
              </div>

              <div className="flex flex-col space-y-1 w-full">
                <input type="file" accept="image/*" ref={editFileInputRef} onChange={(e) => handlePlanPhotoUpload(e, true)} className="hidden" />
                <button type="button" onClick={() => editFileInputRef.current?.click()} className={`w-full py-1.5 text-[9px] font-bold border transition-all duration-300 flex items-center justify-center ${editingPlan.photo ? 'bg-indigo-50 border-indigo-300 text-indigo-600 shadow-sm' : (isDarkMode ? 'bg-slate-700 border-dashed border-slate-500 text-slate-400 hover:bg-slate-600' : 'bg-white border-dashed border-slate-300 text-slate-400 hover:bg-slate-50')}`}>
                  <span className="flex items-center">{editingPlan.photo ? "📸 사진 변경 (또는 Ctrl+V로 붙여넣기)" : "📸 사진 선택 (또는 Ctrl+V로 붙여넣기)"}</span>
                </button>
              </div>

              <div className="flex items-center space-x-2 my-1.5 px-1">
                <input type="checkbox" id="editPlanIsAcc" checked={Boolean(editingPlan.isAccommodation)} onChange={e => setEditingPlan({...editingPlan, isAccommodation: e.target.checked})} className="accent-indigo-600 w-3.5 h-3.5 rounded cursor-pointer" />
                <label htmlFor="editPlanIsAcc" className={`text-[10px] font-bold ${textMuted} cursor-pointer`}>이 장소를 숙소로 설정 🏠</label>
              </div>

              <div className="pt-2 flex space-x-2">
                <button onClick={() => {
                  const finalCountry = editingPlan.countrySelect === "수동입력" ? editingPlan.manualCountry : editingPlan.countrySelect;
                  const finalRegion = editingPlan.regionSelect === "수동입력" ? editingPlan.manualRegion : editingPlan.regionSelect;
// [저장 로직 수정] 테마(theme) 데이터가 핀 목록에도 저장되도록 강제 연동합니다.
// [데이터 보정] 테마가 비어있거나 선택되지 않은 경우 '기타'로 강제 할당하여 저장
const planData = { 
                    ...editingPlan, 
                    country: finalCountry, 
                    region: finalRegion, 
                    theme: (editingPlan.theme && editingPlan.theme.trim() !== "") ? editingPlan.theme : "기타",
                    rating: editingPlan.rating || 0,
                    review: editingPlan.review || ""
                  };           
                  const safePlanTimeline = Array.isArray(planTimeline) ? planTimeline.filter(Boolean) : [];
                  let updatedTimeline = safePlanTimeline.map(p => p && S(p.id) === S(editingPlan.id) ? planData : p).sort((a, b) => S(a.time).localeCompare(S(b.time)));
                  
                  const safeCurrentRestaurants = Array.isArray(currentRestaurants) ? currentRestaurants.filter(Boolean) : [];
                  const matchedIndex = safeCurrentRestaurants.findIndex(r => r && S(r.name).trim() === S(editingPlan.place).trim());
                  let dbUpdates = { plan_timeline: updatedTimeline };
                  
                  if (matchedIndex !== -1) {
                      const updatedRests = [...safeCurrentRestaurants];
                      updatedRests[matchedIndex] = {
                          ...updatedRests[matchedIndex],
                          localName: editingPlan.localName ? S(editingPlan.localName) : updatedRests[matchedIndex].localName,
                          signature: editingPlan.features ? S(editingPlan.features) : updatedRests[matchedIndex].signature,
                          img: editingPlan.photo ? S(editingPlan.photo) : updatedRests[matchedIndex].img,
                          isAccommodation: editingPlan.isAccommodation || editingPlan.theme === "숙소",
                          theme: editingPlan.theme || "기타" // 핀 데이터에 테마 저장!
                      };
                      setCurrentRestaurants(updatedRests);
                      dbUpdates.current_restaurants = updatedRests;
                      dbUpdates.current_restaurants = updatedRests;
                  }
                  
                  setPlanTimeline(updatedTimeline); 
                  
                  if (finalRegion && finalRegion !== displayCityName) {
                    setDisplayCityName(S(finalRegion));
                    dbUpdates.display_city_name = S(finalRegion);
                  }
                  saveToDb(dbUpdates);
                  setEditingPlan(null); showToast("일정이 예쁘게 수정됐어요! 📝");
                }} className="w-full bg-orange-500 text-white rounded-md py-2 text-[11px] font-bold shadow-sm hover:bg-orange-600 active:scale-95 transition-all duration-300">
                  수정 내용 저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddPlaceModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[9000] backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300" onClick={() => setIsAddPlaceModalOpen(false)}>
          <div className={`${cardBg} w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300`} onClick={e => e.stopPropagation()}>
            <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'}`}>
              <h3 className="text-sm font-black flex items-center">
                <span className="mr-2 text-indigo-500 text-lg">📍</span> 
                {clickedLocation?.id ? '핀 정보 수정' : '새 지도 핀 등록'}
              </h3>
              <button onClick={() => setIsAddPlaceModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg transition-colors">✕</button>
            </div>
            
            <div className="p-4 space-y-3 overflow-y-auto max-h-[60vh] custom-scrollbar scroll-smooth">
              <div className="flex flex-col space-y-1">
              <div className="flex flex-col space-y-1 mb-3">
                <label className={`text-[9px] font-bold ${textMuted} px-1`}>테마 분류</label>
                <select value={newManualTheme} onChange={e => setNewManualTheme(e.target.value)} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm rounded-lg transition-all duration-300`}>
                  <option value="교통편">교통편 🚌</option>
                  <option value="식당">식당 🍽️</option>
                  <option value="디저트">디저트 🍰</option>
                  <option value="관광지">관광지 📸</option>
<option value="쇼핑">쇼핑 🛍️</option>
                <option value="숙소">숙소 🏠</option>
                <option value="기타">기타 📌</option>
                </select>
              </div>
                <label className={`text-[9px] font-bold ${textMuted} px-1`}>장소 이름 (필수)</label>
                <input type="text" placeholder="예: 에펠탑" value={newManualPlaceName} onChange={e => setNewManualPlaceName(e.target.value)} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm rounded-lg transition-all duration-300`} />
              </div>

              <div className="flex flex-col space-y-1">
                <label className={`text-[9px] font-bold ${textMuted} px-1`}>현지어 이름 (복사용)</label>
                <input type="text" placeholder="예: Tour Eiffel" value={newManualLocalName} onChange={e => setNewManualLocalName(e.target.value)} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm rounded-lg transition-all duration-300`} />
              </div>

              <div className="flex flex-col space-y-1">
                <label className={`text-[9px] font-bold ${textMuted} px-1`}>메모 / 특징</label>
                <input type="text" placeholder="간단한 메모 입력" value={newManualFeature} onChange={e => setNewManualFeature(e.target.value)} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm rounded-lg transition-all duration-300`} />
              </div>

              <div className="flex flex-col space-y-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700 transition-colors duration-300">
                <div className="flex space-x-2 items-end">
                  <div className={`flex flex-col space-y-1 ${pinLinkDay ? 'w-1/3' : 'w-full'} transition-all duration-300`}>
                    <label className={`text-[9px] font-bold ${textMuted} px-1`}>일정 동기화</label>
                    <select value={pinLinkDay} onChange={e => {
                       setPinLinkDay(e.target.value); 
                       setPinLinkPlanId(""); 
                       setNewManualTime(""); 
                    }} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-[11px] font-bold focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm rounded-lg cursor-pointer transition-all duration-300`}>
                      <option value="">-- 연동 안 함 --</option>
                      {tripDays.map(d => <option key={d} value={d}>Day {d}</option>)}
                      <option value="0">보관함</option>
                    </select>
                  </div>
                  {pinLinkDay && (
                     <div className="flex flex-col space-y-1 w-2/3 animate-in fade-in duration-300">
                       <label className={`text-[9px] font-bold ${textMuted} px-1`}>기존 일정 연동 (또는 직접 입력)</label>
                       
                       {pinLinkPlanId === 'manual' ? (
                          <div className="relative w-full">
                            <input 
                              type="text" 
                              placeholder="시간 입력 (예: 09:00)" 
                              maxLength="5"
                              value={newManualTime} 
                              onChange={e => handleTimeInput(e, setNewManualTime)} 
                              autoFocus
                              className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-indigo-300 ring-1 ring-indigo-500'} p-2 text-[10px] font-bold outline-none shadow-sm rounded-lg transition-all duration-300 pr-6`} 
                            />
                            <button onClick={() => setPinLinkPlanId("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold">✕</button>
                          </div>
                       ) : (
                          <select value={pinLinkPlanId} onChange={e => {
                             const val = e.target.value;
                             setPinLinkPlanId(val);
                             if (val !== 'manual' && val !== '') {
                                const matched = planTimeline.find(p => String(p.id) === String(val));
                                if (matched) {
                                   setNewManualTime(matched.time);
                                   setNewManualPlaceName(matched.place);
                                   if(matched.localName) setNewManualLocalName(matched.localName);
                                   if(matched.features) setNewManualFeature(matched.features);
                                   if(matched.photo) setNewManualPhoto(matched.photo);
                                   setNewManualIsAccommodation(matched.isAccommodation);
                                   showToast("✨ 선택한 일정의 데이터가 쏙 채워졌어요!");
                                }
                             } else {
                                setNewManualTime("");
                             }
                          }} className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'} p-2 text-[10px] font-bold outline-none shadow-sm rounded-lg cursor-pointer transition-all duration-300`}>
                             <option value="">-- 일정 선택 --</option>
                             {planTimeline.filter(p => String(p.day) === String(pinLinkDay)).map(p => (
                                <option key={p.id} value={p.id}>[{p.time}] {S(p.place)}</option>
                             ))}
                             <option value="manual">➕ 새 일정으로 (시간 수동 입력)</option>
                          </select>
                       )}
                     </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col space-y-1 w-full pt-1">
                <input type="file" accept="image/*" ref={manualFileInputRef} onChange={handleManualPhotoUpload} className="hidden" />
                <div className="flex gap-2">
                  <input 
                     type="text" 
                     placeholder="이미지 URL 입력 / 복붙" 
                     value={newManualPhoto} 
                     onChange={e => setNewManualPhoto(e.target.value)} 
                     className={`flex-1 ${inputBg} border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'} px-2 text-[9px] font-bold outline-none rounded transition-all duration-300`} 
                  />
                  <button type="button" onClick={() => manualFileInputRef.current?.click()} className={`flex-1 py-2 text-[9px] font-bold rounded-lg border transition-all duration-300 flex items-center justify-center ${newManualPhoto ? 'bg-indigo-50 border-indigo-300 text-indigo-600 shadow-sm' : (isDarkMode ? 'bg-slate-700 border-dashed border-slate-500 text-slate-400 hover:bg-slate-600' : 'bg-white border-dashed border-slate-300 text-slate-400 hover:bg-slate-50')}`}>
                    <span className="flex items-center">📸 파일 첨부</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center my-2 px-1 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 transition-colors duration-300 flex-wrap gap-y-2">
                <div className="flex items-center space-x-2 mr-3">
                  <input type="checkbox" id="manualPlanIsAcc" checked={newManualIsAccommodation} onChange={e => setNewManualIsAccommodation(e.target.checked)} className="accent-indigo-600 w-4 h-4 cursor-pointer" />
                  <label htmlFor="manualPlanIsAcc" className={`text-xs font-bold ${textMuted} cursor-pointer`}>이 장소를 숙소로 설정 🏠</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="manualPlanIsLandmark" checked={newManualIsLandmark} onChange={e => setNewManualIsLandmark(e.target.checked)} className="accent-yellow-500 w-4 h-4 cursor-pointer" />
                  <label htmlFor="manualPlanIsLandmark" className={`text-xs font-bold ${textMuted} cursor-pointer`}>랜드마크 지정 👑</label>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex gap-2">
              <button onClick={() => handleManualPlaceAdd(false)} className={`flex-1 ${isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'} rounded-xl py-3 text-xs font-bold shadow-sm active:scale-95 transition-all duration-300`}>
                일단 저장하기 💾
              </button>
              <button onClick={() => handleManualPlaceAdd(true)} className="flex-1 bg-indigo-600 text-white rounded-xl py-3 text-xs font-bold shadow-md hover:bg-indigo-700 active:scale-95 transition-all duration-300">
                지도에 핀 꽂기 📍
              </button>
            </div>
          </div>
        </div>
      )}

      {isMyPinsModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[3500] backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300" onClick={() => setIsMyPinsModalOpen(false)}>
          <div className={`${cardBg} w-full max-w-5xl flex flex-col animate-in zoom-in-95 duration-300 max-h-[85vh] rounded-3xl overflow-hidden`} onClick={e => e.stopPropagation()}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b gap-3 ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'}`}>
              <h3 className="text-sm font-black flex items-center shrink-0"><span className="mr-2 text-indigo-500 text-lg">📍</span> 내 핀/장소 목록</h3>
              
              <div className="flex items-center space-x-1 overflow-x-auto custom-scrollbar flex-1 pb-1 sm:pb-0 scroll-smooth">
                 <button onClick={() => setMyPinsFilter('all')} className={`px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors ${myPinsFilter === 'all' ? 'bg-indigo-600 text-white shadow' : (isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500 hover:bg-slate-300')}`}>전체보기</button>
                 {tripDays.map(d => (
                    <button key={d} onClick={() => setMyPinsFilter(d)} className={`px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors ${myPinsFilter === d ? 'bg-indigo-600 text-white shadow' : (isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500 hover:bg-slate-300')}`}>Day {d}</button>
                 ))}
                 <button onClick={() => setMyPinsFilter('unlinked')} className={`px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors border ${myPinsFilter === 'unlinked' ? 'bg-slate-600 text-white border-slate-600 shadow' : (isDarkMode ? 'bg-slate-700 text-slate-400 border-transparent' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50')}`}>미지정 핀</button>
                 <select value={Array.isArray(myPinsThemeFilter) ? myPinsThemeFilter[0] : myPinsThemeFilter} onChange={e => setMyPinsThemeFilter([e.target.value])} className={`ml-2 px-2 py-1 rounded-full text-[10px] font-bold outline-none cursor-pointer transition-colors border ${isDarkMode ? 'bg-slate-700 text-slate-300 border-slate-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>                    <option value="all">테마 전체</option>
                    <option value="교통편">교통편 🚌</option>
                    <option value="식당">식당 🍽️</option>
                    <option value="디저트">디저트 🍰</option>
                    <option value="관광지">관광지 📸</option>
                    <option value="쇼핑">쇼핑 🛍️</option>
                    <option value="숙소">숙소 🏠</option>
                    <option value="기타">기타 📌</option>
                 </select>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <button onClick={() => {
                  setIsMyPinsModalOpen(false);
                  setClickedLocation(null);
                  setNewManualPlaceName("");
                  setNewManualLocalName("");
                  setNewManualFeature("");
                  setNewManualPhoto("");
                  setNewManualIsAccommodation(false);
                  setPinLinkDay("");
                  setPinLinkPlanId("");
                  setNewManualTime("");
                  setIsAddPlaceModalOpen(true);
                }} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center shadow-sm hover:bg-indigo-700 active:scale-95 transition-all duration-300">
                  <span className="mr-1 text-sm">➕</span> 새 장소 추가
                </button>
                <button onClick={() => setIsMyPinsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg transition-colors">✕</button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50 scroll-smooth">
              {filteredMyPins.length === 0 ? (
                <div className="text-center py-20 text-xs font-bold text-slate-400 flex flex-col items-center">
                  <span className="text-4xl mb-3 opacity-20">📍</span>
                  등록된 핀이 없습니다.<br/>우측 상단의 '새 장소 추가'를 눌러 장소를 기록해보세요!
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {filteredMyPins.map(pin => (
                    <div key={pin.id} className={`flex flex-col p-2 border rounded-xl shadow-sm transition-all duration-300 hover:shadow-md ${isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-slate-200 bg-white'} relative group`}>

                      {pin.isLandmark && <div className="absolute top-1 right-1 bg-yellow-400 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm z-10">👑 랜드마크</div>}

                      {pin.img && !S(pin.img).includes("unsplash") ? (
                        <div className="w-full h-20 mb-1.5 rounded-lg overflow-hidden relative shrink-0 cursor-pointer" onClick={() => setViewPhoto(pin.img)}>
                          <img src={pin.img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="" />
                          {pin.isAccommodation && <div className="absolute top-1 left-1 bg-yellow-400 text-white text-[8px] font-black px-1 py-0.5 rounded shadow-sm z-10">숙소</div>}
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                            <span className="opacity-0 hover:opacity-100 text-white text-[9px] font-bold bg-black/50 px-2 py-0.5 rounded-full transition-opacity">🔍 크게 보기</span>
                          </div>
                        </div>
                      ) : (
                        <div className={`w-full h-12 flex items-center justify-center rounded-lg mb-1.5 shrink-0 transition-colors ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                          {pin.isAccommodation ? '🏠 숙소' : '📍 장소'}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-center mb-1 gap-1">
                          <span className="text-[8px] font-bold bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 px-1 py-0.5 rounded shrink-0">
                            {(() => {
                               const linked = planTimeline.find(p => p && S(p.place).trim() === S(pin.name).trim());
                               return linked?.theme || pin.theme || '기타';
                            })()}
                          </span>
                          <h4 className="text-[11px] font-black text-slate-900 dark:text-white truncate leading-tight flex-1 cursor-pointer hover:text-indigo-500 transition-colors" onClick={() => setPinQuickView(pin)}>{S(pin.name)}</h4>
                          {pin.lat && pin.lng && (
                            <button onClick={() => {
                              setIsMyPinsModalOpen(false);
                              setActiveTab('map');
                              setTimeout(() => {
                                if (mapInstanceRef.current) {
                                  mapInstanceRef.current.flyTo([pin.lat, pin.lng], 17);
                                  window.dispatchEvent(new CustomEvent('onPinClick', { detail: String(pin.id) }));
                                }
                              }, 300);
                            }} className="shrink-0 bg-indigo-500 hover:bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded transition-colors" title="지도에서 위치 보기">
                              📍이동
                            </button>
                          )}
                        </div>
                        {pin.localName && (
                          <p className="text-[9px] font-bold text-indigo-500 truncate cursor-pointer hover:opacity-80 leading-tight mb-0.5 transition-opacity" onClick={(e) => handleCopyLocalName(e, pin.localName)}>
                            📋 {S(pin.localName)}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-1 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700">
                        <button onClick={(e) => {
                          e.stopPropagation();
                          setMovingPinId(pin.id);
                          setIsPinMode(true);
                          setIsMyPinsModalOpen(false);
                          setActiveTab('map');
                          showToast("🗺️ 지도에서 핀을 꽂을 위치를 클릭해주세요!");
                        }} className="flex-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 py-1 rounded text-[9px] font-bold hover:bg-emerald-100 transition-colors duration-300">
                          위치 지정
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); openEditPinModal(pin); }} className="flex-1 bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 py-1 rounded text-[9px] font-bold hover:bg-slate-200 transition-colors duration-300">
                          수정
                        </button>
                        <button onClick={(e) => {
                           e.stopPropagation();
                           const updated = safeCurrentRestaurants.filter(r => r && S(r.id) !== S(pin.id));
                           setCurrentRestaurants(updated);
                           saveToDb({ current_restaurants: updated });
                           showToast("핀이 삭제되었습니다.");
                        }} className="w-6 flex items-center justify-center bg-rose-50 text-rose-500 dark:bg-rose-900/30 dark:text-rose-400 py-1 rounded hover:bg-rose-100 transition-colors duration-300">
                           <span className="text-[10px]">🗑️</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {pinQuickView && (
        <div className="fixed inset-0 bg-black/60 z-[9500] backdrop-blur-sm flex items-center justify-center p-6 transition-opacity duration-300" onClick={() => setPinQuickView(null)}>
          <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300`} onClick={e => e.stopPropagation()}>
            {pinQuickView.img && !S(pinQuickView.img).includes("unsplash") && (
              <div className="w-full h-44 relative cursor-pointer" onClick={() => { setPinQuickView(null); setViewPhoto(pinQuickView.img); }}>
                <img src={pinQuickView.img} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="opacity-0 hover:opacity-100 text-white text-xs font-bold bg-black/50 px-3 py-1 rounded-full transition-opacity">🔍 크게 보기</span>
                </div>
              </div>
            )}
            <div className="p-4 flex flex-col space-y-3">
              <h3 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{S(pinQuickView.name)}</h3>
              {pinQuickView.localName && (
                <button onClick={(e) => handleCopyLocalName(e, pinQuickView.localName)} className="flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 px-3 py-2 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors text-left">
                  <span>📋</span>
                  <span className="truncate">{S(pinQuickView.localName)}</span>
                  <span className="ml-auto shrink-0 bg-indigo-100 dark:bg-indigo-800 px-2 py-0.5 rounded-full text-[10px]">복사</span>
                </button>
              )}
              {pinQuickView.lat && pinQuickView.lng && (
                <button onClick={() => { setPinQuickView(null); openGoogleMapsNav(pinQuickView.lat, pinQuickView.lng, 'driving'); }} className="w-full bg-green-500 hover:bg-green-600 active:scale-95 text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1">
                  <span>🧭</span><span>현재 위치에서 길 안내</span>
                </button>
              )}
              <button onClick={() => setPinQuickView(null)} className={`w-full py-2.5 rounded-xl text-xs font-bold transition-colors ${isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {isNavModalOpen && (() => {
        const validPins = currentRestaurants.filter(r => r && r.lat && r.lng);
        // 구글 맵 길 안내 실행
        const openGoogleNav = (mode) => {
          const wps = navWaypoints.filter(w => w);
          const origin = `${navOrigin.lat},${navOrigin.lng}`;
          const dest = `${navDest.lat},${navDest.lng}`;
          const waypointStr = wps.map(w => `${w.lat},${w.lng}`).join('|');
          const webUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}${waypointStr ? `&waypoints=${waypointStr}` : ''}&travelmode=${mode}`;
          openExternalUrl(webUrl);
          setIsNavModalOpen(false);
        };
        const selectingLabel = navSelectingFor === 'origin' ? '출발지' : navSelectingFor === 'dest' ? '도착지' : navSelectingFor !== null ? `경유지 ${navSelectingFor + 1}` : null;
        return (
        <div className="fixed inset-0 bg-black/60 z-[9500] backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300" onClick={() => setIsNavModalOpen(false)}>
          <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]`} onClick={e => e.stopPropagation()}>
            <div className={`flex items-center justify-between p-4 border-b shrink-0 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <h3 className={`text-sm font-black flex items-center ${isDarkMode ? 'text-white' : 'text-slate-900'}`}><span className="mr-2">🗺️</span>경로 네비게이션</h3>
              <button onClick={() => setIsNavModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <div className="p-4 space-y-2 overflow-y-auto">
              {/* 출발지 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-black text-green-500">🟢 출발지</p>
                  {!navOrigin && <button onClick={() => {
                    if (!navigator.geolocation) { showToast("위치 기능을 지원하지 않습니다."); return; }
                    navigator.geolocation.getCurrentPosition((pos) => {
                      setNavOrigin({ id: '__my_location__', name: '📍 내 현재 위치', lat: pos.coords.latitude, lng: pos.coords.longitude });
                      setNavSelectingFor(null);
                    }, () => showToast("위치 권한이 필요합니다."), { enableHighAccuracy: true, timeout: 10000 });
                  }} className="text-[10px] font-black text-blue-500 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-700 transition-colors">📍 현재 위치 사용</button>}
                </div>
                <div onClick={() => setNavSelectingFor(navSelectingFor === 'origin' ? null : 'origin')}
                  className={`flex items-center p-2.5 rounded-xl border-2 cursor-pointer transition-all ${navSelectingFor === 'origin' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : navOrigin ? 'border-green-400 bg-green-50/50 dark:bg-green-900/10' : 'border-dashed border-slate-300 dark:border-slate-600 hover:border-green-300'}`}>
                  <span className="text-xs font-black truncate flex-1 ${navOrigin ? 'text-green-700 dark:text-green-300' : 'text-slate-400'}">{navOrigin ? navOrigin.name : '목록에서 선택'}</span>
                  {navOrigin && <button onClick={e => { e.stopPropagation(); setNavOrigin(null); }} className="ml-2 text-slate-400 hover:text-red-400 shrink-0 text-xs">✕</button>}
                </div>
              </div>

              {/* 출발↔도착 스왑 버튼 */}
              <div className="flex items-center justify-center">
                <button onClick={() => { const tmp = navOrigin; setNavOrigin(navDest); setNavDest(tmp); }}
                  className={`p-1.5 rounded-full border transition-all active:scale-90 ${isDarkMode ? 'bg-slate-700 border-slate-600 hover:bg-slate-600' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'}`} title="출발/도착 바꾸기">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
              </div>

              {/* 경유지 */}
              {navWaypoints.map((wp, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-black text-orange-400">🟠 경유지 {idx + 1}</p>
                  </div>
                  <div onClick={() => setNavSelectingFor(navSelectingFor === idx ? null : idx)}
                    className={`flex items-center p-2.5 rounded-xl border-2 cursor-pointer transition-all ${navSelectingFor === idx ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20' : wp ? 'border-orange-300 bg-orange-50/50 dark:bg-orange-900/10' : 'border-dashed border-slate-300 dark:border-slate-600 hover:border-orange-300'}`}>
                    <span className="text-xs font-black truncate flex-1">{wp ? wp.name : '목록에서 선택'}</span>
                    <button onClick={e => { e.stopPropagation(); setNavWaypoints(prev => prev.filter((_, i) => i !== idx)); }} className="ml-2 text-slate-400 hover:text-red-400 shrink-0 text-xs">✕</button>
                  </div>
                </div>
              ))}

              {/* 도착지 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-black text-indigo-500">🔵 도착지</p>
                  <button onClick={() => setNavWaypoints(prev => [...prev, null])}
                    className="text-[10px] font-black text-orange-500 hover:text-orange-700 bg-orange-50 dark:bg-orange-900/30 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-700 transition-colors">+ 경유지 추가</button>
                </div>
                <div onClick={() => setNavSelectingFor(navSelectingFor === 'dest' ? null : 'dest')}
                  className={`flex items-center p-2.5 rounded-xl border-2 cursor-pointer transition-all ${navSelectingFor === 'dest' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : navDest ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10' : 'border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-300'}`}>
                  <span className="text-xs font-black truncate flex-1">{navDest ? navDest.name : '목록에서 선택'}</span>
                  {navDest && <button onClick={e => { e.stopPropagation(); setNavDest(null); }} className="ml-2 text-slate-400 hover:text-red-400 shrink-0 text-xs">✕</button>}
                </div>
              </div>

              {/* 핀 목록 — 선택 중일 때만 표시 */}
              {navSelectingFor !== null && (
                <div className={`border rounded-xl overflow-hidden ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <p className={`text-[10px] font-black px-3 py-2 ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-50 text-slate-500'}`}>
                    {selectingLabel} 선택 중 — 핀을 눌러주세요
                  </p>
                  <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                    {validPins.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">좌표가 지정된 핀이 없습니다.</p>
                    ) : validPins.map(pin => (
                      <button key={pin.id} onClick={() => {
                        if (navSelectingFor === 'origin') setNavOrigin(pin);
                        else if (navSelectingFor === 'dest') setNavDest(pin);
                        else setNavWaypoints(prev => prev.map((w, i) => i === navSelectingFor ? pin : w));
                        setNavSelectingFor(null);
                      }} className={`w-full flex items-center space-x-2 px-3 py-2 text-left transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}>
                        <span className="text-xs">📍</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-black truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{S(pin.name)}</p>
                          {pin.localName && <p className="text-[10px] text-slate-400 truncate">{S(pin.localName)}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 이동 수단 → 출발 */}
              {navOrigin && navDest && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[['walking','🚶 도보'],['driving','🚗 자동차'],['transit','🚌 대중교통']].map(([mode, label]) => (
                    <button key={mode} onClick={() => openGoogleNav(mode)}
                      className="bg-green-500 hover:bg-green-600 active:scale-95 text-white py-2.5 rounded-xl text-[11px] font-black transition-all shadow-md">
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        );
      })()}

      {/* --- 메인 컨텐츠 영역 --- */}
      <main 
        className={`flex-1 flex flex-col min-w-0 h-full overflow-y-auto overflow-x-hidden relative z-10 transition-transform ${isRefreshing || pullDistance === 0 ? 'duration-300 ease-out' : 'duration-0'} ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}
        style={{ transform: `translateY(${isRefreshing ? 80 : pullDistance}px)`, overscrollBehaviorY: 'contain' }}
        onTouchStart={(e) => {
          const mapEl = document.getElementById('leaflet-map');
          if (mapEl && mapEl.contains(e.target)) {
            e.currentTarget.dataset.isPulling = 'false';
            return;
          }
          if (e.currentTarget.scrollTop <= 0) {
            e.currentTarget.dataset.startY = e.touches[0].clientY;
            e.currentTarget.dataset.isPulling = 'true';
          }
        }}
        onTouchMove={(e) => {
          if (e.currentTarget.dataset.isPulling === 'true') {
            const startY = parseFloat(e.currentTarget.dataset.startY);
            const currentY = e.touches[0].clientY;
            const distance = currentY - startY;
            if (distance > 0) {
              setPullDistance(Math.min(distance * 0.4, 120)); 
            }
          }
        }}
        onTouchEnd={(e) => {
          if (e.currentTarget.dataset.isPulling === 'true') {
            if (pullDistance > 70) {
              setIsRefreshing(true);
              setRefreshTrigger(prev => prev + 1);
              setTimeout(() => {
                setIsRefreshing(false);
                setPullDistance(0);
                showToast("🔄 동기화 완료!");
                if (activeTab === 'map' && mapInstanceRef.current) {
                  flyToSmartPosition(mapInstanceRef.current, currentRestaurants, planTimeline);
                }
              }, 1500);
            } else {
              setPullDistance(0);
            }
            e.currentTarget.dataset.isPulling = 'false';
          }
        }}
      >
        <header className={`h-12 sm:h-14 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border-b flex items-center justify-between px-3 sm:px-5 flex-shrink-0 z-20 transition-colors duration-300`}>
          <div className="flex items-center flex-1 space-x-2 sm:space-x-4">
            <button className={`p-1.5 rounded-lg ${isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'} transition-all duration-300 active:scale-95`} onClick={() => setIsMobileMenuOpen(true)}>
              <span className="text-xl leading-none">☰</span>
            </button>
            
            <div className="flex-1 flex max-w-[250px] sm:max-w-md items-center space-x-2">
              <div className="flex-1 relative">
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMuted} text-sm transition-colors duration-300`}>🔍</span>
                <input 
                  type="text" 
                  placeholder="검색" 
                  value={S(globalSearchQuery)}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  onKeyDown={handleGlobalSearchEnter}
                  onFocus={() => {if (suggestions.length > 0) setShowCountrySuggestions(true)}}
                  onBlur={() => setTimeout(() => setShowCountrySuggestions(false), 200)}
                  className={`w-full ${inputBg} border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'} rounded-lg py-1.5 pl-9 pr-8 text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300 shadow-sm`} 
                />
                {globalSearchQuery && (
                  <button onClick={() => { setGlobalSearchQuery(""); setSuggestions([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">✕</button>
                )}
                
                {showCountrySuggestions && suggestions.length > 0 && (
                  <div className={`absolute top-full left-0 right-0 mt-1 ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'} border rounded-md shadow-xl overflow-hidden z-50 animate-in fade-in duration-200`}>
                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                      {suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onMouseDown={() => fetchCityRestaurants(suggestion)}
                          className={`w-full text-left px-4 py-2.5 text-[11px] font-bold flex items-center transition-colors duration-300 ${isDarkMode ? 'text-slate-200 hover:bg-slate-600 hover:text-indigo-300' : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-600'}`}
                        >
                          <span className="mr-2 opacity-50 text-sm">📍</span><span>{S(suggestion)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 날씨 버튼 (여행 날짜 동기화 연동) */}
              <button 
                onClick={() => setIsWeatherModalOpen(true)} 
                className={`relative z-50 pointer-events-auto cursor-pointer flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border shadow-sm flex-shrink-0 transition-all duration-300 active:scale-95 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                <span className="text-sm leading-none">{headerWeatherInfo ? headerWeatherInfo[1] : '☁️'}</span>
                <span className="text-[10px] sm:text-xs font-bold">{headerTemp}</span>
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2">
            {isSharedTripActive && (
              <button onClick={handleCloneSharedTrip} className={`hidden md:flex px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-300 bg-orange-500 text-white shadow-sm hover:bg-orange-600 active:scale-95 items-center mr-1`}>
                <span className="mr-1">💾</span> 내 일정으로 복사(가져오기)
              </button>
            )}
            <button onClick={() => changeTab('dashboard')} className={`px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-300 ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <span className="hidden sm:inline">대쉬보드 </span>🌍
            </button>
            <button onClick={() => changeTab('plan')} className={`px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-300 ${activeTab === 'plan' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <span className="hidden sm:inline">일정 </span>📆
            </button>
            <button onClick={() => changeTab('map')} className={`px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-300 ${activeTab === 'map' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <span className="hidden sm:inline">지도 </span>🗺️
            </button>
          </div>
        </header>

        <div className="flex-1 w-full flex flex-col relative z-0 min-h-max">
          
          {/* --- Dashboard Tab --- */}
          <div className={`p-2 sm:p-4 pt-3 sm:pt-4 pb-4 flex flex-col gap-3 transition-opacity duration-300 ${activeTab === 'dashboard' ? 'block opacity-100 z-10 flex-1' : 'hidden opacity-0 -z-10 pointer-events-none'}`}>
            <div className="flex items-end justify-between px-1 flex-shrink-0">
              <h2 className={`text-xs sm:text-sm font-bold flex items-center tracking-tight transition-colors duration-300 ${textMain}`}>
                💸 실시간 동시 환율
                <button onClick={() => fetchRealTimeRates(true)} className={`ml-2 px-2 py-0.5 rounded-md flex items-center space-x-1 border shadow-sm transition-all duration-300 active:scale-95 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-indigo-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-indigo-500 hover:bg-indigo-50'}`}>
                  <span className={`text-[10px] ${loadingRates ? 'animate-spin inline-block' : ''}`}>🔄</span>
                  <span className="text-[9px] font-bold">업데이트</span>
                </button>
              </h2>
              {errorRates && <span className="text-rose-500 text-[10px] font-bold ml-2 animate-in fade-in">{errorRates}</span>}
              <div className="flex items-center space-x-1.5 ml-auto">
                <button onClick={handleForceSave} className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold flex items-center space-x-1.5 shadow-sm transition-all duration-300 active:scale-95 ${isDarkMode ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700 hover:bg-emerald-900/70' : 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'}`}>
                  <span className="text-xs">💾</span>
                  <span>저장</span>
                </button>
                <button onClick={handleOpenGoogleTranslate} className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold flex items-center space-x-1.5 shadow-sm transition-all duration-300 active:scale-95 ${isDarkMode ? 'bg-slate-800 text-indigo-300 border border-slate-700 hover:bg-slate-700' : 'bg-white text-indigo-600 border border-slate-200 hover:bg-indigo-50'}`}>
                  <span className="text-xs">🌐</span>
                  <span>AI 번역기</span>
                </button>
                <button onClick={() => setIsExpenseModalOpen(true)} className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold flex items-center space-x-1.5 shadow-sm transition-all duration-300 active:scale-95 ${isDarkMode ? 'bg-rose-900/50 text-rose-400 border border-rose-700 hover:bg-rose-900/70' : 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'}`}>
                  <span className="text-xs">💸</span> 
              <span className="hidden sm:inline">여행정산</span>
              <span className="sm:hidden">정산</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-5 w-full gap-1 sm:gap-3 flex-shrink-0 pb-1">
              {CURRENCIES.map(cur => {
                const isFocused = focusedCurrency === cur.code;
                return (
                  <div key={cur.code} className={`flex flex-col items-center justify-center p-1 sm:p-3 rounded-lg sm:rounded-xl border transition-all duration-300 relative ${isFocused ? (isDarkMode ? 'border-indigo-400 bg-slate-800 shadow-md' : 'border-indigo-400 bg-indigo-50 shadow-md') : `${cardBg} shadow-sm hover:shadow`}`}>
                    <span className={`text-[8px] sm:text-[10px] font-bold mb-0.5 sm:mb-1 uppercase truncate w-full text-center transition-colors duration-300 ${isFocused ? 'text-indigo-500' : textMuted}`}>{cur.label}</span>
                    <input 
                      type="text" inputMode="decimal" value={getInputValue(cur.code)} onChange={(e) => handleInputChange(cur.code, e.target.value)} onFocus={() => setFocusedCurrency(cur.code)} onBlur={() => setFocusedCurrency(null)} placeholder={getPlaceholder(cur.code)} 
                      className={`w-full bg-transparent border-none outline-none text-center text-[10px] sm:text-base font-black p-0 focus:ring-0 transition-colors duration-300 placeholder:font-medium placeholder:text-slate-400 ${isFocused ? 'text-indigo-600' : textMain}`} 
                    />
                    <span className={`text-[7px] sm:text-[9px] font-bold mt-0.5 sm:mt-1 transition-all duration-300 ${isFocused ? 'text-indigo-400' : (amount ? textMuted : 'opacity-30')}`}>{amount ? cur.sym : '₩'}</span>
                  </div>
                );
              })}
            </div>

            {/* 모바일에서만 렌더링되는 항공권 */}
            {renderFlightCards()}

            <div className="flex-1 flex flex-row gap-1 sm:gap-4 overflow-hidden min-h-0 h-full w-full relative" style={{"--mob-left": `${panelRatio}%`}}>
              
              {/* Left Panel */}
              <div className={`max-md:w-[var(--mob-left)] md:w-[40%] ${cardBg} p-1.5 sm:p-3 flex flex-col min-h-0 h-full relative rounded-2xl sm:rounded-3xl shrink-0 transition-colors duration-300`}>
                <div className={`flex flex-col mb-1.5 sm:mb-3 flex-shrink-0 border-b pb-1.5 relative z-10 transition-colors duration-300 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                  <div className={`flex items-center justify-between space-x-1.5 mb-1 sm:mb-2 transition-colors duration-300 ${textMuted}`}>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] sm:text-xs flex-shrink-0">📅</span>
                      <span className="text-[8px] sm:text-[10px] font-bold tracking-tight truncate">{getDayDateString(dashboardDay)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-1.5">
<div className="flex items-center justify-between w-full">
                      <h3 className={`text-[10px] sm:text-xs font-bold tracking-tight leading-tight truncate mr-1 transition-colors duration-300 ${textMain}`}>🎒 오늘의 계획</h3>
                      <div className="flex space-x-1 flex-shrink-0">
                        <button onClick={() => setIsDashboardPackingOpen(true)} className={`px-1.5 py-0.5 rounded border text-[8px] sm:text-[9px] font-bold transition-all duration-300 active:scale-95 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>🎒 준비물</button>
                        <button onClick={() => setIsDashboardShoppingOpen(true)} className={`px-1.5 py-0.5 rounded border text-[8px] sm:text-[9px] font-bold transition-all duration-300 active:scale-95 ${isDarkMode ? 'bg-pink-900/30 border-pink-700/50 text-pink-300' : 'bg-pink-50 border-pink-200 text-pink-600 hover:bg-pink-100'}`}>🛍️ 쇼핑</button>
                      </div>
                    </div>
                    <div className={`grid grid-cols-4 gap-0.5 p-0.5 rounded-md w-full xl:w-[120px] overflow-y-auto custom-scrollbar max-h-16 transition-colors duration-300 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>

                      {tripDays.map(d => {
                         const wInfo = getWeatherForDay(d);
                         return (
                           <button key={d} onClick={() => { setDashboardDay(d); }} className={`h-8 sm:h-10 flex flex-col items-center justify-center rounded flex-shrink-0 transition-all duration-300 border ${dashboardDay === d ? 'bg-white text-indigo-600 shadow-sm border-slate-200/50' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                             <span className="text-[7px] sm:text-[8px] font-bold">D{d}</span>
                             {wInfo ? <span className="text-[7px] sm:text-[8px] leading-none mt-0.5">{wInfo[1]}</span> : <div className="h-1 sm:h-2"></div>}
                           </button>
                         );
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col space-y-1 sm:space-y-2 pr-1 relative z-10 scroll-smooth">
                  {todayPlans.length === 0 ? (
                     <div onClick={(e) => { e.stopPropagation(); changeTab('plan'); }} className={`flex-1 flex flex-col items-center justify-center text-[8px] sm:text-[10px] ${textMuted} font-bold text-center rounded-lg border border-dashed cursor-pointer transition-all duration-300 active:scale-[0.99] ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-indigo-500 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 hover:border-indigo-400 hover:bg-slate-100'}`}>
                       <span>일정이 없습니다.<br/>클릭하여 추가!</span>
                     </div>
                  ) : (
                    todayPlans.map((plan) => {
                      const isActive = activeMobileCard === plan.id;
                      const cardBorder = isActive ? 'border-indigo-400' : (isDarkMode ? 'border-slate-600 md:hover:border-indigo-400' : 'border-slate-100 md:hover:border-indigo-400');
                      
                      // [버그 수정 1] 교통편 렌더링 조건 완화 (테마명 포함 시 무조건 전용 카드 적용)
                      const isTransportTheme = plan.isTransport || ['교통', '항공', '비행기', '기차', '버스', '배'].some(keyword => S(plan.theme).includes(keyword));
// [버그 수정 1] 교통편 렌더링 조건 완화 (테마명에 교통수단 포함 시 전용 카드 적용)
                      if (plan.isTransport || ['교통', '항공', '비행기', '기차', '버스', '배'].some(keyword => S(plan.theme).includes(keyword))) {
                        return (
                          <div key={plan.id} className={`flex items-center space-x-1 sm:space-x-2 p-1.5 sm:p-2.5 rounded-lg border shadow-sm transition-all duration-300 bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 relative group`}
                               onClick={(e) => { 
                                 e.stopPropagation(); 
                                 if(isActive) { setSelectedPlanInfo(plan); setActiveMobileCard(null); }
                                 else setActiveMobileCard(plan.id);
                               }}>
                            <div className="bg-indigo-500 text-white font-black text-[7px] sm:text-[9px] px-1 sm:px-1.5 py-0.5 rounded flex-shrink-0 transition-colors">{S(plan.time)}</div>
                            <div className="flex-1 min-w-0 flex flex-col px-0.5">
                              <span className={`text-[9px] sm:text-[12px] font-black truncate text-indigo-700 dark:text-indigo-300 leading-tight`}>
                                {S(plan.place)}
                              </span>
                              <div className="flex flex-col sm:flex-row sm:items-center mt-0.5 gap-0.5 sm:gap-2">
                                 {plan.localName && <span className="text-[7px] sm:text-[9px] text-slate-500 dark:text-slate-400 font-bold truncate">🏢 {S(plan.localName)}</span>}
                                 {plan.features && <span className="text-[7px] sm:text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate bg-white dark:bg-slate-800 px-1 rounded shadow-sm inline-block">{S(plan.features)}</span>}
                              </div>
                            </div>
                            <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1 rounded border shadow-sm transition-all duration-300 bg-white/90 dark:bg-slate-700/90 border-slate-200 dark:border-slate-600 ${isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 md:group-hover:opacity-100 pointer-events-none md:group-hover:pointer-events-auto'}`}>
                               <button onClick={(e) => { if (!isActive) return; e.stopPropagation(); handleEditPlanClick(plan); }} className="text-slate-500 hover:text-indigo-600 p-0.5 sm:p-1 transition-colors"><span className="text-[10px] sm:text-xs">✏️</span></button>
                               <button onClick={(e) => { if (!isActive) return; e.stopPropagation(); handleDeletePlan(plan.id); }} className="text-slate-500 hover:text-rose-500 p-0.5 sm:p-1 transition-colors"><span className="text-[10px] sm:text-xs">🗑️</span></button>
                            </div>
                          </div>
                        )
                      }

                      return (
                      <div key={plan.id} className={`flex items-center space-x-1 sm:space-x-2 p-1 sm:p-2 rounded-lg border cursor-pointer shadow-sm transition-all duration-300 group relative ${cardBorder} ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-white hover:bg-slate-50'}`} onClick={(e) => { 
                         e.stopPropagation(); 
                         if(isActive) { setSelectedPlanInfo(plan); setActiveMobileCard(null); }
                         else setActiveMobileCard(plan.id);
                      }}>
                        <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-[7px] sm:text-[9px] px-1 sm:px-1.5 py-0.5 rounded flex-shrink-0 transition-colors">
                          {plan.isAccommodation ? '🏠 숙소' : S(plan.time)}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col px-0.5">
                          <span className={`text-[8px] sm:text-[11px] font-bold truncate transition-colors duration-300 ${textMain}`}>
                            {S(plan.place)} {plan.isAccommodation && '🏠'}
                          </span>
                          {plan.features && <span className={`text-[6px] sm:text-[9px] truncate mt-0.5 transition-colors duration-300 ${textMuted}`}>{S(plan.features)}</span>}
                        </div>
                        
{/* 오늘의 계획 전용: 카드 내부 우측 가로 배치 메뉴 */}
                        <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex flex-row space-x-1.5 p-1 rounded-lg border shadow-md bg-white/95 dark:bg-slate-800/95 border-slate-200 dark:border-slate-600 z-10 transition-all duration-300 ${isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 md:group-hover:opacity-100 pointer-events-none'}`}>
                            <button onClick={(e) => { e.stopPropagation(); handleEditPlanClick(plan); }} className="text-slate-500 hover:text-indigo-600 p-1.5 transition-colors active:scale-90"><span className="text-[10px]">✏️</span></button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan.id); }} className="text-slate-500 hover:text-rose-500 p-1.5 transition-colors active:scale-90"><span className="text-[10px]">🗑️</span></button>
                        </div>
                      </div>
                    )})
                  )}
                </div>
{/* 대시보드 하단 요약 뷰는 상단 탭 모달로 깔끔하게 통합되었습니다. */}
              </div>

              {/* Drag Handle */}
              <div 
                 className="w-1.5 bg-slate-200/60 dark:bg-slate-700 hover:bg-indigo-400 rounded-full flex-shrink-0 md:hidden flex items-center justify-center cursor-col-resize active:bg-indigo-500 transition-colors duration-300"
                 onMouseDown={handleDragStart}
                 onTouchStart={handleDragStart}
              >
                <div className="w-0.5 h-8 bg-slate-400/50 dark:bg-slate-500 rounded-full pointer-events-none"></div>
              </div>

              {/* Right Panel */}
              <div className={`flex-1 ${cardBg} p-1.5 sm:p-3 flex flex-col min-h-0 h-full relative rounded-2xl sm:rounded-3xl transition-colors duration-300`}>
                <div className="flex items-center justify-between mb-1.5 sm:mb-3 flex-shrink-0 relative z-30">
                  <h3 className={`text-[10px] sm:text-sm font-bold tracking-tight flex items-center transition-colors duration-300 ${textMain}`}>
                    <span className="truncate max-w-[100px] sm:max-w-none">✈️ 여행 리스트({S(displayCityName)})</span>
                  </h3>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <div className={`grid grid-cols-4 gap-0.5 p-0.5 rounded-md min-w-[70px] sm:min-w-[100px] w-full max-w-[120px] overflow-y-auto custom-scrollbar max-h-16 transition-colors duration-300 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                      {tripDays.map(d => (
                         <button key={d} onClick={() => { setDashboardDay(d); }} className={`px-1 py-0.5 text-[7px] sm:text-[8px] font-bold rounded flex-shrink-0 transition-all duration-300 border ${dashboardDay === d ? 'bg-white text-indigo-600 shadow-sm border-slate-200/50' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                           D{d}
                         </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col min-h-0 scroll-smooth">
                 {/* 여행 리스트 카드: 컴팩트한 3열 배치 (교통편은 숨기고 오늘의 계획에만 표출) */}
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-1.5 content-start">
                    {(() => {
                      // [버그 수정] 여행 리스트 갤러리에서는 교통/항공편 관련 카드를 완전히 필터링하여 레이아웃을 깔끔하게 유지합니다.
                      const travelListPlans = todayPlans.filter(plan => !(plan.isTransport || ['교통', '항공', '비행기', '기차', '버스', '배'].some(keyword => S(plan.theme).includes(keyword))));
                      
                      if (travelListPlans.length === 0) {
                        return (
                           <div onClick={(e) => { e.stopPropagation(); changeTab('plan'); }} className={`col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed h-20 sm:h-24 cursor-pointer transition-all duration-300 active:scale-[0.99] ${textMuted} ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-indigo-500 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 hover:border-indigo-400 hover:bg-white'}`}>
                             <span className="text-[9px] sm:text-[11px] font-bold">일정이 없습니다. 추가해 보세요!</span>
                           </div>
                        );
                      }

                      return travelListPlans.map((plan) => {
                        const isActive = activeMobileCard === plan.id;
                        const cardBorder = isActive ? 'border-indigo-400' : (isDarkMode ? 'border-slate-700 md:hover:border-indigo-500' : 'border-slate-200 md:hover:border-indigo-400');
                        
                        return (
                        <div 
                          key={plan.id} 
                          className={`rounded-lg border shadow-sm overflow-hidden flex flex-col transition-all duration-300 group relative hover:shadow-md ${cardBorder} ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white'}`}
                        >
                          {/* 교통편이 이미 필터링되었으므로 조건부 렌더링을 제거하고 항상 예쁜 사진 영역을 띄웁니다. */}
                          <div className={`w-full h-16 sm:h-20 relative shrink-0 cursor-pointer border-b transition-colors duration-300 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`} 
                               onClick={(e) => { e.stopPropagation(); if(isActive) { setSelectedPlanInfo(plan); setActiveMobileCard(null); } else setActiveMobileCard(plan.id); }}>
                            <img src={plan.photo || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80"} className="w-full h-full object-cover md:group-hover:scale-105 transition-transform duration-500" alt="" />
                            <div className="absolute top-1 left-1 bg-indigo-500/90 backdrop-blur text-white text-[7px] sm:text-[8px] font-bold px-1 py-0.5 rounded shadow-sm">
                              {plan.isAccommodation ? '🏠 숙소' : S(plan.time)}
                            </div>
                            <div className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}><span className="text-white text-[8px] sm:text-[10px] font-bold">터치하여 상세 보기</span></div>
                          </div>
                          
                          <div className={`flex flex-col p-1.5 flex-1 cursor-pointer justify-start min-w-0 transition-colors duration-300 ${isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50/50'}`} 
                               onClick={(e) => { e.stopPropagation(); if(isActive) { setSelectedPlanInfo(plan); setActiveMobileCard(null); } else setActiveMobileCard(plan.id); }}>
                            <h4 className={`font-black text-[9px] sm:text-[11px] truncate tracking-tight mb-0.5 transition-colors duration-300 ${textMain}`}>
                              {S(plan.place)} {plan.isAccommodation && '🏠'}
                            </h4>
                            {plan.localName && <p className="text-[7px] sm:text-[9px] text-indigo-500 font-bold truncate mb-0.5 sm:mb-1">{S(plan.localName)}</p>}
                            {plan.features && <p className={`text-[7px] sm:text-[8px] line-clamp-2 leading-tight mt-auto transition-colors duration-300 ${textMuted}`}>{S(plan.features)}</p>}
                          </div>
                          
                          {/* 모바일 탭 & PC 호버 수정/삭제 메뉴 */}
                          <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex flex-col space-y-1 rounded-lg border shadow-md p-0.5 z-10 transition-all duration-300 ${isDarkMode ? 'bg-slate-700/90 border-slate-600' : 'bg-white/90 border-slate-200'} ${isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 md:group-hover:opacity-100 pointer-events-none md:group-hover:pointer-events-auto'}`}>
                             <button onClick={(e) => { if (!isActive) return; e.stopPropagation(); handleEditPlanClick(plan); }} className="text-slate-500 hover:text-indigo-600 p-1 transition-colors"><span className="text-xs">✏️</span></button>
                             <button onClick={(e) => { if (!isActive) return; e.stopPropagation(); handleDeletePlan(plan.id); }} className="text-slate-500 hover:text-rose-500 p-1 transition-colors"><span className="text-xs">🗑️</span></button>
                          </div>
                        </div>
                      )})
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- Plan Tab --- */}
          <div className={`p-2 sm:p-4 pt-3 pb-4 flex flex-col transition-opacity duration-300 ${activeTab === 'plan' ? 'block opacity-100 z-10 flex-1' : 'hidden opacity-0 -z-10 pointer-events-none'}`}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 sm:mb-3 px-1 gap-2 flex-shrink-0">
              <h2 className={`text-xs sm:text-sm font-bold flex items-center tracking-tight transition-colors duration-300 ${textMain}`}>
                📝 꼼꼼하게 채우는 여행 일기
              </h2>
              <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap sm:flex-nowrap gap-y-1 ml-auto">
                {isSharedTripActive && (
                   <button onClick={handleCloneSharedTrip} className={`flex items-center border shadow-sm px-1.5 sm:px-2 py-1 h-7 sm:h-8 rounded-lg text-[8px] sm:text-[9px] font-bold transition-all duration-300 active:scale-95 bg-orange-500 text-white hover:bg-orange-600`}>
                      💾 내 일정으로 복사
                   </button>
                )}
                <button onClick={() => {
                  setTransType('flight'); setTransDir('outbound'); setModalTransData({ flight: { outbound: { ...initialTransState }, inbound: { ...initialTransState } }, train: { outbound: { ...initialTransState }, inbound: { ...initialTransState } }, bus: { outbound: { ...initialTransState }, inbound: { ...initialTransState } } });
                  setIsTransportModalOpen(true);
                }} className={`flex items-center border shadow-sm px-1.5 sm:px-2 py-1 h-7 sm:h-8 rounded-lg text-[8px] sm:text-[9px] font-bold transition-all duration-300 active:scale-95 ${isDarkMode ? 'bg-indigo-900/40 text-indigo-300 border-indigo-500/50 hover:bg-indigo-900/60' : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'}`}>
                   ✈️ 교통/항공권
                </button>
                <div className={`flex items-center px-1.5 sm:px-2 py-1 h-7 sm:h-8 rounded-lg transition-colors duration-300 ${cardBg}`}>
                  <span className={`text-[8px] sm:text-[9px] font-bold mr-1 sm:mr-1.5 flex-shrink-0 transition-colors duration-300 ${textMuted}`}>국가 🌍</span>
                  <div className="flex-1 relative w-14 sm:w-20 h-full flex items-center">
                    <SelectOrInput 
                      inputId="global-country-input"
                      value={globalPlanCountry} manualValue={globalManualCountry} isDarkMode={isDarkMode} appTheme={appTheme}
                      options={Object.keys(REGIONS_BY_COUNTRY)}
                      onChangeSelect={e => {
                         const val = e.target.value;
                         setGlobalPlanCountry(val); setGlobalPlanRegion(""); setGlobalManualCountry(""); setGlobalManualRegion("");
                      }}
                      onChangeManual={val => setGlobalManualCountry(val)}
                      onCancelManual={() => { setGlobalPlanCountry(""); setGlobalManualCountry(""); }}
                    />
                  </div>
                </div>
                <div className={`flex items-center px-1.5 sm:px-2 py-1 h-7 sm:h-8 rounded-lg transition-colors duration-300 ${cardBg}`}>
                  <span className={`text-[8px] sm:text-[9px] font-bold mr-1 sm:mr-1.5 flex-shrink-0 transition-colors duration-300 ${textMuted}`}>지역 📍</span>
                  <div className="flex-1 relative w-14 sm:w-20 h-full flex items-center">
                    <SelectOrInput 
                      inputId="global-region-input"
                      value={globalPlanRegion} manualValue={globalManualRegion} isDarkMode={isDarkMode} appTheme={appTheme}
                      options={(!globalPlanCountry || globalPlanCountry === '수동입력') ? null : REGIONS_BY_COUNTRY[globalPlanCountry]}
                      onChangeSelect={e => {
                         const val = e.target.value;
                         setGlobalPlanRegion(val); setGlobalManualRegion("");
                         if (val && val !== '수동입력') {
                            setDisplayCityName(val);
                            saveToDb({ display_city_name: val });
                         }
                      }}
                      onChangeManual={val => {
                         setGlobalManualRegion(val);
                         if (val) {
                            setDisplayCityName(val);
                            saveToDb({ display_city_name: val });
                         }
                      }}
                      onCancelManual={() => { setGlobalPlanRegion(""); setGlobalManualRegion(""); }}
                    />
                  </div>
                </div>
                <div className={`flex items-center px-1.5 sm:px-2 py-1 h-7 sm:h-8 rounded-lg transition-colors duration-300 ${cardBg}`}>
                  <span className={`text-[8px] sm:text-[9px] font-bold mr-1 sm:mr-1.5 transition-colors duration-300 ${textMuted}`}>시작일</span>
                  <input 
                    type="date" 
                    value={travelStartDate} 
                    onChange={(e) => { 
                      setTravelStartDate(e.target.value); 
                      saveToDb({ travel_start_date: e.target.value });
                    }}
                    className={`text-[8px] sm:text-[10px] font-bold outline-none bg-transparent transition-colors duration-300 ${textMain}`}
                  />
                </div>
              </div>
            </div>
            
            <div className={`flex-1 flex flex-col md:flex-row overflow-hidden h-full rounded-2xl sm:rounded-3xl custom-scrollbar transition-colors duration-300 ${cardBg}`}>
              <div className={`w-full md:w-[22rem] lg:w-96 p-3 sm:p-4 border-b md:border-b-0 md:border-r flex flex-col flex-shrink-0 md:overflow-y-auto custom-scrollbar transition-colors duration-300 ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
                <div className="space-y-2 mt-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className={`text-[9px] font-bold px-1 transition-colors duration-300 ${textMuted}`}>일차 선택</label>
                    <div className="flex space-x-1">
                      <button onClick={addDay} className="bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[8px] font-bold shadow-sm hover:bg-indigo-100 transition-colors duration-300">+ Day 추가</button>
                      {maxDay > 4 && <button onClick={removeDay} className="bg-rose-50 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded text-[8px] font-bold shadow-sm hover:bg-rose-100 transition-colors duration-300">- 삭제</button>}
                    </div>
                  </div>
                  
                  {/* [NEW] 4칸씩 줄바꿈(접힘) 처리되는 그리드 */}
                  <div className={`grid grid-cols-4 gap-1 border rounded-lg p-1 shadow-sm mb-2 max-h-24 overflow-y-auto custom-scrollbar transition-colors duration-300 ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200/80'}`}>
                    {tripDays.map(d => (
                      <button key={d} onClick={() => setNewDay(d)} className={`flex-1 text-[10px] font-black py-1.5 rounded transition-all duration-300 is-tag ${newDay === d ? 'bg-indigo-600 text-white shadow-md scale-110 z-10' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-indigo-100'}`}>D{d}</button>
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    <div className="flex flex-col space-y-1 w-1/2">
                      <label className={`text-[9px] font-bold px-1 transition-colors duration-300 ${textMuted}`}>국가 🌍</label>
                      <div className={`w-full border px-2 py-1.5 h-8 flex items-center rounded transition-colors duration-300 ${inputBg} ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'}`}>
                        <SelectOrInput 
                          inputId="form-country-input"
                          value={planCountry} manualValue={manualCountry} isDarkMode={isDarkMode} appTheme={appTheme}
                          options={Object.keys(REGIONS_BY_COUNTRY)}
                          onChangeSelect={e => {setPlanCountry(e.target.value); setPlanRegion(""); setManualCountry(""); setManualRegion("");}}
                          onChangeManual={val => setManualCountry(val)}
                          onCancelManual={() => { setPlanCountry(""); setManualCountry(""); }}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1 w-1/2">
                      <label className={`text-[9px] font-bold px-1 transition-colors duration-300 ${textMuted}`}>지역 📍</label>
                      <div className={`w-full border px-2 py-1.5 h-8 flex items-center rounded transition-colors duration-300 ${inputBg} ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'}`}>
                        <SelectOrInput 
                          inputId="form-region-input"
                          value={planRegion} manualValue={manualRegion} isDarkMode={isDarkMode} appTheme={appTheme}
                          options={(!planCountry || planCountry === '수동입력') ? null : REGIONS_BY_COUNTRY[planCountry]}
                          onChangeSelect={e => {setPlanRegion(e.target.value); setManualRegion("");}}
                          onChangeManual={val => setManualRegion(val)}
                          onCancelManual={() => { setPlanRegion(""); setManualRegion(""); }}
                        />
                      </div>
                    </div>
                  </div>

               <div className="flex space-x-2 items-end">
                <div className="flex flex-col space-y-1 w-1/4">
                  <label className={`text-[9px] font-bold px-1 transition-colors duration-300 ${textMuted}`}>테마 📌</label>
                  <select value={newTheme} onChange={e => setNewTheme(e.target.value)} className={`w-full border p-1.5 text-[10px] font-bold focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm rounded transition-all duration-300 ${inputBg} ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'}`}>
                    <option value="교통편">교통편</option>
                    <option value="식당">식당</option>
                    <option value="디저트">디저트</option>
                    <option value="관광지">관광지</option>
                    <option value="쇼핑">쇼핑</option>
                    <option value="숙소">숙소</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
                <div className="flex flex-col space-y-1 w-1/4">
                  <label className={`text-[9px] font-bold px-1 transition-colors duration-300 ${textMuted}`}>시간 ⏰</label>
                  <input 
                    type="text" 
                    maxLength="5"

                        value={newTime} 
                        onChange={(e) => handleTimeInput(e, setNewTime)} 
                        placeholder="09:00" 
                        className={`w-full border p-1.5 text-[10px] font-bold focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm rounded transition-all duration-300 ${inputBg} ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'}`} 
                      />
                    </div>
                    <div className="flex flex-col space-y-1 flex-1 relative">
                      <label className={`text-[9px] font-bold px-1 transition-colors duration-300 ${textMuted}`}>장소 📍</label>
                      <input
                        type="text"
                        placeholder="장소 이름 입력"
                        value={newPlace}
                        onChange={(e) => setNewPlace(e.target.value)}
                        className={`w-full border p-1.5 text-[10px] font-bold focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm pr-6 rounded transition-all duration-300 ${inputBg} ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'}`}
                      />
                    </div>
                  </div>

                  {/* 내 핀에서 선택 - 커스텀 드롭다운 */}
                  {currentRestaurants.filter(r => r && r.name).length > 0 && (
                    <div className="flex flex-col space-y-1">
                      <label className={`text-[9px] font-bold px-1 transition-colors duration-300 ${textMuted}`}>내 핀에서 선택 📌</label>
                      <div className="relative" onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setPinSelectOpen(v => !v)}
                          className={`w-full border p-1.5 text-[10px] font-bold text-left rounded shadow-sm flex items-center justify-between transition-all duration-300 ${inputBg} ${isDarkMode ? 'border-slate-600 text-slate-200' : 'border-slate-200/80 text-slate-700'}`}
                        >
                          <span className={textMuted}>— 핀 목록에서 불러오기 —</span>
                          <span className="ml-1">{pinSelectOpen ? '▲' : '▼'}</span>
                        </button>
                        {pinSelectOpen && (
                          <div className={`absolute left-0 right-0 top-full mt-1 z-50 border rounded-lg shadow-xl overflow-y-auto max-h-44 custom-scrollbar ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'}`}>
                            {currentRestaurants.filter(r => r && r.name).map(pin => (
                              <button
                                key={pin.id}
                                type="button"
                                onClick={() => {
                                  setNewPlace(S(pin.name));
                                  if (pin.localName) setNewLocalName(S(pin.localName));
                                  if (pin.signature) setNewFeatures(S(pin.signature));
                                  if (pin.img) setNewPhoto(S(pin.img));
                                  if (pin.isAccommodation) setNewIsAccommodation(true);
                                  if (pin.theme) setNewTheme(S(pin.theme));
                                  setPinSelectOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-[10px] font-bold flex items-center gap-1 transition-colors ${isDarkMode ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-indigo-50'}`}
                              >
                                <span>{pin.isAccommodation ? '🏠' : pin.isLandmark ? '⭐' : '📍'}</span>
                                <span className="truncate">{S(pin.name)}{pin.localName ? ` (${S(pin.localName)})` : ''}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2 items-end">
                    <div className="flex flex-col space-y-1 flex-1">
                      <label className={`text-[9px] font-bold px-1 transition-colors duration-300 ${textMuted}`}>현지어(복사용)</label>
                      <input type="text" placeholder="현지어 입력" value={newLocalName} onChange={e => setNewLocalName(e.target.value)} className={`w-full border p-1.5 text-[10px] font-bold focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm rounded transition-all duration-300 ${inputBg} ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'}`} />
                    </div>
                    <div className="flex flex-col space-y-1 flex-1">
                      <label className={`text-[9px] font-bold px-1 transition-colors duration-300 ${textMuted}`}>메모</label>
                      <input type="text" placeholder="간단 메모" value={newFeatures} onChange={(e) => setNewFeatures(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSavePlan()} className={`w-full border p-1.5 text-[10px] font-bold focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm rounded transition-all duration-300 ${inputBg} ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'}`} />
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1 w-full pt-1">
                    <label className={`text-[9px] font-bold px-1 transition-colors duration-300 ${textMuted}`}>사진 추가</label>
                    <input type="file" accept="image/*" ref={planFileInputRef} onChange={(e) => handlePlanPhotoUpload(e, false)} className="hidden" />
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         placeholder="URL 입력 / 이미지 복붙" 
                         value={newPhoto} 
                         onChange={e => setNewPhoto(e.target.value)} 
                         className={`flex-1 w-1/2 border p-1.5 text-[9px] font-bold focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm rounded transition-all duration-300 ${inputBg} ${isDarkMode ? 'border-slate-600' : 'border-slate-200/80'}`} 
                       />
                       <button type="button" onClick={() => planFileInputRef.current?.click()} className={`flex-1 w-1/2 py-1.5 text-[9px] font-bold rounded border transition-all duration-300 flex items-center justify-center ${newPhoto ? 'bg-indigo-50 border-indigo-300 text-indigo-600 shadow-sm' : (isDarkMode ? 'bg-slate-700 border-dashed border-slate-500 text-slate-400 hover:bg-slate-600' : 'bg-white border-dashed border-slate-300 text-slate-400 hover:bg-slate-50')}`}>
                         <span className="flex items-center">📸 파일 첨부</span>
                       </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 my-1.5 px-1 pb-1">
                    <input type="checkbox" id="planIsAcc" checked={newIsAccommodation} onChange={e => setNewIsAccommodation(e.target.checked)} className="accent-indigo-600 w-3.5 h-3.5 cursor-pointer" />
                    <label htmlFor="planIsAcc" className={`text-[10px] font-bold cursor-pointer transition-colors duration-300 ${textMuted}`}>이 장소를 숙소로 설정 🏠</label>
                  </div>

                  <div className="pt-1 flex space-x-2">
                    <button onClick={handleSavePlan} className="w-full bg-indigo-600 text-white rounded py-2.5 text-[11px] font-bold shadow-md hover:bg-indigo-700 active:scale-95 transition-all duration-300">
                      <span>스케줄에 등록! ✨</span>
                    </button>
                  </div>
                    <div className="flex space-x-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                     <button onClick={() => setIsPackingModalOpen(true)} className="flex-1 bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400 rounded-lg py-2.5 text-[11px] font-bold shadow-sm hover:bg-emerald-100 transition-colors duration-300 flex justify-center items-center">
                      🎒 준비물 입력
                    </button>
                     <button onClick={() => setIsShoppingModalOpen(true)} className="flex-1 bg-pink-50 text-pink-600 border border-pink-200 dark:bg-pink-900/30 dark:border-pink-800 dark:text-pink-400 rounded-lg py-2.5 text-[11px] font-bold shadow-sm hover:bg-pink-100 transition-colors duration-300 flex justify-center items-center">
                      🛍️ 쇼핑리스트
                     </button>
                  </div>

                </div>
              </div>

              <div className={`flex-1 flex flex-col min-h-0 p-2 sm:p-4 w-full overflow-y-auto custom-scrollbar transition-colors duration-300 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100/50'}`}>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 pb-2">
                  {tripDays.map(day => (
                    <div key={day} className={`flex-1 flex flex-col rounded-xl border min-h-[150px] overflow-hidden shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'}`}>
                      <div className={`py-1.5 flex flex-col items-center border-b flex-shrink-0 transition-colors duration-300 ${isDarkMode ? 'border-slate-600 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
                        <span className={`text-[10px] sm:text-[11px] font-bold leading-tight transition-colors duration-300 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          Day {day}
                        </span>
                        <span className={`text-[7px] sm:text-[8px] mt-0.5 transition-colors duration-300 ${textMuted}`}>{getDayDateString(day)}</span>
                      </div>
                      <div className={`flex-1 overflow-y-auto custom-scrollbar p-1.5 sm:p-2 space-y-1.5 transition-colors duration-300 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                        
                        {/* 숙소(isAccommodation) 아이템 상단 고정 렌더링 로직 추가 */}
                        {planTimeline.filter(p => p && p.isAccommodation).map(plan => {
                          const isActive = activeMobileCard === plan.id;
                          return (
                            <div key={plan.id} className={`p-1.5 sm:p-2 rounded-lg border shadow-sm bg-yellow-50/50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 relative group cursor-pointer transition-all duration-300 hover:shadow-md ${isActive ? 'border-indigo-400' : ''}`}
                                 onClick={(e) => { e.stopPropagation(); if(isActive){setSelectedPlanInfo(plan); setActiveMobileCard(null);}else setActiveMobileCard(plan.id); }}>
                               <div className="flex justify-between items-start mb-1">
                                 <span className="text-[8px] font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/50 px-1 py-0.5 rounded shadow-sm leading-none">🏠 연박 숙소</span>
                                  <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex flex-col space-y-1 p-0.5 rounded-lg border shadow-md bg-white/90 dark:bg-slate-700/90 border-slate-200 dark:border-slate-600 z-10 transition-all duration-300 ${isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 md:group-hover:opacity-100 pointer-events-none md:group-hover:pointer-events-auto'}`}>                                   <button onClick={(e) => { if (!isActive) return; e.stopPropagation(); handleEditPlanClick(plan); }} className="text-slate-500 hover:text-indigo-600 p-0.5 transition-colors"><span className="text-[10px]">✏️</span></button>
                                   <button onClick={(e) => { if (!isActive) return; e.stopPropagation(); handleDeletePlan(plan.id); }} className="text-slate-500 hover:text-rose-500 p-0.5 transition-colors"><span className="text-[10px]">🗑️</span></button>
                                 </div>
                               </div>
                               <div className="flex gap-1.5 items-start mt-1">
                                 <div className="flex-1 min-w-0 flex flex-col cursor-pointer" >
                                   <p className={`text-[9px] sm:text-[10px] font-bold leading-tight line-clamp-2 transition-colors duration-300 ${textMain}`}>{S(plan.place)}</p>
                                   {plan.localName && (
                                     <p className="text-[7px] text-indigo-500 font-bold mt-0.5 truncate hover:opacity-70 transition-opacity" onClick={(e) => handleCopyLocalName(e, plan.localName)}>
                                       📋 {S(plan.localName)}
                                     </p>
                                   )}
                                   {plan.features && <p className={`text-[7px] sm:text-[8px] line-clamp-2 leading-tight mt-0.5 transition-colors duration-300 ${textMuted}`}>{S(plan.features)}</p>}
                                 </div>
                                 {plan.photo && (
                                   <div className="w-8 h-8 sm:w-10 sm:h-10 rounded border border-slate-200 overflow-hidden cursor-pointer relative flex-shrink-0 group-hover:scale-105 transition-transform duration-500" onClick={(e) => { e.stopPropagation(); setViewPhoto(plan.photo); }}>
                                     <img src={plan.photo} className="w-full h-full object-cover transition-opacity" alt="" />
                                   </div>
                                 )}
                               </div>
                            </div>
                          );
                        })}

                        {/* 일반 일정 렌더링 로직 */}
                        {planTimeline.filter(p => !p.isAccommodation && parseInt(p.day || 1) === day).length === 0 && planTimeline.filter(p => p && p.isAccommodation).length === 0 ? (
                           <div className={`flex flex-col items-center justify-center h-full min-h-[100px] text-[8px] sm:text-[9px] transition-colors duration-300 ${textMuted}`}>
                             <span>일정 없음</span>
                           </div>
                        ) : (
                          planTimeline.filter(p => !p.isAccommodation && parseInt(p.day || 1) === day).map((plan) => {
                            const isActive = activeMobileCard === plan.id;

                            // [버그 수정 1] 교통편 렌더링 조건 완화 (테마명 포함 시 무조건 전용 카드 적용)
                            const isTransportTheme = plan.isTransport || ['교통', '항공', '비행기', '기차', '버스', '배'].some(keyword => S(plan.theme).includes(keyword));
                            // [버그 수정 1] 교통/항공권 렌더링 조건 완화 (테마명에 교통수단 포함 시 전용 카드)
                            if (plan.isTransport || ['교통', '항공', '비행기', '기차', '버스', '배'].some(keyword => S(plan.theme).includes(keyword))) {
                              return (
                                <div key={plan.id} className={`flex items-center space-x-1 sm:space-x-2 p-1.5 sm:p-2.5 rounded-lg border shadow-sm transition-all duration-300 bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 relative group cursor-pointer ${isActive ? 'border-indigo-400' : ''}`}
                                     onClick={(e) => { 
                                       e.stopPropagation(); 
                                       if(isActive) { setSelectedPlanInfo(plan); setActiveMobileCard(null); }
                                       else setActiveMobileCard(plan.id);
                                     }}>
                                  <div className="bg-indigo-600 text-white font-black text-[7px] sm:text-[9px] px-1.5 py-0.5 rounded flex-shrink-0 shadow-sm is-tag">{S(plan.time)}</div>
                                  <div className="flex-1 min-w-0 flex flex-col px-0.5">
                                    <span className={`text-[9px] sm:text-[12px] font-black truncate text-indigo-700 dark:text-indigo-300 leading-tight`}>
                                      {S(plan.place)}
                                    </span>
                                    <div className="flex flex-col sm:flex-row sm:items-center mt-0.5 gap-0.5 sm:gap-2">
                                       {plan.localName && <span className="text-[7px] sm:text-[9px] text-slate-500 dark:text-slate-400 font-bold truncate">🏢 {S(plan.localName)}</span>}
                                       {plan.features && <span className="text-[7px] sm:text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate bg-white dark:bg-slate-800 px-1 rounded shadow-sm inline-block">{S(plan.features)}</span>}
                                    </div>
                                  </div>
                                  <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1 rounded border shadow-sm transition-all duration-300 bg-white/90 dark:bg-slate-700/90 border-slate-200 dark:border-slate-600 ${isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 md:group-hover:opacity-100 pointer-events-none md:group-hover:pointer-events-auto'}`}>
                                     <button onClick={(e) => { if (!isActive) return; e.stopPropagation(); handleEditPlanClick(plan); }} className="text-slate-500 hover:text-indigo-600 p-0.5 sm:p-1 transition-colors"><span className="text-[10px] sm:text-xs">✏️</span></button>
                                     <button onClick={(e) => { if (!isActive) return; e.stopPropagation(); handleDeletePlan(plan.id); }} className="text-slate-500 hover:text-rose-500 p-0.5 sm:p-1 transition-colors"><span className="text-[10px] sm:text-xs">🗑️</span></button>
                                  </div>
                                </div>
                              )
                            }

                            return (
                            <div key={plan.id} className={`p-1.5 sm:p-2 rounded-lg border relative group transition-all duration-300 hover:shadow-md cursor-pointer ${isDarkMode ? 'bg-slate-700 border-slate-600 hover:bg-slate-600' : 'bg-slate-50 border-slate-100 hover:bg-white'} ${isActive ? 'border-indigo-400' : 'md:hover:border-indigo-300'}`} onClick={(e) => { e.stopPropagation(); if (isActive) { setSelectedPlanInfo(plan); setActiveMobileCard(null); } else setActiveMobileCard(plan.id); }}>
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-[8px] font-bold text-white bg-indigo-500 px-1 py-0.5 rounded shadow-sm leading-none transition-transform duration-300 hover:scale-105">{S(plan.time)}</span>
                                <div className={`transition-all duration-300 flex space-x-1 rounded border absolute top-1 right-1 z-10 shadow-sm ${isDarkMode ? 'bg-slate-700/90 border-slate-600' : 'bg-white/90 border-slate-200'} ${isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 md:group-hover:opacity-100 pointer-events-none md:group-hover:pointer-events-auto'}`}>
                                  <button onClick={(e) => { if (!isActive) return; e.stopPropagation(); handleEditPlanClick(plan); }} className="text-slate-500 hover:text-indigo-600 p-0.5 transition-colors"><span className="text-[10px]">✏️</span></button>
                                  <button onClick={(e) => { if (!isActive) return; e.stopPropagation(); handleDeletePlan(plan.id); }} className="text-slate-500 hover:text-rose-500 p-0.5 transition-colors"><span className="text-[10px]">🗑️</span></button>
                                </div>
                              </div>
                              <div className="flex gap-1.5 items-start mt-1">
                                <div className="flex-1 min-w-0 flex flex-col cursor-pointer" >
                                  <p className={`text-[9px] sm:text-[10px] font-bold leading-tight line-clamp-2 transition-colors duration-300 ${textMain}`}>{S(plan.place)}</p>
                                  {plan.localName && (
                                    <p className="text-[7px] text-indigo-500 font-bold mt-0.5 truncate hover:opacity-70 transition-opacity" onClick={(e) => handleCopyLocalName(e, plan.localName)}>
                                      📋 {S(plan.localName)}
                                    </p>
                                  )}
                                  {plan.features && <p className={`text-[7px] sm:text-[8px] line-clamp-2 leading-tight mt-0.5 transition-colors duration-300 ${textMuted}`}>{S(plan.features)}</p>}
                                </div>
                                {plan.photo && !plan.isTransport && (
                                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded border border-slate-200 overflow-hidden cursor-pointer relative flex-shrink-0 group-hover:scale-105 transition-transform duration-500" onClick={(e) => { e.stopPropagation(); setViewPhoto(plan.photo); }}>
                                    <img src={plan.photo} className="w-full h-full object-cover transition-opacity" alt="" />
                                  </div>
                                )}
                              </div>
                            </div>
                          )})
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* --- Map Tab --- */}
          {/* --- Archive (Travel History) Tab --- */}
          <div className={`absolute inset-0 flex flex-col p-2 sm:p-5 overflow-hidden transition-opacity duration-300 ${activeTab === 'archive' ? 'visible opacity-100 z-10' : 'invisible opacity-0 -z-10 pointer-events-none'}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 flex-shrink-0">
              <div>
                <h2 className={`text-lg font-black flex items-center ${textMain}`}>📷 소중한 여행기록 <span className="ml-2 text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{trips.filter(t => t.archived).length}개의 추억</span></h2>
                <p className={`text-[10px] font-bold ${textMuted} mt-0.5`}>완료된 여행들을 이곳에서 다시 꺼내보세요.</p>
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shadow-inner">
                {['전체', '국내', '해외'].map(cat => (
                  <button key={cat} onClick={() => setArchiveFilterLocation(cat)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${archiveFilterLocation === cat ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{cat}</button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 scroll-smooth">
              {(() => {
                const archived = trips.filter(t => t.archived);
                if (archived.length === 0) return (
                  <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-40">
                    <span className="text-6xl mb-4">🏜️</span>
                    <p className="text-sm font-black">아직 완료된 여행이 없습니다.</p>
                    <p className="text-xs font-bold mt-1">지금 여행중인 일정을 완료하면 이곳에 나타납니다!</p>
                  </div>
                );

                // 연도별 그룹화 로직
                const years = [...new Set(archived.map(t => new Date(t.finishDate || Date.now()).getFullYear()))].sort((a,b) => b - a);

                return years.map(year => {
                  const yearTrips = archived.filter(t => new Date(t.finishDate || Date.now()).getFullYear() === year);
                  return (
                    <div key={year} className="mb-10 last:mb-0">
                      <div className="flex items-center mb-4 space-x-3">
                        <span className="text-lg font-black text-indigo-500">{year}년</span>
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
{yearTrips.map(trip => (
                          <div 
                            key={trip.id} 
                            onClick={() => {
                              handleSwitchTrip(trip.id);
                              setActiveTab('dashboard'); // 클릭 시 대시보드로 복귀
                            }} 
                            className={`group relative flex flex-col p-4 rounded-3xl border-2 transition-all duration-500 cursor-pointer hover:shadow-2xl hover:-translate-y-1 ${
                              activeTripId === trip.id 
                                ? 'border-indigo-500 bg-indigo-50/20 ring-4 ring-indigo-500/10' 
                                : `${cardBg} border-transparent hover:border-indigo-200`
                            }`}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">🛫</div>
                              <div className="text-right">
                                <span className="text-[9px] font-black text-slate-400 block mb-0.5">FINISH DATE</span>
                                <span className="text-[10px] font-bold text-slate-500">{new Date(trip.finishDate).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <h3 className={`text-sm font-black mb-1.5 ${textMain} line-clamp-1`}>{S(trip.name)}</h3>
                            <div className="flex flex-wrap gap-1.5 mt-auto">
                              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded text-[9px] font-bold"># {year}년 추억</span>
                              {activeTripId === trip.id && <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[9px] font-black animate-pulse">현재 선택됨</span>}
                            </div>
                            <div className={`absolute inset-0 bg-indigo-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
          <div className={`absolute inset-0 flex flex-col p-2 sm:p-4 pt-3 pb-4 overflow-hidden transition-opacity duration-300 ${activeTab === 'map' ? 'visible opacity-100 z-10' : 'invisible opacity-0 -z-10 pointer-events-none'}`}>
            <div className="flex flex-col gap-2 mb-2 flex-shrink-0 relative z-20">
              
              {/* 필터 및 색상 동기화 패널 */}
<div className="flex flex-col space-y-2 pb-1">
                {/* [Day 필터] */}
                <div className="flex space-x-1.5 overflow-x-auto custom-scrollbar pb-1 scroll-smooth">
                  <button onClick={() => toggleMapDay('all')} className={`px-4 py-1.5 rounded-full text-[10px] font-black whitespace-nowrap transition-all duration-300 is-tag ${mapActiveDays.includes('all') ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>전체 Day</button>                   {tripDays.map(d => {
                     const color = getDayColor(d);
                     const isActive = mapActiveDays.includes(d);
return (
                       <button key={d} onClick={() => toggleMapDay(d)} style={{ backgroundColor: isActive ? color : (isDarkMode ? '#1e293b' : 'white'), color: isActive ? 'white' : color, borderColor: color }} className={`px-3 py-1.5 rounded-full text-[10px] font-bold border whitespace-nowrap transition-all duration-300 ${isActive ? 'shadow-md scale-105' : 'hover:opacity-80'}`}>Day {d}</button>
                     )
                   })}
                   
                   {/* [추가됨] 미지정 핀 필터 버튼 복구 및 가로 정렬 유지 */}
                   <button onClick={() => toggleMapDay('unlinked')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap border transition-all duration-300 ${mapActiveDays.includes('unlinked') ? 'bg-slate-500 text-white border-slate-500 shadow-md' : (isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50')}`}>
                     미지정 핀
                   </button>
                </div>
                {/* [테마 필터 - 신설] */}
                <div className="flex space-x-1.5 overflow-x-auto custom-scrollbar pb-1 scroll-smooth">
                   {['all', '교통편', '식당', '디저트', '관광지', '쇼핑', '숙소', '기타'].map(t => (
                     <button key={t} onClick={() => {
                        setMyPinsThemeFilter(prev => {
                           let arr = Array.isArray(prev) ? prev : [prev];
                           if (t === 'all') return ['all'];
                           let newThemes = arr.filter(x => x !== 'all');
                           if (newThemes.includes(t)) newThemes = newThemes.filter(x => x !== t);
                           else newThemes.push(t);
                           return newThemes.length === 0 ? ['all'] : newThemes;
                        });
                     }} className={`px-3 py-1 rounded-full text-[9px] font-bold whitespace-nowrap border transition-all ${myPinsThemeFilter.includes(t) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : (isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50')}`}>
                       {t === 'all' ? '테마 전체' : t}
                     </button>
                   ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="relative w-full sm:w-64">
                   <div className={`flex items-center shadow-sm rounded-lg overflow-hidden border transition-colors duration-300 ${isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-slate-300 bg-white'}`}>
                      <span className={`ml-3 text-sm transition-colors duration-300 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>🔍</span>
                      <input 
                        type="text" 
                        value={S(markerSearchQuery)}
                        onChange={e => setMarkerSearchQuery(e.target.value)}
                        placeholder="내 지도 핀 검색..."
                        className={`w-full pl-2 pr-8 py-2 bg-transparent text-[11px] font-bold focus:outline-none transition-colors duration-300 ${isDarkMode ? 'text-white placeholder-slate-400' : 'text-slate-800'}`}
                      />
                      {markerSearchQuery && (
                        <button onClick={() => setMarkerSearchQuery("")} className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors">✕</button>
                      )}
                   </div>
                   {markerSearchQuery && filteredMarkers.length > 0 && (
                     <div className={`absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-xl overflow-hidden max-h-40 overflow-y-auto custom-scrollbar animate-in fade-in duration-200 transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'}`}>
                        {filteredMarkers.map(marker => (
                          <button 
                            key={marker.id}
                            onClick={() => handleMarkerSearchSelect(marker)}
                            className={`w-full text-left px-3 py-2.5 text-[11px] font-bold border-b last:border-0 flex items-center transition-colors duration-300 ${isDarkMode ? 'text-slate-200 border-slate-700 hover:bg-slate-700' : 'text-slate-700 border-slate-100 hover:bg-indigo-50'}`}
                          >
                            <div className={`w-2 h-2 rounded-full mr-2.5 transition-transform duration-300 ${planTimeline.some(p=>S(p.place)===S(marker.name))?'bg-orange-500':'bg-blue-500'} group-hover:scale-125`}></div>
                            <span className="truncate flex-1">{S(marker.name)}</span>
                            <span className={`text-[9px] ml-2 transition-colors duration-300 ${textMuted}`}>{S(marker.city)}</span>
                          </button>
                        ))}
                     </div>
                   )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                   <label className={`flex items-center space-x-1 border px-2 py-1.5 rounded-md text-[10px] font-bold shadow-sm cursor-pointer transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                      <input type="checkbox" checked={showMapRoute} onChange={e => setShowMapRoute(e.target.checked)} className="accent-indigo-600 w-3 h-3 cursor-pointer" />
                      <span>루트표기 🗺️</span>
                   </label>
                   <button onClick={() => setIsMyPinsModalOpen(true)} className={`border px-2 py-1.5 rounded-md text-[10px] font-bold flex items-center space-x-1 transition-all duration-300 shadow-sm active:scale-95 ${isDarkMode ? 'bg-indigo-900/50 border-indigo-500/50 text-indigo-300 hover:bg-indigo-900/70' : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'}`}>
                      <span className="text-xs mr-1">📍</span><span>내 핀 목록</span>
                   </button>
                   <label className={`flex items-center space-x-1 border px-2 py-1.5 rounded-md text-[10px] font-bold shadow-sm cursor-pointer transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                      <input type="checkbox" checked={isPinMode} onChange={e => setIsPinMode(e.target.checked)} className="accent-indigo-600 w-3 h-3 cursor-pointer" />
                      <span>핀 설정 📍</span>
                   </label>
                   <label className={`flex items-center space-x-1 border px-2 py-1.5 rounded-md text-[10px] font-bold shadow-sm cursor-pointer transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                      <input type="checkbox" checked={showMapPhotos} onChange={e => setShowMapPhotos(e.target.checked)} className="accent-indigo-600 w-3 h-3 cursor-pointer" />
                      <span>사진</span>
                   </label>
                   <label className={`flex items-center space-x-1 border px-2 py-1.5 rounded-md text-[10px] font-bold shadow-sm cursor-pointer transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                      <input type="checkbox" checked={showMapLabels} onChange={e => setShowMapLabels(e.target.checked)} className="accent-indigo-600 w-3 h-3 cursor-pointer" />
                      <span>이름</span>
                   </label>
                   <button onClick={handleFindMyLocation} className={`border px-2 py-1.5 rounded-md text-[10px] font-bold flex items-center space-x-1 transition-all duration-300 shadow-sm active:scale-95 ${isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                      <span className="text-xs mr-1">🧭</span><span>현재 위치</span>
                   </button>
                   <button onClick={() => { setNavOrigin(null); setNavDest(null); setIsNavModalOpen(true); }} className={`border px-2 py-1.5 rounded-md text-[10px] font-bold flex items-center space-x-1 transition-all duration-300 shadow-sm active:scale-95 ${isDarkMode ? 'bg-green-900/50 border-green-600 text-green-300 hover:bg-green-900/70' : 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'}`}>
                      <span className="text-xs mr-1">🗺️</span><span>네비게이션</span>
                   </button>
                </div>
              </div>
            </div>
            
            <div className={`flex-1 relative overflow-hidden min-h-0 flex flex-col items-center justify-center p-0.5 rounded-3xl transition-colors duration-300 ${cardBg}`}>
              <div className="w-full h-full rounded-3xl overflow-hidden relative">
                {!isLeafletLoaded && (
                  <div className={`absolute inset-0 z-0 flex flex-col items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-400'}`}>
                    <span className="text-xl animate-spin inline-block mb-2">🔄</span>
                    <span className="text-[10px] font-bold">지도 로딩 중...</span>
                  </div>
                )}
                <div id="leaflet-map" ref={mapContainerRef} className="absolute inset-0 z-10 bg-transparent w-full h-full cursor-crosshair outline-none"></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 폰트 및 요소 개별 스케일 동적 적용 CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        
        :root {
          --font-scale: ${fontScale};
          /* [NEW] 글자 색상 동적 변수 할당 */
          --main-text-color: ${(() => {
            if (appTextColor === 'original') return isDarkMode ? '#f1f5f9' : '#0f172a'; // 초기 테마는 기본 시스템 색상 따름
            if (appTextColor === 'high-contrast') return isDarkMode ? '#ffffff' : '#000000'; // 고대비: 완전 흰색/검정
            if (appTextColor === 'monochrome') return isDarkMode ? '#e2e8f0' : '#1e293b'; // 단색: 부드러운 흰색/검정
            return isDarkMode ? '#f1f5f9' : '#0f172a'; // 기본값
          })()};
        }

        /* [수정 완료] 전역 글자색 로직 최적화 및 가독성 보호 */
        body { color: var(--main-text-color); }
        
        /* 유색 배경의 태그/버튼들은 전역 글자색 변경에서 제외하여 가독성 확보 */
        .is-tag, .is-tag *, .text-white, .text-white *, 
        .bg-indigo-600 *, .bg-indigo-500 *, .bg-rose-500 *, .bg-orange-500 *, .bg-emerald-500 *, .bg-pink-500 * { 
          color: white !important; 
          text-shadow: 0 1px 1px rgba(0,0,0,0.1);
        }

        ${appTextColor !== 'original' && appTextColor !== 'default' ? `
          /* 일반 텍스트들만 선택된 글자색으로 변경 */
          p, span:not(.is-tag), div:not(.is-tag), h1, h2, h3, h4, h5, h6, label {
            color: var(--main-text-color) !important;
          }
        ` : ''}

        /* 아이콘 및 특수 컴포넌트 보호 */
        .no-recolor, .no-recolor *, .leaflet-container *, .leaflet-popup-content * { color: inherit !important; }

        /* Tailwind 텍스트 클래스들 동적 오버라이드 (폰트 스케일 적용) */
        .text-\\[6px\\] { font-size: calc(6px * var(--font-scale)) !important; }
        .text-\\[7px\\] { font-size: calc(7px * var(--font-scale)) !important; }
        .text-\\[8px\\] { font-size: calc(8px * var(--font-scale)) !important; }
        .text-\\[9px\\] { font-size: calc(9px * var(--font-scale)) !important; }
        .text-\\[10px\\] { font-size: calc(10px * var(--font-scale)) !important; }
        .text-\\[11px\\] { font-size: calc(11px * var(--font-scale)) !important; }
        .text-xs { font-size: calc(0.75rem * var(--font-scale)) !important; line-height: calc(1rem * var(--font-scale)) !important; }
        .text-sm { font-size: calc(0.875rem * var(--font-scale)) !important; line-height: calc(1.25rem * var(--font-scale)) !important; }
        .text-base { font-size: calc(1rem * var(--font-scale)) !important; line-height: calc(1.5rem * var(--font-scale)) !important; }
        .text-lg { font-size: calc(1.125rem * var(--font-scale)) !important; line-height: calc(1.75rem * var(--font-scale)) !important; }
        .text-xl { font-size: calc(1.25rem * var(--font-scale)) !important; line-height: calc(1.75rem * var(--font-scale)) !important; }
        .text-2xl { font-size: calc(1.5rem * var(--font-scale)) !important; line-height: calc(2rem * var(--font-scale)) !important; }
        
        body {
          font-family: inherit;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          overflow: hidden;
          scrollbar-width: none;
        }
        body::-webkit-scrollbar { display: none; }
        html { overflow: hidden; scrollbar-width: none; }
        html::-webkit-scrollbar { display: none; }

        /* 모든 스크롤바: 오버레이 방식으로 레이아웃 공간 미차지 */
        * { scrollbar-width: thin; scrollbar-color: transparent transparent; }
        *::-webkit-scrollbar { width: 4px; height: 4px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background: transparent; border-radius: 10px; transition: background 0.3s; }
        *:hover::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.5); }
        .dark *:hover::-webkit-scrollbar-thumb { background: rgba(71,85,105,0.6); }

        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.5); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(71,85,105,0.6); }
        input[type="text"], input[type="password"], input[type="date"], select { font-variant-numeric: tabular-nums; }
        .leaflet-container { z-index: 10; font-family: inherit; background: transparent; border-radius: 1rem; transition: filter 0.3s; }
        .dark .leaflet-container { filter: brightness(0.8) contrast(1.2); }
        .leaflet-popup-content-wrapper { border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); border: 1px solid #e2e8f0; transition: all 0.3s; }
        .dark .leaflet-popup-content-wrapper { background: #1e293b; border-color: #334155; color: white; }
        .leaflet-popup-content { margin: 12px; font-family: inherit; line-height: 1.4; }
        .leaflet-popup-tip { background: #fff; border-top: 1px solid #e2e8f0; border-left: 1px solid #e2e8f0; transition: all 0.3s; }
        .dark .leaflet-popup-tip { background: #1e293b; border-top-color: #334155; border-left-color: #334155; }

        /* [NEW] 배달의민족 스타일 통통 튀는 모션 및 그림자 애니메이션 */
        @keyframes baemin-bounce {
          0% { transform: translateY(0px) scaleY(0.95); }
          100% { transform: translateY(-12px) scaleY(1.05); }
        }
        @keyframes baemin-shadow {
          0% { transform: translateX(-50%) scale(1); opacity: 0.4; }
          100% { transform: translateX(-50%) scale(0.5); opacity: 0.1; }
        }
      `}} />
    </div>
  );
};

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Global Error Caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen w-full bg-slate-50 p-5 text-center font-sans">
          <div className="text-5xl mb-4">🚨</div>
          <h1 className="text-xl font-black text-slate-900 mb-2">데이터 복구 필요</h1>
          <p className="text-xs text-slate-500 mb-6 max-w-sm leading-relaxed">
            과거에 저장된 데이터 형식이 손상되어 화면을 띄울 수 없습니다.<br/>
            아래 <strong>초기화 버튼</strong>을 누르면 즉시 고쳐집니다.
          </p>
          <button 
            onClick={() => { 
              localStorage.clear(); 
              window.location.reload(); 
            }} 
            className="bg-indigo-600 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 active:scale-95 transition-all duration-300"
          >
            데이터 강제 초기화 및 복구하기
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <GlobalErrorBoundary>
      <MainApp />
    </GlobalErrorBoundary>
  );
}