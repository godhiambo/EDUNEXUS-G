import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type LogoPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
export type BrandingProfile = 'educational' | 'marketing' | 'social';

export interface MediaOverrides {
  images: boolean;
  videos: boolean;
  diagrams: boolean;
  infographics: boolean;
  certificates: boolean;
  worksheets: boolean;
  lessonPlans: boolean;
  presentations: boolean;
  pdfs: boolean;
  wordDocs: boolean;
}

export interface BrandingConfig {
  enabled: boolean;
  logoUrl: string;
  wordmark: string;
  slogan: string;
  website: string;
  showWebsite: boolean;
  showQrCode: boolean;
  qrCodeData: string;
  copyrightNotice: string;
  showTimestamp: boolean;
  position: LogoPosition;
  opacity: number; // 0.1 - 1.0
  logoScale: number; // 0.02 - 0.15 relative to container width
  safeMargin: number; // pixels, default 24
  introDuration: number; // seconds
  outroDuration: number; // seconds
  activeProfile: BrandingProfile;
  mediaOverrides: MediaOverrides;
  primaryColor: string;
  secondaryColor: string;
}

export const DEFAULT_BRANDING_CONFIG: BrandingConfig = {
  enabled: true,
  logoUrl: '/icon.svg',
  wordmark: 'EduNexus',
  slogan: 'Empowering Learning Through AI',
  website: 'joinedunexus.app',
  showWebsite: true,
  showQrCode: true,
  qrCodeData: 'https://joinedunexus.app',
  copyrightNotice: '© EduNexus. All rights reserved.',
  showTimestamp: true,
  position: 'bottom-right',
  opacity: 0.85,
  logoScale: 0.05,
  safeMargin: 24,
  introDuration: 3,
  outroDuration: 4,
  activeProfile: 'educational',
  primaryColor: '#5f6f52',
  secondaryColor: '#2f3e28',
  mediaOverrides: {
    images: true,
    videos: true,
    diagrams: true,
    infographics: true,
    certificates: true,
    worksheets: true,
    lessonPlans: true,
    presentations: true,
    pdfs: true,
    wordDocs: true,
  },
};

const STORAGE_KEY = 'edunexus_branding_config_v1';
const listeners: Set<(config: BrandingConfig) => void> = new Set();

/**
 * Retrieves the active EduNexus Branding Configuration from localStorage with fallback to DEFAULT_BRANDING_CONFIG.
 */
export function getBrandingConfig(): BrandingConfig {
  if (typeof window === 'undefined') return DEFAULT_BRANDING_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_BRANDING_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_BRANDING_CONFIG,
      ...parsed,
      mediaOverrides: {
        ...DEFAULT_BRANDING_CONFIG.mediaOverrides,
        ...(parsed.mediaOverrides || {}),
      },
    };
  } catch (err) {
    console.warn('Failed to parse edunexus_branding_config:', err);
    return DEFAULT_BRANDING_CONFIG;
  }
}

/**
 * Saves the updated Branding Configuration to localStorage, notifies subscribers, and attempts Firestore persistence.
 */
export async function saveBrandingConfig(newConfig: Partial<BrandingConfig>): Promise<BrandingConfig> {
  const current = getBrandingConfig();
  const merged: BrandingConfig = {
    ...current,
    ...newConfig,
    mediaOverrides: {
      ...current.mediaOverrides,
      ...(newConfig.mediaOverrides || {}),
    },
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  }

  // Notify active listeners
  listeners.forEach((listener) => listener(merged));

  // Sync with Firestore if possible
  try {
    const configRef = doc(db, 'system_settings', 'branding');
    await setDoc(configRef, merged, { merge: true });
  } catch (err) {
    console.warn('Firestore branding config save non-blocking warning:', err);
  }

  return merged;
}

/**
 * Subscribe to branding configuration changes
 */
export function subscribeBrandingConfig(callback: (config: BrandingConfig) => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Loads remote branding config from Firestore on app init
 */
export async function syncRemoteBrandingConfig(): Promise<BrandingConfig> {
  try {
    const configRef = doc(db, 'system_settings', 'branding');
    const snap = await getDoc(configRef);
    if (snap.exists()) {
      const data = snap.data() as Partial<BrandingConfig>;
      const merged = await saveBrandingConfig(data);
      return merged;
    }
  } catch (err) {
    console.warn('Could not sync remote branding config from Firestore:', err);
  }
  return getBrandingConfig();
}

/**
 * Draws the official EduNexus watermark badge onto any HTML5 Canvas Context.
 */
export function applyCanvasWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  customConfig?: Partial<BrandingConfig>
): void {
  const cfg = { ...getBrandingConfig(), ...(customConfig || {}) };
  if (!cfg.enabled) return;

  ctx.save();

  // Calculate proportional watermark scale & offsets
  const margin = Math.max(12, Math.min(cfg.safeMargin, Math.min(width, height) * 0.05));
  const targetWidth = Math.max(80, width * cfg.logoScale);
  const badgeHeight = Math.max(36, targetWidth * 0.45);
  const badgeWidth = Math.max(120, targetWidth * 2.2);

  let x = margin;
  let y = margin;

  if (cfg.position === 'bottom-right') {
    x = width - badgeWidth - margin;
    y = height - badgeHeight - margin;
  } else if (cfg.position === 'bottom-left') {
    x = margin;
    y = height - badgeHeight - margin;
  } else if (cfg.position === 'top-right') {
    x = width - badgeWidth - margin;
    y = margin;
  } else if (cfg.position === 'top-left') {
    x = margin;
    y = margin;
  }

  // Set opacity
  ctx.globalAlpha = Math.max(0.1, Math.min(1.0, cfg.opacity));

  // Draw elegant pill backdrop
  const radius = 12;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + badgeWidth - radius, y);
  ctx.quadraticCurveTo(x + badgeWidth, y, x + badgeWidth, y + radius);
  ctx.lineTo(x + badgeWidth, y + badgeHeight - radius);
  ctx.quadraticCurveTo(x + badgeWidth, y + badgeHeight, x + badgeWidth - radius, y + badgeHeight);
  ctx.lineTo(x + radius, y + badgeHeight);
  ctx.quadraticCurveTo(x, y + badgeHeight, x, y + badgeHeight - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Draw Logo Circle / Symbol
  const logoRadius = badgeHeight * 0.3;
  const logoX = x + margin * 0.6 + logoRadius;
  const logoY = y + badgeHeight / 2;

  ctx.fillStyle = cfg.primaryColor;
  ctx.beginPath();
  ctx.arc(logoX, logoY, logoRadius, 0, Math.PI * 2);
  ctx.fill();

  // Inner logo mark 'E'
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(logoRadius * 1.2)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('N', logoX, logoY + 1);

  // Draw EduNexus Wordmark Text
  const textX = logoX + logoRadius + 8;
  ctx.textAlign = 'left';

  // Primary Title
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(badgeHeight * 0.32)}px sans-serif`;
  ctx.fillText(cfg.wordmark, textX, y + badgeHeight * 0.38);

  // Secondary Website / Slogan
  ctx.fillStyle = '#cbd5e1';
  ctx.font = `500 ${Math.round(badgeHeight * 0.22)}px sans-serif`;
  const subText = cfg.showWebsite ? cfg.website : cfg.slogan;
  ctx.fillText(subText, textX, y + badgeHeight * 0.72);

  ctx.restore();
}

/**
 * Takes an input image (Data URL, Blob, or HTMLImageElement) and applies EduNexus watermark post-processing.
 * Returns a Promise that resolves to a high-resolution base64 PNG Data URL.
 */
export async function applyImageWatermark(
  imageSource: string | HTMLImageElement | Blob | File,
  customConfig?: Partial<BrandingConfig>
): Promise<string> {
  const cfg = { ...getBrandingConfig(), ...(customConfig || {}) };
  if (!cfg.enabled || !cfg.mediaOverrides.images) {
    if (typeof imageSource === 'string') return imageSource;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const processLoadedImage = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 1024;
        canvas.height = img.naturalHeight || img.height || 1024;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(typeof imageSource === 'string' ? imageSource : img.src);
          return;
        }

        // 1. Draw base image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // 2. Apply EduNexus Branding Watermark
        applyCanvasWatermark(ctx, canvas.width, canvas.height, cfg);

        // 3. Export as base64 PNG
        const watermarkedDataUrl = canvas.toDataURL('image/png', 0.95);
        resolve(watermarkedDataUrl);
      } catch (err) {
        console.error('Error applying image watermark:', err);
        // Fallback to original
        resolve(typeof imageSource === 'string' ? imageSource : img.src);
      }
    };

    img.onload = processLoadedImage;
    img.onerror = (err) => {
      console.warn('Image load failed for watermarking:', err);
      if (typeof imageSource === 'string') resolve(imageSource);
      else reject(err);
    };

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else if (imageSource instanceof Blob) {
      const url = URL.createObjectURL(imageSource);
      img.src = url;
    } else if (imageSource instanceof HTMLImageElement) {
      if (imageSource.complete) processLoadedImage();
      else img.src = imageSource.src;
    }
  });
}
