import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { AUTH_EMAIL_DOMAIN, REGIONS_BY_COUNTRY, COUNTRY_FLAG, COUNTRY_CURRENCY } from './constants';

// 나라 → 통화 { code, sym }. 대시보드 환율 계산기와 같은 표(COUNTRY_CURRENCY)를 쓴다.
// 예전엔 정산 창/일정 상세가 각자 몇 나라만 따로 적어 둬서, 일정 상세에선 태국·베트남·대만이 달러로 계산됐다.
export function currencyForCountry(country) {
  if (country === '한국') return { code: 'KRW', sym: '₩' };
  const c = COUNTRY_CURRENCY[country];
  return c ? { code: c.code, sym: c.symbol } : { code: 'USD', sym: '$' };
}

// 현지 금액 → 원화. 환율을 아직 못 받았으면 0 (엉뚱한 고정 환율로 계산하지 않음)
export function localToKrw(amount, curCode, rates) {
  const n = Number(amount);
  if (!amount || isNaN(n)) return 0;
  if (curCode === 'KRW') return Math.round(n);
  if (!rates || !rates.KRW || !rates[curCode]) return 0;
  return Math.round(n * (rates.KRW / rates[curCode]));
}

export function toAuthEmail(appUserId) {
  return `${appUserId}${AUTH_EMAIL_DOMAIN}`;
}

// Supabase Auth는 비밀번호 최소 6자를 요구하지만, 이 앱 자체는 예전부터 4자 이상만 허용해왔다.
// 사용자가 기억하는 원래 비밀번호는 그대로 두고, Supabase Auth로 보낼 때만 내부적으로 6자 이상이 되도록
// 채워서 보낸다(항상 같은 값으로 채우므로 매번 동일하게 재현됨). 레거시 비밀번호 확인(bcrypt)에는 영향 없음.
export function toAuthPassword(pw) {
  const p = String(pw || '');
  return p.length >= 6 ? p : (p + '000000').slice(0, 6);
}

export function S(val) {
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

// [일정 ↔ 핀 연결] 예전엔 "이름이 같으면 같은 장소"로만 연결해서, 일정 이름을 바꾸면 연결이 끊기고
// 이름이 같은 핀이 여럿이면 한꺼번에 영향을 받았다. 이제 일정에 연결된 핀 번호(plan.pinId)를 우선 쓰고,
// 번호가 없는 옛 데이터만 이름으로 찾는다. (옛 일정은 수정/일기 저장 때 찾은 핀 번호가 채워진다)
// plans를 넘기면, 이름으로 찾을 때 "다른 일정이 이미 번호로 연결해 둔 핀"은 건너뛴다(같은 이름 핀이 여럿일 때 남의 핀을 잡지 않게).
export function findPinForPlan(plan, pins, plans) {
  if (!plan) return null;
  const list = (Array.isArray(pins) ? pins : []).filter(Boolean);
  if (plan.pinId != null && plan.pinId !== '') {
    // 번호로 연결된 핀이 지워졌으면 "연결된 핀 없음"이다. 이름으로 다시 찾으면 이름이 같은
    // 다른 일정의 핀을 가져가 고쳐 버렸다(4차 테스트 H: 두 일정이 한 핀을 같이 쓰게 됨).
    return list.find(r => S(r.id) === S(plan.pinId)) || null;
  }
  const name = S(plan.place).trim();
  if (!name) return null;
  const claimed = new Set((Array.isArray(plans) ? plans : []).filter(p => p && S(p.id) !== S(plan.id) && p.pinId).map(p => S(p.pinId)));
  const candidates = list.filter(r => S(r.name).trim() === name);
  // 다른 일정이 번호로 연결해 둔 핀은 절대 가져가지 않는다 (예전엔 남는 게 없으면 그 핀이라도 잡았다)
  return candidates.find(r => !claimed.has(S(r.id))) || null;
}

// 이 핀에 연결된 일정들 — 핀 번호로 연결된 일정 + (번호 없는 옛 일정 중) 이름이 같은 일정
export function findPlansForPin(pin, plans) {
  if (!pin) return [];
  const name = S(pin.name).trim();
  return (Array.isArray(plans) ? plans : []).filter(Boolean).filter(p =>
    (p.pinId != null && p.pinId !== '') ? S(p.pinId) === S(pin.id) : (name !== '' && S(p.place).trim() === name)
  );
}

// 일정의 Day 번호. 0 = 보관함(Day 미정). 예전엔 `parseInt(p.day || 1)`로 읽어서 0(보관함)이 1로 바뀌어
// 보관함에 넣은 장소가 D1 목록에 줄줄이 섞였다(4차 E). day가 아예 없는 옛 일정만 1로 본다.
export function planDayNum(plan) {
  if (!plan) return 1;
  if (plan.day === 0 || plan.day === '0') return 0;
  const n = parseInt(plan.day);
  return isNaN(n) ? 1 : n;
}

// 보관함 핀 — 어느 Day(1 이상)에도 들어가지 않은 핀 (연결된 일정이 없거나, 보관함(Day 0) 일정에만 연결됨)
export function isArchivedPin(pin, plans) {
  return !findPlansForPin(pin, plans).some(p => planDayNum(p) >= 1 && !isExpenseRecord(p));
}

// 여행정산에서 넣은 지출 기록인지 — 지출 기록은 일정 목록(plan_timeline)에 일정 모양으로 저장되지만
// (basic-exp-*, manual-exp-*) 실제 일정이 아니므로 일정 화면에선 숨기고, 정산 합계에선 한 번만 센다.
export function isExpenseRecord(plan) {
  const id = S(plan && plan.id);
  return id.startsWith('basic-exp-') || id.startsWith('manual-exp-');
}

// 지도 마커/팝업/인포윈도우처럼 "HTML 문자열"로 만드는 곳에 사용자 입력(핀 이름, 메모, 사진 URL)이나
// 외부 검색 결과(장소명)를 넣을 때 반드시 거친다. 안 거치면 이름에 넣은 <태그>가 코드로 실행되고,
// 공유 여행에선 상대가 넣은 이름이 내 화면에서 실행될 수 있다.
// 카카오 장소 분류 코드 → 핀 테마 (카테고리 검색에서 고른 장소를 핀으로 저장할 때 테마 자동 선택)
export function themeFromKakaoCategory(code) {
  return ({ FD6: '식당', CE7: '디저트', AT4: '관광지', CT1: '관광지', AD5: '숙소', CS2: '쇼핑', MT1: '쇼핑' })[code] || '기타';
}

// 구글 장소 분류(primaryType·types) → 핀 테마 (구글 지도에서 누른 장소를 핀으로 만들 때 테마 자동 선택)
const GOOGLE_TYPE_THEME = [
  ['숙소', /^(lodging|hotel|motel|hostel|resort_hotel|guest_house|bed_and_breakfast|inn|japanese_inn|budget_japanese_inn|private_guest_room|campground|camping_cabin|cottage|farmstay|extended_stay_hotel)$/],
  ['디저트', /^(cafe|coffee_shop|bakery|dessert_shop|dessert_restaurant|ice_cream_shop|tea_house|confectionery|candy_store|chocolate_shop|donut_shop|juice_shop|cat_cafe|dog_cafe)$/],
  ['식당', /(_restaurant|^restaurant|^food_court|^meal_takeaway|^meal_delivery|^diner|^bar|^pub|^izakaya|^bistro|^brunch_restaurant|^steak_house|^sandwich_shop|^deli)$/],
  ['관광지', /^(tourist_attraction|museum|art_gallery|park|national_park|amusement_park|water_park|aquarium|zoo|historical_landmark|historical_place|monument|cultural_landmark|place_of_worship|church|hindu_temple|buddhist_temple|shinto_shrine|mosque|synagogue|observation_deck|botanical_garden|garden|castle|beach|plaza|scenic_spot|visitor_center|performing_arts_theater|stadium)$/],
  ['쇼핑', /(_store|^shopping_mall|^market|^supermarket|^department_store|^convenience_store|^gift_shop|^grocery_store|^outlet_mall)$/],
];
export function themeFromGoogleTypes(primaryType, types) {
  const list = [primaryType, ...(Array.isArray(types) ? types : [])].filter(Boolean);
  // 대표 분류부터 차례로 보고 처음 맞는 테마 (카페 겸 식당이면 대표 분류가 우선)
  for (const t of list) {
    const hit = GOOGLE_TYPE_THEME.find(([, re]) => re.test(t));
    if (hit) return hit[0];
  }
  return '기타';
}

export function escapeHtml(val) {
  return S(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function getWeatherInfo(code) {
  if (code === 0) return ["맑음", "☀️"];
  if ([1, 2, 3].includes(code)) return ["흐림", "🌤️"];
  if ([45, 48].includes(code)) return ["안개", "🌫️"];
  if (code >= 51 && code <= 67) return ["비", "☔"];
  if (code >= 71 && code <= 77) return ["눈", "❄️"];
  if (code >= 80 && code <= 99) return ["폭우/뇌우", "⛈️"];
  return ["평온", "☁️"];
}

export const getFlagForCity = (city) => {
  for (const [country, regions] of Object.entries(REGIONS_BY_COUNTRY)) {
    if (regions.includes(city)) return COUNTRY_FLAG[country] || '';
  }
  return '';
};

// 외부 URL 열기 - 네이티브는 Browser 플러그인, 웹은 window.open
export async function openExternalUrl(url) {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url });
  } else {
    window.open(url, '_blank');
  }
}

// 구글 맵 길 안내 실행
export function openGoogleMapsNav(lat, lng, mode = 'driving') {
  const dest = `${lat},${lng}`;
  const dirMode = mode === 'driving' ? 'driving' : mode === 'transit' ? 'transit' : 'walking';
  const url = `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=${dirMode}`;
  openExternalUrl(url);
}

// 사진 처리/업로드가 실패하면 빈 값('')을 넘기지 않고 이 이벤트로 알린다 (App이 받아서 안내 토스트).
// 예전엔 실패 시 callback('')이 불려 사진 칸에 빈 사진이 끼어들었고, HEIC(아이폰)처럼 브라우저가 못 읽는
// 파일은 img.onload가 안 불려 아무 반응이 없었다.
export const PHOTO_FAILED_EVENT = 'ddubu-photo-failed';
function notifyPhotoFailed(reason) {
  try { window.dispatchEvent(new CustomEvent(PHOTO_FAILED_EVENT, { detail: { reason } })); } catch (e) {}
}

export function compressImage(file, callback) {
  const reader = new FileReader();
  reader.onerror = () => notifyPhotoFailed('read');
  reader.readAsDataURL(file);
  reader.onload = (e) => {
    const img = new Image();
    img.onerror = () => notifyPhotoFailed('decode');
    img.src = e.target.result;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scaleSize = Math.min(1600, img.width) / img.width;
      canvas.width = Math.min(1600, img.width);
      canvas.height = img.height * scaleSize;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      callback(canvas.toDataURL('image/jpeg', 0.85));
    }
  };
}

// 로그인 사용자는 Supabase Storage에 업로드 후 URL만 저장 (DB 용량/속도 개선), Guest는 기존처럼 base64
export function compressAndStoreImage(supabaseClient, appUserId, folderId, file, callback) {
  if (appUserId === 'Guest' || !supabaseClient) {
    compressImage(file, callback);
    return;
  }

  const reader = new FileReader();
  reader.onerror = () => notifyPhotoFailed('read');
  reader.readAsDataURL(file);
  reader.onload = (e) => {
    const img = new Image();
    img.onerror = () => notifyPhotoFailed('decode');
    img.src = e.target.result;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scaleSize = Math.min(1600, img.width) / img.width;
      canvas.width = Math.min(1600, img.width);
      canvas.height = img.height * scaleSize;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(async (blob) => {
        if (!blob) { notifyPhotoFailed('encode'); return; }
        try {
          const path = `${folderId || appUserId}/${Date.now()}_${Math.random().toString(36).slice(2, 10)}.jpg`;
          const { error } = await supabaseClient.storage.from('trip-photos').upload(path, blob, { contentType: 'image/jpeg' });
          if (error) throw error;
          const { data } = supabaseClient.storage.from('trip-photos').getPublicUrl(path);
          if (data?.publicUrl) callback(data.publicUrl); else notifyPhotoFailed('upload');
        } catch (err) {
          console.error('사진 업로드 실패', err);
          notifyPhotoFailed('upload');
        }
      }, 'image/jpeg', 0.85);
    };
  };
}

// plan.transitRoutes = [{ fromPlace, fromIsAccommodation, notes: string[] }, ...]
// 한 일정에 여러 출발지에서 오는 이동정보를 각각 따로 저장한다(도착지가 같아도 출발지가 다르면 별개 항목).
// 구버전 데이터(transitNote/transitFromPlace 단일 필드)는 항목 1개짜리 배열로 취급해서 계속 읽을 수 있게 호환 처리.
export function getTransitRoutes(plan) {
  if (!plan) return [];
  if (Array.isArray(plan.transitRoutes)) {
    return plan.transitRoutes.filter(r => r && Array.isArray(r.notes) && r.notes.length > 0);
  }
  const legacyNotes = Array.isArray(plan.transitNote) ? plan.transitNote.filter(Boolean) : (plan.transitNote ? [plan.transitNote] : []);
  if (legacyNotes.length > 0) {
    return [{ fromPlace: S(plan.transitFromPlace || ''), fromIsAccommodation: Boolean(plan.transitFromIsAccommodation), notes: legacyNotes }];
  }
  return [];
}

// 이 plan에 저장된 모든 이동정보 문구를 한 줄로 모아서 반환(요약 표시용)
export function getTransitNotes(plan) {
  return getTransitRoutes(plan).flatMap(r => r.notes);
}

// 숙소는 화면 맨 위에 고정 표시되어 시간 순서상 위치가 없기 때문에,
// 도착지가 숙소인 이동정보는 숙소 카드가 아니라 "출발지 카드 바로 다음"에 붙여야 자연스럽다.
// 주어진 plan(출발지 후보)에서 출발해 숙소로 가는 이동정보가 있으면 { plan: 숙소plan, route: 해당 항목 }을 반환한다.
export function getAccommodationTransitFrom(plan, dayPlans) {
  if (!plan || !Array.isArray(dayPlans)) return null;
  for (const p of dayPlans) {
    if (!p || !p.isAccommodation) continue;
    const route = getTransitRoutes(p).find(r => S(r.fromPlace) && S(r.fromPlace) === S(plan.place));
    if (route) return { plan: p, route };
  }
  return null;
}
