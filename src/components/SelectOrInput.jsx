import React from 'react';
import { X } from 'lucide-react';
import { S } from '../utils/helpers';

const SelectOrInput = ({ value, manualValue, onChangeSelect, onChangeManual, onCancelManual, options, placeholder, isDarkMode, appTheme, inputId }) => {
  const [inputText, setInputText] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const [geoResults, setGeoResults] = React.useState([]); // Geocoding API 결과
  const [isSearching, setIsSearching] = React.useState(false);
  const wrapRef = React.useRef(null);
  const debounceRef = React.useRef(null);

  const displayValue = value === '수동입력' ? S(manualValue) : S(value);

  // 외부 클릭 시 드롭다운 닫기
  React.useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setIsOpen(false);
        setInputText('');
        setGeoResults([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // value 외부 변경 시 초기화
  React.useEffect(() => {
    setInputText('');
    setGeoResults([]);
  }, [value, manualValue]);

  // 내장 목록 필터
  const filtered = React.useMemo(() => {
    if (!options || !Array.isArray(options)) return [];
    const q = inputText.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o => S(o).toLowerCase().includes(q));
  }, [options, inputText]);

  // 내장 결과 없을 때 Geocoding API 검색 (300ms 디바운스)
  React.useEffect(() => {
    const q = inputText.trim();
    if (!q || filtered.length > 0) {
      setGeoResults([]);
      setIsSearching(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }
    setIsSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=ko&format=json`);
        const data = await res.json();
        setGeoResults(data && data.results ? data.results : []);
      } catch (e) {
        setGeoResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [inputText, filtered.length]);

  const handleFocus = () => {
    setInputText('');
    setGeoResults([]);
    setIsOpen(true);
  };

  const handleChange = (e) => {
    setInputText(e.target.value);
    setIsOpen(true);
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (!wrapRef.current) return;
      const q = inputText.trim();
      if (q) {
        const exact = options && options.find(o => S(o).toLowerCase() === q.toLowerCase());
        if (exact) {
          onChangeSelect({ target: { value: exact } });
        } else {
          onChangeSelect({ target: { value: '수동입력' } });
          onChangeManual(q);
        }
      }
      setIsOpen(false);
      setInputText('');
      setGeoResults([]);
    }, 200);
  };

  // 내장 목록 항목 선택
  const handlePickOption = (opt) => {
    onChangeSelect({ target: { value: opt } });
    setInputText('');
    setGeoResults([]);
    setIsOpen(false);
  };

  // Geocoding 결과 항목 선택 — name만 수동입력으로 저장
  const handlePickGeo = (result) => {
    const name = result.name || '';
    onChangeSelect({ target: { value: '수동입력' } });
    onChangeManual(name);
    setInputText('');
    setGeoResults([]);
    setIsOpen(false);
  };

  const handleClear = () => {
    onCancelManual();
    setInputText('');
    setGeoResults([]);
    setIsOpen(false);
  };

  let textColorClass = "text-slate-900";
  let placeholderClass = "placeholder-slate-400";
  if (appTheme === 'dark') { textColorClass = "text-white"; placeholderClass = "placeholder-slate-500"; }
  else if (appTheme === 'pastel') { textColorClass = "text-pink-900"; placeholderClass = "placeholder-pink-300"; }
  else if (appTheme === 'clean') { textColorClass = "text-zinc-900"; placeholderClass = "placeholder-zinc-400"; }

  const dropdownBg = isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200';
  const dropdownItem = isDarkMode ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-indigo-50 text-slate-800';
  const dropdownSub = isDarkMode ? 'text-slate-400' : 'text-slate-400';

  const showDropdown = isOpen && (filtered.length > 0 || isSearching || geoResults.length > 0);

  return (
    <div ref={wrapRef} className="relative w-full h-full flex items-center">
      <input
        id={inputId}
        type="text"
        autoComplete="new-password"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        name={`no-autofill-${inputId}`}
        value={isOpen ? inputText : displayValue}
        onFocus={handleFocus}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder || (options === null ? "국가 먼저 선택" : "선택 또는 직접입력")}
        disabled={options === null && value !== '수동입력'}
        className={`w-full bg-transparent text-[10px] font-bold outline-none ${textColorClass} ${placeholderClass} pr-5 transition-all duration-300 disabled:opacity-40`}
      />
      {displayValue ? (
        <button onClick={handleClear} className={`absolute right-0 top-1/2 -translate-y-1/2 px-1 text-[10px] ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'}`}><X className="w-[1em] h-[1em] inline" /></button>
      ) : (
        <span className={`absolute right-0 top-1/2 -translate-y-1/2 px-1 text-[8px] pointer-events-none ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>▼</span>
      )}
      {showDropdown && (
        <div className={`absolute top-full left-0 z-[9999] mt-1 w-56 max-h-52 overflow-y-auto rounded-lg border shadow-xl ${dropdownBg}`}>
          {/* 내장 목록 */}
          {filtered.map(opt => (
            <button
              key={opt}
              onMouseDown={(e) => { e.preventDefault(); handlePickOption(opt); }}
              className={`w-full text-left px-3 py-1.5 text-[11px] font-bold transition-colors duration-150 ${dropdownItem}`}
            >
              {opt}
            </button>
          ))}
          {/* 내장 없고 검색 중 */}
          {filtered.length === 0 && isSearching && (
            <div className={`px-3 py-2 text-[10px] ${dropdownSub}`}>🔍 검색 중...</div>
          )}
          {/* Geocoding 결과 */}
          {filtered.length === 0 && !isSearching && geoResults.length > 0 && (
            <>
              <div className={`px-3 py-1 text-[9px] font-bold border-b ${isDarkMode ? 'text-slate-500 border-slate-700' : 'text-slate-400 border-slate-100'}`}>검색 결과</div>
              {geoResults.map((r, i) => (
                <button
                  key={i}
                  onMouseDown={(e) => { e.preventDefault(); handlePickGeo(r); }}
                  className={`w-full text-left px-3 py-1.5 transition-colors duration-150 ${dropdownItem}`}
                >
                  <div className="text-[11px] font-bold">{r.name}</div>
                  <div className={`text-[9px] ${dropdownSub}`}>{[r.admin1, r.country].filter(Boolean).join(', ')}</div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SelectOrInput;
