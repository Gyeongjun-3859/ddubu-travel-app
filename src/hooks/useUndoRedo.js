import { useState, useRef, useEffect } from 'react';

// 일정/맛집/준비물/항공권 편집 내역 실행취소·다시실행(슝/뽕)
//
// [주의] 되돌리기는 예전 스냅샷을 통째로 다시 저장하는 방식이 아니라, "지금 상태"와 "되돌아갈
// 스냅샷" 사이의 차이만 계산해서 반영한다(applySnapshot). 스냅샷을 통째로 저장했다면, 그 사이
// 공유 여행에서 다른 사람이 추가한 항목이 "이 스냅샷엔 없는 항목"이라는 이유만으로 실제로
// 삭제돼버릴 위험이 있었다. 차이만 반영하면 이번 되돌리기가 지울 수 있는 항목은 "이번 세션에서
// 내가 만들었다가 되돌리는 항목"으로만 한정되어, 그런 사고가 구조적으로 불가능해진다.
//
// [버그 수정] 히스토리 목록(list)과 현재 위치(index)를 한 state에 묶어 항상 같이 갱신한다.
// 예전엔 둘을 따로 setState해서, 상태가 안 바뀌어 목록엔 안 쌓였는데도 index만 +1 되는 일이
// 반복됐고 → index가 목록 끝을 넘어가 슝을 누르면 undefined를 읽어 크래시가 났다.
export function useUndoRedo({
  isDbLoaded, activeTripId, isTripLoaded,
  planTimeline, currentRestaurants, packingList, flights,
  setPlanTimeline, setCurrentRestaurants, setPackingList, setFlights,
  applySnapshot, showToast,
}) {
  const [hist, setHist] = useState({ list: [], index: -1 });
  const isUndoingRef = useRef(false);
  const [isReadyToTrack, setIsReadyToTrack] = useState(false);

  const moveTo = (targetIndex, toastMsg) => {
      const target = hist.list[targetIndex];
      if (!target) return false;
      isUndoingRef.current = true;
      const currentState = { planTimeline, currentRestaurants, packingList, flights };
      setHist(prev => ({ ...prev, index: targetIndex }));

      setPlanTimeline(target.planTimeline || []);
      setCurrentRestaurants(target.currentRestaurants || []);
      setPackingList(target.packingList || []);
      setFlights(target.flights || { outbound: null, inbound: null });

      applySnapshot(currentState, target);
      showToast(toastMsg);
      return true;
  };

  const handleUndo = () => {
      if (hist.index > 0 && moveTo(hist.index - 1, "⏪ 슝! 이전 상태로 되돌렸습니다.")) return;
      showToast("더 이상 되돌릴 수 없습니다.");
  };

  const handleRedo = () => {
      if (hist.index < hist.list.length - 1 && moveTo(hist.index + 1, "⏩ 뽕! 다시 실행했습니다.")) return;
      showToast("더 이상 다시 실행할 수 없습니다.");
  };

  // [위험 수정] 예전엔 여행을 연 뒤 "1.5초 후"부터 무조건 기록을 시작해서, 데이터가 그보다 늦게 오면
  // 기록이 [빈 화면 → 불러온 화면]이 됐고, 이때 슝을 누르면 여행 전체가 삭제될 수 있었다.
  // 이제 그 여행 데이터가 실제로 화면에 다 들어온 뒤(isTripLoaded)부터, 그 상태를 첫 기록으로 삼아 시작한다.
  useEffect(() => {
      if (isDbLoaded && activeTripId && isTripLoaded) {
          const timer = setTimeout(() => { setHist({ list: [], index: -1 }); setIsReadyToTrack(true); }, 300);
          return () => clearTimeout(timer);
      }
      setIsReadyToTrack(false);
  }, [isDbLoaded, activeTripId, isTripLoaded]);

  useEffect(() => {
      if (!isReadyToTrack) return;
      if (isUndoingRef.current) {
          isUndoingRef.current = false;
          return;
      }

      const currentState = { planTimeline, currentRestaurants, packingList, flights };
      setHist(prev => {
          const kept = prev.list.slice(0, prev.index + 1);
          const last = kept[kept.length - 1];
          if (last && JSON.stringify(last) === JSON.stringify(currentState)) return prev;
          const list = [...kept, currentState];
          return { list, index: list.length - 1 };
      });
  }, [planTimeline, currentRestaurants, packingList, flights, isReadyToTrack]);

  useEffect(() => {
      setIsReadyToTrack(false);
      setHist({ list: [], index: -1 });
  }, [activeTripId]);

  return { history: hist.list, historyIndex: hist.index, handleUndo, handleRedo };
}
