import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export interface TeacherLedSessionData {
  sessionId: string;
  tripId: string;
  isTeacherLedModeActive: boolean;
  teacherUid?: string;
  teacherName?: string;
  currentStopIndex: number;
  mapViewMode: 'interactive' | 'street' | 'satellite' | 'ar';
  spotlightMessage?: string | null;
  updatedAt: number;
}

const LOCAL_STORAGE_KEY = 'edunexus_teacher_led_session';
const BROADCAST_CHANNEL_NAME = 'edunexus_teacher_led_field_trip';

let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  } catch (e) {
    console.warn('[TeacherLedService] BroadcastChannel initialized with fallback.', e);
  }
}

/**
 * Broadcast updated Teacher-Led Session state across Firestore, BroadcastChannel, and LocalStorage
 */
export async function broadcastTeacherSession(data: TeacherLedSessionData): Promise<void> {
  const payload: TeacherLedSessionData = {
    ...data,
    updatedAt: Date.now()
  };

  // 1. LocalStorage update
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[TeacherLedService] LocalStorage set item failed', err);
  }

  // 2. BroadcastChannel trigger
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(payload);
    } catch (err) {
      console.warn('[TeacherLedService] BroadcastChannel postMessage failed', err);
    }
  }

  // 3. Firestore doc update
  const path = `fieldTripSessions/${payload.sessionId}`;
  try {
    const docRef = doc(db, 'fieldTripSessions', payload.sessionId);
    await setDoc(docRef, {
      sessionId: payload.sessionId,
      tripId: payload.tripId,
      isTeacherLedModeActive: payload.isTeacherLedModeActive,
      teacherUid: payload.teacherUid || 'teacher-host',
      teacherName: payload.teacherName || 'Lead Educator',
      currentStopIndex: payload.currentStopIndex,
      mapViewMode: payload.mapViewMode,
      spotlightMessage: payload.spotlightMessage || null,
      updatedAt: new Date(payload.updatedAt).toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('[TeacherLedService] Firestore setDoc fallback handled gracefully:', err);
  }
}

/**
 * Subscribe to Teacher-Led session updates from Firestore, BroadcastChannel, and LocalStorage
 */
export function subscribeToTeacherSession(
  sessionId: string,
  onUpdate: (data: TeacherLedSessionData) => void
): () => void {
  const unsubscribers: Array<() => void> = [];

  // 1. Initial cached state from LocalStorage
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as TeacherLedSessionData;
      if (parsed && (parsed.sessionId === sessionId || !sessionId)) {
        onUpdate(parsed);
      }
    }
  } catch (err) {
    console.warn('[TeacherLedService] LocalStorage parse error', err);
  }

  // 2. BroadcastChannel listener
  if (broadcastChannel) {
    const handleBroadcast = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'object') {
        const data = event.data as TeacherLedSessionData;
        if (data.sessionId === sessionId || !sessionId) {
          onUpdate(data);
        }
      }
    };
    broadcastChannel.addEventListener('message', handleBroadcast);
    unsubscribers.push(() => broadcastChannel?.removeEventListener('message', handleBroadcast));
  }

  // 3. Storage event listener for multi-tab fallback
  if (typeof window !== 'undefined') {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === LOCAL_STORAGE_KEY && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue) as TeacherLedSessionData;
          if (parsed && (parsed.sessionId === sessionId || !sessionId)) {
            onUpdate(parsed);
          }
        } catch (e) {}
      }
    };
    window.addEventListener('storage', handleStorage);
    unsubscribers.push(() => window.removeEventListener('storage', handleStorage));
  }

  // 4. Firestore onSnapshot real-time listener
  const docRef = doc(db, 'fieldTripSessions', sessionId);
  const unsubFirestore = onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const raw = snapshot.data();
        const data: TeacherLedSessionData = {
          sessionId: raw.sessionId || sessionId,
          tripId: raw.tripId || '',
          isTeacherLedModeActive: !!raw.isTeacherLedModeActive,
          teacherUid: raw.teacherUid || 'teacher-host',
          teacherName: raw.teacherName || 'Lead Educator',
          currentStopIndex: typeof raw.currentStopIndex === 'number' ? raw.currentStopIndex : 0,
          mapViewMode: raw.mapViewMode || 'interactive',
          spotlightMessage: raw.spotlightMessage || null,
          updatedAt: raw.updatedAt ? new Date(raw.updatedAt).getTime() : Date.now()
        };
        onUpdate(data);
      }
    },
    (err) => {
      console.warn('[TeacherLedService] Firestore snapshot listener notice:', err);
    }
  );
  unsubscribers.push(unsubFirestore);

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}
