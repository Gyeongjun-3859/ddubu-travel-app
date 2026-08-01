import { useState } from 'react';
import { S } from '../utils/helpers';
import { CURRENCIES } from '../utils/constants';

// 환율 카드 입력값 상호 변환 (한 통화에 입력하면 나머지가 실시간으로 환산됨)
export function useCurrencyConverter(rates, loadingRates) {
  const [focusedCurrency, setFocusedCurrency] = useState(null);
  const [activeCurrency, setActiveCurrency] = useState('KRW');
  const [amount, setAmount] = useState('');

  function handleInputChange(code, rawValue) {
    const numericValue = S(rawValue).replace(/,/g, '').replace(/[^\d.]/g, '');
    setActiveCurrency(S(code));
    setAmount(numericValue);
  }

  function formatForDisplay(val) {
    if (!val) return '';
    const parts = S(val).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join('.');
  }

  function formatCalculated(val, curCode) {
    const num = parseFloat(val);
    if (isNaN(num)) return '';
    const maxDecimals = (curCode === 'KRW' || curCode === 'JPY') ? 0 : 2;
    return num.toLocaleString('en-US', { maximumFractionDigits: maxDecimals });
  }

  function getInputValue(curCode) {
    if (amount) {
      if (activeCurrency === curCode) return formatForDisplay(amount);
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount)) return '';
      const usdAmount = numAmount / rates[activeCurrency];
      const targetAmount = usdAmount * rates[curCode];
      return formatCalculated(targetAmount, curCode);
    }
    if (focusedCurrency === curCode) return '';
    if (curCode === 'KRW') return '-';
    const unit = CURRENCIES.find(c => c.code === curCode).unit;
    const krwPerUnit = (rates.KRW / rates[curCode]) * unit;
    return Math.round(krwPerUnit).toLocaleString();
  }

  function getPlaceholder(curCode) {
    if (loadingRates) return '...';
    if (curCode === 'KRW') return '0';
    const unit = CURRENCIES.find(c => c.code === curCode).unit;
    const krwPerUnit = (rates.KRW / rates[curCode]) * unit;
    return Math.round(krwPerUnit).toLocaleString();
  }

  return { amount, focusedCurrency, setFocusedCurrency, handleInputChange, getInputValue, getPlaceholder };
}
