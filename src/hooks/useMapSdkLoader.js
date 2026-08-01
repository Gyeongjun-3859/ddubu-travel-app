import { useState, useEffect } from 'react';

// Leaflet(구글 대체) + 카카오맵 SDK 스크립트를 로드하고 준비 상태를 알려줌
export function useMapSdkLoader() {
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const [isKakaoMapLoaded, setIsKakaoMapLoaded] = useState(false);

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

  // 카카오맵 SDK 로드
  useEffect(() => {
    // 이미 로드 완료된 경우
    if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
      setIsKakaoMapLoaded(true);
      return;
    }
    // 이미 script 태그가 있으면 폴링으로 대기
    if (document.querySelector('script[src*="dapi.kakao.com"]')) {
      const poll = setInterval(() => {
        if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
          clearInterval(poll);
          setIsKakaoMapLoaded(true);
        }
      }, 200);
      setTimeout(() => clearInterval(poll), 20000);
      return;
    }
    // autoload=false + kakao.maps.load() 콜백 방식
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=f839f7d670ba8f3c04271e117d3f93b9&libraries=services&autoload=false`;
    script.async = false;
    script.onload = () => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          setIsKakaoMapLoaded(true);
        });
      }
    };
    script.onerror = () => {
      setTimeout(() => {
        const s2 = document.createElement('script');
        s2.src = script.src;
        s2.async = false;
        s2.onload = script.onload;
        document.head.appendChild(s2);
      }, 3000);
    };
    document.head.appendChild(script);
  }, []);

  return { isLeafletLoaded, isKakaoMapLoaded };
}
