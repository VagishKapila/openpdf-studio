import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { db } from '../../shared/db';
import { signatureRequests, signatureFields, documents, signatures, auditLog } from '../../shared/db/schema';
import { getDownloadUrl, uploadToS3, generateS3Key } from '../../shared/utils/s3';
import { signDocument, saveSignedDocument } from './esign.service';
import type { SignFieldInput } from './esign.service';
import { env } from '../../config/env';
import { createNotification } from '../../shared/services/notification.service';

const publicRoutes = new Hono();

// ===== HELPER: Resolve and validate signing token =====
interface ResolvedRequest {
  request: any;
  fields: any[];
  document: any;
  downloadUrl: string | null;
}

async function resolveSigningToken(accessToken: string): Promise<ResolvedRequest | null> {
  // Look up the signature request by token
  const [request] = await db.select()
    .from(signatureRequests)
    .where(eq(signatureRequests.accessToken, accessToken));

  if (!request) return null;

  // Validate status and deadline
  if (!['pending', 'viewed', 'signed', 'declined'].includes(request.status)) {
    throw new Error('Invalid request status');
  }

  if (request.status === 'declined') {
    throw new Error('This request has been declined');
  }

  // Check if deadline has passed
  if (request.deadline && new Date() > new Date(request.deadline)) {
    throw new Error('This signing request has expired');
  }

  // Get fields
  const fields = await db.select()
    .from(signatureFields)
    .where(eq(signatureFields.requestId, request.id));

  // Get document
  const [document] = await db.select()
    .from(documents)
    .where(eq(documents.id, request.documentId));

  // Get download URL
  const downloadUrl = document ? await getDownloadUrl(document.s3Key) : null;

  return { request, fields, document, downloadUrl };
}

// ===== GET SIGNING REQUEST =====
// GET /sign/:accessToken
// Public endpoint — no auth required
// Returns the signing request details, fields, and document preview
publicRoutes.get('/:accessToken', async (c) => {
  try {
    const accessToken = c.req.param('accessToken');

    if (!accessToken || accessToken.length === 0) {
      return c.json({ error: 'Invalid access token' }, 400);
    }

    const result = await resolveSigningToken(accessToken);

    if (!result) {
      return c.json({ error: 'Signing request not found or expired' }, 404);
    }

    const { request, fields, document, downloadUrl } = result;

    // Update to 'viewed' if still pending
    if (request.status === 'pending') {
      await db.update(signatureRequests)
        .set({ status: 'viewed', viewedAt: new Date() })
        .where(eq(signatureRequests.id, request.id));

      // Create notification for sender
      try {
        const docName = document?.fileName || 'Document';
        await createNotification({
          userId: request.senderId,
          orgId: document?.orgId || undefined,
          type: 'document.viewed',
          title: 'Document Viewed',
          message: `${request.recipientName || request.recipientEmail} viewed "${docName}"`,
          data: { documentId: request.documentId, recipientEmail: request.recipientEmail },
        });
      } catch (err) {
        console.warn('[esign] Failed to create view notification:', err);
      }
    }

    // Log the view
    if (request.documentId) {
      await db.insert(auditLog).values({
        documentId: request.documentId,
        action: 'document.viewed',
        actorEmail: request.recipientEmail,
        ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
        metadata: { accessToken: accessToken.substring(0, 8) + '...' },
      });
    }

    return c.json({
      success: true,
      request: {
        id: request.id,
        recipientName: request.recipientName,
        recipientEmail: request.recipientEmail,
        message: request.message,
        deadline: request.deadline,
        status: request.status === 'pending' ? 'viewed' : request.status,
      },
      fields,
      document: document ? {
        id: document.id,
        fileName: document.fileName,
        pageCount: document.pageCount,
      } : null,
      downloadUrl,
    });
  } catch (error: any) {
    console.error('Get signing request error:', error);
    if (error.message === 'This request has been declined' || error.message === 'This signing request has expired') {
      return c.json({ error: error.message }, 410);
    }
    return c.json({ error: error.message || 'Failed to get signing request' }, 500);
  }
});

// ===== SUBMIT SIGNATURES =====
// POST /sign/:accessToken/submit
// Client submits signature data for one or more fields
publicRoutes.post('/:accessToken/submit', async (c) => {
  try {
    const accessToken = c.req.param('accessToken');
    const body = await c.req.json();

    if (!accessToken || accessToken.length === 0) {
      return c.json({ error: 'Invalid access token' }, 400);
    }

    const { signerName, signerEmail, fields } = body;

    // Validate required fields
    if (!signerEmail || typeof signerEmail !== 'string') {
      return c.json({ error: 'Signer email is required' }, 400);
    }

    if (!signerName || typeof signerName !== 'string') {
      return c.json({ error: 'Signer name is required' }, 400);
    }

    if (!Array.isArray(fields)) {
      return c.json({ error: 'Fields array is required' }, 400);
    }

    // Resolve the request
    const resolved = await resolveSigningToken(accessToken);
    if (!resolved) {
      return c.json({ error: 'Signing request not found or expired' }, 404);
    }

    const { request } = resolved;

    // Validate signer email matches recipient
    if (signerEmail !== request.recipientEmail) {
      return c.json({ error: 'Signer email does not match recipient email' }, 403);
    }

    // Call signDocument service with the fields
    const result = await signDocument({
      requestId: request.id,
      signerEmail,
      signerName,
      fields: fields as SignFieldInput[],
      ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
      userAgent: c.req.header('user-agent') || 'unknown',
    });

    // Create notification for sender (non-blocking)
    try {
      const [doc] = await db.select()
        .from(documents)
        .where(eq(documents.id, request.documentId));

      const docName = doc?.fileName || 'Document';
      await createNotification({
        userId: request.senderId,
        orgId: doc?.orgId || undefined,
        type: 'document.signed',
        title: 'Document Signed',
        message: `${signerName} signed "${docName}"`,
        data: { documentId: request.documentId, signerEmail, signerName },
      });
    } catch (err) {
      console.warn('[esign] Failed to create signature notification:', err);
    }

    return c.json({
      success: true,
      requestId: result.requestId,
      message: 'Signatures submitted successfully',
    });
  } catch (error: any) {
    console.error('Submit signatures error:', error);
    return c.json({ error: error.message || 'Failed to submit signatures' }, 500);
  }
});

// ===== UPLOAD SIGNED PDF =====
// POST /sign/:accessToken/finalize
// Client uploads the flattened, signed PDF
publicRoutes.post('/:accessToken/finalize', async (c) => {
  try {
    const accessToken = c.req.param('accessToken');

    if (!accessToken || accessToken.length === 0) {
      return c.json({ error: 'Invalid access token' }, 400);
    }

    // Resolve the request
    const resolved = await resolveSigningToken(accessToken);
    if (!resolved) {
      return c.json({ error: 'Signing request not found or expired' }, 404);
    }

    const { request, document } = resolved;

    // Parse the file from multipart form
    const body = await c.req.parseBody();
    const file = body['file'] as File;

    if (!file) {
      return c.json({ error: 'No signed PDF uploaded' }, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to S3 with a generated key
    const signedKey = generateS3Key(request.senderId, 'signed', 'signed-document.pdf');
    await uploadToS3(signedKey, buffer, 'application/pdf');

    // Update request with signed document key and status
    await db.update(signatureRequests)
      .set({
        signedDocumentS3Key: signedKey,
        status: 'signed',
        signedAt: new Date(),
      })
      .where(eq(signatureRequests.id, request.id));

    // Update document status
    await db.update(documents)
      .set({ status: 'signed', updatedAt: new Date() })
      .where(eq(documents.id, request.documentId));

    // Log the finalization
    await db.insert(auditLog).values({
      documentId: request.documentId,
      action: 'signature.finalized',
      actorEmail: request.recipientEmail,
      ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      metadata: { fileName: file.name },
    });

    const downloadUrl = await getDownloadUrl(signedKey);

    return c.json({
      success: true,
      message: 'Signed document finalized successfully',
      downloadUrl,
    });
  } catch (error: any) {
    console.error('Finalize error:', error);
    return c.json({ error: error.message || 'Failed to finalize document' }, 500);
  }
});

// ===== DECLINE SIGNING =====
// POST /sign/:accessToken/decline
// Recipient declines to sign
publicRoutes.post('/:accessToken/decline', async (c) => {
  try {
    const accessToken = c.req.param('accessToken');

    if (!accessToken || accessToken.length === 0) {
      return c.json({ error: 'Invalid access token' }, 400);
    }

    // Resolve the request
    const resolved = await resolveSigningToken(accessToken);
    if (!resolved) {
      return c.json({ error: 'Signing request not found or expired' }, 404);
    }

    const { request } = resolved;

    // Update request status to declined
    await db.update(signatureRequests)
      .set({ status: 'declined' })
      .where(eq(signatureRequests.id, request.id));

    // Log the decline
    await db.insert(auditLog).values({
      documentId: request.documentId,
      action: 'signature.declined',
      actorEmail: request.recipientEmail,
      ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      metadata: { reason: 'User declined' },
    });

    // Create notification for sender (non-blocking)
    try {
      const [doc] = await db.select()
        .from(documents)
        .where(eq(documents.id, request.documentId));

      const docName = doc?.fileName || 'Document';
      await createNotification({
        userId: request.senderId,
        orgId: doc?.orgId || undefined,
        type: 'document.declined',
        title: 'Document Declined',
        message: `${request.recipientName || request.recipientEmail} declined to sign "${docName}"`,
        data: { documentId: request.documentId, recipientEmail: request.recipientEmail },
      });
    } catch (err) {
      console.warn('[esign] Failed to create decline notification:', err);
    }

    return c.json({
      success: true,
      message: 'Signing request declined',
    });
  } catch (error: any) {
    console.error('Decline error:', error);
    return c.json({ error: error.message || 'Failed to decline signing request' }, 500);
  }
});

export { publicRoutes };
