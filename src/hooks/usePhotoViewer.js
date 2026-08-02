import { useState, useRef, useEffect } from 'react';

// 사진 확대 뷰어: 열기/넘기기 + 핀치줌/드래그 상태 관리
export function usePhotoViewer() {
  const [viewPhoto, setViewPhoto] = useState(null); // {imgs: string[], idx: number} | null
  const [viewPhotoAnim, setViewPhotoAnim] = useState(null); // 'left' | 'right' | null
  const viewPhotoDragRef = useRef({ startX: null, wheelLock: false });
  const zoomImgRef = useRef(null); // 현재 보이는 중앙 사진 DOM ref
  const zoomCardRef = useRef(null); // 중앙 카드 컨테이너 DOM ref
  const zoomStateRef = useRef({ scale: 1, ox: 0, oy: 0, dist: null, baseScale: 1, lastTap: 0, panStartX: 0, panStartY: 0, baseOx: 0, baseOy: 0, mouseDown: false, didDrag: false });

  const applyZoomTransform = (scale, ox, oy, animate = false) => {
    const el = zoomImgRef.current;
    const card = zoomCardRef.current;
    if (!el) return;

    // 사진 가장자리가 확대 프레임 안쪽으로 사라져 빈 공간이 보이지 않도록, 팬 이동거리를 사진 가장자리까지로 제한
    const maxOx = Math.max(0, el.offsetWidth * (scale - 1) / 2);
    const maxOy = Math.max(0, el.offsetHeight * (scale - 1) / 2);
    const clampedOx = Math.min(Math.max(ox, -maxOx), maxOx);
    const clampedOy = Math.min(Math.max(oy, -maxOy), maxOy);
    zoomStateRef.current.ox = clampedOx;
    zoomStateRef.current.oy = clampedOy;

    el.style.transition = animate ? 'transform 0.25s cubic-bezier(.4,0,.2,1)' : 'none';
    el.style.transform = `scale(${scale}) translate(${clampedOx / scale}px, ${clampedOy / scale}px)`;
    if (card) {
      if (scale > 1.05) {
        card.style.overflow = 'visible';
        card.style.borderRadius = '0px';
        card.style.zIndex = '99';
      } else {
        card.style.overflow = 'hidden';
        card.style.borderRadius = '18px';
        card.style.zIndex = '10';
      }
    }
  };

  const resetZoom = (animate = true) => {
    const z = zoomStateRef.current;
    z.scale = 1; z.ox = 0; z.oy = 0;
    applyZoomTransform(1, 0, 0, animate);
  };

  // 뷰어 열려있는 동안 Chrome 트랙패드 뒤로가기 제스처 차단
  useEffect(() => {
    if (!viewPhoto) return;
    const blockSwipe = (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) e.preventDefault();
    };
    window.addEventListener('wheel', blockSwipe, { passive: false });
    return () => window.removeEventListener('wheel', blockSwipe);
  }, [viewPhoto]);

  const openPhotoViewer = (imgs, idx = 0) => {
    const arr = Array.isArray(imgs) ? imgs.filter(Boolean) : (imgs ? [imgs] : []);
    if (arr.length === 0) return;
    setViewPhoto({ imgs: arr, idx });
    setViewPhotoAnim(null);
    zoomStateRef.current = { scale: 1, ox: 0, oy: 0, dist: null, baseScale: 1, lastTap: 0, panStartX: 0, panStartY: 0, baseOx: 0, baseOy: 0, mouseDown: false, didDrag: false };
  };
  const goPhotoNext = (imgs, idx) => {
    if (idx + 1 >= imgs.length) return;
    setViewPhoto({ imgs, idx: idx + 1 });
  };
  const goPhotoPrev = (imgs, idx) => {
    if (idx - 1 < 0) return;
    setViewPhoto({ imgs, idx: idx - 1 });
  };

  return {
    viewPhoto, setViewPhoto, viewPhotoAnim, setViewPhotoAnim,
    viewPhotoDragRef, zoomImgRef, zoomCardRef, zoomStateRef,
    applyZoomTransform, resetZoom, openPhotoViewer, goPhotoNext, goPhotoPrev,
  };
}
