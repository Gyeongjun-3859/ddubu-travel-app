import React, { useState } from 'react';
import { X, Navigation } from 'lucide-react';
import { S, getTransitRoutes } from '../utils/helpers';
import { fetchOdsayRoutes } from '../utils/transit';
import RouteMapPreview from './RouteMapPreview';

// 한 출발↔도착 쌍을 골라 이동 정보(지하철/버스 등)를 붙이는 팝업.
// 도착지 하나에 서로 다른 출발지의 이동정보를 여러 개 저장할 수 있다(예: 숙소로 오는 길이 여러 곳에서 있을 때).
// ODsay 추천 경로 중 여러 개를 체크해서 한 번에 저장할 수 있고, 위쪽엔 선택한 경로가 실제 카카오맵 위에 그려짐.
const TransitNoteModal = ({ isOpen, onClose, dayPlans, findPinCoord, onSave }) => {
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [routes, setRoutes] = useState([]);
  const [checkedIdx, setCheckedIdx] = useState(new Set());
  const [focusedIdx, setFocusedIdx] = useState(null);
  const [sortMode, setSortMode] = useState('default');
  const [customNote, setCustomNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const pickable = dayPlans || [];
  const fromPlan = pickable.find(p => p.id === fromId);
  const toPlan = pickable.find(p => p.id === toId);
  const fromCoord = fromPlan ? findPinCoord(fromPlan.place) : null;
  const toCoord = toPlan ? findPinCoord(toPlan.place) : null;
  const canRecommend = Boolean(fromCoord?.lat && fromCoord?.lng && toCoord?.lat && toCoord?.lng);
  // 지금 고른 출발/도착 쌍에 이미 저장된 항목이 있으면(수동으로 같은 쌍을 다시 고른 경우) 그 항목을 기준으로 매칭
  const existingRouteForPair = (fromPlan && toPlan) ? getTransitRoutes(toPlan).find(r => S(r.fromPlace) === S(fromPlan.place)) : null;

  const resetSearch = () => {
    setRoutes([]); setCheckedIdx(new Set()); setFocusedIdx(null); setError(''); setCustomNote('');
  };

  // fCoord/tCoord/savedNotes를 명시적으로 받아서, state 반영을 기다리지 않고도(수정 진입 시) 바로 조회할 수 있게 함
  const runFetch = async (fCoord, tCoord, savedNotes) => {
    if (!(fCoord?.lat && fCoord?.lng && tCoord?.lat && tCoord?.lng)) return;
    setLoading(true); setError(''); setRoutes([]); setCheckedIdx(new Set()); setFocusedIdx(null);
    try {
      const summarized = await fetchOdsayRoutes(fCoord, tCoord);
      if (summarized.length === 0) {
        setError('추천 경로를 찾지 못했어요. 직접 입력해주세요.');
        return;
      }
      setRoutes(summarized);
      const notesToMatch = Array.isArray(savedNotes) ? savedNotes : [];
      if (notesToMatch.length > 0) {
        const matchedIdx = new Set();
        const leftover = [];
        notesToMatch.forEach(note => {
          const idx = summarized.findIndex(r => r.summaryText === note);
          if (idx >= 0) matchedIdx.add(idx); else leftover.push(note);
        });
        setCheckedIdx(matchedIdx);
        setCustomNote(leftover.join('\n'));
        setFocusedIdx(matchedIdx.size > 0 ? [...matchedIdx][0] : 0);
      } else {
        setFocusedIdx(0);
      }
    } catch (e) {
      setError('경로를 불러오지 못했어요. 직접 입력해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = () => runFetch(fromCoord, toCoord, existingRouteForPair?.notes);

  // 저장된 이동 정보 카드를 클릭하면 출발/도착을 그대로 채우고 경로를 다시 불러와 수정할 수 있게 함
  const handleEditExisting = (p, route) => {
    const matchFrom = pickable.find(pl => pl.id !== p.id && S(pl.place) === S(route.fromPlace) && Boolean(pl.isAccommodation) === Boolean(route.fromIsAccommodation));
    resetSearch();
    setToId(p.id);
    setFromId(matchFrom ? matchFrom.id : '');
    if (matchFrom) {
      const fc = findPinCoord(matchFrom.place);
      const tc = findPinCoord(p.place);
      runFetch(fc, tc, route.notes);
    } else {
      setCustomNote(route.notes.join('\n'));
      setError('출발 일정을 찾을 수 없어요. 직접 다시 선택해주세요.');
    }
  };

  const toggleChecked = (idx) => {
    setCheckedIdx(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
    setFocusedIdx(idx);
  };

  const sortedRoutes = [...routes]
    .map((r, i) => ({ ...r, _origIdx: i }))
    .sort((a, b) => sortMode === 'time' ? a.totalTime - b.totalTime : sortMode === 'transfer' ? a.transferCount - b.transferCount : 0);
  const focusedRoute = focusedIdx != null ? routes[focusedIdx] : null;

  const handleSave = () => {
    const notes = [...checkedIdx].map(i => routes[i]?.summaryText).filter(Boolean);
    if (customNote.trim()) notes.push(customNote.trim());
    if (!toId || notes.length === 0) return;
    onSave(toId, { notes, fromPlace: fromPlan?.place, fromIsAccommodation: Boolean(fromPlan?.isAccommodation) });
    setFromId(''); setToId(''); resetSearch();
  };

  const handleClose = () => {
    setFromId(''); setToId(''); resetSearch();
    onClose();
  };

  // 도착지(plan) 하나에 출발지가 여러 개일 수 있으므로, (도착지, 출발지 하나) 쌍 단위로 목록을 펼친다
  const existingEntries = pickable.flatMap(p => getTransitRoutes(p).map(route => ({ plan: p, route })));
  const canSave = toId && (checkedIdx.size > 0 || customNote.trim());

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[7000] flex items-center justify-center p-4 transition-opacity duration-300" onClick={handleClose}>
      <div className="bg-white dark:bg-slate-800 dark:border dark:border-slate-700 w-full max-w-md shadow-2xl rounded-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 max-h-[85vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
          <h3 className="text-xs font-bold flex items-center gap-1.5"><Navigation className="w-3.5 h-3.5 text-indigo-500" /> 이동 정보</h3>
          <button onClick={handleClose} className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar">
          {existingEntries.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[9px] font-bold text-slate-400">저장된 이동 정보 <span className="font-medium text-slate-300 dark:text-slate-500">(눌러서 수정)</span></p>
              {existingEntries.map(({ plan: p, route }, i) => (
                <div key={`${p.id}_${i}`} onClick={() => handleEditExisting(p, route)}
                  className={`flex items-start justify-between gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${toId === p.id && S(fromPlan?.place) === S(route.fromPlace) ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700' : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'}`}>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-slate-600 dark:text-slate-300 truncate">
                      {route.fromIsAccommodation ? '🏠 ' : ''}{route.fromPlace ? `${S(route.fromPlace)} → ` : ''}{S(p.place)}
                    </p>
                    {route.notes.map((n, ni) => (
                      <p key={ni} className="text-[8px] text-indigo-500 font-bold truncate">· {n}</p>
                    ))}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onSave(p.id, { fromPlace: route.fromPlace, notes: [] }); }} className="flex-shrink-0 text-[9px] font-bold text-rose-500 hover:underline">삭제</button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-[9px] font-bold text-slate-400">새로 추가</p>
            <div className="flex items-center gap-1.5">
              <select value={fromId} onChange={e => { setFromId(e.target.value); resetSearch(); }}
                className="flex-1 min-w-0 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded-lg p-1.5 text-[10px] font-bold outline-none">
                <option value="">출발 일정 선택</option>
                {pickable.map(p => <option key={p.id} value={p.id} disabled={p.id === toId}>{p.isAccommodation ? '🏠 ' : ''}{S(p.time) && S(p.time) !== '99:99' ? `${S(p.time)} ` : ''}{S(p.place)}</option>)}
              </select>
              <span className="text-slate-300 flex-shrink-0">→</span>
              <select value={toId} onChange={e => { setToId(e.target.value); resetSearch(); }}
                className="flex-1 min-w-0 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded-lg p-1.5 text-[10px] font-bold outline-none">
                <option value="">도착 일정 선택</option>
                {pickable.map(p => <option key={p.id} value={p.id} disabled={p.id === fromId}>{p.isAccommodation ? '🏠 ' : ''}{S(p.time) && S(p.time) !== '99:99' ? `${S(p.time)} ` : ''}{S(p.place)}</option>)}
              </select>
            </div>

            {!fromId && error && <p className="text-[9px] text-rose-500">{error}</p>}

            {fromId && toId && (
              <>
                {routes.length === 0 && (
                  <button onClick={fetchRoutes} disabled={!canRecommend || loading}
                    className={`w-full py-2 rounded-lg text-[10px] font-bold border transition-colors ${canRecommend ? 'border-indigo-300 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:border-indigo-700' : 'border-slate-200 dark:border-slate-600 text-slate-300 dark:text-slate-500 cursor-not-allowed'}`}>
                    {loading ? '불러오는 중...' : '🚇 추천 경로 불러오기'}
                  </button>
                )}
                {!canRecommend && <p className="text-[9px] text-slate-400">지도에 핀으로 등록된 장소끼리만 추천을 받을 수 있어요.</p>}
                {error && <p className="text-[9px] text-rose-500">{error}</p>}

                {routes.length > 0 && (
                  <>
                    <RouteMapPreview route={focusedRoute} fromCoord={fromCoord} toCoord={toCoord} />
                    <div className="flex gap-1">
                      {[['default', '추천순'], ['time', '⏱ 최소시간순'], ['transfer', '🔁 최소환승순']].map(([mode, label]) => (
                        <button key={mode} onClick={() => setSortMode(mode)}
                          className={`px-2 py-1 rounded text-[8px] font-bold transition-colors ${sortMode === mode ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[8px] text-slate-400">체크한 경로가 저장돼요. 태그를 눌러 지도 미리보기도 볼 수 있어요.</p>
                    <div className="flex flex-wrap gap-1">
                      {sortedRoutes.map(r => (
                        <button key={r._origIdx} onClick={() => toggleChecked(r._origIdx)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-[8px] font-bold border transition-colors ${checkedIdx.has(r._origIdx) ? 'bg-indigo-600 text-white border-indigo-600' : (focusedIdx === r._origIdx ? 'border-indigo-400 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600')}`}>
                          {checkedIdx.has(r._origIdx) && '✓ '}{r.tagLabel}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            <div className="flex flex-col space-y-1">
              <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400">직접 입력 (선택사항)</label>
              <textarea value={customNote} onChange={e => setCustomNote(e.target.value)} placeholder="예: 다음역 교대에서 3호선 환승"
                className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded-lg p-2 text-[10px] font-bold outline-none focus:border-indigo-400 resize-none transition-colors" rows={2} />
            </div>

            <button onClick={handleSave} disabled={!canSave}
              className={`w-full py-2 rounded-lg text-[10px] font-bold text-white shadow-md transition-colors ${!canSave ? 'bg-slate-300 dark:bg-slate-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
              저장{checkedIdx.size > 0 ? ` (경로 ${checkedIdx.size}개)` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransitNoteModal;
