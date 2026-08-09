import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface DocumentBroadcastData {
  sessionId: string; // e.g. "global_active_broadcast" or specific class ID
  documentId: string;
  documentTitle: string;
  documentContent: string;
  documentSubject?: string;
  documentClassLevel?: string;
  teacherUid: string;
  teacherName: string;
  isBroadcasting: boolean;
  spotlightNote?: string | null;
  activeSectionTitle?: string | null;
  updatedAt: number;
}

const LOCAL_STORAGE_KEY = 'edunexus_document_broadcast_session';
const BROADCAST_CHANNEL_NAME = 'edunexus_document_broadcast_channel';

let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  } catch (e) {
    console.warn('[DocumentBroadcastService] BroadcastChannel fallback:', e);
  }
}

/**
 * Broadcast current document state to all connected students across Firestore, BroadcastChannel, and LocalStorage
 */
export async function broadcastDocumentSession(data: Omit<DocumentBroadcastData, 'updatedAt'>): Promise<void> {
  const payload: DocumentBroadcastData = {
    ...data,
    updatedAt: Date.now()
  };

  // 1. LocalStorage
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[DocumentBroadcastService] LocalStorage set error:', err);
  }

  // 2. BroadcastChannel
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(payload);
    } catch (err) {
      console.warn('[DocumentBroadcastService] BroadcastChannel post error:', err);
    }
  }

  // 3. Firestore
  const sessionId = payload.sessionId || 'global_active_broadcast';
  try {
    const docRef = doc(db, 'documentBroadcastSessions', sessionId);
    await setDoc(docRef, {
      sessionId,
      documentId: payload.documentId,
      documentTitle: payload.documentTitle,
      documentContent: payload.documentContent,
      documentSubject: payload.documentSubject || 'General',
      documentClassLevel: payload.documentClassLevel || 'All Grades',
      teacherUid: payload.teacherUid || 'teacher-host',
      teacherName: payload.teacherName || 'Lead Educator',
      isBroadcasting: payload.isBroadcasting,
      spotlightNote: payload.spotlightNote || null,
      activeSectionTitle: payload.activeSectionTitle || null,
      updatedAt: payload.updatedAt
    }, { merge: true });
  } catch (err) {
    console.warn('[DocumentBroadcastService] Firestore setDoc fallback handled:', err);
  }
}

/**
 * Stop an active document broadcast
 */
export async function stopDocumentBroadcastSession(sessionId = 'global_active_broadcast', teacherUid?: string): Promise<void> {
  const payload: DocumentBroadcastData = {
    sessionId,
    documentId: '',
    documentTitle: '',
    documentContent: '',
    teacherUid: teacherUid || 'teacher',
    teacherName: 'Teacher',
    isBroadcasting: false,
    updatedAt: Date.now()
  };

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {}

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(payload);
    } catch (err) {}
  }

  try {
    const docRef = doc(db, 'documentBroadcastSessions', sessionId);
    await setDoc(docRef, {
      isBroadcasting: false,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (err) {}
}

/**
 * Subscribe to real-time Document Broadcast updates
 */
export function subscribeToDocumentBroadcast(
  sessionId = 'global_active_broadcast',
  onUpdate: (data: DocumentBroadcastData | null) => void
): () => void {
  const unsubscribers: Array<() => void> = [];

  // 1. Initial cached state from LocalStorage
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as DocumentBroadcastData;
      if (parsed) {
        onUpdate(parsed);
      }
    }
  } catch (err) {}

  // 2. BroadcastChannel listener
  if (broadcastChannel) {
    const handleBroadcast = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'object') {
        const data = event.data as DocumentBroadcastData;
        onUpdate(data);
      }
    };
    broadcastChannel.addEventListener('message', handleBroadcast);
    unsubscribers.push(() => broadcastChannel?.removeEventListener('message', handleBroadcast));
  }

  // 3. Window Storage event listener (multi-tab)
  if (typeof window !== 'undefined') {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === LOCAL_STORAGE_KEY && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue) as DocumentBroadcastData;
          onUpdate(parsed);
        } catch (e) {}
      }
    };
    window.addEventListener('storage', handleStorage);
    unsubscribers.push(() => window.removeEventListener('storage', handleStorage));
  }

  // 4. Firestore real-time onSnapshot listener
  const docRef = doc(db, 'documentBroadcastSessions', sessionId);
  const unsubFirestore = onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const raw = snapshot.data();
        const data: DocumentBroadcastData = {
          sessionId: raw.sessionId || sessionId,
          documentId: raw.documentId || '',
          documentTitle: raw.documentTitle || '',
          documentContent: raw.documentContent || '',
          documentSubject: raw.documentSubject || '',
          documentClassLevel: raw.documentClassLevel || '',
          teacherUid: raw.teacherUid || '',
          teacherName: raw.teacherName || 'Teacher',
          isBroadcasting: !!raw.isBroadcasting,
          spotlightNote: raw.spotlightNote || null,
          activeSectionTitle: raw.activeSectionTitle || null,
          updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now()
        };
        onUpdate(data);
      }
    },
    (err) => {
      console.warn('[DocumentBroadcastService] Firestore snapshot listener notice:', err);
    }
  );
  unsubscribers.push(unsubFirestore);

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}
