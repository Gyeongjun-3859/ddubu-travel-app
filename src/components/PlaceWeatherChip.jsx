import React from 'react';
import { getWeatherInfo } from '../utils/helpers';
import { usePlaceWeather } from '../utils/placeWeather';

// 일정 카드의 작은 날씨 표시 — 그 장소(좌표·고도) 그날의 날씨. 도시 날씨보다 5도 이상 추우면 옷차림 경고.
// cityDay: 같은 날 도시 예보 { max, min } (대시보드 날씨와 같은 기준) — 비교용
const PlaceWeatherChip = ({ lat, lng, date, cityDay }) => {
  const w = usePlaceWeather(lat, lng, date);
  if (!w) return null;
  const [label, icon] = getWeatherInfo(w.code);
  const colder = cityDay && typeof cityDay.max === 'number' ? cityDay.max - w.max : 0;
  return (
    <span className="inline-flex flex-wrap items-center gap-1 text-[11px] font-semibold">
      <span className="text-slate-500" title={`${label}${w.elevation != null ? ` · 해발 ${w.elevation.toLocaleString()}m` : ''}`}>
        {icon} {w.min}° / {w.max}°
      </span>
      {colder >= 5 && (
        <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-700">
          🧥 시내보다 {colder}도 추워요{w.elevation != null ? ` (해발 ${w.elevation.toLocaleString()}m)` : ''}
        </span>
      )}
    </span>
  );
};

export default PlaceWeatherChip;
