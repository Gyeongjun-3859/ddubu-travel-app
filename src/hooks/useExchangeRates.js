import { useState, useEffect } from 'react';

// 실시간 환율 조회 + 마지막 성공 값 로컬 캐싱(오프라인 대비)
export function useExchangeRates(showToast) {
  const [rates, setRates] = useState({ USD: 1, KRW: 1350, JPY: 150, EUR: 0.92, CNY: 7.2 });
  const [loadingRates, setLoadingRates] = useState(false);
  const [errorRates, setErrorRates] = useState(null);
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState(null);

  async function fetchRealTimeRates(isManual = false) {
    try {
      setLoadingRates(true);
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!res.ok) throw new Error('Data fetch failed');
      const data = await res.json();
      const nextRates = { USD: 1, KRW: data.rates.KRW, JPY: data.rates.JPY, EUR: data.rates.EUR, CNY: data.rates.CNY };
      setRates(nextRates);
      setErrorRates(null);
      const now = Date.now();
      setRatesUpdatedAt(now);
      try { localStorage.setItem('my_travel_rates_cache', JSON.stringify({ rates: nextRates, updatedAt: now })); } catch (e) {}
      if (isManual) showToast("💱 최신 환율로 동기화되었습니다.");
    } catch (e) {
      // 오프라인/서버 오류 시 마지막으로 저장해둔 환율을 대신 보여줌
      try {
        const cachedStr = localStorage.getItem('my_travel_rates_cache');
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          if (cached?.rates) { setRates(cached.rates); setRatesUpdatedAt(cached.updatedAt || null); }
        }
      } catch (e2) {}
      setErrorRates("환율 서버 연결 실패 (마지막으로 불러온 값 표시 중)");
      if (isManual) showToast("환율 동기화에 실패했습니다.");
    } finally {
      setLoadingRates(false);
    }
  }

  // 오프라인/최초 로딩 시 마지막으로 불러온 환율을 우선 표시
  useEffect(() => {
    try {
      const cachedRatesStr = localStorage.getItem('my_travel_rates_cache');
      if (cachedRatesStr) {
        const cachedRates = JSON.parse(cachedRatesStr);
        if (cachedRates?.rates) { setRates(cachedRates.rates); setRatesUpdatedAt(cachedRates.updatedAt || null); }
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchRealTimeRates();
    const interval = setInterval(() => fetchRealTimeRates(false), 300000);
    return () => clearInterval(interval);
  }, []);

  return { rates, loadingRates, errorRates, ratesUpdatedAt, fetchRealTimeRates };
}
