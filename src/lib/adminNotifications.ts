import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AdminNotification } from '../types';

export async function triggerAdminNotification(
  type: 'teacher_registered' | 'suspension_threshold_triggered' | 'manual_warning',
  title: string,
  message: string,
  userEmail: string,
  userDisplayName: string,
  severity: 'info' | 'warning' | 'critical'
): Promise<AdminNotification> {
  const timestamp = new Date().toISOString();

  // Write notification document to Firestore
  const newNotificationData = {
    type,
    title,
    message,
    userEmail,
    userDisplayName,
    timestamp,
    severity,
    resolved: false,
    emailSent: false
  };

  try {
    const notificationsCol = collection(db, 'admin-notifications');
    const docRef = await addDoc(notificationsCol, newNotificationData);
    return {
      id: docRef.id,
      ...newNotificationData
    } as AdminNotification;
  } catch (error) {
    console.error('Failed to write admin notification to Firestore:', error);
    // Fallback in-memory simulation for sandbox environment
    return {
      id: `fallback-id-${Date.now()}`,
      ...newNotificationData
    } as AdminNotification;
  }
}
