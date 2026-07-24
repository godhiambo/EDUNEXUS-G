import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getGoogleWorkspaceToken } from './googleWorkspace';
import { AdminNotification } from '../types';

const ADMIN_EMAILS = ['ojiambo.godfry@gmail.com', 'godfreynexused@gmail.com'];

export async function triggerAdminNotification(
  type: 'teacher_registered' | 'suspension_threshold_triggered' | 'manual_warning',
  title: string,
  message: string,
  userEmail: string,
  userDisplayName: string,
  severity: 'info' | 'warning' | 'critical'
): Promise<AdminNotification> {
  let emailSent = false;
  const timestamp = new Date().toISOString();

  // 1. Try sending emails via Gmail API if token is active
  try {
    const token = getGoogleWorkspaceToken();
    if (token) {
      for (const adminEmail of ADMIN_EMAILS) {
        await sendGmailNotification(token, adminEmail, title, message, userEmail, userDisplayName, severity, timestamp);
      }
      emailSent = true;
      console.log('Admin email notification sent successfully.');
    } else {
      console.warn('Gmail token not available. Skipping background email dispatch (will record locally in Firestore).');
    }
  } catch (err) {
    console.error('Failed to send admin notification emails:', err);
  }

  // 2. Write notification document to Firestore
  const newNotificationData = {
    type,
    title,
    message,
    userEmail,
    userDisplayName,
    timestamp,
    severity,
    resolved: false,
    emailSent
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

async function sendGmailNotification(
  token: string,
  recipientEmail: string,
  title: string,
  message: string,
  userEmail: string,
  userDisplayName: string,
  severity: 'info' | 'warning' | 'critical',
  timestamp: string
) {
  const severityEmoji = severity === 'critical' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️';
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
      <div style="background-color: ${severity === 'critical' ? '#be123c' : severity === 'warning' ? '#b45309' : '#0369a1'}; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h2 style="color: #ffffff; margin: 0; font-family: Georgia, serif;">${severityEmoji} EduNexus Admin Alert</h2>
        <p style="color: #f1f5f9; margin: 5px 0 0; font-size: 13px; font-weight: bold; text-transform: uppercase;">
          Administrative Monitoring Notification
        </p>
      </div>
      <div style="padding: 24px; background-color: #fdfbf7; border: 1px solid #e5e1da; border-top: none; border-radius: 0 0 8px 8px;">
        <h3 style="color: #1e293b; margin-top: 0;">${title}</h3>
        <p style="font-size: 14px; background: #fff; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; line-height: 1.5; color: #334155; white-space: pre-wrap;">
          ${message}
        </p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        
        <table style="width: 100%; font-size: 13px; color: #475569; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-weight: bold; width: 150px;">Target User:</td>
            <td style="padding: 6px 0;">${userDisplayName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">User Email:</td>
            <td style="padding: 6px 0;">${userEmail}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Alert Time:</td>
            <td style="padding: 6px 0;">${new Date(timestamp).toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Alert Severity:</td>
            <td style="padding: 6px 0;">
              <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-weight: bold; font-size: 11px; text-transform: uppercase; 
                background-color: ${severity === 'critical' ? '#ffe4e6' : severity === 'warning' ? '#fef3c7' : '#e0f2fe'}; 
                color: ${severity === 'critical' ? '#9f1239' : severity === 'warning' ? '#92400e' : '#0369a1'};">
                ${severity}
              </span>
            </td>
          </tr>
        </table>
        
        <p style="font-size: 11px; color: #94a3b8; margin-top: 30px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 15px;">
          This is an automated system audit log alert from your EduNexus Administrative Console.
        </p>
      </div>
    </div>
  `.trim();

  const subjectLine = `${severityEmoji} [EduNexus Admin] ${title}`;
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subjectLine)))}?=`;
  const emailLines = [
    `To: ${recipientEmail}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    htmlBody
  ];
  const emailRaw = emailLines.join('\r\n');

  const base64UrlSafe = btoa(unescape(encodeURIComponent(emailRaw)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      raw: base64UrlSafe
    })
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error?.message || 'Gmail dispatch failed');
  }
}
