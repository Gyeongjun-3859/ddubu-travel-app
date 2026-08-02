import React, { useEffect, useRef, useState } from 'react';

// ODsay 경로의 실제 좌표(passStopList)를 카카오맵 위에 노선 색깔 그대로 그려주는 미리보기
const RouteMapPreview = ({ route, fromCoord, toCoord }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const overlaysRef = useRef([]);
  const [sdkReady, setSdkReady] = useState(Boolean(window.kakao && window.kakao.maps));

  useEffect(() => {
    if (sdkReady) return;
    const poll = setInterval(() => {
      if (window.kakao && window.kakao.maps) { setSdkReady(true); clearInterval(poll); }
    }, 300);
    return () => clearInterval(poll);
  }, [sdkReady]);

  useEffect(() => {
    if (!sdkReady || !route || !mapRef.current) return;
    const kakao = window.kakao;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new kakao.maps.Map(mapRef.current, {
        center: new kakao.maps.LatLng(fromCoord?.lat || 37.5665, fromCoord?.lng || 126.9780),
        level: 6,
      });
    }
    const map = mapInstanceRef.current;

    overlaysRef.current.forEach(o => o.setMap(null));
    overlaysRef.current = [];

    const bounds = new kakao.maps.LatLngBounds();
    const toLatLng = (c) => new kakao.maps.LatLng(c.lat, c.lng);

    route.segments.forEach(seg => {
      if (!seg.coords || seg.coords.length < 2) return;
      const path = seg.coords.map(toLatLng);
      path.forEach(p => bounds.extend(p));
      const polyline = new kakao.maps.Polyline({
        path,
        strokeWeight: seg.trafficType === 3 ? 3 : 6,
        strokeColor: seg.trafficType === 3 ? '#94a3b8' : seg.color,
        strokeOpacity: seg.trafficType === 3 ? 0.7 : 0.9,
        strokeStyle: seg.trafficType === 3 ? 'shortdash' : 'solid',
      });
      polyline.setMap(map);
      overlaysRef.current.push(polyline);
    });

    if (fromCoord) {
      const m = new kakao.maps.Marker({ position: toLatLng(fromCoord) });
      m.setMap(map); overlaysRef.current.push(m);
      bounds.extend(toLatLng(fromCoord));
    }
    if (toCoord) {
      const m = new kakao.maps.Marker({ position: toLatLng(toCoord) });
      m.setMap(map); overlaysRef.current.push(m);
      bounds.extend(toLatLng(toCoord));
    }

    if (!bounds.isEmpty()) map.setBounds(bounds, 30);
  }, [sdkReady, route, fromCoord, toCoord]);

  if (!sdkReady) {
    return <div className="w-full h-40 rounded-lg flex items-center justify-center text-[9px] text-slate-400 bg-slate-100 dark:bg-slate-800">지도를 불러오는 중...</div>;
  }
  return <div ref={mapRef} className="w-full h-40 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600" />;
};

export default RouteMapPreview;
