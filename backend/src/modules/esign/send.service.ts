import { db } from '../../shared/db';
import { documents, signatureRequests, signatureFields, auditLog } from '../../shared/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { sendSigningRequestEmail } from '../../shared/services/email.service';
import { createNotification } from '../../shared/services/notification.service';
import { scheduleAutoReminders } from './reminder.service';
import { env } from '../../config/env';

// ===== TYPES =====
export interface SendDocumentForSigningInput {
  documentId: string;
  senderId: string;
  recipientEmail: string;
  recipientName: string;
  fields: Array<{
    fieldType: string;
    pageNumber: number;
    x: number;
    y: number;
    width: number;
    height: number;
    required?: boolean;
    label?: string;
  }>;
  message?: string;
  deadline?: string;
  paymentRequired?: boolean;
  paymentAmount?: number;
  paymentDescription?: string;
}

// ===== SEND DOCUMENT FOR SIGNING =====
export async function sendDocumentForSigning(input: SendDocumentForSigningInput) {
  const {
    documentId,
    senderId,
    recipientEmail,
    recipientName,
    fields,
    message,
    deadline,
  } = input;

  // 1. Verify document exists and belongs to sender
  const [document] = await db.select()
    .from(documents)
    .where(eq(documents.id, documentId));

  if (!document) {
    throw new Error('Document not found');
  }

  if (document.userId !== senderId) {
    throw new Error('Unauthorized: document does not belong to sender');
  }

  // 2. Create a signature request with a random accessToken
  const accessToken = crypto.randomBytes(32).toString('hex');

  const [request] = await db.insert(signatureRequests).values({
    documentId,
    senderId,
    recipientEmail,
    recipientName,
    message,
    status: 'pending',
    accessToken,
    deadline: deadline ? new Date(deadline) : null,
  }).returning();

  // 3. Save the fields to the signature request
  if (fields && fields.length > 0) {
    const fieldRecords = fields.map(f => ({
      requestId: request.id,
      fieldType: f.fieldType,
      pageNumber: f.pageNumber,
      x: f.x,
      y: f.y,
      width: f.width,
      height: f.height,
      label: f.label || `${f.fieldType} field`,
      required: f.required !== false,
      aiDetected: false,
    }));

    await db.insert(signatureFields).values(fieldRecords);
  }

  // 4. Send signing request email to recipient
  try {
    await sendSigningRequestEmail({
      recipientEmail,
      recipientName,
      senderName: document.userId, // In a real app, fetch the user's name
      documentName: document.fileName || 'document',
      message,
      accessToken,
    });
  } catch (emailError) {
    console.warn(`Failed to send signing request email to ${recipientEmail}:`, emailError);
    // Non-blocking: sending continues even if email fails
  }

  // 5. Update document status to 'sent'
  await db.update(documents)
    .set({ status: 'sent', updatedAt: new Date() })
    .where(eq(documents.id, documentId));

  // 6. Log to audit_log
  await db.insert(auditLog).values({
    documentId,
    userId: senderId,
    action: 'signature.requested',
    actorEmail: recipientEmail,
    metadata: {
      recipientName,
      fieldCount: fields.length,
      deadline,
    },
  });

  // 7. Create notification for sender (non-blocking)
  try {
    const docName = document?.fileName || 'Document';
    await createNotification({
      userId: senderId,
      orgId: document?.orgId || undefined,
      type: 'document.sent',
      title: 'Document Sent',
      message: `"${docName}" sent to ${recipientEmail}`,
      data: { documentId, recipientEmail, recipientName },
    });
  } catch (err) {
    console.warn('[esign] Failed to create send notification:', err);
  }

  // 8. Schedule auto-reminders (non-blocking)
  try {
    await scheduleAutoReminders({
      requestId: request.id,
      recipientEmail,
      orgId: document?.orgId || undefined,
      deadline,
    });
  } catch (err) {
    console.warn('[esign] Failed to schedule reminders:', err);
  }

  return {
    success: true,
    requestId: request.id,
    accessToken,
    signingUrl: `${env.FRONTEND_URL}/sign/${accessToken}`,
  };
}
