import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, cleanUndefined } from '../firebase';
import { FieldTripStickyNote } from '../types/virtualFieldTrip';

const COLLECTION_NAME = 'fieldTripStickyNotes';

// Initial sample sticky notes for virtual field trip stops to demonstrate real-time collaborative notes immediately
export const SAMPLE_FIELD_TRIP_STICKY_NOTES: FieldTripStickyNote[] = [
  {
    id: 'sample-note-1',
    routeId: 'paris-louvre-architectural-tour',
    stopNumber: 1,
    locationName: 'Eiffel Tower Esplanade',
    lat: 48.8584,
    lng: 2.2945,
    xPercentage: 28,
    yPercentage: 35,
    text: 'Notice the lattice wrought iron geometry! Gustav Eiffel designed this with wind resilience in mind.',
    authorUid: 'teacher-1',
    authorName: 'Mr. Ojiambo (Teacher)',
    authorRole: 'Teacher',
    color: 'yellow',
    category: 'insight',
    likesCount: 5,
    likedByUids: ['student-1', 'student-2'],
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'sample-note-2',
    routeId: 'paris-louvre-architectural-tour',
    stopNumber: 1,
    locationName: 'Eiffel Tower Esplanade',
    lat: 48.8584,
    lng: 2.2945,
    xPercentage: 68,
    yPercentage: 55,
    text: 'Class Question: What foreign language directional cue would you use to guide someone south across the Seine river?',
    authorUid: 'teacher-1',
    authorName: 'Mr. Ojiambo (Teacher)',
    authorRole: 'Teacher',
    color: 'purple',
    category: 'question',
    likesCount: 4,
    likedByUids: ['student-1'],
    createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString()
  },
  {
    id: 'sample-note-3',
    routeId: 'paris-louvre-architectural-tour',
    stopNumber: 1,
    locationName: 'Eiffel Tower Esplanade',
    lat: 48.8584,
    lng: 2.2945,
    xPercentage: 45,
    yPercentage: 72,
    text: 'I observed the rivets along the arches! "Au sud" means to the south in French!',
    authorUid: 'student-1',
    authorName: 'Sarah K. (Student)',
    authorRole: 'Student',
    color: 'green',
    category: 'discovery',
    likesCount: 3,
    likedByUids: ['teacher-1'],
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: 'sample-note-4',
    routeId: 'great-wall-beijing-exploration',
    stopNumber: 1,
    locationName: 'Badaling Pass Fortress',
    lat: 40.3582,
    lng: 116.0152,
    xPercentage: 35,
    yPercentage: 40,
    text: 'Look at the watchtowers positioned along the ridge for smoke signal communications!',
    authorUid: 'teacher-1',
    authorName: 'Mr. Ojiambo (Teacher)',
    authorRole: 'Teacher',
    color: 'amber',
    category: 'insight',
    likesCount: 6,
    likedByUids: ['student-2'],
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  }
];

export class FieldTripNotesService {
  /**
   * Subscribe to real-time sticky notes for a specific virtual field trip route
   */
  static subscribeNotesByRoute(
    routeId: string,
    onSuccess: (notes: FieldTripStickyNote[]) => void,
    onError?: (error: any) => void
  ): () => void {
    try {
      const notesCol = collection(db, COLLECTION_NAME);
      const q = query(notesCol, where('routeId', '==', routeId));

      return onSnapshot(
        q,
        (snapshot) => {
          const notes: FieldTripStickyNote[] = [];
          snapshot.forEach((docSnap) => {
            notes.push({ id: docSnap.id, ...docSnap.data() } as FieldTripStickyNote);
          });

          // Sort by creation date ascending
          notes.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          onSuccess(notes);
        },
        (error) => {
          console.warn('[FieldTripNotesService] Real-time listener error, falling back:', error);
          if (onError) onError(error);
          // Return sample fallback notes for this route
          const fallback = SAMPLE_FIELD_TRIP_STICKY_NOTES.filter((n) => n.routeId === routeId);
          onSuccess(fallback);
        }
      );
    } catch (err) {
      console.warn('[FieldTripNotesService] Real-time subscription failed:', err);
      const fallback = SAMPLE_FIELD_TRIP_STICKY_NOTES.filter((n) => n.routeId === routeId);
      onSuccess(fallback);
      return () => {};
    }
  }

  /**
   * Add a new collaborative sticky note
   */
  static async addNote(
    noteData: Omit<FieldTripStickyNote, 'id' | 'createdAt' | 'likesCount' | 'likedByUids'>
  ): Promise<FieldTripStickyNote> {
    const newNote: Omit<FieldTripStickyNote, 'id'> = {
      ...noteData,
      likesCount: 0,
      likedByUids: [],
      createdAt: new Date().toISOString()
    };

    try {
      const notesCol = collection(db, COLLECTION_NAME);
      const docRef = await addDoc(notesCol, cleanUndefined(newNote));
      return { id: docRef.id, ...newNote };
    } catch (err) {
      console.error('[FieldTripNotesService] Failed to save sticky note to Firestore:', err);
      handleFirestoreError(err, OperationType.CREATE, COLLECTION_NAME);
      // Fallback return with synthetic ID for local reactive state
      return { id: `local-note-${Date.now()}`, ...newNote };
    }
  }

  /**
   * Toggle like / reaction on a sticky note
   */
  static async toggleLike(
    noteId: string,
    userUid: string,
    currentLikedByUids: string[] = [],
    currentLikesCount: number = 0
  ): Promise<{ liked: boolean; newCount: number; newLikedByUids: string[] }> {
    const isAlreadyLiked = currentLikedByUids.includes(userUid);
    const newLikedByUids = isAlreadyLiked
      ? currentLikedByUids.filter((id) => id !== userUid)
      : [...currentLikedByUids, userUid];
    const newCount = Math.max(0, isAlreadyLiked ? currentLikesCount - 1 : currentLikesCount + 1);

    if (!noteId.startsWith('sample-') && !noteId.startsWith('local-')) {
      try {
        const noteRef = doc(db, COLLECTION_NAME, noteId);
        await updateDoc(noteRef, {
          likedByUids: newLikedByUids,
          likesCount: newCount
        });
      } catch (err) {
        console.error('[FieldTripNotesService] Error updating sticky note likes:', err);
        handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${noteId}`);
      }
    }

    return { liked: !isAlreadyLiked, newCount, newLikedByUids };
  }

  /**
   * Delete a collaborative sticky note
   */
  static async deleteNote(noteId: string): Promise<void> {
    if (!noteId.startsWith('sample-') && !noteId.startsWith('local-')) {
      try {
        const noteRef = doc(db, COLLECTION_NAME, noteId);
        await deleteDoc(noteRef);
      } catch (err) {
        console.error('[FieldTripNotesService] Error deleting sticky note:', err);
        handleFirestoreError(err, OperationType.DELETE, `${COLLECTION_NAME}/${noteId}`);
      }
    }
  }
}
