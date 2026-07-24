import React from 'react';

interface WatermarkProps {
  opacity?: number;
  showLogo?: boolean;
  text?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A highly reusable and configurable EduNexus Watermark component.
 * It injects a subtle repeating diagonal text watermark, plus an elegant bottom-corner logo badge.
 * Designed to work seamlessly on-screen (with dark/light responsiveness) and in high-fidelity prints.
 */
export const NexusWatermark: React.FC<WatermarkProps> = ({
  opacity = 0.035,
  showLogo = true,
  text = 'EduNexus Curriculum',
  className = '',
  style = {},
}) => {
  // SVG background for a beautiful, repeating, tiled diagonal text watermark
  // Using low opacity to prevent interfering with reading, but clearly present
  const svgDataUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180"><text fill="rgba(95, 111, 82, ${opacity})" font-family="sans-serif" font-weight="900" font-size="12" dy="25" dx="-20" transform="rotate(-30 90 90)" text-anchor="middle">${text}</text></svg>`;

  // A dark-mode specific version with slightly lower opacity and white text for high legibility and contrast
  const darkSvgDataUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180"><text fill="rgba(255, 255, 255, ${opacity * 0.55})" font-family="sans-serif" font-weight="900" font-size="12" dy="25" dx="-20" transform="rotate(-30 90 90)" text-anchor="middle">${text}</text></svg>`;

  return (
    <>
      {/* Inline styles to handle repeating tile and print optimization */}
      <style>{`
        .nexus-watermark-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          background-image: url('${svgDataUrl}');
          background-repeat: repeat;
          z-index: 2;
        }
        .dark .nexus-watermark-overlay {
          background-image: url('${darkSvgDataUrl}');
        }
        @media print {
          .nexus-watermark-overlay {
            display: block !important;
            opacity: 1 !important;
            background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'><text fill='rgba(0, 0, 0, 0.025)' font-family='sans-serif' font-weight='900' font-size='12' dy='25' dx='-20' transform='rotate(-30 90 90)' text-anchor='middle'>${text}</text></svg>") !important;
            background-repeat: repeat !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .nexus-watermark-corner {
            display: flex !important;
            opacity: 0.25 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Repeating Tile Watermark */}
      <div 
        className={`nexus-watermark-overlay ${className}`} 
        style={style} 
        aria-hidden="true" 
      />

      {/* Corner Branding Emblem Overlay */}
      {showLogo && (
        <div 
          className="nexus-watermark-corner absolute bottom-4 right-4 pointer-events-none select-none flex items-center gap-1.5 opacity-[0.08] dark:opacity-[0.04] transition hover:opacity-20 z-10"
          aria-hidden="true"
        >
          <img 
            src="/icon.svg" 
            alt="EduNexus Emblem Logo" 
            className="w-5 h-5 rounded-md grayscale" 
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col">
            <span className="text-[9px] font-black tracking-widest text-[#5f6f52] dark:text-slate-300 uppercase font-sans leading-none">EduNexus</span>
            <span className="text-[7px] text-slate-500 dark:text-slate-400 font-mono tracking-tight uppercase leading-none">Certified</span>
          </div>
        </div>
      )}
    </>
  );
};

/**
 * A direct functional injector that returns an inline background style or SVG definition
 * if custom JS injection is needed for canvases or external rendering engines.
 */
export function getNexusWatermarkStyle(opacity = 0.03): React.CSSProperties {
  const svgDataUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180"><text fill="rgba(95, 111, 82, ${opacity})" font-family="sans-serif" font-weight="900" font-size="12" dy="25" dx="-20" transform="rotate(-30 90 90)" text-anchor="middle">EduNexus Curriculum</text></svg>`;
  return {
    backgroundImage: `url('${svgDataUrl}')`,
    backgroundRepeat: 'repeat',
  };
}
