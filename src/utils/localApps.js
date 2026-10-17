// 나라별로 현지에서 더 잘 되는 지도·택시 앱 열기.
// 카자흐스탄·키르기스스탄·우즈베키스탄은 구글 지도보다 2GIS가 훨씬 정확하고(가게 입구·버스까지), 택시는 Yandex Go를 쓴다.
// 휴대폰에 앱이 깔려 있으면 앱이 열리고, 없으면 웹사이트(또는 앱 설치 화면)로 간다.

import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

export const LOCAL_APP_COUNTRIES = ['카자흐스탄', '키르기스스탄', '우즈베키스탄', '러시아'];
export const hasLocalApps = (country) => LOCAL_APP_COUNTRIES.includes(country);

const num = (v) => Number(v).toFixed(6);

// 2GIS: 그 장소 열기. 좌표만 주면 2GIS가 '알마티(도시)'로 잡아 버려서, 현지어 이름으로 검색하고 지도는 그 좌표에 맞춘다
// (검색 결과에서 장소를 누르면 경로·전화·리뷰까지 2GIS에서 바로). 이름이 없으면 좌표 지점으로.
export const twoGisPlaceUrl = (lat, lng, name) => name
  ? `https://2gis.kz/search/${encodeURIComponent(name)}?m=${num(lng)}%2C${num(lat)}%2F17`
  : `https://2gis.kz/geo/${num(lng)}%2C${num(lat)}`;
// Yandex Go: 도착지를 정해 택시 부르기 화면 (Yandex 공식 안내의 앱 연결 주소) — PC·아이폰용
const YANDEX_GO_TRACKING = '1178268795219780156';
const YANDEX_GO_PACKAGE = 'ru.yandex.taxi';
const yandexGoQuery = (lat, lng) => `end-lat=${num(lat)}&end-lon=${num(lng)}&appmetrica_tracking_id=${YANDEX_GO_TRACKING}`;
export const yandexGoUrl = (lat, lng) => `https://3.redirect.appmetrica.yandex.com/route?${yandexGoQuery(lat, lng)}`;

// 안드로이드에서는 위 경유 주소가 구글 플레이로 빠지면서 도착지가 사라진다 → 앱을 바로 부른다.
// <a href={yandexGoUrl(..)} onClick={(e) => openYandexGo(e, lat, lng)}> 로 쓴다 (안드로이드가 아니면 href 그대로).
export const openYandexGo = (e, lat, lng) => {
  if (!/Android/i.test(navigator.userAgent || '')) return;
  e.preventDefault();
  const query = yandexGoQuery(lat, lng);
  if (Capacitor.isNativePlatform()) {
    // 우리 앱(APK): 앱 주소로 직접 열고, 1.5초 안에 앱으로 안 넘어가면(앱 없음) 플레이 스토어
    // (앱이 뒤로 가는 순간 취소 — 안 그러면 돌아왔을 때 멈춰 있던 타이머가 뒤늦게 플레이 스토어를 띄운다)
    let pauseListener = null;
    const fallback = setTimeout(() => {
      pauseListener?.then((h) => h.remove());
      window.location.href = `market://details?id=${YANDEX_GO_PACKAGE}`;
    }, 1500);
    const cancel = () => { clearTimeout(fallback); pauseListener?.then((h) => h.remove()); };
    pauseListener = CapacitorApp.addListener('pause', cancel);
    window.addEventListener('blur', cancel, { once: true });
    document.addEventListener('visibilitychange', cancel, { once: true });
    window.location.href = `yandextaxi://route?${query}`;
  } else {
    // 휴대폰 크롬: 앱이 있으면 도착지 채워 열고, 없으면 크롬이 알아서 플레이 스토어로
    const store = encodeURIComponent(`https://play.google.com/store/apps/details?id=${YANDEX_GO_PACKAGE}`);
    window.location.href = `intent://route?${query}#Intent;scheme=yandextaxi;package=${YANDEX_GO_PACKAGE};S.browser_fallback_url=${store};end`;
  }
};
