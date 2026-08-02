import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const PhotoViewerModal = ({
  viewPhoto, setViewPhoto, setViewPhotoAnim,
  viewPhotoDragRef, zoomImgRef, zoomCardRef, zoomStateRef,
  applyZoomTransform, resetZoom, goPhotoNext, goPhotoPrev,
}) => {
  const containerRef = useRef(null);

  const _vp = viewPhoto ? (typeof viewPhoto === 'string' ? { imgs: [viewPhoto], idx: 0 } : viewPhoto) : { imgs: [], idx: 0 };
  const imgs = _vp.imgs || [];
  const idx = _vp.idx || 0;
  const n = imgs.length;
  const dr = viewPhotoDragRef.current;
  const z = zoomStateRef.current;

  // DOM 직접 조작으로 렉 없는 줌 처리
  const getTouchDist = (t) => {
    const dx = t[0].clientX - t[1].clientX;
    const dy = t[0].clientY - t[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const onTouchStart = (e) => {
    if (e.touches.length === 2) {
      z.dist = getTouchDist(e.touches);
      z.baseScale = z.scale;
      z.baseOx = z.ox; z.baseOy = z.oy;
      dr.startX = null;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      // 더블탭
      if (now - z.lastTap < 280) {
        z.lastTap = 0;
        if (z.scale > 1.05) {
          resetZoom(true);
        } else {
          z.scale = 2.5; z.ox = 0; z.oy = 0;
          applyZoomTransform(2.5, 0, 0, true);
        }
        return;
      }
      z.lastTap = now;
      z.panStartX = e.touches[0].clientX;
      z.panStartY = e.touches[0].clientY;
      z.baseOx = z.ox; z.baseOy = z.oy;
      if (z.scale <= 1.05) dr.startX = e.touches[0].clientX;
      else dr.startX = null;
    }
  };

  const onTouchMove = (e) => {
    if (e.touches.length === 2 && z.dist !== null) {
      e.preventDefault();
      const newDist = getTouchDist(e.touches);
      const newScale = Math.min(Math.max(z.baseScale * (newDist / z.dist), 1), 5);
      z.scale = newScale;
      if (newScale <= 1.05) { z.ox = 0; z.oy = 0; }
      applyZoomTransform(newScale, z.ox, z.oy, false);
    } else if (e.touches.length === 1 && z.scale > 1.05) {
      e.preventDefault();
      const movedX = Math.abs(e.touches[0].clientX - z.panStartX);
      const movedY = Math.abs(e.touches[0].clientY - z.panStartY);
      if (movedX > 4 || movedY > 4) z.didDrag = true;
      z.ox = z.baseOx + (e.touches[0].clientX - z.panStartX);
      z.oy = z.baseOy + (e.touches[0].clientY - z.panStartY);
      applyZoomTransform(z.scale, z.ox, z.oy, false);
    }
  };

  const onTouchEnd = (e) => {
    if (z.dist !== null) {
      z.dist = null;
      if (z.scale <= 1.05) resetZoom(true);
      return;
    }
    if (z.scale > 1.05) { dr.startX = null; return; }
    if (dr.startX === null) return;
    const diff = dr.startX - e.changedTouches[0].clientX;
    dr.startX = null;
    if (Math.abs(diff) < 30) return;
    e.stopPropagation();
    resetZoom(false);
    if (diff > 0) goPhotoNext(imgs, idx);
    else goPhotoPrev(imgs, idx);
  };

  const onWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const newScale = Math.min(Math.max(z.scale * (e.deltaY < 0 ? 1.12 : 0.89), 1), 5);
      z.scale = newScale;
      if (newScale <= 1.05) { z.ox = 0; z.oy = 0; }
      applyZoomTransform(newScale, z.ox, z.oy, false);
      return;
    }
    if (z.scale > 1.05) return;
    if (n < 2 || dr.wheelLock) return;
    const delta = Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) < 10) return;
    dr.wheelLock = true;
    setTimeout(() => { dr.wheelLock = false; }, 450);
    resetZoom(false);
    if (delta > 0) goPhotoNext(imgs, idx);
    else goPhotoPrev(imgs, idx);
  };

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    z.didDrag = false;
    if (z.scale > 1.05) {
      z.panStartX = e.clientX;
      z.panStartY = e.clientY;
      z.baseOx = z.ox;
      z.baseOy = z.oy;
      z.mouseDown = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    } else {
      dr.startX = e.clientX;
    }
  };
  const onPointerMove = (e) => {
    if (!z.mouseDown || z.scale <= 1.05) return;
    const movedX = Math.abs(e.clientX - z.panStartX);
    const movedY = Math.abs(e.clientY - z.panStartY);
    if (movedX > 4 || movedY > 4) z.didDrag = true;
    e.preventDefault();
    z.ox = z.baseOx + (e.clientX - z.panStartX);
    z.oy = z.baseOy + (e.clientY - z.panStartY);
    applyZoomTransform(z.scale, z.ox, z.oy, false);
  };
  const onPointerUp = (e) => {
    if (z.mouseDown) {
      z.mouseDown = false;
      return;
    }
    if (dr.startX === null || z.scale > 1.05) return;
    const diff = dr.startX - e.clientX;
    dr.startX = null;
    if (Math.abs(diff) < 30) return;
    e.stopPropagation();
    resetZoom(false);
    if (diff > 0) goPhotoNext(imgs, idx);
    else goPhotoPrev(imgs, idx);
  };

  // React onWheel/onTouchMove는 passive 리스너로 붙어서 preventDefault가 브라우저 자체 확대(핀치줌/Ctrl+휠줌)를
  // 막지 못하는 경우가 있어, 네이티브 리스너를 passive:false로 직접 붙여서 확실히 막는다.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !viewPhoto) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
    };
  });

  if (!viewPhoto) return null;

  const CARD_W = 300; const CARD_H = 400; const X_GAP = 160;
  const getCardStyle = (offset) => {
    const absOff = Math.abs(offset);
    const scale = absOff === 0 ? 1 : absOff === 1 ? 0.78 : 0.62;
    const brightness = absOff === 0 ? 1 : absOff === 1 ? 0.5 : 0.3;
    const opacity = absOff === 0 ? 1 : absOff === 1 ? 0.9 : 0.65;
    const zIndex = 10 - absOff;
    const tx = offset * X_GAP;
    const ty = absOff === 0 ? 0 : absOff === 1 ? 28 : 50;
    return {
      position: 'absolute', width: CARD_W, height: CARD_H,
      left: '50%', top: '50%', marginLeft: -CARD_W / 2, marginTop: -CARD_H / 2 - 30,
      borderRadius: 18, overflow: 'hidden',
      background: '#ffffff',
      transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
      filter: `brightness(${brightness})`, opacity, zIndex,
      transition: 'transform 0.32s cubic-bezier(.4,0,.2,1), opacity 0.32s, filter 0.32s',
      boxShadow: absOff === 0 ? '0 24px 64px rgba(0,0,0,0.95)' : '0 8px 24px rgba(0,0,0,0.6)',
      cursor: absOff === 0 ? 'default' : 'pointer', pointerEvents: 'none',
    };
  };
  const offsets = [-2, -1, 0, 1, 2].filter(o => { const ci = idx + o; return ci >= 0 && ci < n; });

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black/95 z-[99998] flex flex-col items-center justify-center backdrop-blur-sm"
         onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
         onTouchEnd={onTouchEnd}
         onClick={() => { if (z.didDrag) { z.didDrag = false; return; } setViewPhoto(null); }}>
      {/* 카드 영역 */}
      <div className="relative flex-1 w-full" style={{ pointerEvents: 'none', overflow: 'hidden' }}>
        {offsets.map(offset => {
          const ci = idx + offset;
          return (
            <div key={ci}
                 ref={offset === 0 ? zoomCardRef : null}
                 style={{ ...getCardStyle(offset), pointerEvents: 'auto' }}
                 onClick={e => {
                   e.stopPropagation();
                   if (z.scale > 1.05) return;
                   if (offset < 0) goPhotoPrev(imgs, idx);
                   else if (offset > 0) goPhotoNext(imgs, idx);
                 }}>
              <img
                ref={offset === 0 ? zoomImgRef : null}
                src={imgs[ci]}
                alt="" draggable={false}
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'contain',
                  transformOrigin: 'center center',
                  willChange: 'transform',
                  display: 'block',
                }}
              />
            </div>
          );
        })}
      </div>
      {/* 하단 미니 썸네일 */}
      {n > 1 && (
        <div className="flex gap-2 pb-6 pt-2 px-4 flex-shrink-0" style={{ zIndex: 30 }}
             onClick={e => e.stopPropagation()}>
          {imgs.map((img, i) => (
            <div key={i} onClick={e => {
                   e.stopPropagation();
                   resetZoom(false);
                   setViewPhoto({ imgs, idx: i });
                   setViewPhotoAnim(null);
                 }}
                 className="relative flex-shrink-0 cursor-pointer transition-all duration-200"
                 style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden',
                   border: i === idx ? '2.5px solid white' : '2px solid rgba(255,255,255,0.25)',
                   opacity: i === idx ? 1 : 0.55,
                   transform: i === idx ? 'scale(1.12)' : 'scale(1)',
                   boxShadow: i === idx ? '0 4px 16px rgba(0,0,0,0.7)' : 'none' }}>
              <img src={img} className="w-full h-full object-cover" alt="" draggable={false} />
            </div>
          ))}
        </div>
      )}
      <button className="absolute top-4 right-4 text-white bg-black/50 px-3 py-1.5 rounded-full hover:bg-black/80 transition-colors text-sm font-bold" style={{ zIndex: 30 }}
              onClick={e => { e.stopPropagation(); setViewPhoto(null); }}><X className="w-[1em] h-[1em] inline" /></button>
    </div>
  );
};

export default PhotoViewerModal;
