import { useState, useCallback, useEffect } from 'react';
import { S } from '../utils/helpers';
import { CITY_NAME_TO_EN } from '../utils/constants';

// 날씨/예보 조회 + 오프라인 대비 로컬 캐싱 + 일차별 시간대 날씨 확장
export function useWeather(planTimeline, displayCityName, globalManualRegion, globalPlanRegion) {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [hourlyWeatherCache, setHourlyWeatherCache] = useState({});
  const [expandedWeatherDay, setExpandedWeatherDay] = useState(null);
  const [isLoadingHourly, setIsLoadingHourly] = useState(false);

  const fetchWeatherData = useCallback(async (cityName) => {
    console.log("🌤️ [1] 날씨 호출 시작. 타겟 지역:", cityName);

    // 객체 충돌 방지 및 문자열 변환
    const safeCityName = typeof cityName === 'string' ? cityName : S(cityName);

    if (!safeCityName || safeCityName === "선택된 지역 없음" || safeCityName === "글로벌" || safeCityName === "수동입력") {
      setWeather(null); setForecast([]);
      console.log("🚨 [2] 유효하지 않은 지역명으로 호출 중단됨.", safeCityName);
      return;
    }

    try {
      const queryName = CITY_NAME_TO_EN[safeCityName] || safeCityName;
      console.log(`🌤️ [3] '${safeCityName}' → '${queryName}' 좌표 검색 중...`);
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(queryName)}&count=1&language=ko&format=json`);
      const geoData = await geoRes.json();

      if (!geoData || !geoData.results || geoData.results.length === 0) {
          console.warn(`🚨 [4] 에러: '${safeCityName}'의 좌표를 찾을 수 없습니다.`);
          setWeather(null);
          setForecast([]);
          return;
      }

      const { latitude: lat, longitude: lon } = geoData.results[0];
      console.log(`🌤️ [5] 좌표 획득 성공! 위도:${lat}, 경도:${lon}. 날씨 API 요청 시작.`);

      const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weather_code&timezone=auto&forecast_days=16`);
      const wData = await wRes.json();

      let nextWeather = null, nextForecast = null;
      if (wData.current) { nextWeather = { temp: Math.round(wData.current.temperature_2m), code: wData.current.weather_code }; setWeather(nextWeather); }

      if (wData.daily && Array.isArray(wData.daily.time)) {
        nextForecast = wData.daily.time.map((t, i) => ({
          date: S(t), code: wData.daily.weather_code[i], max: Math.round(wData.daily.temperature_2m_max[i]), min: Math.round(wData.daily.temperature_2m_min[i])
        }));
        setForecast(nextForecast);
      }
      if (wData.hourly) {
        setHourlyWeatherCache(prev => ({ ...prev, [safeCityName]: wData.hourly }));
      }
      // 오프라인 대비: 마지막으로 성공한 날씨를 도시명 기준으로 저장
      if (nextWeather || nextForecast) {
        try { localStorage.setItem('my_travel_weather_cache', JSON.stringify({ city: safeCityName, weather: nextWeather, forecast: nextForecast, updatedAt: Date.now() })); } catch (e) {}
      }
    } catch (e) {
      console.error("🚨 [8] 치명적 에러 발생:", e);
      // 오프라인/서버 오류 시 같은 도시의 마지막 캐시가 있으면 대신 사용
      try {
        const cachedStr = localStorage.getItem('my_travel_weather_cache');
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          if (cached?.city === safeCityName) {
            if (cached.weather) setWeather(cached.weather);
            if (cached.forecast) setForecast(cached.forecast);
          }
        }
      } catch (e2) {}
    }
  }, []);

  // 특정 지역의 시간대별 날씨를 캐싱 및 호출
  const fetchRegionHourlyWeather = async (regionName) => {
      if (!regionName || regionName === "수동입력" || regionName === "선택된 지역 없음" || regionName === "글로벌") return null;
      if (hourlyWeatherCache[regionName]) return hourlyWeatherCache[regionName];
      try {
          const queryRegion = CITY_NAME_TO_EN[S(regionName)] || S(regionName);
          const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(queryRegion)}&count=1&language=ko&format=json`);
          const geoData = await geoRes.json();
          if (!geoData || !geoData.results || !geoData.results.length) return null;
          const { latitude: lat, longitude: lon } = geoData.results[0];
          const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weather_code&timezone=auto&forecast_days=16`);
          const wData = await wRes.json();
          setHourlyWeatherCache(prev => ({ ...prev, [regionName]: wData.hourly }));
          return wData.hourly;
      } catch (e) { console.error(e); return null; }
  };

  // 날씨 일자 클릭 시, 일정 타임라인을 분석해 여러 지역의 날씨를 동시 로드
  const handleWeatherDayClick = async (day) => {
      if (expandedWeatherDay === day) {
          setExpandedWeatherDay(null);
          return;
      }
      setExpandedWeatherDay(day);
      setIsLoadingHourly(true);

      const dayPlans = (Array.isArray(planTimeline) ? planTimeline : [])
          .filter(p => parseInt(p.day) === day && p.region && p.region !== '수동입력')
          .sort((a, b) => S(a.time).localeCompare(S(b.time)));

      let uniqueRegions = new Set();
      let defaultRegion = displayCityName;
      if (dayPlans.length > 0) defaultRegion = dayPlans[0].region;
      uniqueRegions.add(defaultRegion);
      dayPlans.forEach(p => uniqueRegions.add(p.region));

      for (const region of uniqueRegions) {
          await fetchRegionHourlyWeather(region);
      }
      setIsLoadingHourly(false);
  };

  // 날씨 데이터 호출 트리거 — 모든 일정 지역의 날씨를 한꺼번에 로드
  useEffect(() => {
    // 1) 기본 대표 지역 fetch
    let targetCity = displayCityName;
    if (!targetCity || targetCity === "선택된 지역 없음" || targetCity === "수동입력") {
      if (globalManualRegion) targetCity = globalManualRegion;
      else if (globalPlanRegion && globalPlanRegion !== "수동입력" && globalPlanRegion !== "선택된 지역 없음") targetCity = globalPlanRegion;
      else {
        const validPlan = Array.isArray(planTimeline) ? planTimeline.find(p => p && p.region && p.region !== "수동입력" && p.region !== "선택된 지역 없음") : null;
        if (validPlan) targetCity = validPlan.region;
      }
    }
    fetchWeatherData(targetCity);

    // 2) planTimeline 내 다른 지역들도 미리 캐시 (시간대별 날씨용)
    if (Array.isArray(planTimeline)) {
      const extraRegions = [...new Set(planTimeline
        .map(p => p && p.region)
        .filter(r => r && r !== targetCity && r !== '수동입력' && r !== '선택된 지역 없음')
      )];
      extraRegions.forEach(r => fetchWeatherData(r));
    }
  }, [displayCityName, globalManualRegion, globalPlanRegion, planTimeline, fetchWeatherData]);

  return {
    weather, forecast, hourlyWeatherCache, expandedWeatherDay, setExpandedWeatherDay,
    isLoadingHourly, fetchWeatherData, fetchRegionHourlyWeather, handleWeatherDayClick,
  };
}
