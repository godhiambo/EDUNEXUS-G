import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserAccount } from '../types';
import { resolveDisplayName } from '../context/AuthContext';

export type ActivityAction = 'login' | 'view' | 'generate' | 'edit' | 'delete' | 'comment' | 'create' | 'feedback' | 'system';

export async function logActivity(
  action: ActivityAction,
  details: string,
  profile: UserAccount | null,
  documentId?: string | null,
  documentTitle?: string | null
) {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const computedName = resolveDisplayName(profile?.displayName, user.email, user.displayName);

    const logData = {
      userId: user.uid,
      userEmail: user.email || 'unknown@edunexus.local',
      userName: computedName,
      userRole: profile?.role || 'Student',
      action,
      details,
      documentId: documentId || null,
      documentTitle: documentTitle || null,
      timestamp: new Date().toISOString(),
    };

    const logsCol = collection(db, 'activity-logs');
    await addDoc(logsCol, logData);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
