import React from 'react';
import { Pencil, MapPin } from 'lucide-react';
import { S } from '../utils/helpers';
import TripImg from './TripImg';

const THEME_EMOJI = { '식당': '🍽️', '디저트': '🍰', '관광지': '📸', '쇼핑': '🛍️', '숙소': '🏠', '기타': '📍' };

// 📦 보관함 — 어느 Day에도 넣지 않은 핀 목록. 일정 탭(보관함 칩)에서 보여 준다.
// 카드의 [D1][D2]… 를 누르면 그날 일정으로 바로 들어가고 목록에서 빠진다.
const ArchivePinsPanel = ({ pins, tripDays, onAddToDay, onEdit, onShowOnMap, onAddPlace, isReadOnly, isDarkMode, textMuted }) => {
  const list = Array.isArray(pins) ? pins : [];
  const card = `rounded-xl border overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.05)]'}`;

  return (
    <div className="flex flex-col gap-2">
      <span className={`px-1 text-[11px] font-medium ${textMuted}`}>📦 보관함 — 아직 날짜를 정하지 않은 장소 {list.length}곳</span>

      {list.length === 0 ? (
        <div onClick={isReadOnly ? undefined : onAddPlace}
          className={`mt-1 flex h-28 flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-[12px] font-semibold ${isReadOnly ? '' : 'cursor-pointer'} ${textMuted} ${isDarkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-white'}`}>
          보관함이 비어 있어요
          {!isReadOnly && <span className="text-[11px] font-medium">가 보고 싶은 곳을 날짜 없이 담아 두세요</span>}
        </div>
      ) : list.map(pin => {
        const hasImg = pin.img && !S(pin.img).includes('unsplash');
        return (
          <div key={pin.id} className={card}>
            <div className="flex gap-3 p-2.5">
              <div className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg flex items-center justify-center text-xl ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                {hasImg ? <TripImg src={pin.img} className="h-full w-full object-cover" alt="" /> : (THEME_EMOJI[S(pin.theme)] || '📍')}
              </div>
              <div className="min-w-0 flex-1">
                <div className={`truncate text-[13px] font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{S(pin.name)}</div>
                <div className={`truncate text-[11px] ${textMuted}`}>{S(pin.theme) || '기타'}{pin.localName ? ` · ${S(pin.localName)}` : ''}</div>
                {!isReadOnly && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    <span className={`text-[10px] font-bold ${textMuted}`}>일정에 넣기</span>
                    {tripDays.map(d => (
                      <button key={d} type="button" onClick={() => onAddToDay(pin, d)}
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold transition-colors ${isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-[#007AFF] hover:text-white' : 'border-slate-300 text-slate-600 hover:bg-[#007AFF] hover:border-[#007AFF] hover:text-white'}`}>
                        D{d}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                {pin.lat && pin.lng && (
                  <button type="button" onClick={() => onShowOnMap(pin)} title="지도에서 보기" className={`rounded-md p-1.5 ${isDarkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-100'}`}><MapPin className="h-3.5 w-3.5" /></button>
                )}
                {!isReadOnly && (
                  <button type="button" onClick={() => onEdit(pin)} title="수정" className={`rounded-md p-1.5 ${isDarkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-100'}`}><Pencil className="h-3.5 w-3.5" /></button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ArchivePinsPanel;
