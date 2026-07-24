import { SavedDocument } from '../types';

const OFFLINE_DOCS_KEY = 'edunexus_cached_curriculum_documents';
const OFFLINE_SYNC_TIME_KEY = 'edunexus_last_offline_sync_time';

export interface OfflineCacheStats {
  cachedDocCount: number;
  lastSyncTime: string | null;
  serviceWorkerActive: boolean;
  firestoreOfflineEnabled: boolean;
}

/**
 * Save curriculum documents to local storage backup and notify Service Worker
 * to precache associated images/assets for offline classroom access.
 */
export function saveCurriculumDocsToOfflineCache(docs: SavedDocument[]): void {
  if (typeof window === 'undefined') return;

  try {
    const serialized = JSON.stringify(docs);
    localStorage.setItem(OFFLINE_DOCS_KEY, serialized);
    const now = new Date().toISOString();
    localStorage.setItem(OFFLINE_SYNC_TIME_KEY, now);

    // Notify Service Worker to cache curriculum document assets
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const imageUrlsToCache: string[] = [];
      docs.forEach((doc) => {
        if (doc.imageUrl && !doc.imageUrl.startsWith('data:') && !doc.imageUrl.startsWith('db-image-ref:')) {
          imageUrlsToCache.push(doc.imageUrl);
        }
      });

      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_CURRICULUM_DOCS',
        documents: docs.map((d) => ({
          id: d.id,
          title: d.title,
          subject: d.subject,
          classLevel: d.classLevel,
          lastModified: d.lastModified || d.createdAt,
        })),
        imageUrls: imageUrlsToCache,
      });
    }
  } catch (e) {
    console.warn('[OfflineCache] Could not write to local storage backup:', e);
  }
}

/**
 * Retrieve cached curriculum documents from offline backup storage.
 */
export function getOfflineCachedDocuments(): SavedDocument[] | null {
  if (typeof window === 'undefined') return null;

  try {
    const data = localStorage.getItem(OFFLINE_DOCS_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as SavedDocument[];
    }
  } catch (e) {
    console.error('[OfflineCache] Failed to parse offline cached documents:', e);
  }
  return null;
}

/**
 * Request active Service Worker to synchronize and verify offline caches.
 */
export async function requestServiceWorkerCacheSync(docs?: SavedDocument[]): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  if (docs && docs.length > 0) {
    saveCurriculumDocsToOfflineCache(docs);
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (registration && registration.active) {
    registration.active.postMessage({
      type: 'VERIFY_OFFLINE_CACHE',
    });
    return true;
  }
  return false;
}

/**
 * Return diagnostic statistics about offline curriculum readiness.
 */
export function getOfflineCacheStats(): OfflineCacheStats {
  if (typeof window === 'undefined') {
    return {
      cachedDocCount: 0,
      lastSyncTime: null,
      serviceWorkerActive: false,
      firestoreOfflineEnabled: true,
    };
  }

  const docs = getOfflineCachedDocuments();
  const lastSyncTime = localStorage.getItem(OFFLINE_SYNC_TIME_KEY);

  return {
    cachedDocCount: docs ? docs.length : 0,
    lastSyncTime: lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
    serviceWorkerActive: !!(navigator.serviceWorker && navigator.serviceWorker.controller),
    firestoreOfflineEnabled: true,
  };
}
