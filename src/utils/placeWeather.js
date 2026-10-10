import { useEffect, useState } from 'react';

// 장소별 날씨 — 도시 이름 하나로 받던 날씨는 알마티 시내(약 800m) 기준이라 침불락(2,200m~)·빅 알마티 호수(2,500m)와
// 10도 넘게 차이 났다. 장소 좌표로 받으면 날씨 서비스(Open-Meteo, 무료·키 없음)가 그 자리 고도를 반영해 준다.
// 같은 자리(소수 둘째 자리 ≈ 1km)는 한 번만 받고, 휴대폰에 저장해 두어 신호 없는 산에서도 마지막 예보를 보여 준다.

const LS_KEY = 'my_travel_place_weather';
const MAX_SAVED = 60;
const TTL_MS = 3 * 3600 * 1000; // 3시간 지나면 새로 받음 (못 받으면 저장된 것)
const mem = new Map(); // 자리 → Promise<{ elevation, days: { 'YYYY-MM-DD': { code, max, min } } }>

const keyOf = (lat, lng) => `${Number(lat).toFixed(2)},${Number(lng).toFixed(2)}`;

function readSaved() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') || {}; } catch (e) { return {}; }
}
function save(key, data) {
  try {
    const all = readSaved();
    all[key] = { ...data, savedAt: Date.now() };
    const keys = Object.keys(all).sort((a, b) => (all[b].savedAt || 0) - (all[a].savedAt || 0));
    keys.slice(MAX_SAVED).forEach(k => delete all[k]);
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  } catch (e) {}
}

export function fetchPlaceWeather(lat, lng) {
  if (!isFinite(lat) || !isFinite(lng)) return Promise.resolve(null);
  const key = keyOf(lat, lng);
  const saved = readSaved()[key];
  if (saved && Date.now() - (saved.savedAt || 0) < TTL_MS) return Promise.resolve(saved);
  if (!mem.has(key)) {
    const p = (async () => {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${Number(lat).toFixed(4)}&longitude=${Number(lng).toFixed(4)}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=16`);
      if (!res.ok) throw new Error(`weather-${res.status}`);
      const d = await res.json();
      const days = {};
      (d.daily && Array.isArray(d.daily.time) ? d.daily.time : []).forEach((t, i) => {
        days[t] = { code: d.daily.weather_code[i], max: Math.round(d.daily.temperature_2m_max[i]), min: Math.round(d.daily.temperature_2m_min[i]) };
      });
      const out = { elevation: typeof d.elevation === 'number' ? Math.round(d.elevation) : null, days };
      save(key, out);
      return out;
    })().catch(e => { mem.delete(key); console.warn('[장소 날씨 실패]', e && e.message); return saved || null; });
    mem.set(key, p);
  }
  return mem.get(key);
}

// 그 장소·그 날짜의 날씨 { code, max, min, elevation } — 16일 넘게 남았거나 못 받으면 null
export function usePlaceWeather(lat, lng, date) {
  const [w, setW] = useState(null);
  useEffect(() => {
    let alive = true;
    setW(null);
    if (!date || !isFinite(Number(lat)) || !isFinite(Number(lng)) || !lat || !lng) return undefined;
    fetchPlaceWeather(Number(lat), Number(lng)).then(r => {
      if (alive && r && r.days && r.days[date]) setW({ ...r.days[date], elevation: r.elevation });
    });
    return () => { alive = false; };
  }, [lat, lng, date]);
  return w;
}
