import React, { useEffect, useState } from 'react';
import { X, Navigation } from 'lucide-react';
import { S } from '../utils/helpers';
import { fetchOdsayRoutes } from '../utils/transit';
import RouteMapPreview from './RouteMapPreview';

// 오늘의 계획에서 저장된 이동 정보 배지를 클릭했을 때 실제 경로를 카카오맵 위에 보여주는 읽기 전용 모달.
// 좌표(핀)로 ODsay 경로를 다시 조회해서, 저장했던 문구와 일치하는 경로를 찾아 지도에 그려준다.
// plan은 도착지 일정, route는 그중 클릭한 출발지 하나(한 도착지에 출발지가 여러 개일 수 있음)
const TransitRouteViewModal = ({ isOpen, onClose, plan, route, findPinCoord }) => {
  const [routes, setRoutes] = useState([]);
  const [focusedIdx, setFocusedIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const notes = route?.notes || [];
  const fromCoord = route ? findPinCoord(route.fromPlace) : null;
  const toCoord = plan ? findPinCoord(plan.place) : null;
  const canShowMap = Boolean(fromCoord?.lat && fromCoord?.lng && toCoord?.lat && toCoord?.lng);

  useEffect(() => {
    if (!isOpen || !plan || !route || !canShowMap) return;
    setLoading(true); setError(''); setRoutes([]); setFocusedIdx(0);
    fetchOdsayRoutes(fromCoord, toCoord)
      .then(summarized => {
        // 일정 탭에서 저장해둔 경로만 지도에 보여준다(추천 가능한 다른 경로는 여기서 보여주지 않음)
        const matched = summarized.filter(r => notes.includes(r.summaryText));
        if (matched.length === 0) { setError('저장된 경로와 일치하는 지도를 다시 찾지 못했어요.'); return; }
        setRoutes(matched);
        setFocusedIdx(0);
      })
      .catch(() => setError('경로를 다시 불러오지 못했어요.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, plan?.id, route?.fromPlace]);

  if (!isOpen || !plan || !route) return null;

  const focusedRoute = routes[focusedIdx] || null;

  return (
    <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 dark:border dark:border-slate-700 w-full max-w-md shadow-2xl rounded-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 max-h-[85vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
          <h3 className="text-xs font-bold flex items-center gap-1.5"><Navigation className="w-3.5 h-3.5 text-indigo-500" /> 이동 경로</h3>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar">
          <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
            {route.fromIsAccommodation ? '🏠 ' : ''}{route.fromPlace ? `${S(route.fromPlace)} → ` : ''}{S(plan.place)}
          </p>

          {!canShowMap && (
            <p className="text-[9px] text-slate-400">지도에 핀으로 등록된 장소가 아니라서 노선을 보여드릴 수 없어요. 저장된 경로 정보만 확인해주세요.</p>
          )}
          {canShowMap && loading && (
            <div className="w-full h-40 rounded-lg flex items-center justify-center text-[9px] text-slate-400 bg-slate-100 dark:bg-slate-800">경로를 불러오는 중...</div>
          )}
          {canShowMap && !loading && error && <p className="text-[9px] text-rose-500">{error}</p>}
          {canShowMap && !loading && !error && routes.length > 0 && (
            <>
              <RouteMapPreview route={focusedRoute} fromCoord={fromCoord} toCoord={toCoord} />
              {routes.length > 1 && (
                <div className="flex flex-wrap gap-1">
                  {routes.map((r, i) => (
                    <button key={i} onClick={() => setFocusedIdx(i)}
                      className={`px-2 py-1 rounded-full text-[8px] font-bold border transition-colors ${focusedIdx === i ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'}`}>
                      {r.tagLabel}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="space-y-1">
            <p className="text-[9px] font-bold text-slate-400">저장된 이동 정보</p>
            {notes.map((n, i) => (
              <p key={i} className="text-[9px] text-indigo-500 font-bold">· {n}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransitRouteViewModal;
