import { doc, setDoc, updateDoc, deleteDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { cleanUndefined } from '../firebase';

export type OfflineActionType = 'CREATE' | 'UPDATE' | 'DELETE';

export interface OfflineQueueItem {
  id: string;
  timestamp: string;
  collectionName: string;
  action: OfflineActionType;
  documentId?: string;
  title: string;
  payload: any;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  errorMessage?: string;
  createdAt: string;
}

const STORAGE_KEY = 'edunexus_pending_firestore_queue';
const EVENT_NAME = 'edunexus_offline_queue_changed';

/**
 * Retrieve current pending queue from LocalStorage.
 */
export function getOfflineQueue(): OfflineQueueItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[OfflineQueue] Error reading offline queue:', err);
    return [];
  }
}

/**
 * Persist queue array to LocalStorage and broadcast custom change event.
 */
function saveQueue(queue: OfflineQueueItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: queue }));
  } catch (err) {
    console.error('[OfflineQueue] Error saving offline queue:', err);
  }
}

/**
 * Add a new pending mutation to the offline queue.
 */
export function addToOfflineQueue(params: {
  collectionName: string;
  action: OfflineActionType;
  documentId?: string;
  title: string;
  payload: any;
}): OfflineQueueItem {
  const queue = getOfflineQueue();
  const newItem: OfflineQueueItem = {
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    createdAt: new Date().toISOString(),
    collectionName: params.collectionName,
    action: params.action,
    documentId: params.documentId,
    title: params.title || 'Untitled Update',
    payload: params.payload,
    status: 'pending',
    retryCount: 0,
  };

  const updatedQueue = [newItem, ...queue];
  saveQueue(updatedQueue);
  return newItem;
}

/**
 * Remove a specific item from the offline queue.
 */
export function removeFromOfflineQueue(id: string): void {
  const queue = getOfflineQueue();
  const updated = queue.filter((item) => item.id !== id);
  saveQueue(updated);
}

/**
 * Clear all synced items from the queue.
 */
export function clearSyncedFromOfflineQueue(): void {
  const queue = getOfflineQueue();
  const updated = queue.filter((item) => item.status !== 'synced');
  saveQueue(updated);
}

/**
 * Clear all items from the queue.
 */
export function clearAllOfflineQueue(): void {
  saveQueue([]);
}

/**
 * Update a specific item's status in the queue.
 */
export function updateQueueItemStatus(
  id: string,
  status: OfflineQueueItem['status'],
  errorMessage?: string
): void {
  const queue = getOfflineQueue();
  const updated = queue.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        status,
        retryCount: status === 'failed' ? item.retryCount + 1 : item.retryCount,
        errorMessage: errorMessage || item.errorMessage,
      };
    }
    return item;
  });
  saveQueue(updated);
}

/**
 * Process all pending items in the offline queue by attempting to sync with Firestore.
 */
export async function processOfflineQueue(): Promise<{ successCount: number; failedCount: number }> {
  const queue = getOfflineQueue();
  const pending = queue.filter((i) => i.status === 'pending' || i.status === 'failed');

  if (pending.length === 0) {
    return { successCount: 0, failedCount: 0 };
  }

  let successCount = 0;
  let failedCount = 0;

  for (const item of pending) {
    updateQueueItemStatus(item.id, 'syncing');
    try {
      const sanitizedPayload = item.payload ? cleanUndefined(item.payload) : {};

      if (item.action === 'CREATE') {
        if (item.documentId) {
          const docRef = doc(db, item.collectionName, item.documentId);
          await setDoc(docRef, {
            ...sanitizedPayload,
            syncedAt: new Date().toISOString(),
          }, { merge: true });
        } else {
          const colRef = collection(db, item.collectionName);
          await addDoc(colRef, {
            ...sanitizedPayload,
            syncedAt: new Date().toISOString(),
          });
        }
      } else if (item.action === 'UPDATE') {
        if (!item.documentId) {
          throw new Error('Document ID missing for UPDATE action');
        }
        const docRef = doc(db, item.collectionName, item.documentId);
        await updateDoc(docRef, {
          ...sanitizedPayload,
          updatedAt: new Date().toISOString(),
        });
      } else if (item.action === 'DELETE') {
        if (!item.documentId) {
          throw new Error('Document ID missing for DELETE action');
        }
        const docRef = doc(db, item.collectionName, item.documentId);
        await deleteDoc(docRef);
      }

      updateQueueItemStatus(item.id, 'synced');
      successCount++;
    } catch (err: any) {
      console.error(`[OfflineQueue] Error syncing queue item ${item.id}:`, err);
      updateQueueItemStatus(item.id, 'failed', err?.message || 'Firestore connection error');
      failedCount++;
    }
  }

  return { successCount, failedCount };
}

/**
 * Subscribe to offline queue changes.
 */
export function subscribeOfflineQueue(callback: (queue: OfflineQueueItem[]) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<OfflineQueueItem[]>;
    callback(custom.detail || getOfflineQueue());
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      callback(getOfflineQueue());
    }
  };

  window.addEventListener(EVENT_NAME, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  // Initial call
  callback(getOfflineQueue());

  return () => {
    window.removeEventListener(EVENT_NAME, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}
