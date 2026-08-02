import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { AUTH_EMAIL_DOMAIN, REGIONS_BY_COUNTRY, COUNTRY_FLAG } from './constants';

export function toAuthEmail(appUserId) {
  return `${appUserId}${AUTH_EMAIL_DOMAIN}`;
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
