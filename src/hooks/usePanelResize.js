import { useState, useRef, useCallback } from 'react';

// 대시보드 좌우 패널 드래그 크기 조절(Resizer)
export function usePanelResize(initialRatio = 50) {
  const [panelRatio, setPanelRatio] = useState(initialRatio);
  const dragRef = useRef(false);

  const handleDragMove = useCallback((e) => {
    if (!dragRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const ratio = (clientX / window.innerWidth) * 100;
    if (ratio > 20 && ratio < 80) setPanelRatio(ratio);
  }, []);

  const handleDragEnd = useCallback(() => {
    dragRef.current = false;
    document.body.style.cursor = 'default';
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('touchend', handleDragEnd);
  }, [handleDragMove]);

  const handleDragStart = (e) => {
    dragRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
  };

  return { panelRatio, handleDragStart };
}
