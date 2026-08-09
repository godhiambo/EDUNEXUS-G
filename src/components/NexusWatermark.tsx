import React, { useState, useEffect } from 'react';
import { getBrandingConfig, subscribeBrandingConfig, BrandingConfig } from '../services/brandingService';

interface WatermarkProps {
  opacity?: number;
  showLogo?: boolean;
  text?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Reusable and configurable EduNexus Watermark component.
 * It injects a repeating diagonal text watermark, plus an adaptive corner logo badge based on the central Branding Service.
 */
export const NexusWatermark: React.FC<WatermarkProps> = ({
  opacity: customOpacity,
  showLogo = true,
  text: customText,
  className = '',
  style = {},
}) => {
  const [config, setConfig] = useState<BrandingConfig>(getBrandingConfig());

  useEffect(() => {
    return subscribeBrandingConfig((newCfg) => setConfig(newCfg));
  }, []);

  if (!config.enabled) {
    return null;
  }

  const activeOpacity = customOpacity ?? 0.035;
  const activeText = customText ?? `${config.wordmark} ${config.slogan}`;

  const svgDataUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180"><text fill="rgba(95, 111, 82, ${activeOpacity})" font-family="sans-serif" font-weight="900" font-size="12" dy="25" dx="-20" transform="rotate(-30 90 90)" text-anchor="middle">${activeText}</text></svg>`;
  const darkSvgDataUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180"><text fill="rgba(255, 255, 255, ${activeOpacity * 0.55})" font-family="sans-serif" font-weight="900" font-size="12" dy="25" dx="-20" transform="rotate(-30 90 90)" text-anchor="middle">${activeText}</text></svg>`;

  const positionClass = 
    config.position === 'bottom-left' ? 'bottom-4 left-4' :
    config.position === 'top-right' ? 'top-4 right-4' :
    config.position === 'top-left' ? 'top-4 left-4' : 'bottom-4 right-4';

  return (
    <>
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
            background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'><text fill='rgba(0, 0, 0, 0.025)' font-family='sans-serif' font-weight='900' font-size='12' dy='25' dx='-20' transform='rotate(-30 90 90)' text-anchor='middle'>${activeText}</text></svg>") !important;
            background-repeat: repeat !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .nexus-watermark-corner {
            display: flex !important;
            opacity: 0.35 !important;
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
          className={`nexus-watermark-corner absolute ${positionClass} pointer-events-none select-none flex items-center gap-2 p-1.5 rounded-xl bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 shadow-md transition hover:opacity-100 z-10`}
          style={{ opacity: Math.max(0.1, config.opacity * 0.8) }}
          aria-hidden="true"
        >
          <img 
            src={config.logoUrl || "/icon.svg"} 
            alt={`${config.wordmark} Logo`} 
            className="w-4 h-4 rounded-md object-contain" 
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col">
            <span className="text-[9px] font-black tracking-widest text-white uppercase font-sans leading-none">{config.wordmark}</span>
            {config.showWebsite && (
              <span className="text-[7px] text-slate-300 font-mono tracking-tight uppercase leading-none mt-0.5">{config.website}</span>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export function getNexusWatermarkStyle(opacity = 0.03): React.CSSProperties {
  const cfg = getBrandingConfig();
  const text = `${cfg.wordmark} ${cfg.slogan}`;
  const svgDataUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180"><text fill="rgba(95, 111, 82, ${opacity})" font-family="sans-serif" font-weight="900" font-size="12" dy="25" dx="-20" transform="rotate(-30 90 90)" text-anchor="middle">${text}</text></svg>`;
  return {
    backgroundImage: `url('${svgDataUrl}')`,
    backgroundRepeat: 'repeat',
  };
}
