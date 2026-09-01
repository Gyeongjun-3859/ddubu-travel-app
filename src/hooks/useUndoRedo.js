import { useState, useRef, useEffect } from 'react';

// 일정/맛집/준비물/항공권 편집 내역 실행취소·다시실행(슝/뽕)
//
// [주의] 되돌리기는 예전 스냅샷을 통째로 다시 저장하는 방식이 아니라, "지금 상태"와 "되돌아갈
// 스냅샷" 사이의 차이만 계산해서 반영한다(applySnapshot). 스냅샷을 통째로 저장했다면, 그 사이
// 공유 여행에서 다른 사람이 추가한 항목이 "이 스냅샷엔 없는 항목"이라는 이유만으로 실제로
// 삭제돼버릴 위험이 있었다. 차이만 반영하면 이번 되돌리기가 지울 수 있는 항목은 "이번 세션에서
// 내가 만들었다가 되돌리는 항목"으로만 한정되어, 그런 사고가 구조적으로 불가능해진다.
export function useUndoRedo({
  isDbLoaded, activeTripId,
  planTimeline, currentRestaurants, packingList, flights,
  setPlanTimeline, setCurrentRestaurants, setPackingList, setFlights,
  applySnapshot, showToast,
}) {
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoingRef = useRef(false);
  const [isReadyToTrack, setIsReadyToTrack] = useState(false);

  const handleUndo = () => {
      if (historyIndex > 0) {
          isUndoingRef.current = true;
          const currentState = { planTimeline, currentRestaurants, packingList, flights };
          const prevState = history[historyIndex - 1];
          setHistoryIndex(historyIndex - 1);

          setPlanTimeline(prevState.planTimeline || []);
          setCurrentRestaurants(prevState.currentRestaurants || []);
          setPackingList(prevState.packingList || []);
          setFlights(prevState.flights || { outbound: null, inbound: null });

          applySnapshot(currentState, prevState);
          showToast("⏪ 슝! 이전 상태로 되돌렸습니다.");
      } else {
          showToast("더 이상 되돌릴 수 없습니다.");
      }
  };

  const handleRedo = () => {
      if (historyIndex < history.length - 1) {
          isUndoingRef.current = true;
          const currentState = { planTimeline, currentRestaurants, packingList, flights };
          const nextState = history[historyIndex + 1];
          setHistoryIndex(historyIndex + 1);

          setPlanTimeline(nextState.planTimeline || []);
          setCurrentRestaurants(nextState.currentRestaurants || []);
          setPackingList(nextState.packingList || []);
          setFlights(nextState.flights || { outbound: null, inbound: null });

          applySnapshot(currentState, nextState);
          showToast("⏩ 뽕! 다시 실행했습니다.");
      } else {
          showToast("더 이상 다시 실행할 수 없습니다.");
      }
  };

  useEffect(() => {
      if (isDbLoaded && activeTripId) {
          const timer = setTimeout(() => setIsReadyToTrack(true), 1500);
          return () => clearTimeout(timer);
      }
  }, [isDbLoaded, activeTripId]);

  useEffect(() => {
      if (!isReadyToTrack) return;
      if (isUndoingRef.current) {
          isUndoingRef.current = false;
          return;
      }

      const currentState = { planTimeline, currentRestaurants, packingList, flights };
      setHistory(prev => {
          const newHistory = prev.slice(0, historyIndex + 1);
          if (newHistory.length > 0) {
              const last = newHistory[newHistory.length - 1];
              if (JSON.stringify(last) === JSON.stringify(currentState)) {
                  return prev;
              }
          }
          return [...newHistory, currentState];
      });
      setHistoryIndex(prev => prev + 1);
  }, [planTimeline, currentRestaurants, packingList, flights, isReadyToTrack]);

  useEffect(() => {
      setIsReadyToTrack(false);
      setHistory([]);
      setHistoryIndex(-1);
  }, [activeTripId]);

  return { history, historyIndex, handleUndo, handleRedo };
}
