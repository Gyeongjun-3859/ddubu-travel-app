import React from 'react';
import { Navigation } from 'lucide-react';
import { S, getTransitRoutes } from '../utils/helpers';

// 저장된 이동 정보(출발지→이 일정)를 카드 위에 작은 배지로 표시. 숙소발이면 노란색으로 구분.
// 한 일정에 서로 다른 출발지의 이동정보가 여러 개 저장돼 있으면 배지를 각각 따로 표시한다.
// route를 명시적으로 넘기면 plan의 전체 이동정보 중 그 항목 하나만 표시(숙소 도착지를 출발지 카드 쪽에 붙일 때 사용).
const TransitConnector = ({ plan, route, className = '', onClick }) => {
  const routes = route ? [route] : getTransitRoutes(plan);
  if (routes.length === 0) return null;
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {routes.map((r, i) => (
        <div
          key={i}
          onClick={onClick ? (e) => { e.stopPropagation(); onClick(plan, r); } : undefined}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-bold border transition-colors ${r.fromIsAccommodation ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'} ${onClick ? 'cursor-pointer hover:brightness-95' : ''}`}>
          <Navigation className="w-2.5 h-2.5 flex-shrink-0" />
          <span className="truncate">{r.fromIsAccommodation ? '🏠 ' : ''}{r.fromPlace ? `${S(r.fromPlace)} → ` : ''}{S(plan.place)}</span>
        </div>
      ))}
    </div>
  );
};

export default TransitConnector;
