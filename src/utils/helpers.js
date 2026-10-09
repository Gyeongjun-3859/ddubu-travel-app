import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { AUTH_EMAIL_DOMAIN, REGIONS_BY_COUNTRY, COUNTRY_FLAG } from './constants';

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
    const byId = list.find(r => S(r.id) === S(plan.pinId));
    if (byId) return byId;
  }
  const name = S(plan.place).trim();
  if (!name) return null;
  const claimed = new Set((Array.isArray(plans) ? plans : []).filter(p => p && S(p.id) !== S(plan.id) && p.pinId).map(p => S(p.pinId)));
  const candidates = list.filter(r => S(r.name).trim() === name);
  return candidates.find(r => !claimed.has(S(r.id))) || candidates[0] || null;
}

// 이 핀에 연결된 일정들 — 핀 번호로 연결된 일정 + (번호 없는 옛 일정 중) 이름이 같은 일정
export function findPlansForPin(pin, plans) {
  if (!pin) return [];
  const name = S(pin.name).trim();
  return (Array.isArray(plans) ? plans : []).filter(Boolean).filter(p =>
    (p.pinId != null && p.pinId !== '') ? S(p.pinId) === S(pin.id) : (name !== '' && S(p.place).trim() === name)
  );
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

export function compressImage(file, callback) {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (e) => {
    const img = new Image();
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
  reader.readAsDataURL(file);
  reader.onload = (e) => {
    const img = new Image();
    img.src = e.target.result;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scaleSize = Math.min(1600, img.width) / img.width;
      canvas.width = Math.min(1600, img.width);
      canvas.height = img.height * scaleSize;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(async (blob) => {
        if (!blob) { callback(''); return; }
        try {
          const path = `${folderId || appUserId}/${Date.now()}_${Math.random().toString(36).slice(2, 10)}.jpg`;
          const { error } = await supabaseClient.storage.from('trip-photos').upload(path, blob, { contentType: 'image/jpeg' });
          if (error) throw error;
          const { data } = supabaseClient.storage.from('trip-photos').getPublicUrl(path);
          callback(data?.publicUrl || '');
        } catch (err) {
          console.error('사진 업로드 실패', err);
          callback('');
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
