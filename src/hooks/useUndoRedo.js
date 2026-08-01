import { useState, useRef, useEffect } from 'react';

// 일정/맛집/준비물/항공권 편집 내역 실행취소·다시실행(슝/뽕)
export function useUndoRedo({
  isDbLoaded, activeTripId,
  planTimeline, currentRestaurants, packingList, flights,
  setPlanTimeline, setCurrentRestaurants, setPackingList, setFlights,
  saveToDb, showToast,
}) {
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoingRef = useRef(false);
  const [isReadyToTrack, setIsReadyToTrack] = useState(false);

  const handleUndo = () => {
      if (historyIndex > 0) {
          isUndoingRef.current = true;
          const prevState = history[historyIndex - 1];
          setHistoryIndex(historyIndex - 1);

          setPlanTimeline(prevState.planTimeline || []);
          setCurrentRestaurants(prevState.currentRestaurants || []);
          setPackingList(prevState.packingList || []);
          setFlights(prevState.flights || { outbound: null, inbound: null });

          saveToDb({
              plan_timeline: prevState.planTimeline,
              current_restaurants: prevState.currentRestaurants,
              packing_list: prevState.packingList,
              flights: prevState.flights
          });
          showToast("⏪ 슝! 이전 상태로 되돌렸습니다.");
      } else {
          showToast("더 이상 되돌릴 수 없습니다.");
      }
  };

  const handleRedo = () => {
      if (historyIndex < history.length - 1) {
          isUndoingRef.current = true;
          const nextState = history[historyIndex + 1];
          setHistoryIndex(historyIndex + 1);

          setPlanTimeline(nextState.planTimeline || []);
          setCurrentRestaurants(nextState.currentRestaurants || []);
          setPackingList(nextState.packingList || []);
          setFlights(nextState.flights || { outbound: null, inbound: null });

          saveToDb({
              plan_timeline: nextState.planTimeline,
              current_restaurants: nextState.currentRestaurants,
              packing_list: nextState.packingList,
              flights: nextState.flights
          });
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
