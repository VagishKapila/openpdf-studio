import { db } from '../db';
import { notificationInbox } from '../db/schema';

/**
 * Notification service for creating in-app notifications.
 * All operations are non-blocking and failures are logged but don't affect the main flow.
 */

export interface CreateNotificationParams {
  userId: string;
  orgId?: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Create a notification in the inbox.
 * Non-blocking: failures are logged but don't throw.
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const [notif] = await db.insert(notificationInbox).values({
      userId: params.userId,
      orgId: params.orgId || null,
      type: params.type,
      title: params.title,
      message: params.message,
      data: params.data || null,
      read: false,
    }).returning();

    console.log(`[notification] Created ${params.type} notification for user ${params.userId}`);
    return notif;
  } catch (error) {
    console.error('[notification] Failed to create notification:', error);
    return null;
  }
}

/**
 * Convenience: notify when a document is sent.
 */
export async function notifyDocumentSent(
  userId: string,
  orgId: string | null,
  documentName: string,
  recipientEmail: string
) {
  return createNotification({
    userId,
    orgId: orgId || undefined,
    type: 'document.sent',
    title: 'Document Sent',
    message: `"${documentName}" sent to ${recipientEmail}`,
    data: { recipientEmail, documentName },
  });
}

/**
 * Convenience: notify when a document is viewed.
 */
export async function notifyDocumentViewed(
  userId: string,
  orgId: string | null,
  documentName: string,
  viewerName: string,
  viewerEmail: string
) {
  return createNotification({
    userId,
    orgId: orgId || undefined,
    type: 'document.viewed',
    title: 'Document Viewed',
    message: `${viewerName || viewerEmail} viewed "${documentName}"`,
    data: { viewerEmail, viewerName, documentName },
  });
}

/**
 * Convenience: notify when a document is signed.
 */
export async function notifyDocumentSigned(
  userId: string,
  orgId: string | null,
  documentName: string,
  signerName: string,
  signerEmail: string
) {
  return createNotification({
    userId,
    orgId: orgId || undefined,
    type: 'document.signed',
    title: 'Document Signed',
    message: `${signerName} signed "${documentName}"`,
    data: { signerEmail, signerName, documentName },
  });
}

/**
 * Convenience: notify when a document signing is declined.
 */
export async function notifyDocumentDeclined(
  userId: string,
  orgId: string | null,
  documentName: string,
  recipientName: string,
  recipientEmail: string
) {
  return createNotification({
    userId,
    orgId: orgId || undefined,
    type: 'document.declined',
    title: 'Document Declined',
    message: `${recipientName || recipientEmail} declined to sign "${documentName}"`,
    data: { recipientEmail, recipientName, documentName },
  });
}

/**
 * Convenience: notify when a payment is received.
 */
export async function notifyPaymentReceived(
  userId: string,
  orgId: string | null,
  amount: number,
  documentName: string,
  currency: string = 'usd'
) {
  const amountDisplay = (amount / 100).toFixed(2);
  const currencySymbol = currency === 'usd' ? '$' : currency.toUpperCase();
  return createNotification({
    userId,
    orgId: orgId || undefined,
    type: 'payment.received',
    title: 'Payment Received',
    message: `${currencySymbol}${amountDisplay} received for "${documentName}"`,
    data: { amount, documentName, currency },
  });
}

/**
 * Convenience: notify for system alerts.
 */
export async function notifySystemAlert(
  userId: string,
  title: string,
  message: string,
  data?: Record<string, unknown>
) {
  return createNotification({
    userId,
    type: 'system.alert',
    title,
    message,
    data,
  });
}
