import React from 'react';

const DynamicStyles = ({ fontScale, appTextColor, isDarkMode }) => {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

        :root {
          --font-scale: ${fontScale};
          /* [NEW] 글자 색상 동적 변수 할당 */
          --main-text-color: ${(() => {
            if (appTextColor === 'original') return isDarkMode ? '#f1f5f9' : '#0f172a'; // 초기 테마는 기본 시스템 색상 따름
            if (appTextColor === 'high-contrast') return isDarkMode ? '#ffffff' : '#000000'; // 고대비: 완전 흰색/검정
            if (appTextColor === 'monochrome') return isDarkMode ? '#94a3b8' : '#64748b'; // 단색: 뚜렷하게 옅은 회색
            return isDarkMode ? '#e2e8f0' : '#1e293b'; // 기본값: 고대비보다 한 톤 옅은 짙은 회색
          })()};
        }

        /* [수정 완료] 전역 글자색 로직 최적화 및 가독성 보호 */
        body { color: var(--main-text-color); }

        /* 유색 배경의 태그/버튼들은 전역 글자색 변경에서 제외하여 가독성 확보 */
        .is-tag, .is-tag *, .text-white, .text-white *,
        .bg-indigo-600 *, .bg-indigo-500 *, .bg-rose-500 *, .bg-orange-500 *, .bg-emerald-500 *, .bg-pink-500 * {
          color: white !important;
          text-shadow: 0 1px 1px rgba(0,0,0,0.1);
        }

        ${appTextColor !== 'original' && appTextColor !== 'default' ? `
          /* 일반 텍스트들만 선택된 글자색으로 변경 */
          p, span:not(.is-tag), div:not(.is-tag), h1, h2, h3, h4, h5, h6, label {
            color: var(--main-text-color) !important;
          }
        ` : ''}

        /* 아이콘 및 특수 컴포넌트 보호 */
        .no-recolor, .no-recolor *, .leaflet-container *, .leaflet-popup-content * { color: inherit !important; }

        /* Tailwind 텍스트 클래스들 동적 오버라이드 (폰트 스케일 적용) */
        .text-\\[6px\\] { font-size: calc(6px * var(--font-scale)) !important; }
        .text-\\[7px\\] { font-size: calc(7px * var(--font-scale)) !important; }
        .text-\\[8px\\] { font-size: calc(8px * var(--font-scale)) !important; }
        .text-\\[9px\\] { font-size: calc(9px * var(--font-scale)) !important; }
        .text-\\[10px\\] { font-size: calc(10px * var(--font-scale)) !important; }
        .text-\\[11px\\] { font-size: calc(11px * var(--font-scale)) !important; }
        .text-xs { font-size: calc(0.75rem * var(--font-scale)) !important; line-height: calc(1rem * var(--font-scale)) !important; }
        .text-sm { font-size: calc(0.875rem * var(--font-scale)) !important; line-height: calc(1.25rem * var(--font-scale)) !important; }
        .text-base { font-size: calc(1rem * var(--font-scale)) !important; line-height: calc(1.5rem * var(--font-scale)) !important; }
        .text-lg { font-size: calc(1.125rem * var(--font-scale)) !important; line-height: calc(1.75rem * var(--font-scale)) !important; }
        .text-xl { font-size: calc(1.25rem * var(--font-scale)) !important; line-height: calc(1.75rem * var(--font-scale)) !important; }
        .text-2xl { font-size: calc(1.5rem * var(--font-scale)) !important; line-height: calc(2rem * var(--font-scale)) !important; }

        body {
          font-family: inherit;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          overflow: hidden;
          scrollbar-width: none;
        }
        body::-webkit-scrollbar { display: none; }
        html { overflow: hidden; scrollbar-width: none; }
        html::-webkit-scrollbar { display: none; }

        /* 스크롤바 공간 완전 제거 - 레이아웃에 영향 없이 콘텐츠 위에 오버레이로만 표시 */
        * {
          scrollbar-width: none;
        }
        *::-webkit-scrollbar {
          width: 0px;
          height: 0px;
          background: transparent;
        }
        /* 스크롤 가능 영역은 overflow:overlay로 레이아웃 공간 미차지 */
        .overflow-y-auto, .overflow-x-auto, .custom-scrollbar {
          overflow: overlay !important;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.4); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(71,85,105,0.5); }
        input[type="text"], input[type="password"], input[type="date"], select { font-variant-numeric: tabular-nums; }
        .leaflet-container { z-index: 10; font-family: inherit; background: transparent; border-radius: 1rem; transition: filter 0.3s; }
        .dark .leaflet-container { filter: brightness(0.8) contrast(1.2); }
        .leaflet-popup-content-wrapper { border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); border: 1px solid #e2e8f0; transition: all 0.3s; }
        .dark .leaflet-popup-content-wrapper { background: #1e293b; border-color: #334155; color: white; }
        .leaflet-popup-content { margin: 12px; font-family: inherit; line-height: 1.4; }
        .leaflet-popup-tip { background: #fff; border-top: 1px solid #e2e8f0; border-left: 1px solid #e2e8f0; transition: all 0.3s; }
        .dark .leaflet-popup-tip { background: #1e293b; border-top-color: #334155; border-left-color: #334155; }

        /* [NEW] 배달의민족 스타일 통통 튀는 모션 및 그림자 애니메이션 */
        @keyframes baemin-bounce {
          0% { transform: translateY(0px) scaleY(0.95); }
          100% { transform: translateY(-12px) scaleY(1.05); }
        }
        @keyframes baemin-shadow {
          0% { transform: translateX(-50%) scale(1); opacity: 0.4; }
          100% { transform: translateX(-50%) scale(0.5); opacity: 0.1; }
        }
      `}} />
  );
};

export default DynamicStyles;
