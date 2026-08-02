import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App as CapacitorApp } from '@capacitor/app';
import { X, Menu, LayoutDashboard, Calendar, Map, Wallet, Plane, Backpack, ShoppingBag, Mail, Settings, ClipboardList, CloudSun, MapPin, Navigation, LogOut, Home, Compass, ListChecks, PenLine, Globe, Clock, Tag, Search, Camera, Pencil, FolderOpen, Trash2, Handshake, Undo2, Redo2, RefreshCw } from 'lucide-react';
import { SUPABASE_URL, SUPABASE_ANON_KEY, CURRENCIES, REGIONS_BY_COUNTRY, COUNTRY_FLAG, KAKAO_CAT_COLORS, CITY_NAME_TO_EN } from './utils/constants';
import { toAuthEmail, S, getWeatherInfo, getFlagForCity, openExternalUrl, openGoogleMapsNav, compressImage, compressAndStoreImage } from './utils/helpers';
import SelectOrInput from './components/SelectOrInput';
import WeatherModal from './components/WeatherModal';
import PackingDashboardModal from './components/PackingDashboardModal';
import PackingEditModal from './components/PackingEditModal';
import ShoppingDashboardModal from './components/ShoppingDashboardModal';
import ShoppingEditModal from './components/ShoppingEditModal';
import ExpenseModal from './components/ExpenseModal';
import MyPinsModal from './components/MyPinsModal';
import NavModal from './components/NavModal';
import AddPlaceModal from './components/AddPlaceModal';
import TransportModal from './components/TransportModal';
import EditPlanModal from './components/EditPlanModal';
import ArchiveTab from './components/ArchiveTab';
import SettingsModal from './components/SettingsModal';
import TripModal from './components/TripModal';
import MobileMenu from './components/MobileMenu';
import PlanDetailModal from './components/PlanDetailModal';
import PinDetailModal from './components/PinDetailModal';
import DeleteTripConfirmModal from './components/DeleteTripConfirmModal';
import PhotoViewerModal from './components/PhotoViewerModal';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import DashboardTab from './components/DashboardTab';
import PlanFormPanel from './components/PlanFormPanel';
import PlanTimelinePanel from './components/PlanTimelinePanel';
import MapTab from './components/MapTab';
import LoginScreen from './components/LoginScreen';
import DynamicStyles from './components/DynamicStyles';
import { useExchangeRates } from './hooks/useExchangeRates';
import { useWeather } from './hooks/useWeather';
import { useCurrencyConverter } from './hooks/useCurrencyConverter';
import { useMapSdkLoader } from './hooks/useMapSdkLoader';
import { useUndoRedo } from './hooks/useUndoRedo';
import { useAppSettings } from './hooks/useAppSettings';
import { usePhotoViewer } from './hooks/usePhotoViewer';
import { usePanelResize } from './hooks/usePanelResize';

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

  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const {
    appTheme, handleThemeChange,
    elementScale, handleElementScaleChange,
    fontScale, handleFontScaleChange,
    appFont, setAppFont,
    appTextColor, setAppTextColor,
    myLocationIcon, setMyLocationIcon,
  } = useAppSettings();
  const [isMigratingPhotos, setIsMigratingPhotos] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tripModal, setTripModal] = useState({ isOpen: false, mode: 'add', name: '' });
  const [tripToDelete, setTripToDelete] = useState(null);

  const { rates, loadingRates, errorRates, ratesUpdatedAt, fetchRealTimeRates } = useExchangeRates(showToast);
  const { amount, focusedCurrency, setFocusedCurrency, handleInputChange, getInputValue, getPlaceholder } = useCurrencyConverter(rates, loadingRates);

  const [planTimeline, setPlanTimeline] = useState([]);
  const [currentRestaurants, setCurrentRestaurants] = useState([]);
  const currentRestaurantsRef = useRef(currentRestaurants); 
  const [displayCityName, setDisplayCityName] = useState("선택된 지역 없음");
  const [travelStartDate, setTravelStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [maxDay, setMaxDay] = useState(4);
  const [dashboardDay, setDashboardDay] = useState(1);
  

  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const [globalPlanCountry, setGlobalPlanCountry] = useState("");
  const [globalPlanRegion, setGlobalPlanRegion] = useState("");
  const [globalManualCountry, setGlobalManualCountry] = useState("");
  const [globalManualRegion, setGlobalManualRegion] = useState("");

  const {
    weather, forecast, hourlyWeatherCache, expandedWeatherDay, setExpandedWeatherDay,
    isLoadingHourly, fetchWeatherData, fetchRegionHourlyWeather, handleWeatherDayClick,
  } = useWeather(planTimeline, displayCityName, globalManualRegion, globalPlanRegion);

  const [newDay, setNewDay] = useState(1);
  const [editingPlanId, setEditingPlanId] = useState(null); // null이면 새 등록, id 있으면 수정 모드
  const [editingPlanSnapshot, setEditingPlanSnapshot] = useState(null); // 수정 시작 시 원본 스냅샷
  const [newTime, setNewTime] = useState("");
  const [newPlace, setNewPlace] = useState("");
  const [newLocalName, setNewLocalName] = useState("");
  const [newFeatures, setNewFeatures] = useState("");
  const [newPhoto, setNewPhoto] = useState("");
  const [newPlanPhotos, setNewPlanPhotos] = useState([]); // 스케줄 다중 사진
  const [newIsAccommodation, setNewIsAccommodation] = useState(false);
  const [newAccommodationDays, setNewAccommodationDays] = useState([]);
  const [planCountry, setPlanCountry] = useState("");
  const [planRegion, setPlanRegion] = useState("");
  const [manualCountry, setManualCountry] = useState("");
  const [manualRegion, setManualRegion] = useState("");
  const planFileInputRef = useRef(null);

  const [editingPlan, setEditingPlan] = useState(null);
  const editFileInputRef = useRef(null);
  const weatherDragRef = useRef({ down: false, startX: 0, scrollLeft: 0, didDrag: false }); // 헤더 날씨 칩 마우스 드래그 스크롤

  const { isLeafletLoaded, isKakaoMapLoaded } = useMapSdkLoader();
  const [isKakaoMap, setIsKakaoMap] = useState(false);
  const mapContainerRef = useRef(null);
  const kakaoMapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const kakaoMapInstanceRef = useRef(null);
  const kakaoMarkersRef = useRef([]);
  const kakaoSearchMarkersRef = useRef([]); // 장소 검색 결과 임시 마커
  const kakaoMyLocOverlayRef = useRef(null); // 카카오맵 현재위치 오버레이
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
  const [kakaoCategory, setKakaoCategory] = useState([]); // 복수 선택 배열
  const kakaoCategoryRef = useRef([]);
  const [kakaoCategoryResults, setKakaoCategoryResults] = useState([]); // 카테고리 검색 결과 장소 목록
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
  const [navDayFilter, setNavDayFilter] = useState('all'); // 'all' | 'unlinked' | 1|2|3...
  const [clickedLocation, setClickedLocation] = useState(null);
  const [newManualPlaceName, setNewManualPlaceName] = useState("");
  const [newManualLocalName, setNewManualLocalName] = useState("");
  const [newManualFeature, setNewManualFeature] = useState("");
  const [newManualPhoto, setNewManualPhoto] = useState("");
  const [newManualTime, setNewManualTime] = useState(""); 
  const [newManualIsAccommodation, setNewManualIsAccommodation] = useState(false);
  const [newManualAccommodationDays, setNewManualAccommodationDays] = useState([]);
  const [newManualIsLandmark, setNewManualIsLandmark] = useState(false);
  const [pinLinkDay, setPinLinkDay] = useState("");
  const [pinLinkPlanId, setPinLinkPlanId] = useState("");
  const manualFileInputRef = useRef(null);

  const {
    viewPhoto, setViewPhoto, viewPhotoAnim, setViewPhotoAnim,
    viewPhotoDragRef, zoomImgRef, zoomCardRef, zoomStateRef,
    applyZoomTransform, resetZoom, openPhotoViewer, goPhotoNext, goPhotoPrev,
  } = usePhotoViewer();
  const [newManualPhotos, setNewManualPhotos] = useState([]); // 핀 등록 다중 사진
  const mapInitFlyDoneRef = useRef(false); // 지도 최초 자동 이동 완료 여부
  const pendingMapFlyRef = useRef(null); // 핀 이동 버튼 클릭 시 탭 전환 후 flyTo 대기 좌표
  
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
  const [confirmModal, setConfirmModal] = useState(null); // {msg, onOk, onCancel?, okLabel?, cancelLabel?, extraBtn?}
  const showConfirm = (msg, onOk, onCancel, opts) => setConfirmModal({ msg, onOk, onCancel: onCancel || null, ...(opts || {}) });
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseAmtModalPlan, setExpenseAmtModalPlan] = useState(null); // 금액 수정 모달 대상 plan
  const [expenseAmtValue, setExpenseAmtValue] = useState(""); // 금액 수정 모달 입력값
  const [expenseAmtIsKrw, setExpenseAmtIsKrw] = useState(false); // 모달 내 화폐 토글
  const [expenseCurrencyToggle, setExpenseCurrencyToggle] = useState({}); // {planId: 'local'|'krw'}
  const [basicExpenses, setBasicExpenses] = useState([]); // 기본지출 항목 [{id, name, amtKrw, category}]
  const totalExpenseKrw = useMemo(() => {
    const planSum = (Array.isArray(planTimeline) ? planTimeline : []).reduce((s, p) => s + (Number(p?.expenseKrw) || 0), 0);
    const basicSum = (Array.isArray(basicExpenses) ? basicExpenses : []).reduce((s, b) => s + (Number(b?.amtKrw) || 0), 0);
    return planSum + basicSum;
  }, [planTimeline, basicExpenses]);
  const [isBasicExpAddOpen, setIsBasicExpAddOpen] = useState(false); // 기본지출 추가 모달
  const [basicExpAddName, setBasicExpAddName] = useState('');
  const [basicExpAddAmt, setBasicExpAddAmt] = useState('');
  const [basicExpAddCat, setBasicExpAddCat] = useState('기타');
  const [basicExpAddIsKrw, setBasicExpAddIsKrw] = useState(false);
  const [basicExpAddDay, setBasicExpAddDay] = useState(1);
  const [isTransportModalOpen, setIsTransportModalOpen] = useState(false);
  const [transType, setTransType] = useState('flight'); 
  const [transDir, setTransDir] = useState('outbound'); 
  
  const initialTransState = { airline: '', flightNum: '', seatNum: '', dep: '', arr: '', depTime: '', arrTime: '', day: 1 };
  const [modalTransData, setModalTransData] = useState({
    flight: { outbound: { ...initialTransState }, inbound: { ...initialTransState } },
    train: { outbound: { ...initialTransState }, inbound: { ...initialTransState } },
    bus: { outbound: { ...initialTransState }, inbound: { ...initialTransState } }
  });
  const initialRentalState = { company: '', carType: '', depPlace: '', arrPlace: '', depTime: '', arrTime: '', days: [], photos: [] };
  const [rentalCarData, setRentalCarData] = useState({ ...initialRentalState });
  const rentalFileInputRef = useRef(null);

  const { panelRatio, handleDragStart } = usePanelResize(50);
  const planAddFormRef = useRef(null);
  const manualRegionSaveTimer = useRef(null);
  const dbVersionRef = useRef(1); // 현재 DB version 추적 (Optimistic Locking용)

const [activeMobileCard, setActiveMobileCard] = useState(null);
  const [previewTransportDay, setPreviewTransportDay] = useState(null); // 대표편 카드 자리에 임시로 미리보기 중인 배지 날짜
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
  const [archiveFilterLocation, setArchiveFilterLocation] = useState('전체');
  const isDarkMode = appTheme === 'dark';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

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
        compressAndStoreImage(supabaseClient, appUserId, activeTripId, imageFile, (compressedBase64) => {
          const ctx = activeContextRef.current;
          if (ctx.editingPlan) {
            setEditingPlan(prev => {
              const imgs = Array.isArray(prev.photos) ? prev.photos : (prev.photo ? [prev.photo] : []);
              if (imgs.length >= 3) { showToast("사진은 최대 3장까지 추가할 수 있어요."); return prev; }
              const newImgs = [...imgs, compressedBase64];
              return {...prev, photos: newImgs, photo: newImgs[0]};
            });
            showToast("📋 복사된 이미지가 붙여넣기 되었습니다!");
          } else if (ctx.isAddPlaceModalOpen) {
            setNewManualPhoto(compressedBase64);
            showToast("📋 핀 사진에 이미지가 붙여넣어 졌습니다!");
          } else if (ctx.activeTab === 'plan') {
            setNewPlanPhotos(prev => {
              if (prev.length >= 3) { showToast("사진은 최대 3장까지 추가할 수 있어요."); return prev; }
              return [...prev, compressedBase64];
            });
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
        if (plan && plan.country && Object.keys(REGIONS_BY_COUNTRY).includes(plan.country)) {
            // timeline에 국가 정보가 있으면 그걸 사용
            setGlobalPlanCountry(plan.country);
            setGlobalManualCountry("");
            try { localStorage.setItem('my_travel_global_country', plan.country); } catch(e){}
        } else {
            // timeline에 없으면 localStorage에 마지막으로 저장된 국가 복원
            try {
              const savedCountry = localStorage.getItem('my_travel_global_country');
              if (savedCountry && Object.keys(REGIONS_BY_COUNTRY).includes(savedCountry)) {
                setGlobalPlanCountry(savedCountry);
                setGlobalManualCountry("");
              }
            } catch(e){}
        }
    }
  }, []);

  // [NEW] 보관함 국내/해외 필터용: country 필드 없는 옛 완료 여행에 국가 정보 1회성 보정
  function resolveTripCountry(cityName, timeline) {
    if (cityName && cityName !== "선택된 지역 없음") {
      for (const [c, rArray] of Object.entries(REGIONS_BY_COUNTRY)) {
        if (rArray.includes(cityName)) return c;
      }
    }
    const tl = Array.isArray(timeline) ? timeline : [];
    const withCountry = tl.find(p => p && p.country && Object.keys(REGIONS_BY_COUNTRY).includes(p.country));
    return withCountry ? withCountry.country : '';
  }

  useEffect(() => {
    if (!isDbLoaded) return;
    const needsBackfill = trips.filter(t => t && t.archived && t.country === undefined);
    if (needsBackfill.length === 0) return;
    let cancelled = false;
    (async () => {
      const newTrips = [...trips];
      let changed = false;
      for (const t of needsBackfill) {
        let cityName = '', timeline = [];
        try {
          const all = JSON.parse(localStorage.getItem('my_travel_states') || '{}');
          if (all[t.id]) { cityName = all[t.id].display_city_name || ''; timeline = all[t.id].plan_timeline || []; }
        } catch(e) {}
        if (!cityName && supabaseClient && appUserId && appUserId !== 'Guest') {
          try {
            const { data } = await supabaseClient.from('travel_state').select('display_city_name, plan_timeline').eq('id', t.id).single();
            if (data) { cityName = data.display_city_name || ''; timeline = data.plan_timeline || []; }
          } catch(e) {}
        }
        const country = resolveTripCountry(cityName, timeline);
        const idx = newTrips.findIndex(x => x.id === t.id);
        if (idx !== -1) { newTrips[idx] = { ...newTrips[idx], country }; changed = true; }
      }
      if (cancelled || !changed) return;
      setTrips(newTrips);
      if (supabaseClient && appUserId && appUserId !== 'Guest') {
        await supabaseClient.from('profiles').update({ trips: newTrips }).eq('app_user_id', appUserId);
      } else if (appUserId === 'Guest') {
        localStorage.setItem('my_travel_guest_trips', JSON.stringify(newTrips));
      }
    })();
    return () => { cancelled = true; };
  }, [trips, appUserId, supabaseClient, isDbLoaded]);

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
    const pinImgs = Array.isArray(pin.imgs) && pin.imgs.length > 0 ? pin.imgs : (pin.img && !S(pin.img).includes("unsplash") ? [S(pin.img)] : []);
    setNewManualPhoto(pinImgs[0] || "");
    setNewManualPhotos(pinImgs);
    setNewManualIsAccommodation(Boolean(pin.isAccommodation));
    setNewManualIsLandmark(Boolean(pin.isLandmark));
    setNewManualTheme(pin.theme ? S(pin.theme) : "기타");

    const safePlanTimeline = Array.isArray(planTimeline) ? planTimeline.filter(Boolean) : [];
    const linkedPlan = safePlanTimeline.find(p => p && S(p.place) === S(pin.name));

    if (linkedPlan) {
      setPinLinkDay(S(linkedPlan.day));
      setPinLinkPlanId(S(linkedPlan.id));
      setNewManualTime(S(linkedPlan.time));
      if (linkedPlan.theme) setNewManualTheme(S(linkedPlan.theme));
      setNewManualIsAccommodation(Boolean(linkedPlan.isAccommodation));
      setNewManualAccommodationDays(Array.isArray(linkedPlan.accommodationDays) ? linkedPlan.accommodationDays : []);
    } else {
      setPinLinkDay("");
      setPinLinkPlanId("");
      setNewManualTime("");
    }

    setIsAddPlaceModalOpen(true);
  }


const saveToDb = useCallback(async (updates, explicitTripId) => {
    console.log("💾 [DB 저장] Supabase로 전송되는 최종 Payload 데이터:", updates);
    const targetId = explicitTripId || activeTripId;

    // plan_timeline 항목에 updatedAt 타임스탬프 추가 (항목별 최신성 판별용)
    const now = Date.now();
    const stamped = { ...updates };
    if (Array.isArray(stamped.plan_timeline)) {
      stamped.plan_timeline = stamped.plan_timeline.map(p =>
        p && !p.updatedAt ? { ...p, updatedAt: now } : p
      );
    }

    // localStorage 즉시 저장
    try {
      const allStr = localStorage.getItem('my_travel_states') || '{}';
      const all = JSON.parse(allStr);
      all[targetId] = { ...(all[targetId] || {}), ...stamped };
      localStorage.setItem('my_travel_states', JSON.stringify(all));
    } catch (e) {
      console.error("Local save error", e);
    }

    if (supabaseClient && appUserId && appUserId !== "Guest") {
      const currentVersion = dbVersionRef.current;
      const nextVersion = currentVersion + 1;
      try {
        // Optimistic Locking: 현재 version과 일치할 때만 업데이트
        const { data: updated, error } = await supabaseClient
          .from('travel_state')
          .update({ ...stamped, version: nextVersion })
          .eq('id', targetId)
          .eq('version', currentVersion)
          .select('version')
          .single();

        if (updated) {
          // 성공: version ref 갱신
          dbVersionRef.current = nextVersion;
        } else if (error && error.code !== 'PGRST116') {
          // PGRST116 = no rows matched (version 충돌) 이외의 진짜 오류
          console.error("DB save error", error);
        } else {
          // version 충돌: DB 최신 상태를 가져와 병합 후 재저장
          console.warn("⚠️ [충돌 감지] version 불일치 — DB 최신 데이터와 병합 후 재저장");
          const { data: latest } = await supabaseClient
            .from('travel_state')
            .select('*')
            .eq('id', targetId)
            .single();
          if (latest) {
            dbVersionRef.current = latest.version || 1;
            const mergedVersion = dbVersionRef.current + 1;

            // plan_timeline 병합: updatedAt 기준으로 최신 항목 우선
            let mergedTimeline = Array.isArray(latest.plan_timeline) ? [...latest.plan_timeline] : [];
            if (Array.isArray(stamped.plan_timeline)) {
              const dbMap = new Map(mergedTimeline.map(p => [S(p.id), p]));
              stamped.plan_timeline.forEach(localP => {
                if (!localP) return;
                const dbP = dbMap.get(S(localP.id));
                if (!dbP) {
                  // 로컬에만 있는 새 항목 → 추가
                  mergedTimeline.push(localP);
                } else {
                  // 양쪽 모두 있으면 updatedAt 더 최신 것 사용
                  const localTime = localP.updatedAt || 0;
                  const dbTime = dbP.updatedAt || 0;
                  if (localTime >= dbTime) dbMap.set(S(localP.id), localP);
                }
              });
              mergedTimeline = Array.from(dbMap.values());
              // 로컬에만 있던 신규 항목 포함
              const dbIds = new Set(mergedTimeline.map(p => S(p.id)));
              stamped.plan_timeline.forEach(p => { if (p && !dbIds.has(S(p.id))) mergedTimeline.push(p); });
            }

            const mergedUpdates = { ...latest, ...stamped, plan_timeline: mergedTimeline, version: mergedVersion };
            const { error: mergeErr } = await supabaseClient
              .from('travel_state')
              .update(mergedUpdates)
              .eq('id', targetId);
            if (!mergeErr) {
              dbVersionRef.current = mergedVersion;
              // 병합된 timeline을 로컬 state에도 반영
              if (Array.isArray(mergedTimeline)) {
                setPlanTimeline(mergedTimeline);
                try {
                  const allStr2 = localStorage.getItem('my_travel_states') || '{}';
                  const all2 = JSON.parse(allStr2);
                  all2[targetId] = { ...(all2[targetId] || {}), plan_timeline: mergedTimeline };
                  localStorage.setItem('my_travel_states', JSON.stringify(all2));
                } catch(e) {}
              }
            }
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
        shared_users: [],
        owner_app_user_id: appUserId
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
          current_restaurants: [], plan_timeline: [], flights: { outbound: null, inbound: null }, packing_list: [],
          owner_app_user_id: appUserId
        };
        const { error: insErr } = await supabaseClient.from('travel_state').insert(insertPayload);
        if (insErr && insErr.code === '42703') {
           await supabaseClient.from('travel_state').insert({ id: newId, display_city_name: "선택된 지역 없음", travel_start_date: new Date().toISOString().split('T')[0], current_restaurants: [], plan_timeline: [], owner_app_user_id: appUserId });
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

    // 전환 전 현재 여행 데이터를 현재 tripId로 명시 저장 (stale closure 방지)
    const prevTripId = activeTripId;
    await saveToDb({ plan_timeline: planTimelineRef.current || planTimeline }, prevTripId);

    mapInitFlyDoneRef.current = false;
    setActiveTripId(S(tripId));
    showToast("여행 일정을 불러왔습니다.");
    await supabaseClient.from('profiles').update({ activeTripId: tripId }).eq('app_user_id', appUserId);
  }

async function confirmDeleteTrip() {
  showConfirm("이 여행 데이터를 내 목록에서 정말 삭제(또는 나가기) 하시겠습니까?", async () => {
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
  }); // showConfirm end
  }

  const { history, historyIndex, handleUndo, handleRedo } = useUndoRedo({
    isDbLoaded, activeTripId,
    planTimeline, currentRestaurants, packingList, flights,
    setPlanTimeline, setCurrentRestaurants, setPackingList, setFlights,
    saveToDb, showToast,
  });

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
      const defaultTripId = `trip_${cleanId}_${Date.now()}`;
      const initialTrips = [{ id: defaultTripId, name: '🛫 나의 첫 번째 여행' }];

      const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email: toAuthEmail(cleanId),
        password: S(pwInput),
      });
      if (authError || !authData?.user) {
        setIdError("계정 생성에 실패했습니다: " + S(authError?.message));
        setIsLoggingIn(false);
        return;
      }

      const { error } = await supabaseClient.rpc('signup_profile', {
        p_app_user_id: cleanId,
        p_password: S(pwInput),
        p_trips: initialTrips,
        p_active_trip_id: defaultTripId,
        p_auth_user_id: authData.user.id,
      });

      if (error) {
        if (error.code === '42883' || error.code === 'PGRST202' || error.code === '42P01') {
          setIdError("서버 함수가 없습니다. Supabase SQL Editor에서 보안 마이그레이션을 실행해주세요!");
        } else if (S(error.message).includes('duplicate_id')) {
          setIdError("이미 사용 중인 아이디입니다.");
        } else {
          setIdError("서버 오류가 발생했습니다.");
        }
        setIsLoggingIn(false);
        return;
      }

      const insertPayload = {
        id: defaultTripId, display_city_name: "선택된 지역 없음", travel_start_date: new Date().toISOString().split('T')[0],
        current_restaurants: [], plan_timeline: [], flights: { outbound: null, inbound: null }, packing_list: [],
        owner_app_user_id: cleanId,
      };
      const { error: insErr } = await supabaseClient.from('travel_state').insert(insertPayload);
      if (insErr && insErr.code === '42703') {
         await supabaseClient.from('travel_state').insert({ id: defaultTripId, display_city_name: "선택된 지역 없음", travel_start_date: new Date().toISOString().split('T')[0], current_restaurants: [], plan_timeline: [], owner_app_user_id: cleanId });
      }

      setTrips(initialTrips);
      setActiveTripId(defaultTripId);
      handleLoginSuccess(cleanId, S(pwInput));
    } catch (e) { setIdError("서버 오류가 발생했습니다."); setIsLoggingIn(false); }
  }

  async function handleLogin(overrideId = null, overridePw = null) {
    setIsLoggingIn(true);
    const currentId = S(overrideId || idInput).trim().toLowerCase();
    const currentPw = S(overridePw || pwInput);

    if (!currentId || !currentPw) { setIdError("아이디와 비밀번호를 입력해주세요."); setIsLoggingIn(false); return; }
    if (!supabaseClient) { setIdError("서버에 연결할 수 없습니다. 키를 확인해주세요."); setIsLoggingIn(false); return; }

    try {
      // 1) 이미 Supabase Auth로 전환된 계정이면 정식 세션으로 바로 로그인
      const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
        email: toAuthEmail(currentId),
        password: currentPw,
      });

      if (!signInError && signInData?.user) {
        const { data: profileRow } = await supabaseClient.from('profiles').select('trips, activeTripId').eq('app_user_id', currentId).single();
        if (profileRow?.trips && Array.isArray(profileRow.trips)) setTrips(profileRow.trips);
        if (profileRow?.activeTripId) setActiveTripId(S(profileRow.activeTripId));
        handleLoginSuccess(currentId, currentPw);
        return;
      }

      // 2) 아직 전환 전인 레거시 계정이면 기존 방식으로 확인 후 조용히 전환
      const { data, error } = await supabaseClient.rpc('verify_login', { p_app_user_id: currentId, p_password: currentPw });
      if (error) {
        if (error.code === '42883' || error.code === 'PGRST202' || error.code === '42P01') {
          setIdError("서버 함수가 없습니다. Supabase SQL Editor에서 보안 마이그레이션을 실행해주세요!");
        } else {
          setIdError("서버 오류가 발생했습니다.");
        }
        setIsLoggingIn(false);
        return;
      }

      const profile = Array.isArray(data) && data.length > 0 ? data[0] : null;
      if (profile) {
        const { data: migrateAuthData, error: migrateAuthError } = await supabaseClient.auth.signUp({
          email: toAuthEmail(currentId),
          password: currentPw,
        });
        if (!migrateAuthError && migrateAuthData?.user) {
          await supabaseClient.rpc('link_auth_account', { p_app_user_id: currentId, p_password: currentPw });
        }

        if (profile.trips && Array.isArray(profile.trips)) setTrips(profile.trips);
        if (profile.activeTripId) setActiveTripId(S(profile.activeTripId));
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
    if (supabaseClient) supabaseClient.auth.signOut();
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

    const { data: exists } = await supabaseClient.rpc('user_exists', { p_app_user_id: targetId });
    if (!exists) { showToast("존재하지 않는 사용자입니다."); return; }

    const currentTrip = trips.find(t => S(t.id) === S(activeTripId));
    const { error } = await supabaseClient.rpc('send_invite', {
      p_target_id: targetId,
      p_trip_id: activeTripId,
      p_trip_name: S(currentTrip?.name) || "여행",
    });
    if (error) { showToast("초대장 전송에 실패했습니다."); return; }
    showToast(`초대장을 보냈습니다.`); setInviteIdInput(""); setIsSettingsOpen(false);
  }

  async function handleAcceptInvite() {
    if (pendingInvite) {
      const targetTripId = S(pendingInvite.trip_id);
      const ownerId = S(pendingInvite.from_id);
      const tripName = S(pendingInvite.trip_name) || "공유된 여행";

      const { error } = await supabaseClient.rpc('accept_trip_invite', { p_trip_id: targetTripId });
      if (error) { showToast("초대 수락에 실패했습니다."); return; }

      const newSharedTrip = { id: targetTripId, name: `🤝 ${tripName} (${ownerId})`, isShared: true, owner: ownerId };
      const updatedTrips = [...trips.filter(t => t.id !== targetTripId), newSharedTrip];
      setTrips(updatedTrips);

      await supabaseClient.from('profiles').update({ trips: updatedTrips, activeTripId: targetTripId }).eq('app_user_id', appUserId);

      setPendingInvite(null);
      setActiveTripId(targetTripId);
      showToast(`공유된 일정에 접속했습니다.`);
    }
  }

  async function handleRejectInvite() {
    await supabaseClient.from('invites').delete().eq('target_id', appUserId);
    setPendingInvite(null);
  }

  async function handleMigratePhotosToStorage() {
    if (!supabaseClient || appUserId === 'Guest') { showToast("로그인 후 이용 가능합니다."); return; }
    if (isMigratingPhotos) return;
    setIsMigratingPhotos(true);

    let migratedCount = 0;

    const uploadIfBase64 = async (tripId, val) => {
      if (typeof val !== 'string' || !val.startsWith('data:image')) return val;
      try {
        const [header, base64Data] = val.split(',');
        const mimeMatch = header.match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const binary = atob(base64Data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: mime });
        const path = `${tripId}/migrated_${Date.now()}_${Math.random().toString(36).slice(2, 10)}.jpg`;
        const { error } = await supabaseClient.storage.from('trip-photos').upload(path, blob, { contentType: 'image/jpeg' });
        if (error) throw error;
        const { data } = supabaseClient.storage.from('trip-photos').getPublicUrl(path);
        migratedCount++;
        return data?.publicUrl || val;
      } catch (e) {
        console.error('사진 마이그레이션 실패', e);
        return val;
      }
    };

    try {
      const myTripIds = (Array.isArray(trips) ? trips : []).map(t => t?.id).filter(Boolean);

      for (const tripId of myTripIds) {
        const { data: row } = await supabaseClient.from('travel_state').select('*').eq('id', tripId).single();
        if (!row) continue;

        let changed = false;

        const newPlanTimeline = await Promise.all((Array.isArray(row.plan_timeline) ? row.plan_timeline : []).map(async (p) => {
          if (!p || typeof p !== 'object') return p;
          const newPhoto = await uploadIfBase64(tripId, p.photo);
          const newPhotos = Array.isArray(p.photos) ? await Promise.all(p.photos.map(ph => uploadIfBase64(tripId, ph))) : p.photos;
          if (newPhoto !== p.photo) changed = true;
          return { ...p, photo: newPhoto, photos: newPhotos };
        }));

        const newRestaurants = await Promise.all((Array.isArray(row.current_restaurants) ? row.current_restaurants : []).map(async (r) => {
          if (!r || typeof r !== 'object') return r;
          const newImg = await uploadIfBase64(tripId, r.img);
          const newImgs = Array.isArray(r.imgs) ? await Promise.all(r.imgs.map(im => uploadIfBase64(tripId, im))) : r.imgs;
          if (newImg !== r.img) changed = true;
          return { ...r, img: newImg, imgs: newImgs };
        }));

        const newShoppingList = await Promise.all((Array.isArray(row.shopping_list) ? row.shopping_list : []).map(async (s) => {
          if (!s || typeof s !== 'object') return s;
          const newImg = await uploadIfBase64(tripId, s.img);
          if (newImg !== s.img) changed = true;
          return { ...s, img: newImg };
        }));

        if (changed) {
          await supabaseClient.from('travel_state').update({
            plan_timeline: newPlanTimeline,
            current_restaurants: newRestaurants,
            shopping_list: newShoppingList,
          }).eq('id', tripId);
        }
      }

      showToast(migratedCount > 0 ? `✅ 사진 ${migratedCount}장을 정리했습니다!` : "정리할 사진이 없습니다.");
      setRefreshTrigger(prev => prev + 1);
    } catch (e) {
      console.error(e);
      showToast("사진 정리 중 오류가 발생했습니다.");
    } finally {
      setIsMigratingPhotos(false);
    }
  }

  function handleOpenGoogleTranslate() {
    const langMap = { '일본': 'ja', '중국': 'zh-CN', '프랑스': 'fr', '이탈리아': 'it', '스페인': 'es', '독일': 'de', '영국': 'en', '태국': 'th', '미국': 'en', '베트남': 'vi', '대만': 'zh-TW', '홍콩': 'zh-TW', '싱가포르': 'en', '인도네시아': 'id', '말레이시아': 'ms', '필리핀': 'tl', '터키': 'tr', '포르투갈': 'pt', '러시아': 'ru', '아랍에미리트': 'ar' };
    const tl = langMap[globalPlanCountry] || langMap[globalManualCountry] || 'en';
    const webUrl = `https://translate.google.com/?sl=ko&tl=${tl}`;
    const deepLink = `googletranslate://?sl=ko&tl=${tl}`;
    const fallback = setTimeout(() => { window.open(webUrl, '_blank'); }, 1500);
    window.location.href = deepLink;
    window.addEventListener('blur', () => clearTimeout(fallback), { once: true });
  }

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
    const finalImgs = newManualPhotos.length > 0 ? newManualPhotos : (newManualPhoto ? [newManualPhoto] : []);
    // country는 실제 국가명(globalPlanCountry), city는 지역명(displayCityName)으로 올바르게 저장
    const pinCountry = globalPlanCountry && globalPlanCountry !== '수동입력' ? globalPlanCountry : (globalManualCountry || S(displayCityName));
    const pinCity = displayCityName && displayCityName !== '선택된 지역 없음' ? displayCityName : S(globalPlanRegion === '수동입력' ? globalManualRegion : globalPlanRegion);
    const newPlace = {
      id: S(placeId), lat: pLat, lng: pLng, country: pinCountry, city: pinCity,
      name: S(newManualPlaceName), localName: S(newManualLocalName), signature: newManualFeature ? S(newManualFeature) : "직접 추가한 장소",
      img: finalImgs[0] || "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=400&q=80",
      imgs: finalImgs,
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
      // 전역 여행 국가/지역을 기본값으로 사용 (핀 데이터보다 globalPlanCountry/globalPlanRegion 우선)
      const targetCountry = globalPlanCountry && globalPlanCountry !== '수동입력' ? globalPlanCountry : (globalManualCountry || S(globalPlanCountry));
      const targetRegion = globalPlanRegion && globalPlanRegion !== '수동입력' ? globalPlanRegion : (globalManualRegion || S(globalPlanRegion));

      const pinFinalImgs = newManualPhotos.length > 0 ? newManualPhotos : (newManualPhoto ? [newManualPhoto] : []);
      if (pinLinkPlanId && pinLinkPlanId !== 'manual') {
        updatedTimeline = updatedTimeline.map(p => p && String(p.id) === String(pinLinkPlanId) ? {
          ...p, day: parseInt(pinLinkDay), time: S(newManualTime), place: S(newManualPlaceName),
          localName: S(newManualLocalName), features: S(newManualFeature), photo: pinFinalImgs[0] || S(newManualPhoto),
          photos: pinFinalImgs,
          isAccommodation: Boolean(newManualIsAccommodation),
          accommodationDays: newManualIsAccommodation ? newManualAccommodationDays : [],
          theme: S(newManualTheme) || "기타",
          country: targetCountry, region: targetRegion
        } : p).sort((a, b) => S(a?.time).localeCompare(S(b?.time)));
      } else {
        const newPlan = {
          id: Date.now().toString() + "_plan",
          day: parseInt(pinLinkDay), time: S(newManualTime), place: S(newManualPlaceName),
          localName: S(newManualLocalName), features: S(newManualFeature), photo: pinFinalImgs[0] || S(newManualPhoto),
          photos: pinFinalImgs,
          country: targetCountry, region: targetRegion,
          isAccommodation: Boolean(newManualIsAccommodation),
          accommodationDays: newManualIsAccommodation ? newManualAccommodationDays : [],
          theme: S(newManualTheme) || "기타"
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
    
    setNewManualPlaceName(""); setNewManualLocalName(""); setNewManualFeature(""); setNewManualPhoto(""); setNewManualPhotos([]); setNewManualTime(""); setNewManualIsAccommodation(false); setNewManualAccommodationDays([]); setNewManualIsLandmark(false); setNewManualTheme("기타");
    setPinLinkDay(""); setPinLinkPlanId(""); 
  }

  function handleManualPhotoUpload(e) {
    const file = e.target.files?.[0]; if (!file) return;
    compressAndStoreImage(supabaseClient, appUserId, activeTripId, file, (compressed) => setNewManualPhoto(S(compressed)));
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

    // ── 카카오맵 모드 ──────────────────────────────────────────────
    if (isKakaoMap && kakaoMapInstanceRef.current && window.kakao) {
      const kakao = window.kakao;
      let kakaoMapFlown = false;

      const renderKakaoLocMarker = (lat, lng, heading) => {
        // 기존 오버레이 제거
        if (kakaoMyLocOverlayRef.current) {
          try { kakaoMyLocOverlayRef.current.setMap(null); } catch(e) {}
          kakaoMyLocOverlayRef.current = null;
        }
        const arrowHtml = (heading !== null && heading !== undefined && !isNaN(heading))
          ? `<div style="position:absolute;top:-14px;left:50%;transform:translateX(-50%) rotate(${heading}deg);transform-origin:50% 36px;transition:transform 0.3s ease-out;z-index:1;">
               <div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:16px solid rgba(79,70,229,0.9);filter:drop-shadow(0 2px 2px rgba(0,0,0,0.3));"></div>
             </div>`
          : '';
        const el = document.createElement('div');
        el.style.cssText = 'position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;';
        el.innerHTML = `
          ${arrowHtml}
          <div style="position:relative;z-index:2;font-size:32px;line-height:1;filter:drop-shadow(0 4px 4px rgba(0,0,0,0.4));animation:baemin-bounce 0.6s infinite alternate cubic-bezier(0.5,0.05,1,0.5);">
            ${myLocationIcon}
          </div>
          <div style="position:absolute;bottom:2px;left:50%;transform:translateX(-50%);width:20px;height:6px;background:rgba(0,0,0,0.25);border-radius:50%;filter:blur(2px);animation:baemin-shadow 0.6s infinite alternate cubic-bezier(0.5,0.05,1,0.5);z-index:1;"></div>
        `;
        const overlay = new kakao.maps.CustomOverlay({
          position: new kakao.maps.LatLng(lat, lng),
          content: el,
          yAnchor: 1.1,
          zIndex: 20,
        });
        overlay.setMap(kakaoMapInstanceRef.current);
        kakaoMyLocOverlayRef.current = overlay;
      };

      const locRef = { lat: null, lng: null, heading: null };
      window.myLocWatchId = navigator.geolocation.watchPosition((pos) => {
        const { latitude, longitude, heading } = pos.coords;
        locRef.lat = latitude; locRef.lng = longitude;
        if (heading !== null && !isNaN(heading)) locRef.heading = heading;
        if (!kakaoMapFlown && kakaoMapInstanceRef.current) {
          kakaoMapInstanceRef.current.setCenter(new kakao.maps.LatLng(latitude, longitude));
          kakaoMapInstanceRef.current.setLevel(3);
          kakaoMapFlown = true;
        }
        renderKakaoLocMarker(locRef.lat, locRef.lng, locRef.heading);
      }, (error) => {
        if (error.code === 1) showToast("위치 권한이 거부되었습니다. 스마트폰/브라우저의 위치 권한을 허용해주세요.");
        else if (error.code === 2) showToast("위치 정보를 사용할 수 없습니다. GPS를 켜주세요.");
        else if (error.code === 3) showToast("위치 요청 시간이 초과되었습니다.");
        else showToast("위치 접근 중 알 수 없는 오류가 발생했습니다.");
      }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });

      if (window.DeviceOrientationEvent) {
        const handleOrientation = (e) => {
          if (locRef.lat === null) return;
          let h;
          if (e.webkitCompassHeading != null) h = e.webkitCompassHeading;
          else if (e.alpha != null) h = (360 - e.alpha) % 360;
          else return;
          locRef.heading = h;
          renderKakaoLocMarker(locRef.lat, locRef.lng, h);
        };
        window.myLocOrientationHandler = handleOrientation;
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
          DeviceOrientationEvent.requestPermission().then(res => {
            if (res === 'granted') window.addEventListener('deviceorientation', handleOrientation);
          }).catch(() => {});
        } else {
          window.addEventListener('deviceorientation', handleOrientation);
        }
      }
      return; // 카카오맵 처리 완료 — Leaflet 로직 실행 안 함
    }
    // ── Leaflet 모드 ────────────────────────────────────────────────

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

    const finalPlanImgs = newPlanPhotos.length > 0 ? newPlanPhotos : (newPhoto ? [newPhoto] : []);

    if (editingPlanId) {
      // 수정 모드: 기존 일정 업데이트
      updatedTimeline = updatedTimeline.map(p =>
        String(p.id) === String(editingPlanId)
          ? { ...p, day: newDay, time: S(newTime), place: S(newPlace), localName: S(newLocalName), features: S(newFeatures), photo: finalPlanImgs[0] || p.photo || "", photos: finalPlanImgs.length > 0 ? finalPlanImgs : (p.photos || []), country: S(finalCountry), region: S(finalRegion), isAccommodation: Boolean(newIsAccommodation), accommodationDays: newIsAccommodation ? newAccommodationDays : [], theme: S(newTheme) }
          : p
      );
      showToast("✅ 일정이 수정되었습니다!");
    } else {
      // 새 등록 모드
      const planData = {
        id: Date.now().toString(), day: newDay, time: S(newTime), place: S(newPlace), localName: S(newLocalName), features: S(newFeatures), photo: finalPlanImgs[0] || "", photos: finalPlanImgs,
        country: S(finalCountry), region: S(finalRegion), isAccommodation: Boolean(newIsAccommodation), accommodationDays: newIsAccommodation ? newAccommodationDays : [], theme: S(newTheme)
      };
      updatedTimeline.push(planData);
      showToast(newIsAccommodation ? "🏠 숙소로 등록되었습니다!" : "스케줄에 등록 성공! ✨");
    }

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
            img: finalPlanImgs[0] || updatedRests[matchedIndex].img,
            imgs: finalPlanImgs.length > 0 ? finalPlanImgs : (updatedRests[matchedIndex].imgs || []),
            isAccommodation: newIsAccommodation ? true : updatedRests[matchedIndex].isAccommodation
        };
        setCurrentRestaurants(updatedRests);
        updates.current_restaurants = updatedRests;
    }

    saveToDb(updates);
    resetPlanForm();
  }
  
  function handlePlanPhotoUpload(e, isEdit = false) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    files.forEach(file => {
      compressAndStoreImage(supabaseClient, appUserId, activeTripId, file, (compressedBase64) => {
        if (isEdit) {
          setEditingPlan(prev => {
            if (!prev) return prev; // 압축 완료 전에 모달이 닫힌 경우
            const imgs = Array.isArray(prev.photos) ? prev.photos : (prev.photo ? [prev.photo] : []);
            if (imgs.length >= 3) { showToast("사진은 최대 3장까지 추가할 수 있어요."); return prev; }
            const newImgs = [...imgs, S(compressedBase64)];
            return {...prev, photos: newImgs, photo: newImgs[0]};
          });
        } else {
          setNewPlanPhotos(prev => {
            if (prev.length >= 3) { showToast("사진은 최대 3장까지 추가할 수 있어요."); return prev; }
            return [...prev, S(compressedBase64)];
          });
        }
      });
    });
    e.target.value = "";
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

        // 렌터카 수정: trans_rental_dep/arr 클릭 시 렌터카 탭으로 데이터 로드
        if (p.id === 'trans_rental_dep' || p.id === 'trans_rental_arr') {
            const safeTimeline = Array.isArray(planTimeline) ? planTimeline : [];
            const rentalDep = safeTimeline.find(item => item.id === 'trans_rental_dep');
            const rentalArr = safeTimeline.find(item => item.id === 'trans_rental_arr');
            const meta = rentalDep?.rentalMeta || rentalArr?.rentalMeta || {};
            // fallback: rentalMeta 없을 경우 features 텍스트에서 파싱
            const depFeat = S(rentalDep?.features);
            const arrFeat = S(rentalArr?.features);
            const parseDepPlace = depFeat.replace(/대여장소:\s*/, '').split('|')[0].trim();
            const parseArrPlace = arrFeat.replace(/반납장소:\s*/, '').split('|')[0].trim();
            const parseCarType = (() => { const m = depFeat.match(/\|\s*([^|]+)\s*$/); return m ? m[1].trim() : ''; })();
            const parseDays = (() => {
              const items = [];
              if (rentalDep) items.push(Number(rentalDep.day) || 1);
              if (rentalArr) items.push(Number(rentalArr.day) || 1);
              return [...new Set(items)].sort((a,b)=>a-b);
            })();
            setRentalCarData({
                company: meta.company || S(rentalDep?.localName) || S(rentalArr?.localName) || '',
                carType: meta.carType || parseCarType || '',
                depPlace: meta.depPlace || parseDepPlace || '',
                arrPlace: meta.arrPlace || parseArrPlace || '',
                depTime: meta.depTime || S(rentalDep?.time).replace('99:99','') || '',
                arrTime: meta.arrTime || S(rentalArr?.time).replace('99:99','') || '',
                days: meta.days && meta.days.length > 0 ? meta.days : parseDays,
                photos: meta.photos && meta.photos.length > 0 ? meta.photos : (rentalDep?.photos || (rentalDep?.photo ? [rentalDep.photo] : [])),
            });
            setTransType('rental');
            setIsTransportModalOpen(true);
            return;
        }

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

    let rawC = S(p.country || "");
    let rawR = S(p.region || "");
    // country가 실제 국가명인지 확인, 아니면 역추적
    let c = rawC;
    let r = rawR;
    if (rawC && !Object.keys(REGIONS_BY_COUNTRY).includes(rawC)) {
      // rawR로 국가 역추적 시도
      let found = "";
      for (const [cn, rs] of Object.entries(REGIONS_BY_COUNTRY)) { if (rs.includes(rawR)) { found = cn; break; } }
      if (!found) {
        // rawC 자체가 지역명인 경우
        for (const [cn, rs] of Object.entries(REGIONS_BY_COUNTRY)) { if (rs.includes(rawC)) { found = cn; r = rawC; break; } }
      }
      if (found) c = found;
    }
    const isStandardCountry = Object.keys(REGIONS_BY_COUNTRY).includes(c) || c === "";
    const isStandardRegion = (isStandardCountry && c && REGIONS_BY_COUNTRY[c]?.includes(r)) || r === "";

    setEditingPlan({ ...p, country: c, region: r, countrySelect: isStandardCountry ? c : "수동입력", manualCountry: isStandardCountry ? "" : c, regionSelect: isStandardRegion ? r : "수동입력", manualRegion: isStandardRegion ? "" : r, isAccommodation: Boolean(p.isAccommodation), localName: S(p.localName || ""), features: S(p.features || ""), time: S(p.time || ""), place: S(p.place || ""), theme: S(p.theme || "기타") });  
  }
  
function handleDeletePlan(id) {
    const safePlanTimeline = Array.isArray(planTimeline) ? planTimeline.filter(Boolean) : [];
    const targetPlan = safePlanTimeline.find(p => p && S(p.id) === S(id));
    const safeRests = Array.isArray(currentRestaurants) ? currentRestaurants.filter(Boolean) : [];
    // 같은 장소명의 핀이 있는지 확인
    const linkedPin = targetPlan ? safeRests.find(r => r && S(r.name).trim() === S(targetPlan.place).trim()) : null;

    const doDeletePlanOnly = () => {
      const updated = safePlanTimeline.filter(p => p && S(p.id) !== S(id));
      setPlanTimeline(updated);
      syncCountryRegionFromCityName(displayCityName, updated);
      saveToDb({ plan_timeline: updated });
      showToast("일정이 삭제되었습니다.");
      // 삭제된 일정이 현재 수정 중인 항목이면 폼 초기화
      if (S(editingPlanId) === S(id)) resetPlanForm();
    };

    const doDeleteBoth = () => {
      const updatedTimeline = safePlanTimeline.filter(p => p && S(p.id) !== S(id));
      const updatedRests = safeRests.filter(r => r && S(r.name).trim() !== S(targetPlan?.place).trim());
      setPlanTimeline(updatedTimeline);
      setCurrentRestaurants(updatedRests);
      syncCountryRegionFromCityName(displayCityName, updatedTimeline);
      saveToDb({ plan_timeline: updatedTimeline, current_restaurants: updatedRests });
      showToast("일정과 지도 핀이 함께 삭제되었습니다.");
      if (S(editingPlanId) === S(id)) resetPlanForm();
    };

    if (linkedPin) {
      showConfirm(
        `"${S(targetPlan?.place)}" 일정을 삭제합니다.\n지도의 핀도 함께 삭제할까요?`,
        doDeleteBoth,
        null,
        {
          okLabel: '핀도 함께 삭제',
          extraBtn: { label: '일정만 삭제 (핀 유지)', onClick: doDeletePlanOnly }
        }
      );
    } else {
      showConfirm("이 일정을 정말 삭제하시겠습니까?", doDeletePlanOnly);
    }
  }
  
  function resetPlanForm() {
    setNewTime(""); setNewPlace(""); setNewLocalName(""); setNewFeatures(""); setNewPhoto(""); setNewPlanPhotos([]); setNewIsAccommodation(false); setNewAccommodationDays([]); setNewTheme("기타"); setPinSelectOpen(false);
    setPlanCountry(globalPlanCountry); setPlanRegion(globalPlanRegion);
    setManualCountry(globalPlanCountry === "수동입력" ? globalManualCountry : ""); setManualRegion(globalPlanRegion === "수동입력" ? globalManualRegion : "");
    setEditingPlanId(null);
    setEditingPlanSnapshot(null);
  }

  function isPlanFormDirty() {
    if (!editingPlanId || !editingPlanSnapshot) return false;
    return (
      S(newTime) !== S(editingPlanSnapshot.time) ||
      S(newPlace) !== S(editingPlanSnapshot.place) ||
      S(newLocalName) !== S(editingPlanSnapshot.localName) ||
      S(newFeatures) !== S(editingPlanSnapshot.features) ||
      S(newTheme) !== S(editingPlanSnapshot.theme) ||
      Boolean(newIsAccommodation) !== Boolean(editingPlanSnapshot.isAccommodation)
    );
  }

  function guardPlanForm(onConfirm) {
    if (editingPlanId) {
      if (isPlanFormDirty()) {
        setConfirmModal({
          msg: "저장하지 않고 나가시겠습니까?\n수정한 내용이 사라집니다.",
          okLabel: "나가기",
          cancelLabel: "계속 수정",
          onOk: () => { resetPlanForm(); onConfirm(); },
          onCancel: () => {},
        });
        return;
      }
      resetPlanForm();
    }
    onConfirm();
  }

  function loadPlanToForm(plan) {
    setNewDay(Number(plan.day) || 1);
    setNewTime(plan.time === '99:99' ? '' : S(plan.time));
    setNewPlace(S(plan.place));
    setNewLocalName(S(plan.localName));
    setNewFeatures(S(plan.features) === "직접 추가한 장소" ? "" : S(plan.features));
    setNewTheme(S(plan.theme) || '기타');
    setNewIsAccommodation(Boolean(plan.isAccommodation));
    const imgs = Array.isArray(plan.photos) && plan.photos.length > 0 ? plan.photos : (plan.photo ? [plan.photo] : []);
    setNewPlanPhotos(imgs);
    // 국가/지역 세팅
    const c = S(plan.country); const r = S(plan.region);
    if (c && Object.keys(REGIONS_BY_COUNTRY).includes(c)) {
      setPlanCountry(c);
      setManualCountry('');
      // 지역이 해당 국가 목록에 있으면 그대로, 없으면 수동입력
      if (r && REGIONS_BY_COUNTRY[c]?.includes(r)) {
        setPlanRegion(r); setManualRegion('');
      } else if (r) {
        setPlanRegion('수동입력'); setManualRegion(r);
      } else {
        setPlanRegion(''); setManualRegion('');
      }
    } else if (c) {
      setPlanCountry('수동입력'); setManualCountry(c); setPlanRegion('수동입력'); setManualRegion(r);
    }
    setPinSelectOpen(false);
    setEditingPlanSnapshot({ time: plan.time === '99:99' ? '' : S(plan.time), place: S(plan.place), localName: S(plan.localName), features: S(plan.features) === "직접 추가한 장소" ? "" : S(plan.features), theme: S(plan.theme) || '기타', isAccommodation: Boolean(plan.isAccommodation) });
    setTimeout(() => planAddFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    setEditingPlanId(plan.id);
    showToast('✏️ 일정 정보를 불러왔습니다!');
  }

  function handleTimeInput(e, setter) {
    let val = S(e.target.value).replace(/\D/g, '');
    if (val.length > 4) val = val.slice(0, 4);
    if (val.length >= 3) { val = val.slice(0, 2) + ':' + val.slice(2); }
    setter(val);
  }

  function changeTab(tabId) {
    guardPlanForm(() => {
      setActiveTab(S(tabId));
      setIsMobileMenuOpen(false);
    });
  }

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const handler = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (showIdSetup) return; // 로그인 화면에서는 아무것도 안 함
      if (activeTab !== 'dashboard') {
        changeTab('dashboard'); // 다른 탭이면 대시보드(초기화면)로
      }
      // 대시보드면 아무것도 안 함 (앱 종료 방지)
    });
    return () => { handler.then(h => h.remove()); };
  }, [activeTab, showIdSetup]);

  function addDay() { const next = maxDay + 1; setMaxDay(next); saveToDb({ max_day: next }); }
  function removeDay() { if (maxDay > 1) { const next = maxDay - 1; setMaxDay(next); saveToDb({ max_day: next }); } }

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
          newFlights[dir] = { ...data, type };

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

    // 렌터카 처리
    if (transType === 'rental') {
      const r = rentalCarData;
      if (r.days.length === 0) { showToast("렌터카 사용 일수를 선택해주세요."); return; }
      if (!r.depPlace && !r.arrPlace) { showToast("대여 장소 또는 반납 장소를 입력해주세요."); return; }
      const sortedDays = [...r.days].sort((a,b) => a-b);
      const firstDay = sortedDays[0];
      const lastDay = sortedDays[sortedDays.length - 1];
      const rentalDepId = 'trans_rental_dep';
      const rentalArrId = 'trans_rental_arr';
      updatedTimeline = updatedTimeline.filter(p => p.id !== rentalDepId && p.id !== rentalArrId);
      const rentalMeta = { depPlace: r.depPlace, depTime: r.depTime, arrPlace: r.arrPlace, arrTime: r.arrTime, days: sortedDays, company: r.company, carType: r.carType || '', photos: r.photos || [] };
      const rentalPhoto = (r.photos && r.photos[0]) || '';
      // 대여 첫날
      updatedTimeline.push({
        id: rentalDepId, day: firstDay, time: r.depTime || '99:99',
        place: `🚗 렌터카 대여`, localName: r.company || '',
        features: `대여장소: ${r.depPlace || ''}${r.carType ? ` | ${r.carType}` : ''}`,
        photo: rentalPhoto, photos: r.photos || [],
        country: S(globalPlanCountry), region: S(globalPlanRegion),
        isAccommodation: false, isTransport: true, theme: '교통편',
        rentalMeta,
      });
      // 반납: 같은 날이어도 항상 별개 아이템으로 생성
      if (r.arrPlace || r.arrTime) {
        updatedTimeline.push({
          id: rentalArrId, day: lastDay, time: r.arrTime || '99:99',
          place: `🏁 렌터카 반납`, localName: r.company || '',
          features: `반납장소: ${r.arrPlace || ''}${r.carType ? ` | ${r.carType}` : ''}`,
          photo: rentalPhoto, photos: r.photos || [],
          country: S(globalPlanCountry), region: S(globalPlanRegion),
          isAccommodation: false, isTransport: true, theme: '교통편',
          rentalMeta,
        });
      }
      hasAnyData = true;
    }

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
    setRentalCarData({ ...initialRentalState });
  }
  
  function handleEditFlight(dir, outboundLeg, inboundLeg) {
    const activeLeg = dir === 'outbound' ? outboundLeg : inboundLeg;
    const currentType = activeLeg?.type || 'flight';
    const legToState = (leg) => leg ? { airline: leg.airline || '', flightNum: leg.flightNum || '', seatNum: leg.seatNum || '', dep: leg.dep || '', arr: leg.arr || '', depTime: leg.depTime || '', arrTime: leg.arrTime || '', day: leg.day || 1 } : { ...initialTransState };
    setTransType(currentType);
    setTransDir(dir);
    setModalTransData(prev => ({
      ...prev,
      [currentType]: {
        outbound: (outboundLeg && outboundLeg.type === currentType) ? legToState(outboundLeg) : { ...initialTransState },
        inbound: (inboundLeg && inboundLeg.type === currentType) ? legToState(inboundLeg) : { ...initialTransState }
      }
    }));
    setIsTransportModalOpen(true);
  }

  function handleDeleteFlight(dir, type) {
    const dirLabel = dir === 'outbound' ? '가는 편' : '오는 편';
    showConfirm(`${dirLabel} 교통편을 삭제하시겠습니까?\n오늘의 계획에 등록된 해당 일정도 함께 삭제됩니다.`, () => {
      const updates = {};
      if (flights[dir]?.type === type) {
        const newFlights = { ...flights, [dir]: null };
        setFlights(newFlights);
        updates.flights = newFlights;
      }
      if (type) {
        const depId = `trans_${type}_${dir}_dep`;
        const arrId = `trans_${type}_${dir}_arr`;
        const updatedTimeline = (Array.isArray(planTimeline) ? planTimeline : []).filter(p => p && p.id !== depId && p.id !== arrId);
        setPlanTimeline(updatedTimeline);
        updates.plan_timeline = updatedTimeline;
      }
      setPreviewTransportDay(null);
      saveToDb(updates);
      showToast(`${dirLabel} 교통편이 삭제되었습니다.`);
    });
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
    showConfirm("이 준비물을 목록에서 정말 삭제하시겠습니까?", () => {
      const newList = packingList.filter(item => item.id !== id);
      setPackingList(newList);
      saveToDb({ packing_list: newList });
    });
  }


  /* ===================== 3. UseEffect 파트 ===================== */

  
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
              const cNameLS = data.display_city_name ? S(data.display_city_name) : "선택된 지역 없음";
              setDisplayCityName(cNameLS);
              syncCountryRegionFromCityName(cNameLS, data.plan_timeline);
              setTravelStartDate(data.travel_start_date ? S(data.travel_start_date) : new Date().toISOString().split('T')[0]);
              if (typeof data.max_day === 'number' && data.max_day >= 1) setMaxDay(data.max_day);
              setFlights(data.flights || { outbound: null, inbound: null });
              setPackingList(Array.isArray(data.packing_list) ? data.packing_list : []);
              setShoppingList(Array.isArray(data.shopping_list) ? data.shopping_list : []);
              setSharedUsers(Array.isArray(data.shared_users) ? data.shared_users : []);
              
              if (Array.isArray(data.current_restaurants)) {
              setCurrentRestaurants(data.current_restaurants.filter(r => r && typeof r === 'object').map(r => ({ id: S(r.id), name: S(r.name), localName: S(r.localName), signature: S(r.signature), img: S(r.img), imgs: Array.isArray(r.imgs) ? r.imgs : (r.img && !S(r.img).includes('unsplash') ? [S(r.img)] : []), country: S(r.country), city: S(r.city), lat: r.lat, lng: r.lng, isAccommodation: Boolean(r.isAccommodation), isLandmark: Boolean(r.isLandmark), theme: S(r.theme) || "기타", rating: r.rating || 0, review: r.review || "" })));              } else { setCurrentRestaurants([]); }
              
              if (Array.isArray(data.plan_timeline)) {
               const fallbackCityName = data.display_city_name ? S(data.display_city_name) : "";
               let fallbackCountry = ""; let fallbackRegion = fallbackCityName;
               if (fallbackCityName) { for (const [cn, rs] of Object.entries(REGIONS_BY_COUNTRY)) { if (rs.includes(fallbackCityName)) { fallbackCountry = cn; break; } } }
               setPlanTimeline(data.plan_timeline.filter(p => p && typeof p === 'object').map(p => ({ id: S(p.id), day: p.day, time: S(p.time), place: S(p.place), localName: S(p.localName), features: S(p.features), photo: S(p.photo), photos: Array.isArray(p.photos) ? p.photos : (p.photo ? [S(p.photo)] : []), ...(p.rentalMeta ? { rentalMeta: p.rentalMeta } : {}), ...(() => { let rc = S(p.country), rr = S(p.region); if (rc && !Object.keys(REGIONS_BY_COUNTRY).includes(rc)) { for (const [cn, rs] of Object.entries(REGIONS_BY_COUNTRY)) { if (rs.includes(rr)) { rc = cn; break; } } if (!Object.keys(REGIONS_BY_COUNTRY).includes(rc)) { for (const [cn, rs] of Object.entries(REGIONS_BY_COUNTRY)) { if (rs.includes(p.country)) { rc = cn; rr = S(p.country); break; } } } if (!Object.keys(REGIONS_BY_COUNTRY).includes(rc) && fallbackCountry) { rc = fallbackCountry; rr = fallbackRegion; } } return { country: rc, region: rr }; })(), isAccommodation: Boolean(p.isAccommodation), accommodationDays: Array.isArray(p.accommodationDays) ? p.accommodationDays : [], isTransport: Boolean(p.isTransport), theme: S(p.theme) || "기타", expenseLocal: p.expenseLocal || "", expenseKrw: p.expenseKrw || "", rating: p.rating || 0, review: p.review || "" })));              } else { setPlanTimeline([]); }

              loaded = true;
            }
          }
        }

        if (!loaded) {
          // localStorage에 해당 여행 key가 없어도 현재 state 보존 (새 여행 전환 타이밍 경쟁 방지)
          setPlanTimeline(prev => (Array.isArray(prev) && prev.length > 0) ? prev : []);
          setCurrentRestaurants(prev => (Array.isArray(prev) && prev.length > 0) ? prev : []);
          setDisplayCityName(prev => (prev && prev !== "선택된 지역 없음") ? prev : "선택된 지역 없음");
          setFlights(prev => prev || { outbound: null, inbound: null });
          setPackingList(prev => (Array.isArray(prev) && prev.length > 0) ? prev : []);
          setTravelStartDate(prev => prev || new Date().toISOString().split('T')[0]);
        }
      } catch (e) {
        console.error("Local data load error", e);
        setPlanTimeline(prev => (Array.isArray(prev) && prev.length > 0) ? prev : []);
        setCurrentRestaurants(prev => (Array.isArray(prev) && prev.length > 0) ? prev : []);
        setDisplayCityName(prev => (prev && prev !== "선택된 지역 없음") ? prev : "선택된 지역 없음");
        setFlights(prev => prev || { outbound: null, inbound: null });
        setPackingList(prev => (Array.isArray(prev) && prev.length > 0) ? prev : []);
      }
    }
  }, [appUserId, activeTripId, syncCountryRegionFromCityName]);

  useEffect(() => {
    movingPinIdRef.current = movingPinId;
  }, [movingPinId]);

  useEffect(() => { kakaoCategoryRef.current = kakaoCategory; }, [kakaoCategory]);

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

    // 도시명 기반 fallback 이동
    const flyToCity = (cityName) => {
      if (!cityName || cityName === '선택된 지역 없음') return false;
      const queryName = CITY_NAME_TO_EN[cityName] || cityName;
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryName)}&limit=1&accept-language=en`)
        .then(r => r.json())
        .then(data => {
          if (data && data[0] && mapInstanceRef.current) {
            mapInstanceRef.current.setView([parseFloat(data[0].lat), parseFloat(data[0].lon)], 12);
          }
        })
        .catch(() => {});
      return true;
    };

    if (safeRests.length === 0) {
      const cityForMap = displayCityName !== '선택된 지역 없음' ? displayCityName : null;
      if (cityForMap) return flyToCity(cityForMap);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          mapInstanceRef.current && mapInstanceRef.current.setView([pos.coords.latitude, pos.coords.longitude], 13);
        }, () => {});
        return true;
      }
      return false;
    }

    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const startD = new Date(travelStartDate); startD.setHours(0,0,0,0);
    const todayD = new Date(now); todayD.setHours(0,0,0,0);
    const diff = Math.round((todayD - startD) / 86400000);

    // 여행 전(diff < 0): D1 첫 번째 핀 또는 D1 지역 도시명으로 이동
    if (diff < 0) {
      const d1Plans = safePlans.filter(p => parseInt(p.day) === 1 && !p.isTransport).sort((a,b) => S(a.time).localeCompare(S(b.time)));
      const d1Pin = d1Plans.map(p => safeRests.find(r => r.lat && r.lng && S(r.name) === S(p.place))).find(Boolean);
      if (d1Pin) { map.setView([d1Pin.lat, d1Pin.lng], 15); return true; }
      // lat/lng 있는 D1 핀 직접 탐색
      const d1DirectPin = safeRests.find(r => r.lat && r.lng && safePlans.some(p => parseInt(p.day) === 1 && S(p.place) === S(r.name)));
      if (d1DirectPin) { map.setView([d1DirectPin.lat, d1DirectPin.lng], 15); return true; }
      // D1 지역명 → 도시명 fallback
      const d1Region = d1Plans.find(p => p.region && p.region !== '선택된 지역 없음')?.region;
      if (d1Region) return flyToCity(d1Region);
      return flyToCity(displayCityName);
    }

    // 여행 중(diff >= 0): 오늘 날짜 기준 현재 시각에 있어야 할 핀
    const todayDay = diff + 1;
    let targetPin = null;
    if (safePlans.some(p => parseInt(p.day) === todayDay)) {
      const todayPlans = safePlans.filter(p => parseInt(p.day) === todayDay && p.time && !p.isTransport).sort((a,b) => S(a.time).localeCompare(S(b.time)));
      const passed = todayPlans.filter(p => { const [h,m] = p.time.split(':').map(Number); return h*60+m <= nowMin; });
      const mp = passed.length > 0 ? passed[passed.length-1] : todayPlans[0];
      if (mp) targetPin = safeRests.find(r => r.lat && r.lng && S(r.name) === S(mp.place));
      // 해당 일정 핀 없으면 오늘 day에 lat/lng 있는 핀 직접 탐색
      if (!targetPin) targetPin = safeRests.find(r => r.lat && r.lng && safePlans.some(p => parseInt(p.day) === todayDay && S(p.place) === S(r.name)));
      // 오늘 지역명 fallback
      if (!targetPin) {
        const todayRegion = todayPlans.find(p => p.region && p.region !== '선택된 지역 없음')?.region;
        if (todayRegion) return flyToCity(todayRegion);
      }
    }
    if (!targetPin) targetPin = safeRests.find(r => r.isAccommodation && r.lat && r.lng);
    if (!targetPin) targetPin = safeRests.find(r => r.lat && r.lng);
    if (targetPin?.lat) { map.setView([targetPin.lat, targetPin.lng], 15); return true; }
    return flyToCity(displayCityName);
  }, [displayCityName, travelStartDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // [NEW] 지도 탭 전환 시 잔상 해결 + 최초 1회 자동 위치 이동 (Leaflet 전용)
  useEffect(() => {
    if (activeTab !== 'map' || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    map.invalidateSize(true);
    const timers = [10, 50, 150, 350, 500].map(t => setTimeout(() => map.invalidateSize(true), t));

    // 카카오맵 모드이면 pendingMapFlyRef는 카카오맵 useEffect에서 처리 — 여기선 스킵
    if (!isKakaoMap) {
      if (pendingMapFlyRef.current) {
        const { lat, lng, id } = pendingMapFlyRef.current;
        pendingMapFlyRef.current = null;
        const flyTimer = setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([lat, lng], 17);
            if (id) window.dispatchEvent(new CustomEvent('onPinClick', { detail: String(id) }));
          }
        }, 600);
        return () => { timers.forEach(clearTimeout); clearTimeout(flyTimer); };
      }

      if (!mapInitFlyDoneRef.current) {
        const done = flyToSmartPosition(map, currentRestaurants, planTimeline);
        if (done) mapInitFlyDoneRef.current = true;
      }
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
    // Math.round로 통일 (flyToSmartPosition과 동일 기준)
    const diff = Math.round(diffTime / (1000 * 60 * 60 * 24));
    const diffDays = diff + 1; // diff=0이면 D1, diff=1이면 D2
    const safeMax = (typeof maxDay === 'number' && maxDay > 0) ? maxDay : 4;
    // [스마트 Day 자동 인식 로직]
    if (diff < 0) {
      setDashboardDay(1); // 여행 전이면 무조건 Day 1
    } else if (diffDays > safeMax) {
      setDashboardDay(safeMax); // 여행 후면 마지막 Day 고정
    } else {
      setDashboardDay(diffDays); // 여행 중이면 해당 일차 표시
    }
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
      // functional update로 최신 state 기반 업데이트 (ref 지연 문제 방지)
      let savedTimeline = null;
      let savedRests = null;
      setPlanTimeline(prev => {
        const updated = (prev || []).map(p =>
          String(p.id) === String(prevId) ? { ...p, rating, review } : p
        );
        savedTimeline = updated;
        return updated;
      });
      setCurrentRestaurants(prev => {
        const prevPlan = (planTimelineRef.current || []).find(p => String(p.id) === String(prevId));
        const updated = (prev || []).map(r =>
          prevPlan && S(r.name).trim() === S(prevPlan.place).trim()
            ? { ...r, rating, review }
            : r
        );
        savedRests = updated;
        return updated;
      });
      // functional update 완료 후 저장 (setTimeout 0으로 state flush 대기)
      setTimeout(() => {
        const tl = savedTimeline || planTimelineRef.current || [];
        const rs = savedRests || currentRestaurantsRef2.current || [];
        saveToDb({ plan_timeline: tl, current_restaurants: rs });
      }, 0);
    }

    prevDiaryPlanIdRef.current = newId;
    setIsDiaryOpen(false);
    setDiaryRating(selectedPlanInfo?.rating || 0);
    setDiaryReview(selectedPlanInfo?.review || "");
  }, [selectedPlanInfo?.id]);

  // 날씨 로드 후 현재 Day를 자동으로 펼침 (앱 재진입 시에도 초기화)
  useEffect(() => {
    if (!Array.isArray(forecast) || forecast.length === 0 || !travelStartDate) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = new Date(travelStartDate); start.setHours(0, 0, 0, 0);
    const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;
    const safeMax = (typeof maxDay === 'number' && maxDay > 0) ? maxDay : 4;
    const autoDay = diff >= 1 && diff <= safeMax ? diff : 1;
    setExpandedWeatherDay(autoDay);
  }, [forecast, travelStartDate, maxDay]);


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
                // 1) 이미 전환된 계정이면 Supabase가 들고 있는 세션으로 바로 복원
                const { data: sessionData } = await client.auth.getSession();
                let profile = null;
                if (sessionData?.session) {
                  const { data: profileRow } = await client.from('profiles').select('trips, activeTripId').eq('app_user_id', S(id)).single();
                  if (profileRow) profile = profileRow;
                }

                // 2) 세션이 없으면(아직 전환 전) 레거시 방식으로 확인 후 조용히 전환
                if (!profile) {
                  const { data } = await client.rpc('verify_login', { p_app_user_id: S(id), p_password: S(pw) });
                  profile = Array.isArray(data) && data.length > 0 ? data[0] : null;
                  if (profile) {
                    const { data: migrateAuthData, error: migrateAuthError } = await client.auth.signUp({
                      email: toAuthEmail(S(id)),
                      password: S(pw),
                    });
                    if (!migrateAuthError && migrateAuthData?.user) {
                      await client.rpc('link_auth_account', { p_app_user_id: S(id), p_password: S(pw) });
                    }
                  }
                }

                if (profile) {
                  setAppUserId(S(id));
                  if (profile.trips && Array.isArray(profile.trips)) setTrips(profile.trips);
                  if (profile.activeTripId) setActiveTripId(S(profile.activeTripId));
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
      const savedGlobalCountry = localStorage.getItem('my_travel_global_country');
      if (savedGlobalCountry && Object.keys(REGIONS_BY_COUNTRY).includes(savedGlobalCountry)) {
        setGlobalPlanCountry(savedGlobalCountry);
      }
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
          // DB에서 읽은 version을 ref에 기록 (Optimistic Locking 기준값)
          if (typeof data.version === 'number') dbVersionRef.current = data.version;
          // max_day 복원
          if (typeof data.max_day === 'number' && data.max_day >= 1) setMaxDay(data.max_day);
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
          setCurrentRestaurants(data.current_restaurants.filter(r => r && typeof r === 'object').map(r => ({ id: S(r.id), name: S(r.name), localName: S(r.localName), signature: S(r.signature), img: S(r.img), imgs: Array.isArray(r.imgs) ? r.imgs : (r.img && !S(r.img).includes('unsplash') ? [S(r.img)] : []), country: S(r.country), city: S(r.city), lat: r.lat, lng: r.lng, isAccommodation: Boolean(r.isAccommodation), isLandmark: Boolean(r.isLandmark), theme: S(r.theme) || "기타", rating: r.rating || 0, review: r.review || "" })));          } else { setCurrentRestaurants([]); }
          
          if (Array.isArray(data.plan_timeline)) {
          const fallbackCityName2 = data.display_city_name ? S(data.display_city_name) : "";
          let fallbackCountry2 = ""; let fallbackRegion2 = fallbackCityName2;
          if (fallbackCityName2) { for (const [cn, rs] of Object.entries(REGIONS_BY_COUNTRY)) { if (rs.includes(fallbackCityName2)) { fallbackCountry2 = cn; break; } } }
          setPlanTimeline(data.plan_timeline.filter(p => p && typeof p === 'object').map(p => ({ id: S(p.id), day: p.day, time: S(p.time), place: S(p.place), localName: S(p.localName), features: S(p.features), photo: S(p.photo), photos: Array.isArray(p.photos) ? p.photos : (p.photo ? [S(p.photo)] : []), ...(p.rentalMeta ? { rentalMeta: p.rentalMeta } : {}), ...(() => { let rc = S(p.country), rr = S(p.region); if (rc && !Object.keys(REGIONS_BY_COUNTRY).includes(rc)) { for (const [cn, rs] of Object.entries(REGIONS_BY_COUNTRY)) { if (rs.includes(rr)) { rc = cn; break; } } if (!Object.keys(REGIONS_BY_COUNTRY).includes(rc)) { for (const [cn, rs] of Object.entries(REGIONS_BY_COUNTRY)) { if (rs.includes(p.country)) { rc = cn; rr = S(p.country); break; } } } if (!Object.keys(REGIONS_BY_COUNTRY).includes(rc) && fallbackCountry2) { rc = fallbackCountry2; rr = fallbackRegion2; } } return { country: rc, region: rr }; })(), isAccommodation: Boolean(p.isAccommodation), accommodationDays: Array.isArray(p.accommodationDays) ? p.accommodationDays : [], isTransport: Boolean(p.isTransport), theme: S(p.theme) || "기타", expenseLocal: p.expenseLocal || "", expenseKrw: p.expenseKrw || "", rating: p.rating || 0, review: p.review || "" })));          } else { setPlanTimeline([]); }
        } else {
           // DB에 row가 없어도 로컬 state가 이미 있으면 유지 (새 여행 insert 타이밍 경쟁 방지)
           setPlanTimeline(prev => (Array.isArray(prev) && prev.length > 0) ? prev : []);
           setCurrentRestaurants(prev => (Array.isArray(prev) && prev.length > 0) ? prev : []);
           setDisplayCityName(prev => (prev && prev !== "선택된 지역 없음") ? prev : "선택된 지역 없음");
           setFlights(prev => prev || { outbound: null, inbound: null });
           setPackingList(prev => (Array.isArray(prev) && prev.length > 0) ? prev : []);
           setTravelStartDate(prev => prev || new Date().toISOString().split('T')[0]);
        }
      } catch(e) { console.error(e); }
    };
    fetchTrip();

    const tripChannel = supabaseClient.channel(`trip_${targetId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'travel_state', filter: `id=eq.${targetId}` }, (payload) => {
        if (payload.new) {
          // Realtime 이벤트의 version이 현재보다 높을 때만 처리 (자기 자신의 리바운드 이벤트 필터링)
          const incomingVersion = typeof payload.new.version === 'number' ? payload.new.version : null;
          if (incomingVersion !== null && incomingVersion <= dbVersionRef.current) {
            console.log(`🔁 [Realtime 무시] 수신 version(${incomingVersion}) ≤ 현재(${dbVersionRef.current}) — 자기 자신의 이벤트`);
            return;
          }
          if (incomingVersion !== null) dbVersionRef.current = incomingVersion;

          if (payload.new.display_city_name) {
             const validRTCity = S(payload.new.display_city_name);
             setDisplayCityName(validRTCity);
             syncCountryRegionFromCityName(validRTCity, payload.new.plan_timeline);
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
            const cleanRests = payload.new.current_restaurants.filter(r => r && typeof r === 'object').map(r => ({ id: S(r.id), name: S(r.name), localName: S(r.localName), signature: S(r.signature), img: S(r.img), imgs: Array.isArray(r.imgs) ? r.imgs : (r.img && !S(r.img).includes('unsplash') ? [S(r.img)] : []), country: S(r.country), city: S(r.city), lat: r.lat, lng: r.lng, isAccommodation: Boolean(r.isAccommodation), isLandmark: Boolean(r.isLandmark), theme: S(r.theme) || '기타', rating: r.rating || 0, review: r.review || "" }));
            // updatedAt 기준 병합: 로컬에만 있는 미저장 항목 보존
            setCurrentRestaurants(prev => {
              const dbIds = new Set(cleanRests.map(r => S(r.id)));
              const localOnly = (Array.isArray(prev) ? prev : []).filter(r => r && !dbIds.has(S(r.id)));
              return [...cleanRests, ...localOnly];
            });
          }
          if (Array.isArray(payload.new.plan_timeline)) {
            const fallbackCityName3 = payload.new.display_city_name ? S(payload.new.display_city_name) : "";
            let fallbackCountry3 = ""; let fallbackRegion3 = fallbackCityName3;
            if (fallbackCityName3) { for (const [cn, rs] of Object.entries(REGIONS_BY_COUNTRY)) { if (rs.includes(fallbackCityName3)) { fallbackCountry3 = cn; break; } } }
            const cleanPlans = payload.new.plan_timeline.filter(p => p && typeof p === 'object').map(p => ({ id: S(p.id), day: p.day, time: S(p.time), place: S(p.place), localName: S(p.localName), features: S(p.features), photo: S(p.photo), photos: Array.isArray(p.photos) ? p.photos : (p.photo ? [S(p.photo)] : []), ...(p.rentalMeta ? { rentalMeta: p.rentalMeta } : {}), ...(() => { let rc = S(p.country), rr = S(p.region); if (rc && !Object.keys(REGIONS_BY_COUNTRY).includes(rc)) { for (const [cn, rs] of Object.entries(REGIONS_BY_COUNTRY)) { if (rs.includes(rr)) { rc = cn; break; } } if (!Object.keys(REGIONS_BY_COUNTRY).includes(rc)) { for (const [cn, rs] of Object.entries(REGIONS_BY_COUNTRY)) { if (rs.includes(p.country)) { rc = cn; rr = S(p.country); break; } } } if (!Object.keys(REGIONS_BY_COUNTRY).includes(rc) && fallbackCountry3) { rc = fallbackCountry3; rr = fallbackRegion3; } } return { country: rc, region: rr }; })(), isAccommodation: Boolean(p.isAccommodation), accommodationDays: Array.isArray(p.accommodationDays) ? p.accommodationDays : [], isTransport: Boolean(p.isTransport), theme: S(p.theme) || "기타", expenseLocal: p.expenseLocal || "", expenseKrw: p.expenseKrw || "", rating: p.rating || 0, review: p.review || "" }));
            // updatedAt 기준 병합: 로컬 항목과 DB 항목 중 더 최신 것 우선, 로컬 미저장 항목 보존
            setPlanTimeline(prev => {
              const localMap = new Map((Array.isArray(prev) ? prev : []).map(p => [S(p.id), p]));
              const merged = cleanPlans.map(dbP => {
                const localP = localMap.get(S(dbP.id));
                if (!localP) return dbP;
                // updatedAt 비교: 로컬이 더 최신이면 로컬 우선
                return (localP.updatedAt || 0) > (dbP.updatedAt || 0) ? localP : dbP;
              });
              // 로컬에만 있는 미저장 신규 항목 추가
              const dbIds = new Set(cleanPlans.map(p => S(p.id)));
              (Array.isArray(prev) ? prev : []).forEach(p => { if (p && !dbIds.has(S(p.id))) merged.push(p); });
              return merged;
            });
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
          setNewManualAccommodationDays([]);
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

  // 수동 override: 'kakao' | 'leaflet' | null(자동)
  const [mapTypeOverride, setMapTypeOverride] = useState(null);

  useEffect(() => {
    // 수동 선택 중이면 자동 전환 안 함
    if (mapTypeOverride === 'kakao') { setIsKakaoMap(true); return; }
    if (mapTypeOverride === 'leaflet') { setIsKakaoMap(false); return; }

    // 자동 판별: 현재 여행 국가가 한국이면 카카오맵, 아니면 구글맵
    const isKorea = globalPlanCountry === '한국' ||
      (Array.isArray(planTimeline) && planTimeline.length > 0 &&
        planTimeline.filter(p => p && p.country).every(p => p.country === '한국')) ||
      (Array.isArray(currentRestaurants) && currentRestaurants.length > 0 &&
        currentRestaurants.filter(r => r && r.country).every(r => r.country === '한국'));
    setIsKakaoMap(isKorea);
  }, [mapTypeOverride, planTimeline, currentRestaurants, globalPlanCountry]);

  // 카카오맵 초기화 + 핀 렌더링
  useEffect(() => {
    if (!isKakaoMap || !isKakaoMapLoaded || activeTab !== 'map') return;
    if (!window.kakao || !window.kakao.maps) return;
    if (!kakaoMapContainerRef.current) return;

    const kakao = window.kakao;

    // 컨테이너가 보이는 상태인지 확인 후 초기화
    const container = kakaoMapContainerRef.current;

    if (!kakaoMapInstanceRef.current) {
      try {
        const center = new kakao.maps.LatLng(37.5665, 126.9780);
        kakaoMapInstanceRef.current = new kakao.maps.Map(container, { center, level: 5 });
        const map = kakaoMapInstanceRef.current;

        // 장소 클릭 인포윈도우 (카테고리 마커와 공유)
        if (!kakaoInfowindowRef.current) {
          kakaoInfowindowRef.current = new kakao.maps.InfoWindow({ zIndex: 10, removable: true });
        }
        const infowindow = kakaoInfowindowRef.current;

        kakao.maps.event.addListener(map, 'click', (mouseEvent) => {
          // 카테고리 마커 클릭 직후면 무시 (인포윈도우 중복 방지)
          if (kakaoBlockMapClickRef.current) return;
          const latlng = mouseEvent.latLng;
          const ps = new kakao.maps.services.Places();
          const geocoder = new kakao.maps.services.Geocoder();

          // 카테고리 필터 활성 상태: 빈 공간 클릭 시 인포윈도우 닫고 종료
          // (카테고리 마커 클릭은 마커 자체 onclick에서 처리)
          if (Array.isArray(kakaoCategoryRef.current) && kakaoCategoryRef.current.length > 0) {
            try { kakaoInfowindowRef.current?.close(); } catch(e) {}
            return;
          }

          // 위치 재지정 모드 (movingPinId 있을 때)
          if (isPinModeRef.current && movingPinIdRef.current) {
            geocoder.coord2Address(latlng.getLng(), latlng.getLat(), (result, gStatus) => {
              const addr = (gStatus === kakao.maps.services.Status.OK && result[0])
                ? (result[0].road_address?.address_name || result[0].address?.address_name || '') : '';
              ps.keywordSearch(addr || '장소', (places, pStatus) => {
                const nearby = (pStatus === kakao.maps.services.Status.OK && places)
                  ? places.find(p => {
                      const dy = (parseFloat(p.y) - latlng.getLat()) * 111000;
                      const dx = (parseFloat(p.x) - latlng.getLng()) * 111000 * Math.cos(latlng.getLat() * Math.PI / 180);
                      return Math.sqrt(dx*dx + dy*dy) <= 30;
                    }) : null;
                const pinId = movingPinIdRef.current;
                const lat = latlng.getLat();
                const lng = latlng.getLng();
                const placeName = nearby ? nearby.place_name : (addr || '선택한 위치');
                const btnId = `kakao-locate-btn-${Date.now()}`;
                const content = `<div style="padding:8px 10px;width:200px;max-width:200px;overflow:hidden;line-height:1.6;box-sizing:border-box;">
                  <div style="font-size:12px;font-weight:900;color:#1e293b;margin-bottom:4px;word-break:keep-all;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">📍 ${placeName}</div>
                  ${nearby && nearby.road_address_name ? `<div style="font-size:10px;color:#555;margin-bottom:6px;">${nearby.road_address_name}</div>` : ''}
                  <button id="${btnId}" style="width:100%;padding:6px 0;background:#4f46e5;color:white;border:none;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">이 위치로 지정 ✅</button>
                </div>`;
                infowindow.setContent(content);
                infowindow.setPosition(latlng);
                infowindow.open(map);
                setTimeout(() => {
                  const btn = document.getElementById(btnId);
                  if (btn) btn.onclick = () => {
                    setPendingMove({ id: pinId, lat, lng });
                    infowindow.close();
                  };
                }, 100);
              }, { location: latlng, radius: 30, sort: kakao.maps.services.SortBy.DISTANCE, size: 5 });
            });
            return;
          }

          // 새 핀 등록 모드 (movingPinId 없이 isPinMode만 켜진 경우)
          if (isPinModeRef.current) {
            geocoder.coord2Address(latlng.getLng(), latlng.getLat(), (result, gStatus) => {
              const addr = (gStatus === kakao.maps.services.Status.OK && result[0])
                ? (result[0].road_address?.address_name || result[0].address?.address_name || '') : '';
              ps.keywordSearch(addr || '장소', (places, pStatus) => {
                const nearby = (pStatus === kakao.maps.services.Status.OK && places)
                  ? places.find(p => {
                      const dy = (parseFloat(p.y) - latlng.getLat()) * 111000;
                      const dx = (parseFloat(p.x) - latlng.getLng()) * 111000 * Math.cos(latlng.getLat() * Math.PI / 180);
                      return Math.sqrt(dx*dx + dy*dy) <= 30;
                    }) : null;
                const placeName = nearby ? nearby.place_name : '';
                const clickLat = latlng.getLat();
                const clickLng = latlng.getLng();
                const btnId = `kakao-newpin-btn-${Date.now()}`;
                const content = `<div style="padding:8px 10px;width:200px;max-width:200px;overflow:hidden;line-height:1.6;box-sizing:border-box;">
                  <div style="font-size:12px;font-weight:900;color:#1e293b;margin-bottom:4px;word-break:keep-all;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">📍 ${placeName || '선택한 위치'}</div>
                  ${nearby && nearby.road_address_name ? `<div style="font-size:10px;color:#555;margin-bottom:6px;">${nearby.road_address_name}</div>` : (addr ? `<div style="font-size:10px;color:#555;margin-bottom:6px;">${addr}</div>` : '')}
                  <button id="${btnId}" style="width:100%;padding:6px 0;background:#4f46e5;color:white;border:none;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">이 위치를 핀으로 지정 📌</button>
                </div>`;
                infowindow.setContent(content);
                infowindow.setPosition(latlng);
                infowindow.open(map);
                setTimeout(() => {
                  const btn = document.getElementById(btnId);
                  if (btn) btn.onclick = () => {
                    infowindow.close();
                    setClickedLocation({ lat: clickLat, lng: clickLng });
                    setNewManualPlaceName(placeName); setNewManualLocalName(""); setNewManualFeature("");
                    setNewManualPhoto(""); setNewManualIsAccommodation(false);
                    setPinLinkDay(""); setPinLinkPlanId(""); setNewManualTime("");
                    setIsAddPlaceModalOpen(true);
                  };
                }, 100);
              }, { location: latlng, radius: 30, sort: kakao.maps.services.SortBy.DISTANCE, size: 5 });
            });
            return;
          }

          // 일반 모드: 반경 30m 이내 등록된 장소가 있을 때만 인포윈도우 표시
          geocoder.coord2Address(latlng.getLng(), latlng.getLat(), (result, gStatus) => {
            const addr = (gStatus === kakao.maps.services.Status.OK && result[0])
              ? (result[0].road_address?.address_name || result[0].address?.address_name || '') : '';
            ps.keywordSearch(addr || '장소', (places, pStatus) => {
              if (pStatus !== kakao.maps.services.Status.OK || !places || places.length === 0) { infowindow.close(); return; }
              const nearby = places.find(p => {
                const dy = (parseFloat(p.y) - latlng.getLat()) * 111000;
                const dx = (parseFloat(p.x) - latlng.getLng()) * 111000 * Math.cos(latlng.getLat() * Math.PI / 180);
                return Math.sqrt(dx*dx + dy*dy) <= 30;
              });
              if (!nearby) { infowindow.close(); return; }
              const content = `<div style="padding:8px 10px;width:200px;max-width:200px;overflow:hidden;line-height:1.6;box-sizing:border-box;">
                <div style="font-size:13px;font-weight:900;color:#1e293b;margin-bottom:2px;word-break:keep-all;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${nearby.place_name}</div>
                ${nearby.category_name ? `<div style="font-size:10px;color:#6366f1;font-weight:700;margin-bottom:2px;">${nearby.category_name.split(' > ').pop()}</div>` : ''}
                ${nearby.road_address_name ? `<div style="font-size:11px;color:#555;word-break:keep-all;">${nearby.road_address_name}</div>` : (nearby.address_name ? `<div style="font-size:11px;color:#555;word-break:keep-all;">${nearby.address_name}</div>` : '')}
                ${nearby.phone ? `<div style="font-size:11px;color:#888;margin-top:2px;word-break:break-all;">📞 ${nearby.phone}</div>` : ''}
              </div>`;
              infowindow.setContent(content);
              infowindow.setPosition(latlng);
              infowindow.open(map);
            }, { location: latlng, radius: 30, sort: kakao.maps.services.SortBy.DISTANCE, size: 5 });
          });
        });

        // 지도 드래그 시 인포윈도우 닫기
        kakao.maps.event.addListener(map, 'dragstart', () => { try { kakaoInfowindowRef.current?.close(); } catch(e) {} });
      } catch(e) { console.error("카카오맵 초기화 실패", e); return; }
    } else {
      // 이미 생성된 인스턴스를 현재 컨테이너에 relayout
      try { kakaoMapInstanceRef.current.relayout(); } catch(e) {}
    }

    const map = kakaoMapInstanceRef.current;

    // 기존 오버레이 제거
    kakaoMarkersRef.current.forEach(m => { try { m.setMap(null); } catch(e) {} });
    kakaoMarkersRef.current = [];

    // 현재 dashboardDay 기준 핀만 표시 (전체 Day 핀도 표시, Day 색으로 구분)
    const safeRests = Array.isArray(currentRestaurants) ? currentRestaurants.filter(Boolean) : [];
    const activeDayNums = mapActiveDays.includes('all')
      ? null // null이면 전체
      : mapActiveDays.filter(d => d !== 'unlinked');

    safeRests.forEach(rest => {
      if (!rest.lat || !rest.lng) return;
      try {
        const primaryPlan = Array.isArray(planTimeline)
          ? planTimeline.filter(Boolean).find(p => S(p.place) === S(rest.name))
          : null;
        const planDay = primaryPlan ? parseInt(primaryPlan.day) : null;

        // Day 필터 적용
        if (activeDayNums && planDay && !activeDayNums.includes(planDay)) return;

        const dayColor = planDay ? getDayColor(planDay) : '#6366f1';
        const label = rest.isAccommodation ? '🏠' : (planDay ? `D${planDay}` : '📍');

        const content = document.createElement('div');
        content.style.cssText = `background:${dayColor};color:white;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);cursor:pointer;`;
        content.innerText = label;
        content.onclick = () => setSelectedPinInfo(rest);

        const position = new kakao.maps.LatLng(rest.lat, rest.lng);
        const overlay = new kakao.maps.CustomOverlay({ position, content, yAnchor: 1.1, zIndex: 3 });
        overlay.setMap(map);
        kakaoMarkersRef.current.push(overlay);

        if (showMapLabels) {
          const labelEl = document.createElement('div');
          labelEl.style.cssText = `background:white;border:1px solid #e2e8f0;border-radius:6px;padding:2px 6px;font-size:10px;font-weight:bold;color:#1e293b;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.12);margin-top:2px;cursor:pointer;`;
          labelEl.innerText = S(rest.name);
          labelEl.onclick = () => setSelectedPinInfo(rest);
          const labelOverlay = new kakao.maps.CustomOverlay({ position, content: labelEl, yAnchor: -0.2, zIndex: 2 });
          labelOverlay.setMap(map);
          kakaoMarkersRef.current.push(labelOverlay);
        }
      } catch(e) {}
    });

    // 지역 기반 초기 위치: 여행 전/중 스마트 이동
    const cityToSearch = (displayCityName && displayCityName !== '선택된 지역 없음')
      ? displayCityName : globalManualRegion;
    const currentCity = cityToSearch || '';
    const prevCity = mapInitFlyDoneRef.current;

    // pendingMapFlyRef: 핀 이동 버튼에서 넘어온 경우 즉시 이동
    if (pendingMapFlyRef.current) {
      const { lat, lng } = pendingMapFlyRef.current;
      pendingMapFlyRef.current = null;
      try { map.setCenter(new kakao.maps.LatLng(lat, lng)); map.setLevel(3); } catch(e) {}
    } else if (prevCity !== 'pinset') {
      // 여행 전/중 스마트 이동 (Leaflet flyToSmartPosition과 동일 로직)
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const startD = new Date(travelStartDate); startD.setHours(0,0,0,0);
      const todayD = new Date(now); todayD.setHours(0,0,0,0);
      const diff = Math.round((todayD - startD) / 86400000);
      const safePlans = Array.isArray(planTimeline) ? planTimeline.filter(Boolean) : [];

      let targetPin = null;
      if (diff < 0) {
        // 여행 전: D1 첫 핀
        const d1Plans = safePlans.filter(p => parseInt(p.day) === 1 && !p.isTransport).sort((a,b) => S(a.time).localeCompare(S(b.time)));
        targetPin = d1Plans.map(p => safeRests.find(r => r.lat && r.lng && S(r.name) === S(p.place))).find(Boolean)
          || safeRests.find(r => r.lat && r.lng && safePlans.some(p => parseInt(p.day) === 1 && S(p.place) === S(r.name)));
      } else {
        // 여행 중: 오늘 날짜+현재 시각 기준 핀
        const todayDay = diff + 1;
        if (safePlans.some(p => parseInt(p.day) === todayDay)) {
          const todayPlans = safePlans.filter(p => parseInt(p.day) === todayDay && p.time && !p.isTransport).sort((a,b) => S(a.time).localeCompare(S(b.time)));
          const passed = todayPlans.filter(p => { const [h,m] = p.time.split(':').map(Number); return h*60+m <= nowMin; });
          const mp = passed.length > 0 ? passed[passed.length-1] : todayPlans[0];
          if (mp) targetPin = safeRests.find(r => r.lat && r.lng && S(r.name) === S(mp.place));
          if (!targetPin) targetPin = safeRests.find(r => r.lat && r.lng && safePlans.some(p => parseInt(p.day) === todayDay && S(p.place) === S(r.name)));
        }
        if (!targetPin) targetPin = safeRests.find(r => r.isAccommodation && r.lat && r.lng);
        if (!targetPin) targetPin = safeRests.find(r => r.lat && r.lng);
      }

      if (targetPin) {
        try { map.setCenter(new kakao.maps.LatLng(targetPin.lat, targetPin.lng)); map.setLevel(4); } catch(e) {}
        mapInitFlyDoneRef.current = 'pinset';
      } else if (currentCity && prevCity !== currentCity) {
        try {
          const ps = new kakao.maps.services.Places();
          ps.keywordSearch(currentCity, (data, status) => {
            if (status === kakao.maps.services.Status.OK && data[0]) {
              map.setCenter(new kakao.maps.LatLng(parseFloat(data[0].y), parseFloat(data[0].x)));
              map.setLevel(6);
            }
          });
        } catch(e) {}
        mapInitFlyDoneRef.current = currentCity;
      }
    }
  }, [isKakaoMap, isKakaoMapLoaded, activeTab, currentRestaurants, planTimeline, showMapLabels, mapActiveDays, getDayColor, dashboardDay, displayCityName, globalManualRegion]);

  // 카테고리 마커 ref
  const kakaoCategoryMarkersRef = useRef([]);
  const kakaoInfowindowRef = useRef(null); // 지도 전체 공유 인포윈도우
  const kakaoBlockMapClickRef = useRef(false);

  // 카카오맵 카테고리 검색 useEffect
  useEffect(() => {
    if (!isKakaoMap || !isKakaoMapLoaded || activeTab !== 'map') return;
    const map = kakaoMapInstanceRef.current;
    if (!map || !window.kakao) return;
    const kakao = window.kakao;

    const clearCategoryMarkers = () => {
      kakaoCategoryMarkersRef.current.forEach(m => { try { m.setMap(null); } catch(e) {} });
      kakaoCategoryMarkersRef.current = [];
    };

    const activeCats = Array.isArray(kakaoCategory) ? kakaoCategory : [];
    if (activeCats.length === 0) {
      clearCategoryMarkers();
      if (kakaoInfowindowRef.current) { try { kakaoInfowindowRef.current.close(); } catch(e) {} }
      setKakaoCategoryResults([]);
      return;
    }

    if (!kakaoInfowindowRef.current) {
      kakaoInfowindowRef.current = new kakao.maps.InfoWindow({ zIndex: 10, removable: true });
    }
    const infowindow = kakaoInfowindowRef.current;

    const openPlaceInfowindow = (place, pos) => {
      const color = KAKAO_CAT_COLORS[place._catCode] || '#6366f1';
      kakaoBlockMapClickRef.current = true;
      setTimeout(() => { kakaoBlockMapClickRef.current = false; }, 300);
      const btnId = `cat-pin-btn-${Date.now()}`;
      const content = `<div style="padding:8px 10px;width:210px;max-width:210px;overflow:hidden;line-height:1.6;box-sizing:border-box;">
        <div style="font-size:12px;font-weight:900;color:#1e293b;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${place.place_name}</div>
        ${place.category_name ? `<div style="font-size:10px;color:${color};font-weight:700;margin-bottom:2px;">${place.category_name.split(' > ').pop()}</div>` : ''}
        ${place.road_address_name ? `<div style="font-size:10px;color:#555;word-break:keep-all;">${place.road_address_name}</div>` : (place.address_name ? `<div style="font-size:10px;color:#555;">${place.address_name}</div>` : '')}
        ${place.phone ? `<div style="font-size:10px;color:#888;margin-top:2px;word-break:break-all;">📞 ${place.phone}</div>` : ''}
        <button id="${btnId}" style="width:100%;margin-top:6px;padding:6px 0;background:${color};color:white;border:none;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">이 위치를 핀으로 지정 📌</button>
      </div>`;
      infowindow.setContent(content);
      infowindow.setPosition(pos);
      infowindow.open(map);
      setTimeout(() => {
        const btn = document.getElementById(btnId);
        if (btn) btn.onclick = () => {
          infowindow.close();
          if (movingPinIdRef.current) {
            setPendingMove({ id: movingPinIdRef.current, lat: parseFloat(place.y), lng: parseFloat(place.x) });
          } else {
            setClickedLocation({ lat: parseFloat(place.y), lng: parseFloat(place.x) });
            setNewManualPlaceName(place.place_name); setNewManualLocalName(""); setNewManualFeature("");
            setNewManualPhoto(""); setNewManualIsAccommodation(false);
            setPinLinkDay(""); setPinLinkPlanId(""); setNewManualTime("");
            setIsAddPlaceModalOpen(true);
          }
        };
      }, 100);
    };

    const openClusterInfowindow = (places, pos) => {
      kakaoBlockMapClickRef.current = true;
      setTimeout(() => { kakaoBlockMapClickRef.current = false; }, 300);
      const listId = `cat-cluster-list-${Date.now()}`;
      const rows = places.map((p, i) => {
        const c = KAKAO_CAT_COLORS[p._catCode] || '#6366f1';
        return `<div data-idx="${i}" style="padding:5px 4px;border-bottom:1px solid #f1f5f9;cursor:pointer;border-radius:4px;" onmouseover="this.style.background='#f0f4ff'" onmouseout="this.style.background='transparent'">
          <div style="display:flex;align-items:center;gap:4px;">
            <div style="width:7px;height:7px;border-radius:50%;background:${c};flex-shrink:0;"></div>
            <div style="font-size:10px;font-weight:700;color:#1e293b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.place_name}</div>
          </div>
          ${p.road_address_name ? `<div style="font-size:9px;color:#888;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-left:11px;">${p.road_address_name}</div>` : ''}
        </div>`;
      }).join('');
      const content = `<div style="padding:8px 10px;width:220px;max-width:220px;line-height:1.5;box-sizing:border-box;">
        <div style="font-size:10px;font-weight:900;color:#6366f1;margin-bottom:4px;">📍 ${places.length}개 장소 — 클릭하면 상세 정보</div>
        <div id="${listId}">${rows}</div>
      </div>`;
      infowindow.setContent(content);
      infowindow.setPosition(pos);
      infowindow.open(map);
      setTimeout(() => {
        const listEl = document.getElementById(listId);
        if (!listEl) return;
        listEl.querySelectorAll('[data-idx]').forEach(row => {
          row.onclick = (e) => {
            e.stopPropagation();
            const p = places[parseInt(row.dataset.idx)];
            if (!p) return;
            const placePos = new kakao.maps.LatLng(parseFloat(p.y), parseFloat(p.x));
            openPlaceInfowindow(p, placePos);
          };
        });
      }, 100);
    };

    const latLngToPixel = (latlng) => {
      try { return map.getProjection().pointFromCoords(latlng); } catch(e) { return null; }
    };

    // 픽셀 거리 기준 클러스터링 (threshold: 60px)
    const clusterPlaces = (places) => {
      const THRESHOLD = 60;
      const assigned = new Array(places.length).fill(-1);
      const clusters = [];
      for (let i = 0; i < places.length; i++) {
        if (assigned[i] !== -1) continue;
        const pi = latLngToPixel(new kakao.maps.LatLng(parseFloat(places[i].y), parseFloat(places[i].x)));
        const cluster = [i];
        assigned[i] = clusters.length;
        for (let j = i + 1; j < places.length; j++) {
          if (assigned[j] !== -1) continue;
          const pj = latLngToPixel(new kakao.maps.LatLng(parseFloat(places[j].y), parseFloat(places[j].x)));
          if (pi && pj) {
            const dx = pi.x - pj.x, dy = pi.y - pj.y;
            if (Math.sqrt(dx*dx + dy*dy) < THRESHOLD) { cluster.push(j); assigned[j] = clusters.length; }
          }
        }
        clusters.push(cluster);
      }
      return clusters.map(idxArr => idxArr.map(i => places[i]));
    };

    const drawMarker = (place, pos, isCluster, allInCluster) => {
      const color = KAKAO_CAT_COLORS[place._catCode] || '#6366f1';
      const markerEl = document.createElement('div');
      markerEl.style.cssText = `display:flex;flex-direction:column;align-items:center;cursor:pointer;`;
      if (isCluster) {
        // 클러스터 내 카테고리가 다양하면 각 색 점으로 표시
        const uniqueColors = [...new Set(allInCluster.map(p => KAKAO_CAT_COLORS[p._catCode] || '#6366f1'))];
        const dotHtml = uniqueColors.slice(0,3).map(c => `<div style="width:5px;height:5px;border-radius:50%;background:${c};"></div>`).join('');
        markerEl.innerHTML = `
          <div style="min-width:14px;height:14px;padding:0 3px;border-radius:7px;background:white;border:1.5px solid #cbd5e1;box-shadow:0 1px 3px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;gap:2px;">
            ${dotHtml}
          </div>
          <div style="margin-top:2px;padding:1px 5px;background:${color};border-radius:4px;font-size:9px;font-weight:700;color:white;white-space:nowrap;box-shadow:0 1px 2px rgba(0,0,0,0.2);">${allInCluster[0].place_name.slice(0,8)}${allInCluster[0].place_name.length > 8 ? '…' : ''} +${allInCluster.length - 1}</div>
        `;
      } else {
        markerEl.innerHTML = `
          <div style="width:10px;height:10px;border-radius:50%;background:${color};border:1.5px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>
          <div style="margin-top:2px;padding:1px 4px;background:rgba(255,255,255,0.93);border:1px solid ${color};border-radius:4px;font-size:9px;font-weight:700;color:#1e293b;white-space:nowrap;max-width:72px;overflow:hidden;text-overflow:ellipsis;box-shadow:0 1px 2px rgba(0,0,0,0.12);">${place.place_name}</div>
        `;
      }
      const overlay = new kakao.maps.CustomOverlay({ position: pos, content: markerEl, zIndex: 5, yAnchor: 0 });
      overlay.setMap(map);
      kakaoCategoryMarkersRef.current.push(overlay);
      markerEl.onclick = (e) => {
        e.stopPropagation();
        if (isCluster) openClusterInfowindow(allInCluster, pos);
        else openPlaceInfowindow(place, pos);
      };
    };

    const searchAndDraw = () => {
      clearCategoryMarkers();
      const center = map.getCenter();
      const ps = new kakao.maps.services.Places();
      const cats = Array.isArray(kakaoCategoryRef.current) ? kakaoCategoryRef.current : [];
      if (cats.length === 0) return;

      // 선택된 카테고리별로 병렬 검색 후 합쳐서 클러스터링
      let allPlaces = [];
      let done = 0;
      cats.forEach(catCode => {
        ps.categorySearch(catCode, (places, status) => {
          if (status === kakao.maps.services.Status.OK && places) {
            // 카테고리 코드를 각 장소에 태깅
            places.forEach(p => { p._catCode = catCode; });
            allPlaces = allPlaces.concat(places);
          }
          done++;
          if (done === cats.length) {
            setKakaoCategoryResults(allPlaces);
            const clusters = clusterPlaces(allPlaces);
            clusters.forEach(group => {
              const rep = group[0];
              const pos = new kakao.maps.LatLng(parseFloat(rep.y), parseFloat(rep.x));
              drawMarker(rep, pos, group.length > 1, group);
            });
          }
        }, { location: center, radius: 2000, sort: kakao.maps.services.SortBy.DISTANCE, size: 15 });
      });
    };

    searchAndDraw();

    kakao.maps.event.addListener(map, 'idle', searchAndDraw);
    return () => {
      try { kakao.maps.event.removeListener(map, 'idle', searchAndDraw); } catch(e) {}
      clearCategoryMarkers();
    };
  }, [isKakaoMap, isKakaoMapLoaded, activeTab, kakaoCategory]);


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
  const dayAccoms = safePlanTimeline.filter(p => {
    if (!p || !p.isAccommodation) return false;
    // accommodationDays가 비어있으면 모든 Day에 표시 (하위호환)
    const days = Array.isArray(p.accommodationDays) ? p.accommodationDays : [];
    if (days.length === 0) return true;
    return days.includes(safeDashboardDay);
  });
  // trans_rental_ 아이템이 있으면 place에 '렌터카'가 포함된 비-trans_rental_ 항목(여행정산 중복) 숨기기
  const hasRentalTransItems = safePlanTimeline.some(p => p && (p.id === 'trans_rental_dep' || p.id === 'trans_rental_arr'));
  const dayPlans = safePlanTimeline.filter(p => {
    if (!p || p.isAccommodation) return false;
    if (parseInt(p.day || 1) !== safeDashboardDay) return false;
    // 렌터카 교통권 아이템이 있으면 여행정산에서 별도 저장된 렌터카 일정 숨기기
    if (hasRentalTransItems && !String(p.id).startsWith('trans_rental_') && S(p.place).includes('렌터카')) return false;
    return true;
  }).sort((a,b) => S(a?.time).localeCompare(S(b?.time)));
  const todayPlans = [...dayAccoms, ...dayPlans]; // isTransport(렌터카 포함) 이미 dayPlans에 포함됨
  
  const safeMaxDay = (typeof maxDay === 'number' && maxDay > 0 && maxDay < 100) ? maxDay : 4;
  const tripDays = Array.from({length: safeMaxDay}, (_, i) => i + 1);

  // 현재 dashboardDay + 현재 시각 기준으로 "지금 있어야 할 지역" 계산
  // 시간순 일정 중 현재 시각 이전 마지막 일정의 지역 (없으면 첫 일정 지역, 없으면 displayCityName)
  const activeRegionForDay = (() => {
    const allKnownRegions = Object.values(REGIONS_BY_COUNTRY).flat();
    const isValidReg = (r) => r && r !== '수동입력' && r !== '선택된 지역 없음' && (allKnownRegions.includes(r) || (globalManualRegion && r === globalManualRegion));
    const dPlans = (Array.isArray(planTimeline) ? planTimeline : [])
      .filter(p => p && !p.isAccommodation && !p.isTransport && parseInt(p.day) === safeDashboardDay && isValidReg(p.region) && p.time && p.time !== '99:99')
      .sort((a, b) => S(a.time).localeCompare(S(b.time)));
    if (dPlans.length === 0) {
      return displayCityName && displayCityName !== '선택된 지역 없음' ? displayCityName : (globalManualRegion || '');
    }
    const nowTime = `${String(new Date().getHours()).padStart(2,'0')}:${String(new Date().getMinutes()).padStart(2,'0')}`;
    // 현재 시각 이전 일정 중 가장 마지막 것
    const past = dPlans.filter(p => p.time <= nowTime);
    if (past.length > 0) return past[past.length - 1].region;
    // 아직 모두 미래 일정이면 첫 일정 지역
    return dPlans[0].region;
  })();

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

  const TRANS_TYPE_ICON = { flight: '✈️', train: '🚆', bus: '🚌' };

  // trans_ 접두사가 붙은 교통편 등록 항목(가는편/오는편)들을 오늘의 계획에서 그대로 재구성
  const getAllTransportLegs = () => {
    const safeTimeline = Array.isArray(planTimeline) ? planTimeline.filter(Boolean) : [];
    const legs = [];
    ['flight', 'train', 'bus'].forEach(type => {
      ['outbound', 'inbound'].forEach(dir => {
        const depItem = safeTimeline.find(p => p.id === `trans_${type}_${dir}_dep`);
        const arrItem = safeTimeline.find(p => p.id === `trans_${type}_${dir}_arr`);
        if (!depItem || !arrItem) return;
        const depPlace = S(depItem.place).replace(/[^가-힣a-zA-Z0-9\s]/g, '').replace('출발', '').trim();
        const arrPlace = S(arrItem.place).replace(/[^가-힣a-zA-Z0-9\s]/g, '').replace('도착', '').trim();
        const match = S(depItem.features).match(/:\s*(.*?)(?:\s*\|\s*좌석:\s*(.*?))?\s*\|/);
        legs.push({
          type, dir, day: parseInt(depItem.day) || 1,
          dep: depPlace, arr: arrPlace,
          depTime: depItem.time || '', arrTime: arrItem.time || '',
          airline: S(depItem.localName),
          flightNum: match ? S(match[1]).trim() : '',
          seatNum: (match && match[2]) ? S(match[2]).trim() : '',
        });
      });
    });
    return legs;
  };

  // 방향별로 여러 편이 등록돼 있으면, 도착지(가는편)/출발지(오는편)가 대표 여행지와 일치하는 편을 대표편으로 선택
  const pickRepresentativeLeg = (legs, dir) => {
    const candidates = legs.filter(l => l.dir === dir);
    if (candidates.length === 0) return null;
    const cityValid = displayCityName && displayCityName !== '선택된 지역 없음';
    if (cityValid) {
      const matched = candidates.find(l => {
        const target = dir === 'outbound' ? l.arr : l.dep;
        return target && (target.includes(displayCityName) || displayCityName.includes(target));
      });
      if (matched) return matched;
    }
    return candidates[0];
  };

  const renderFlightCards = () => {
    const allLegs = getAllTransportLegs();
    const repOutboundLeg = pickRepresentativeLeg(allLegs, 'outbound');
    const repInboundLeg = pickRepresentativeLeg(allLegs, 'inbound');
    // 트랜스 항목이 하나도 없는 구버전 데이터는 flights state로 폴백
    const displayOutbound = repOutboundLeg || flights.outbound;
    const displayInbound = repInboundLeg || flights.inbound;
    const extraLegs = allLegs.filter(l => l !== repOutboundLeg && l !== repInboundLeg);

    // 대표편으로 채택되지 않은 교통 관련 일정(대표 왕복이 아닌 개별 이동)이 있는 날짜만 작은 배지로 알림
    const transportBadgeDays = (() => {
      const safeTimeline = Array.isArray(planTimeline) ? planTimeline.filter(Boolean) : [];
      const generalDays = safeTimeline
        .filter(p => !p.isAccommodation && !String(p.id).startsWith('trans_') && ['교통', '항공', '비행기', '기차', '버스', '배'].some(k => S(p.theme).includes(k)))
        .map(p => parseInt(p.day) || 1);
      const extraLegDays = extraLegs.map(l => l.day);
      return [...new Set([...generalDays, ...extraLegDays])].sort((a, b) => a - b);
    })();

    // 배지로 특정 날짜를 미리보기 중이면, 그 날짜에 등록된 편만 방향별로 채우고 없는 쪽은 비움(대표편으로 되돌아가지 않음)
    const isPreviewingDay = previewTransportDay != null;
    const dayExtraLegs = isPreviewingDay ? extraLegs.filter(l => l.day === previewTransportDay) : [];
    const shownOutbound = isPreviewingDay ? (dayExtraLegs.find(l => l.dir === 'outbound') || null) : displayOutbound;
    const shownInbound = isPreviewingDay ? (dayExtraLegs.find(l => l.dir === 'inbound') || null) : displayInbound;

    const badgeRow = transportBadgeDays.length > 0 && (
      <div className="flex items-center justify-end gap-1 mb-1 flex-wrap">
        {transportBadgeDays.map(d => {
          const isActive = previewTransportDay === d;
          return (
          <button
            key={d}
            onClick={(e) => { e.stopPropagation(); setPreviewTransportDay(prev => prev === d ? null : d); }}
            className={`flex items-center gap-0.5 text-[7px] sm:text-[8px] font-bold px-1.5 py-0.5 rounded-full transition-colors duration-300 active:scale-95 ${isActive ? 'bg-indigo-100 text-indigo-600 border border-indigo-300 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-700' : (isDarkMode ? 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-indigo-300' : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600')}`}
          >
            <Calendar className="w-2.5 h-2.5" /> {getDayDateString(d).split('(')[0]}
          </button>
        )})}
      </div>
    );

    if (!displayOutbound && !displayInbound) {
      return (
        <>
          {badgeRow}
          <button
            onClick={() => {
              setTransType('flight'); setTransDir('outbound');
              setModalTransData({ flight: { outbound: { ...initialTransState }, inbound: { ...initialTransState } }, train: { outbound: { ...initialTransState }, inbound: { ...initialTransState } }, bus: { outbound: { ...initialTransState }, inbound: { ...initialTransState } } });
              setIsTransportModalOpen(true);
            }}
            className={`flex items-center justify-center gap-1.5 w-full mb-2 py-2.5 rounded-lg border border-dashed text-[10px] font-bold transition-all duration-300 active:scale-[0.99] shrink-0 ${isDarkMode ? 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-indigo-500' : 'border-slate-300 text-slate-500 hover:bg-slate-50 hover:border-indigo-400'}`}
          >
            <Plane className="w-3.5 h-3.5" /> 등록된 교통편이 없어요, 여기서 추가하세요
          </button>
        </>
      );
    }

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
      <>
        {badgeRow}
        <div className={wrapperClass}>
        {shownOutbound && (() => {
          const ux = getCardUX('outbound');
          return (
          <div onClick={(e) => {
             e.stopPropagation();
             if (ux.isActive) { handleEditFlight('outbound', shownOutbound, shownInbound); setActiveMobileCard(null); }
             else setActiveMobileCard('flight_outbound');
          }} className={`flex-1 flex flex-col justify-center p-2 rounded-lg border shadow-sm relative cursor-pointer md:hover:border-indigo-400 transition-all duration-300 group ${ux.finalBorder}`}>
            <div className="flex justify-between items-center w-full absolute top-1 left-0 right-0 px-1.5">
               <span className="text-[6px] sm:text-[8px] font-bold text-indigo-500 bg-indigo-100 px-1 rounded">가는 편 🛫</span>
               <div className="flex items-center space-x-1 relative">
                 <span className={`text-[6px] sm:text-[7px] font-bold text-slate-400 bg-slate-100/80 dark:bg-slate-700/80 px-1.5 py-0.5 rounded transition-opacity duration-300 ${ux.isActive ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'}`}>
                    {shownOutbound.flightNum || '편명미상'} {shownOutbound.seatNum ? `| ${shownOutbound.seatNum}` : ''}
                 </span>
                 <div className={`flex space-x-1 bg-white/90 dark:bg-slate-700/90 rounded border border-slate-200 dark:border-slate-600 shadow-sm transition-opacity duration-300 absolute right-0 top-0 ${ux.hoverLogic}`}>
                   <button onClick={(e) => { if (!ux.isActive) return; e.stopPropagation(); handleEditFlight('outbound', shownOutbound, shownInbound); }} className="text-slate-500 hover:text-indigo-600 p-0.5"><span className="text-[10px]">✏️</span></button>
                   <button onClick={(e) => { if (!ux.isActive) return; e.stopPropagation(); handleDeleteFlight('outbound', shownOutbound.type); }} className="text-slate-500 hover:text-rose-500 p-0.5"><span className="text-[10px]"><Trash2 className="w-[1em] h-[1em] inline" /></span></button>
                 </div>
               </div>
            </div>
            <div className="flex w-full items-center justify-between mt-3 sm:mt-4 px-1">
              <div className="flex flex-col w-[30%]"><span className="text-[10px] sm:text-sm font-black text-slate-700 dark:text-slate-200 truncate">{shownOutbound.dep}</span><span className="text-[7px] sm:text-[8px] font-bold text-slate-400">{shownOutbound.depTime}</span></div>
              <div className="flex flex-col items-center flex-1 px-0.5 sm:px-1">
                <span className="text-[6px] sm:text-[8px] text-slate-300 w-full flex items-center before:flex-1 before:border-t before:border-dashed before:border-slate-300 after:flex-1 after:border-t after:border-dashed after:border-slate-300"><span className="px-0.5 sm:px-1">{TRANS_TYPE_ICON[shownOutbound.type] || '✈️'}</span></span>
                <span className="text-[6px] sm:text-[8px] font-bold text-indigo-400 truncate w-full text-center">{shownOutbound.airline}</span>
              </div>
              <div className="flex flex-col text-right w-[30%]"><span className="text-[10px] sm:text-sm font-black text-slate-700 dark:text-slate-200 truncate">{shownOutbound.arr}</span><span className="text-[7px] sm:text-[8px] font-bold text-slate-400">{shownOutbound.arrTime}</span></div>
            </div>
          </div>
        )})()}
        {shownInbound && (() => {
          const ux = getCardUX('inbound');
          return (
          <div onClick={(e) => {
             e.stopPropagation();
             if (ux.isActive) { handleEditFlight('inbound', shownOutbound, shownInbound); setActiveMobileCard(null); }
             else setActiveMobileCard('flight_inbound');
          }} className={`flex-1 flex flex-col justify-center p-2 rounded-lg border shadow-sm relative cursor-pointer md:hover:border-rose-400 transition-all duration-300 group ${ux.finalBorder}`}>
            <div className="flex justify-between items-center w-full absolute top-1 left-0 right-0 px-1.5">
               <span className="text-[6px] sm:text-[8px] font-bold text-rose-500 bg-rose-100 px-1 rounded">오는 편 🛬</span>
               <div className="flex items-center space-x-1 relative">
                 <span className={`text-[6px] sm:text-[7px] font-bold text-slate-400 bg-slate-100/80 dark:bg-slate-700/80 px-1.5 py-0.5 rounded transition-opacity duration-300 ${ux.isActive ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'}`}>
                    {shownInbound.flightNum || '편명미상'} {shownInbound.seatNum ? `| ${shownInbound.seatNum}` : ''}
                 </span>
                 <div className={`flex space-x-1 bg-white/90 dark:bg-slate-700/90 rounded border border-slate-200 dark:border-slate-600 shadow-sm transition-opacity duration-300 absolute right-0 top-0 ${ux.hoverLogic}`}>
                   <button onClick={(e) => { if (!ux.isActive) return; e.stopPropagation(); handleEditFlight('inbound', shownOutbound, shownInbound); }} className="text-slate-500 hover:text-indigo-600 p-0.5"><span className="text-[10px]">✏️</span></button>
                   <button onClick={(e) => { if (!ux.isActive) return; e.stopPropagation(); handleDeleteFlight('inbound', shownInbound.type); }} className="text-slate-500 hover:text-rose-500 p-0.5"><span className="text-[10px]"><Trash2 className="w-[1em] h-[1em] inline" /></span></button>
                 </div>
               </div>
            </div>
            <div className="flex w-full items-center justify-between mt-3 sm:mt-4 px-1">
              <div className="flex flex-col w-[30%]"><span className="text-[10px] sm:text-sm font-black text-slate-700 dark:text-slate-200 truncate">{shownInbound.dep}</span><span className="text-[7px] sm:text-[8px] font-bold text-slate-400">{shownInbound.depTime}</span></div>
              <div className="flex flex-col items-center flex-1 px-0.5 sm:px-1">
                <span className="text-[6px] sm:text-[8px] text-slate-300 w-full flex items-center before:flex-1 before:border-t before:border-dashed before:border-slate-300 after:flex-1 after:border-t after:border-dashed after:border-slate-300"><span className="px-0.5 sm:px-1">{TRANS_TYPE_ICON[shownInbound.type] || '✈️'}</span></span>
                <span className="text-[6px] sm:text-[8px] font-bold text-rose-400 truncate w-full text-center">{shownInbound.airline}</span>
              </div>
              <div className="flex flex-col text-right w-[30%]"><span className="text-[10px] sm:text-sm font-black text-slate-700 dark:text-slate-200 truncate">{shownInbound.arr}</span><span className="text-[7px] sm:text-[8px] font-bold text-slate-400">{shownInbound.arrTime}</span></div>
            </div>
          </div>
        )})()}
        </div>
      </>
    );
  };

  const finalElementScale = (typeof elementScale === 'number' && !isNaN(elementScale) && elementScale > 0.3) ? elementScale : 1;

  /* ===================== 메인 렌더링 블록 ===================== */

  if (!isDbLoaded) return <div className="h-screen w-full flex items-center justify-center bg-slate-50"><span className="text-2xl animate-spin inline-block">🔄</span></div>;

  if (showIdSetup) {
    return (
      <LoginScreen
        isLoginMode={isLoginMode} setIsLoginMode={setIsLoginMode}
        idInput={idInput} setIdInput={setIdInput} idError={idError} setIdError={setIdError}
        pwInput={pwInput} setPwInput={setPwInput}
        saveCredentials={saveCredentials} setSaveCredentials={setSaveCredentials}
        autoLogin={autoLogin} setAutoLogin={setAutoLogin}
        isLoggingIn={isLoggingIn} handleLogin={handleLogin} handleSignUp={handleSignUp} handleSkipIdSetup={handleSkipIdSetup}
      />
    );
  }

  return (
    <div style={{ zoom: finalElementScale, width: '100vw', maxWidth: '100vw', overflowX: 'hidden' }} className={`flex flex-col h-[100dvh] ${appBg} ${textMain} overflow-hidden select-none relative transition-colors duration-300`} onClick={() => setActiveMobileCard(null)}>
      
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
      <Toast toastMsg={toastMsg} />

      {/* 커스텀 확인 모달 (window.confirm 대체) */}
      <ConfirmModal confirmModal={confirmModal} setConfirmModal={setConfirmModal} cardBg={cardBg} isDarkMode={isDarkMode} textMain={textMain} />

      <MobileMenu
        isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} isDarkMode={isDarkMode} appUserId={appUserId}
        trips={trips} setTrips={setTrips} activeTripId={activeTripId} travelStartDate={travelStartDate} planTimeline={planTimeline} maxDay={maxDay}
        handleSwitchTrip={handleSwitchTrip} setActiveTab={setActiveTab} setTripToDelete={setTripToDelete} showConfirm={showConfirm}
        globalPlanCountry={globalPlanCountry} globalManualCountry={globalManualCountry} supabaseClient={supabaseClient} showToast={showToast}
        activeTab={activeTab} openAddTripModal={openAddTripModal} openRenameTripModal={openRenameTripModal}
        pendingInvite={pendingInvite} handleAcceptInvite={handleAcceptInvite} handleRejectInvite={handleRejectInvite}
        handleUndo={handleUndo} handleRedo={handleRedo} historyIndex={historyIndex} history={history}
        setIsSettingsOpen={setIsSettingsOpen} handleLogout={handleLogout}
      />

      <SettingsModal
        isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}
        cardBg={cardBg} isDarkMode={isDarkMode} textMain={textMain} textMuted={textMuted} inputBg={inputBg}
        appTheme={appTheme} handleThemeChange={handleThemeChange}
        myLocationIcon={myLocationIcon} setMyLocationIcon={setMyLocationIcon}
        appFont={appFont} setAppFont={setAppFont}
        appTextColor={appTextColor} setAppTextColor={setAppTextColor}
        fontScale={fontScale} handleFontScaleChange={handleFontScaleChange} elementScale={elementScale} handleElementScaleChange={handleElementScaleChange}
        appUserId={appUserId} isMigratingPhotos={isMigratingPhotos} handleMigratePhotosToStorage={handleMigratePhotosToStorage}
        inviteIdInput={inviteIdInput} setInviteIdInput={setInviteIdInput} handleSendInvite={handleSendInvite}
        sharedUsers={sharedUsers} isTripOwner={isTripOwner}
        kickUserTarget={kickUserTarget} setKickUserTarget={setKickUserTarget}
        supabaseClient={supabaseClient} activeTripId={activeTripId} setSharedUsers={setSharedUsers} showToast={showToast}
      />

      <PhotoViewerModal
        viewPhoto={viewPhoto} setViewPhoto={setViewPhoto} setViewPhotoAnim={setViewPhotoAnim}
        viewPhotoDragRef={viewPhotoDragRef} zoomImgRef={zoomImgRef} zoomCardRef={zoomCardRef} zoomStateRef={zoomStateRef}
        applyZoomTransform={applyZoomTransform} resetZoom={resetZoom} goPhotoNext={goPhotoNext} goPhotoPrev={goPhotoPrev}
      />

      <DeleteTripConfirmModal
        tripToDelete={tripToDelete} setTripToDelete={setTripToDelete} trips={trips} isDarkMode={isDarkMode} confirmDeleteTrip={confirmDeleteTrip}
      />
      <ExpenseModal
        isExpenseModalOpen={isExpenseModalOpen} setIsExpenseModalOpen={setIsExpenseModalOpen}
        expenseAmtModalPlan={expenseAmtModalPlan} setExpenseAmtModalPlan={setExpenseAmtModalPlan}
        expenseAmtValue={expenseAmtValue} setExpenseAmtValue={setExpenseAmtValue}
        expenseAmtIsKrw={expenseAmtIsKrw} setExpenseAmtIsKrw={setExpenseAmtIsKrw}
        isBasicExpAddOpen={isBasicExpAddOpen} setIsBasicExpAddOpen={setIsBasicExpAddOpen}
        basicExpAddName={basicExpAddName} setBasicExpAddName={setBasicExpAddName}
        basicExpAddAmt={basicExpAddAmt} setBasicExpAddAmt={setBasicExpAddAmt}
        basicExpAddCat={basicExpAddCat} setBasicExpAddCat={setBasicExpAddCat}
        basicExpAddIsKrw={basicExpAddIsKrw} setBasicExpAddIsKrw={setBasicExpAddIsKrw}
        basicExpAddDay={basicExpAddDay} setBasicExpAddDay={setBasicExpAddDay}
        expenseFilterDay={expenseFilterDay} setExpenseFilterDay={setExpenseFilterDay}
        expenseFilterTheme={expenseFilterTheme} setExpenseFilterTheme={setExpenseFilterTheme}
        cardBg={cardBg} textMain={textMain} textMuted={textMuted} inputBg={inputBg} isDarkMode={isDarkMode}
        planTimeline={planTimeline} setPlanTimeline={setPlanTimeline} basicExpenses={basicExpenses} setBasicExpenses={setBasicExpenses}
        rates={rates} tripDays={tripDays} globalPlanCountry={globalPlanCountry} globalPlanRegion={globalPlanRegion} globalManualCountry={globalManualCountry}
        travelStartDate={travelStartDate} safeMaxDay={safeMaxDay} showToast={showToast} saveToDb={saveToDb}
      />

      <WeatherModal
        isOpen={isWeatherModalOpen}
        onClose={() => setIsWeatherModalOpen(false)}
        cardBg={cardBg} isDarkMode={isDarkMode} textMain={textMain} textMuted={textMuted}
        displayCityName={displayCityName} globalManualRegion={globalManualRegion} globalPlanRegion={globalPlanRegion}
        forecast={forecast} fetchWeatherData={fetchWeatherData}
        expandedWeatherDay={expandedWeatherDay} onDayClick={handleWeatherDayClick}
        isLoadingHourly={isLoadingHourly} hourlyWeatherCache={hourlyWeatherCache}
        tripDays={tripDays} getDateStringForDay={getDateStringForDay} planTimeline={planTimeline}
      />

      <PackingDashboardModal
        isOpen={isDashboardPackingOpen}
        onClose={() => setIsDashboardPackingOpen(false)}
        isDarkMode={isDarkMode} textMain={textMain}
        packingList={packingList} onToggleItem={togglePackingItem}
      />
      <ShoppingEditModal
        isOpen={isShoppingModalOpen}
        onClose={() => setIsShoppingModalOpen(false)}
        isDarkMode={isDarkMode} textMuted={textMuted} inputBg={inputBg}
        shoppingItemDay={shoppingItemDay} setShoppingItemDay={setShoppingItemDay}
        shoppingLinkPlanId={shoppingLinkPlanId} setShoppingLinkPlanId={setShoppingLinkPlanId}
        tripDays={tripDays} shoppingItemTheme={shoppingItemTheme} setShoppingItemTheme={setShoppingItemTheme}
        planTimeline={planTimeline}
        newShoppingItem={newShoppingItem} setNewShoppingItem={setNewShoppingItem}
        newShoppingPhoto={newShoppingPhoto} setNewShoppingPhoto={setNewShoppingPhoto}
        showToast={showToast} appUserId={appUserId} saveToDb={saveToDb}
        shoppingList={shoppingList} setShoppingList={setShoppingList}
        shoppingFileInputRef={shoppingFileInputRef} supabaseClient={supabaseClient} activeTripId={activeTripId}
        shoppingFilterTheme={shoppingFilterTheme} setShoppingFilterTheme={setShoppingFilterTheme}
        showAllShopping={showAllShopping} setShowAllShopping={setShowAllShopping}
        editingItemId={editingItemId} setEditingItemId={setEditingItemId}
        onStartLongPress={startLongPress} onCancelLongPress={cancelLongPress}
      />

      <ShoppingDashboardModal
        isOpen={isDashboardShoppingOpen}
        onClose={() => setIsDashboardShoppingOpen(false)}
        isDarkMode={isDarkMode} textMain={textMain} textMuted={textMuted} inputBg={inputBg}
        dashShoppingFilterTheme={dashShoppingFilterTheme} setDashShoppingFilterTheme={setDashShoppingFilterTheme}
        dashShowAllShopping={dashShowAllShopping} setDashShowAllShopping={setDashShowAllShopping}
        shoppingList={shoppingList} setShoppingList={setShoppingList} saveToDb={saveToDb} dashboardDay={dashboardDay}
      />

      <PackingEditModal
        isOpen={isPackingModalOpen}
        onClose={() => setIsPackingModalOpen(false)}
        isDarkMode={isDarkMode} textMain={textMain} inputBg={inputBg}
        onAddItem={handleAddPackingItem} packingList={packingList} appUserId={appUserId} editingItemId={editingItemId}
        onStartLongPress={startLongPress} onCancelLongPress={cancelLongPress} onToggleItem={togglePackingItem}
        setPackingList={setPackingList} setEditingItemId={setEditingItemId}
        saveToDb={saveToDb} onDeleteItem={deletePackingItem}
      />

      <PlanDetailModal
        selectedPlanInfo={selectedPlanInfo} setSelectedPlanInfo={setSelectedPlanInfo} cardBg={cardBg} isDarkMode={isDarkMode} openPhotoViewer={openPhotoViewer} handleCopyLocalName={handleCopyLocalName}
        planTimeline={planTimeline} setPlanTimeline={setPlanTimeline} saveToDb={saveToDb}
        isSettleMode={isSettleMode} setIsSettleMode={setIsSettleMode} settleLocal={settleLocal} setSettleLocal={setSettleLocal} settleKrw={settleKrw} setSettleKrw={setSettleKrw}
        isDiaryOpen={isDiaryOpen} setIsDiaryOpen={setIsDiaryOpen} diaryReview={diaryReview} setDiaryReview={setDiaryReview} diaryRating={diaryRating} setDiaryRating={setDiaryRating}
        currentRestaurants={currentRestaurants} setCurrentRestaurants={setCurrentRestaurants} showToast={showToast} rates={rates}
      />

      <PinDetailModal
        selectedPinInfo={selectedPinInfo} setSelectedPinInfo={setSelectedPinInfo} cardBg={cardBg} setViewPhoto={setViewPhoto} handleCopyLocalName={handleCopyLocalName} openEditPinModal={openEditPinModal}
      />

      <TripModal
        tripModal={tripModal} setTripModal={setTripModal} cardBg={cardBg} isDarkMode={isDarkMode} inputBg={inputBg} submitTripModal={submitTripModal} isSubmittingTrip={isSubmittingTrip}
      />

      <TransportModal
        isOpen={isTransportModalOpen} onClose={() => setIsTransportModalOpen(false)}
        isDarkMode={isDarkMode} textMuted={textMuted} inputBg={inputBg}
        transType={transType} setTransType={setTransType} transDir={transDir} setTransDir={setTransDir}
        modalTransData={modalTransData} setModalTransData={setModalTransData} tripDays={tripDays} handleTimeInput={handleTimeInput}
        rentalCarData={rentalCarData} setRentalCarData={setRentalCarData} rentalFileInputRef={rentalFileInputRef}
        supabaseClient={supabaseClient} appUserId={appUserId} activeTripId={activeTripId} handleSaveTransport={handleSaveTransport}
      />

      <EditPlanModal
        editingPlan={editingPlan} setEditingPlan={setEditingPlan} isDarkMode={isDarkMode} appTheme={appTheme} textMuted={textMuted} inputBg={inputBg}
        tripDays={tripDays} handleTimeInput={handleTimeInput} editFileInputRef={editFileInputRef} handlePlanPhotoUpload={handlePlanPhotoUpload}
        supabaseClient={supabaseClient} appUserId={appUserId} activeTripId={activeTripId}
        planTimeline={planTimeline} setPlanTimeline={setPlanTimeline} currentRestaurants={currentRestaurants} setCurrentRestaurants={setCurrentRestaurants}
        setDisplayCityName={setDisplayCityName} saveToDb={saveToDb} showToast={showToast}
      />

      <AddPlaceModal
        isOpen={isAddPlaceModalOpen} onClose={() => setIsAddPlaceModalOpen(false)}
        cardBg={cardBg} isDarkMode={isDarkMode} textMuted={textMuted} inputBg={inputBg} clickedLocation={clickedLocation}
        newManualTheme={newManualTheme} setNewManualTheme={setNewManualTheme}
        newManualPlaceName={newManualPlaceName} setNewManualPlaceName={setNewManualPlaceName}
        newManualLocalName={newManualLocalName} setNewManualLocalName={setNewManualLocalName}
        newManualFeature={newManualFeature} setNewManualFeature={setNewManualFeature}
        pinLinkDay={pinLinkDay} setPinLinkDay={setPinLinkDay} pinLinkPlanId={pinLinkPlanId} setPinLinkPlanId={setPinLinkPlanId}
        newManualTime={newManualTime} setNewManualTime={setNewManualTime} handleTimeInput={handleTimeInput}
        tripDays={tripDays} planTimeline={planTimeline} showToast={showToast}
        newManualPhotos={newManualPhotos} setNewManualPhotos={setNewManualPhotos} setNewManualPhoto={setNewManualPhoto}
        newManualIsAccommodation={newManualIsAccommodation} setNewManualIsAccommodation={setNewManualIsAccommodation}
        newManualAccommodationDays={newManualAccommodationDays} setNewManualAccommodationDays={setNewManualAccommodationDays}
        newManualIsLandmark={newManualIsLandmark} setNewManualIsLandmark={setNewManualIsLandmark}
        manualFileInputRef={manualFileInputRef} supabaseClient={supabaseClient} appUserId={appUserId} activeTripId={activeTripId}
        handleManualPlaceAdd={handleManualPlaceAdd}
      />

      <MyPinsModal
        isOpen={isMyPinsModalOpen} onClose={() => setIsMyPinsModalOpen(false)}
        cardBg={cardBg} isDarkMode={isDarkMode}
        myPinsFilter={myPinsFilter} setMyPinsFilter={setMyPinsFilter} tripDays={tripDays}
        myPinsThemeFilter={myPinsThemeFilter} setMyPinsThemeFilter={setMyPinsThemeFilter}
        filteredMyPins={filteredMyPins} planTimeline={planTimeline}
        setClickedLocation={setClickedLocation} setNewManualPlaceName={setNewManualPlaceName} setNewManualLocalName={setNewManualLocalName} setNewManualFeature={setNewManualFeature}
        setNewManualPhoto={setNewManualPhoto} setNewManualIsAccommodation={setNewManualIsAccommodation} setPinLinkDay={setPinLinkDay} setPinLinkPlanId={setPinLinkPlanId}
        setNewManualTime={setNewManualTime} setIsAddPlaceModalOpen={setIsAddPlaceModalOpen}
        setViewPhoto={setViewPhoto} pinQuickView={pinQuickView} setPinQuickView={setPinQuickView}
        activeTab={activeTab} setActiveTab={setActiveTab} isKakaoMap={isKakaoMap} kakaoMapInstanceRef={kakaoMapInstanceRef} mapInstanceRef={mapInstanceRef} pendingMapFlyRef={pendingMapFlyRef}
        setMovingPinId={setMovingPinId} setIsPinMode={setIsPinMode} showToast={showToast} openEditPinModal={openEditPinModal}
        safeCurrentRestaurants={safeCurrentRestaurants} setCurrentRestaurants={setCurrentRestaurants} saveToDb={saveToDb} handleCopyLocalName={handleCopyLocalName}
      />

      <NavModal
        isOpen={isNavModalOpen} onClose={() => setIsNavModalOpen(false)}
        isDarkMode={isDarkMode} currentRestaurants={currentRestaurants}
        navOrigin={navOrigin} setNavOrigin={setNavOrigin} navDest={navDest} setNavDest={setNavDest} navWaypoints={navWaypoints} setNavWaypoints={setNavWaypoints}
        navSelectingFor={navSelectingFor} setNavSelectingFor={setNavSelectingFor} navDayFilter={navDayFilter} setNavDayFilter={setNavDayFilter}
        planTimeline={planTimeline} tripDays={tripDays} getDayColor={getDayColor} showToast={showToast}
      />

      {/* --- 메인 컨텐츠 영역 --- */}
      <main 
        className={`flex-1 flex flex-col min-w-0 h-full overflow-y-auto overflow-x-hidden relative z-10 transition-transform ${isRefreshing || pullDistance === 0 ? 'duration-300 ease-out' : 'duration-0'} ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}
        style={{ transform: `translateY(${isRefreshing ? 80 : pullDistance}px)`, overscrollBehaviorY: 'contain' }}
        onTouchStart={(e) => {
          // 지도 탭이면 pull-to-refresh 완전 비활성화
          if (activeTab === 'map') {
            e.currentTarget.dataset.isPulling = 'false';
            return;
          }
          const leafletEl = document.getElementById('leaflet-map');
          const kakaoEl = kakaoMapContainerRef.current;
          if ((leafletEl && leafletEl.contains(e.target)) || (kakaoEl && kakaoEl.contains(e.target))) {
            e.currentTarget.dataset.isPulling = 'false';
            return;
          }
          if (e.currentTarget.scrollTop <= 0) {
            e.currentTarget.dataset.startY = e.touches[0].clientY;
            e.currentTarget.dataset.isPulling = 'true';
          }
        }}
        onTouchMove={(e) => {
          if (activeTab === 'map') return;
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
          if (activeTab === 'map') return;
          if (e.currentTarget.dataset.isPulling === 'true') {
            if (pullDistance > 70) {
              setIsRefreshing(true);
              setRefreshTrigger(prev => prev + 1);
              setTimeout(() => {
                setIsRefreshing(false);
                setPullDistance(0);
                showToast("🔄 동기화 완료!");
              }, 1500);
            } else {
              setPullDistance(0);
            }
            e.currentTarget.dataset.isPulling = 'false';
          }
        }}
      >
        <header className={`min-h-[48px] sm:min-h-[56px] ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border-b flex items-center justify-between px-3 sm:px-5 flex-shrink-0 z-20 transition-colors duration-300 overflow-hidden`} style={{maxWidth:'100vw'}}>
          <div className="flex items-center flex-1 min-w-0 space-x-2 sm:space-x-4">
            <button className={`p-1.5 rounded-lg ${isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'} transition-all duration-300 active:scale-95`} onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            
            {/* 날씨 카드 행 — 헤더 */}
            {(() => {
              const fallbackCityKey = (displayCityName && displayCityName !== '선택된 지역 없음') ? displayCityName : globalManualRegion;

              // 특정 지역·시간대의 날씨 슬롯 추출 (hourlyWeatherCache에서 지역별 조회)
              const getSlotWeatherForRegion = (region, dateStr, startH, endH) => {
                const key = region || fallbackCityKey;
                const hourly = key ? hourlyWeatherCache[key] : null;
                if (!hourly || !Array.isArray(hourly.time)) return null;
                const slots = hourly.time.reduce((acc, t, i) => {
                  if (!t.startsWith(dateStr)) return acc;
                  const h = parseInt(t.slice(11, 13));
                  if (h >= startH && h < endH) acc.push({ temp: Math.round(hourly.temperature_2m[i]), code: hourly.weather_code[i] });
                  return acc;
                }, []);
                if (!slots.length) return null;
                const mid = slots[Math.floor(slots.length / 2)];
                return { ...getWeatherInfo(mid.code), temp: mid.temp };
              };

              // 특정 Day + 시간대의 지역 계산
              const getRegionForDayHour = (day, hour) => {
                const allKnownR = Object.values(REGIONS_BY_COUNTRY).flat();
                const isValidR = (r) => r && r !== '수동입력' && r !== '선택된 지역 없음' && (allKnownR.includes(r) || r === globalManualRegion);
                const dPs = (Array.isArray(planTimeline) ? planTimeline : [])
                  .filter(p => p && !p.isAccommodation && !p.isTransport && parseInt(p.day) === day && isValidR(p.region) && p.time && p.time !== '99:99')
                  .sort((a, b) => S(a.time).localeCompare(S(b.time)));
                if (dPs.length === 0) return fallbackCityKey;
                const hStr = `${String(hour).padStart(2,'0')}:00`;
                const past = dPs.filter(p => p.time <= hStr);
                return past.length > 0 ? past[past.length - 1].region : dPs[0].region;
              };

              if (!Array.isArray(forecast) || forecast.length === 0) return null;

              // 펼쳐진 Day의 시간대 카드 3개 — 각 슬롯의 지역을 개별 계산
              const expandedSlots = expandedWeatherDay ? (() => {
                const d = expandedWeatherDay;
                const dateStr = getDateStringForDay(d);
                const regM = getRegionForDayHour(d, 9);
                const regA = getRegionForDayHour(d, 15);
                const regE = getRegionForDayHour(d, 20);
                const m = getSlotWeatherForRegion(regM, dateStr, 6, 12);
                const a = getSlotWeatherForRegion(regA, dateStr, 12, 18);
                const e = getSlotWeatherForRegion(regE, dateStr, 18, 24);
                return [
                  m ? { key: 'morning', label: `D${d} 🌅`, region: regM, ...m } : null,
                  a ? { key: 'afternoon', label: `D${d} ☀️`, region: regA, ...a } : null,
                  e ? { key: 'evening', label: `D${d} 🌙`, region: regE, ...e } : null,
                ].filter(Boolean);
              })() : [];

              // 총 카드 수에 따라 카드 너비 동적 계산 (헤더 좌우 여백 ~120px 제외)
              const totalCards = tripDays.length + expandedSlots.length + (expandedSlots.length > 0 ? 1 : 0);
              const cardW = Math.max(32, Math.min(44, Math.floor((window.innerWidth - 120) / Math.max(totalCards, 1)) - 4));
              const cardStyle = { minWidth: `${cardW}px`, width: `${cardW}px` };

              const cardCls = `cursor-pointer flex flex-col items-center justify-center px-0.5 py-1 rounded-md border shadow-sm flex-shrink-0 relative transition-all duration-200 active:scale-95`;
              const baseCard = isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-200 hover:bg-slate-50';
              const lbl = `absolute top-0.5 left-0.5 text-[6px] font-black leading-none ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`;

              return (
                <div
                  className="flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto custom-scrollbar select-none cursor-grab active:cursor-grabbing"
                  onMouseDown={(e) => {
                    const el = e.currentTarget;
                    const d = weatherDragRef.current;
                    d.down = true; d.didDrag = false;
                    d.startX = e.pageX; d.scrollLeft = el.scrollLeft;
                  }}
                  onMouseUp={() => { weatherDragRef.current.down = false; }}
                  onMouseLeave={() => { weatherDragRef.current.down = false; }}
                  onMouseMove={(e) => {
                    const d = weatherDragRef.current;
                    if (!d.down) return;
                    e.preventDefault();
                    const dx = e.pageX - d.startX;
                    if (Math.abs(dx) > 4) d.didDrag = true;
                    e.currentTarget.scrollLeft = d.scrollLeft - dx;
                  }}
                >
                  {/* Day 요약 카드들 */}
                  {tripDays.map(d => {
                    const dateStr = getDateStringForDay(d);
                    const fc = forecast.find(f => f && f.date === dateStr);
                    const info = fc ? getWeatherInfo(fc.code) : null;
                    const isExpanded = expandedWeatherDay === d;
                    return (
                      <div key={d}
                        onClick={() => { if (weatherDragRef.current.didDrag) return; setExpandedWeatherDay(isExpanded ? null : d); if (!hourlyWeatherCache[fallbackCityKey]) handleWeatherDayClick(d); }}
                        style={cardStyle}
                        className={`${cardCls} ${baseCard} ${isExpanded ? (isDarkMode ? 'border-indigo-500 bg-indigo-900/40' : 'border-indigo-400 bg-indigo-50') : ''}`}>
                        <span className={`${lbl} ${isExpanded ? 'text-indigo-400' : ''}`}>D{d}</span>
                        <span className="text-[10px] mt-2">{info ? info[1] : '—'}</span>
                        {fc && <span className={`text-[7px] font-black ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{fc.max}°</span>}
                      </div>
                    );
                  })}
                  {/* 구분선 */}
                  {expandedSlots.length > 0 && <div className={`w-px h-6 flex-shrink-0 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />}
                  {/* 펼쳐진 시간대 카드들 */}
                  {expandedSlots.map(slot => (
                    <div key={slot.key} onClick={() => { if (weatherDragRef.current.didDrag) return; setIsWeatherModalOpen(true); }}
                      style={cardStyle}
                      className={`${cardCls} ${isDarkMode ? 'bg-indigo-900/30 border-indigo-700' : 'bg-indigo-50 border-indigo-200'}`}>
                      <span className={`${lbl} text-indigo-400`}>{slot.label}</span>
                      <span className="text-[10px] mt-2">{slot[1]}</span>
                      <span className={`text-[7px] font-black ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{slot.temp}°</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {isSharedTripActive && (
              <button onClick={handleCloneSharedTrip} className={`hidden md:flex px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-300 bg-orange-500 text-white shadow-sm hover:bg-orange-600 active:scale-95 items-center mr-1`}>
                <span className="mr-1">💾</span> 내 일정으로 복사(가져오기)
              </button>
            )}
            <button onClick={() => changeTab('dashboard')} className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-300 ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <LayoutDashboard className="w-3.5 h-3.5" /><span className="hidden sm:inline">대쉬보드</span>
            </button>
            <button onClick={() => changeTab('plan')} className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-300 ${activeTab === 'plan' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <Calendar className="w-3.5 h-3.5" /><span className="hidden sm:inline">일정</span>
            </button>
            <button onClick={() => changeTab('map')} className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-300 ${activeTab === 'map' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <Map className="w-3.5 h-3.5" /><span className="hidden sm:inline">지도</span>
            </button>
          </div>
        </header>

        <div className="flex-1 w-full flex flex-col relative z-0 min-h-max">
          
          {/* --- Dashboard Tab --- */}
          <DashboardTab
            activeTab={activeTab} textMain={textMain} textMuted={textMuted} isDarkMode={isDarkMode} cardBg={cardBg}
            fetchRealTimeRates={fetchRealTimeRates} loadingRates={loadingRates} errorRates={errorRates} ratesUpdatedAt={ratesUpdatedAt}
            handleOpenGoogleTranslate={handleOpenGoogleTranslate} setIsExpenseModalOpen={setIsExpenseModalOpen} totalExpenseKrw={totalExpenseKrw}
            amount={amount} focusedCurrency={focusedCurrency} setFocusedCurrency={setFocusedCurrency} handleInputChange={handleInputChange} getInputValue={getInputValue} getPlaceholder={getPlaceholder}
            renderFlightCards={renderFlightCards} panelRatio={panelRatio} handleDragStart={handleDragStart}
            dashboardDay={dashboardDay} setDashboardDay={setDashboardDay} getDayDateString={getDayDateString} activeRegionForDay={activeRegionForDay}
            setIsDashboardPackingOpen={setIsDashboardPackingOpen} setIsDashboardShoppingOpen={setIsDashboardShoppingOpen}
            tripDays={tripDays} getWeatherForDay={getWeatherForDay} todayPlans={todayPlans}
            activeMobileCard={activeMobileCard} setActiveMobileCard={setActiveMobileCard} setSelectedPlanInfo={setSelectedPlanInfo}
            handleEditPlanClick={handleEditPlanClick} handleDeletePlan={handleDeletePlan} changeTab={changeTab} displayCityName={displayCityName} openPhotoViewer={openPhotoViewer}
          />

          {/* --- Plan Tab --- */}
          <div className={`p-2 sm:p-4 pt-3 pb-4 flex flex-col transition-opacity duration-300 ${activeTab === 'plan' ? 'block opacity-100 z-10 flex-1' : 'hidden opacity-0 -z-10 pointer-events-none'}`}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 sm:mb-3 px-1 gap-2 flex-shrink-0">
              <h2 className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 tracking-tight transition-colors duration-300 ${textMain}`}>
                <PenLine className="w-3.5 h-3.5" /> 꼼꼼하게 채우는 여행 일기
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
                }} className={`flex items-center gap-1 border shadow-sm px-1.5 sm:px-2 py-1 h-7 sm:h-8 rounded-lg text-[8px] sm:text-[9px] font-bold transition-all duration-300 active:scale-95 ${isDarkMode ? 'bg-indigo-900/40 text-indigo-300 border-indigo-500/50 hover:bg-indigo-900/60' : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'}`}>
                   <Plane className="w-3 h-3" /> 교통/항공권
                </button>
                <div className={`relative z-30 flex items-center px-1.5 sm:px-2 py-1 h-7 sm:h-8 rounded-lg transition-colors duration-300 ${cardBg}`}>
                  <span className={`text-[8px] sm:text-[9px] font-bold mr-1 sm:mr-1.5 flex-shrink-0 transition-colors duration-300 ${textMuted}`}>국가 <Globe className="w-3 h-3 inline" /></span>
                  <div className="flex-1 relative w-14 sm:w-20 h-full flex items-center">
                    <SelectOrInput
                      inputId="global-country-input"
                      value={globalPlanCountry} manualValue={globalManualCountry} isDarkMode={isDarkMode} appTheme={appTheme}
                      options={Object.keys(REGIONS_BY_COUNTRY)}
                      onChangeSelect={e => {
                         const val = e.target.value;
                         setGlobalPlanCountry(val); setGlobalPlanRegion(""); setGlobalManualCountry(""); setGlobalManualRegion("");
                         try { localStorage.setItem('my_travel_global_country', val); } catch(e){}
                      }}
                      onChangeManual={val => setGlobalManualCountry(val)}
                      onCancelManual={() => { setGlobalPlanCountry(""); setGlobalManualCountry(""); }}
                    />
                  </div>
                </div>
                <div className={`relative z-30 flex items-center px-1.5 sm:px-2 py-1 h-7 sm:h-8 rounded-lg transition-colors duration-300 ${cardBg}`}>
                  <span className={`text-[8px] sm:text-[9px] font-bold mr-1 sm:mr-1.5 flex-shrink-0 transition-colors duration-300 ${textMuted}`}>지역 <MapPin className="w-3 h-3 inline" /></span>
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
                         if (manualRegionSaveTimer.current) clearTimeout(manualRegionSaveTimer.current);
                         if (val) {
                            manualRegionSaveTimer.current = setTimeout(() => {
                              setDisplayCityName(val);
                              saveToDb({ display_city_name: val });
                            }, 600);
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
              <PlanFormPanel
                planAddFormRef={planAddFormRef} textMuted={textMuted} isDarkMode={isDarkMode} inputBg={inputBg} appTheme={appTheme}
                maxDay={maxDay} addDay={addDay} removeDay={removeDay} tripDays={tripDays}
                newDay={newDay} setNewDay={setNewDay}
                planCountry={planCountry} setPlanCountry={setPlanCountry} manualCountry={manualCountry} setManualCountry={setManualCountry}
                planRegion={planRegion} setPlanRegion={setPlanRegion} manualRegion={manualRegion} setManualRegion={setManualRegion}
                newTheme={newTheme} setNewTheme={setNewTheme}
                newTime={newTime} setNewTime={setNewTime} handleTimeInput={handleTimeInput}
                newPlace={newPlace} setNewPlace={setNewPlace}
                currentRestaurants={currentRestaurants} kakaoCategoryResults={kakaoCategoryResults}
                pinSelectOpen={pinSelectOpen} setPinSelectOpen={setPinSelectOpen}
                newLocalName={newLocalName} setNewLocalName={setNewLocalName}
                newFeatures={newFeatures} setNewFeatures={setNewFeatures} handleSavePlan={handleSavePlan}
                newPlanPhotos={newPlanPhotos} setNewPlanPhotos={setNewPlanPhotos}
                planFileInputRef={planFileInputRef} handlePlanPhotoUpload={handlePlanPhotoUpload}
                supabaseClient={supabaseClient} appUserId={appUserId} activeTripId={activeTripId}
                newIsAccommodation={newIsAccommodation} setNewIsAccommodation={setNewIsAccommodation}
                newAccommodationDays={newAccommodationDays} setNewAccommodationDays={setNewAccommodationDays}
                editingPlanId={editingPlanId} resetPlanForm={resetPlanForm}
                setIsPackingModalOpen={setIsPackingModalOpen} setIsShoppingModalOpen={setIsShoppingModalOpen}
                globalPlanCountry={globalPlanCountry} globalManualCountry={globalManualCountry} globalPlanRegion={globalPlanRegion} globalManualRegion={globalManualRegion}
              />

              <PlanTimelinePanel
                isDarkMode={isDarkMode} textMuted={textMuted} textMain={textMain} tripDays={tripDays} getDayDateString={getDayDateString} planTimeline={planTimeline}
                activeMobileCard={activeMobileCard} setActiveMobileCard={setActiveMobileCard} guardPlanForm={guardPlanForm} loadPlanToForm={loadPlanToForm}
                handleEditPlanClick={handleEditPlanClick} handleDeletePlan={handleDeletePlan} handleCopyLocalName={handleCopyLocalName} openPhotoViewer={openPhotoViewer}
              />
            </div>
          </div>

          {/* --- Map Tab --- */}
          {/* --- Archive (Travel History) Tab --- */}
          <ArchiveTab
            activeTab={activeTab} trips={trips} archiveFilterLocation={archiveFilterLocation} setArchiveFilterLocation={setArchiveFilterLocation}
            textMain={textMain} textMuted={textMuted} cardBg={cardBg} isDarkMode={isDarkMode} activeTripId={activeTripId} handleSwitchTrip={handleSwitchTrip} setActiveTab={setActiveTab}
            setTripToDelete={setTripToDelete}
          />
          <MapTab
            activeTab={activeTab} mapActiveDays={mapActiveDays} toggleMapDay={toggleMapDay} tripDays={tripDays} getDayColor={getDayColor} isDarkMode={isDarkMode}
            myPinsThemeFilter={myPinsThemeFilter} setMyPinsThemeFilter={setMyPinsThemeFilter}
            isKakaoMap={isKakaoMap} kakaoCategory={kakaoCategory} setKakaoCategory={setKakaoCategory}
            markerSearchQuery={markerSearchQuery} setMarkerSearchQuery={setMarkerSearchQuery} kakaoMapInstanceRef={kakaoMapInstanceRef} kakaoSearchMarkersRef={kakaoSearchMarkersRef} showToast={showToast}
            filteredMarkers={filteredMarkers} handleMarkerSearchSelect={handleMarkerSearchSelect} planTimeline={planTimeline} textMuted={textMuted}
            showMapRoute={showMapRoute} setShowMapRoute={setShowMapRoute} setIsMyPinsModalOpen={setIsMyPinsModalOpen}
            isPinMode={isPinMode} setIsPinMode={setIsPinMode}
            showMapPhotos={showMapPhotos} setShowMapPhotos={setShowMapPhotos}
            showMapLabels={showMapLabels} setShowMapLabels={setShowMapLabels}
            handleFindMyLocation={handleFindMyLocation}
            setNavOrigin={setNavOrigin} setNavDest={setNavDest} setIsNavModalOpen={setIsNavModalOpen}
            cardBg={cardBg} isKakaoMapLoaded={isKakaoMapLoaded} isLeafletLoaded={isLeafletLoaded} setMapTypeOverride={setMapTypeOverride}
            mapContainerRef={mapContainerRef} kakaoMapContainerRef={kakaoMapContainerRef}
          />
        </div>
      </main>

      <DynamicStyles fontScale={fontScale} appTextColor={appTextColor} isDarkMode={isDarkMode} />
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
