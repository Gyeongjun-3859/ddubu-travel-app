// 나라별로 현지에서 더 잘 되는 지도·택시 앱 열기.
// 카자흐스탄·키르기스스탄·우즈베키스탄은 구글 지도보다 2GIS가 훨씬 정확하고(가게 입구·버스까지), 택시는 Yandex Go를 쓴다.
// 휴대폰에 앱이 깔려 있으면 앱이 열리고, 없으면 웹사이트(또는 앱 설치 화면)로 간다.

export const LOCAL_APP_COUNTRIES = ['카자흐스탄', '키르기스스탄', '우즈베키스탄', '러시아'];
export const hasLocalApps = (country) => LOCAL_APP_COUNTRIES.includes(country);

const num = (v) => Number(v).toFixed(6);

// 2GIS: 그 장소 열기. 좌표만 주면 2GIS가 '알마티(도시)'로 잡아 버려서, 현지어 이름으로 검색하고 지도는 그 좌표에 맞춘다
// (검색 결과에서 장소를 누르면 경로·전화·리뷰까지 2GIS에서 바로). 이름이 없으면 좌표 지점으로.
export const twoGisPlaceUrl = (lat, lng, name) => name
  ? `https://2gis.kz/search/${encodeURIComponent(name)}?m=${num(lng)}%2C${num(lat)}%2F17`
  : `https://2gis.kz/geo/${num(lng)}%2C${num(lat)}`;
// Yandex Go: 도착지를 정해 택시 부르기 화면 (Yandex 공식 안내의 앱 연결 주소)
export const yandexGoUrl = (lat, lng) =>
  `https://3.redirect.appmetrica.yandex.com/route?end-lat=${num(lat)}&end-lon=${num(lng)}&appmetrica_tracking_id=1178268795219780156`;
