import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  setDoc, 
  writeBatch,
  enableMultiTabIndexedDbPersistence,
  enableIndexedDbPersistence 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { SavedDocument } from './types';
import { compressObject, decompressObject, compressString, decompressString } from './utils/compression';
import firebaseConfigJson from '../firebase-applet-config.json';

type FirebaseConfigShape = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
  firestoreDatabaseId?: string;
  databaseId?: string;
};

const envFirebaseConfig: FirebaseConfigShape = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim(),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim(),
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID?.trim(),
  firestoreDatabaseId: import.meta.env.VITE_FIRESTORE_DATABASE_ID?.trim(),
};

const hasEnvFirebaseConfig =
  !!envFirebaseConfig.apiKey &&
  !!envFirebaseConfig.authDomain &&
  !!envFirebaseConfig.projectId &&
  !!envFirebaseConfig.appId;

const jsonConfig = firebaseConfigJson as FirebaseConfigShape;
const hasJsonConfig = !!jsonConfig.apiKey && !!jsonConfig.projectId && !!jsonConfig.appId;

export const firebaseConfig: FirebaseConfigShape = hasJsonConfig
  ? jsonConfig
  : (hasEnvFirebaseConfig ? envFirebaseConfig : jsonConfig);

export const firebaseProjectId = firebaseConfig.projectId || 'your-firebase-project-id';
export const firebaseAuthDomain = firebaseConfig.authDomain || 'your-project.firebaseapp.com';

const app = initializeApp(firebaseConfig);
const databaseId =
  firebaseConfig.firestoreDatabaseId ||
  firebaseConfig.databaseId ||
  envFirebaseConfig.firestoreDatabaseId;

export const db = databaseId
  ? initializeFirestore(
      app,
      {
        experimentalAutoDetectLongPolling: true,
      },
      databaseId
    )
  : initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    });

// Enable Firestore multi-tab offline persistence for seamless classroom connectivity
if (typeof window !== 'undefined') {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open; fall back to single tab persistence
      enableIndexedDbPersistence(db).catch((e) => {
        console.warn('[Firestore Offline Persistence Warning]', e);
      });
    } else if (err.code === 'unimplemented') {
      console.warn('[Firestore Offline Persistence Unimplemented]', err);
    }
  });
}
export const auth = getAuth();
export const storage = getStorage(app);

// Non-blocking asynchronous connection check
async function testConnection() {
  try {
    // Non-blocking connection check if needed
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj as any)) {
      const val = (obj as any)[key];
      if (val !== undefined) {
        cleaned[key] = cleanUndefined(val);
      }
    }
    return cleaned as T;
  }
  return obj;
}

export { compressObject, decompressObject, compressString, decompressString } from './utils/compression';

export async function saveDocumentWithImageChunks(docId: string, docData: SavedDocument): Promise<SavedDocument> {
  let content = docData.content || '';
  let imageUrl = docData.imageUrl || '';

  const base64ImagesToSave: { id: string; base64Url: string }[] = [];
  let imageIndex = 0;

  // 1. Regex for Markdown images with base64 data URLs: ![alt](data:image/...)
  const markdownImageRegex = /!\[(.*?)\]\((data:image\/[a-zA-Z0-9+.-]+;base64,[\s\S]*?)\)/gi;

  let updatedContent = content.replace(markdownImageRegex, (fullMatch, altText, base64Url) => {
    const refId = imageIndex === 0 ? `db-image-ref:${docId}` : `db-image-ref:${docId}_img${imageIndex}`;
    base64ImagesToSave.push({ id: refId, base64Url });
    imageIndex++;
    return `![${altText}](${refId})`;
  });

  // 2. Check if docData.imageUrl itself is a base64 data URL
  let updatedImageUrl = imageUrl;
  if (imageUrl && imageUrl.startsWith('data:image/')) {
    const refId = `db-image-ref:${docId}`;
    base64ImagesToSave.push({ id: refId, base64Url: imageUrl });
    updatedImageUrl = refId;
  }

  // 3. Fallback: catch any standalone raw data:image/...;base64,... strings longer than 1000 chars in content
  const rawDataUrlRegex = /(data:image\/[a-zA-Z0-9+.-]+;base64,[\s\S]*?)(?=["'\s\)]|$)/gi;
  updatedContent = updatedContent.replace(rawDataUrlRegex, (rawBase64) => {
    if (rawBase64.length > 1000) {
      const refId = imageIndex === 0 ? `db-image-ref:${docId}` : `db-image-ref:${docId}_img${imageIndex}`;
      base64ImagesToSave.push({ id: refId, base64Url: rawBase64 });
      imageIndex++;
      return refId;
    }
    return rawBase64;
  });

  const finalDocData: SavedDocument = {
    ...docData,
    content: updatedContent,
    imageUrl: updatedImageUrl || docData.imageUrl,
  };

  if (base64ImagesToSave.length > 0) {
    const batch = writeBatch(db);
    const mainDocRef = doc(db, 'documents', docId);
    batch.set(mainDocRef, cleanUndefined(compressObject(finalDocData)));

    const chunksColRef = collection(db, 'documents', docId, 'imageChunks');

    const chunkString = (str: string, size: number): string[] => {
      const chunks: string[] = [];
      for (let i = 0; i < str.length; i += size) {
        chunks.push(str.slice(i, i + size));
      }
      return chunks;
    };

    const chunkSize = 500000; // 500 KB per chunk (safely well below 1MB limit)

    base64ImagesToSave.forEach((imgObj) => {
      const chunks = chunkString(imgObj.base64Url, chunkSize);
      chunks.forEach((chunk, idx) => {
        const chunkDocId = imgObj.id === `db-image-ref:${docId}`
          ? `chunk_${idx}`
          : `chunk_${imgObj.id.split('_img')[1] || '0'}_${idx}`;
        const chunkDocRef = doc(chunksColRef, chunkDocId);
        batch.set(chunkDocRef, {
          idx,
          data: chunk,
          total: chunks.length,
          imageId: imgObj.id,
        });
      });
    });

    try {
      await batch.commit();
      console.log(`[Image Chunking] Saved document ${docId} with ${base64ImagesToSave.length} image(s) chunked.`);
      return finalDocData;
    } catch (err) {
      console.error('[Image Chunking Error]', err);
      handleFirestoreError(err, OperationType.WRITE, `documents/${docId}/imageChunks`);
      throw err;
    }
  } else {
    try {
      await setDoc(doc(db, 'documents', docId), cleanUndefined(compressObject(finalDocData)));
      return finalDocData;
    } catch (err) {
      console.error('[Document Save Error]', err);
      handleFirestoreError(err, OperationType.WRITE, `documents/${docId}`);
      throw err;
    }
  }
}

