import { Hono } from 'hono';
import { requireAuth, getUser } from '../../shared/middleware/auth';
import { db } from '../../shared/db';
import { documents } from '../../shared/db/schema';
import { eq } from 'drizzle-orm';
import { getDownloadUrl } from '../../shared/utils/s3';
import { sendDocumentForSigning } from '../esign/send.service';

const documentRoutes = new Hono();

// All document routes require authentication
documentRoutes.use('*', requireAuth);

// ===== SEND DOCUMENT FOR SIGNING =====
// POST /documents/:documentId/send
// Send a document to a recipient for signing
documentRoutes.post('/:documentId/send', async (c) => {
  try {
    const userId = getUser(c).id;
    const documentId = c.req.param('documentId');
    const body = await c.req.json();

    // Validate required fields
    if (!body.recipientEmail || typeof body.recipientEmail !== 'string') {
      return c.json({ error: 'Recipient email is required' }, 400);
    }

    if (!body.recipientName || typeof body.recipientName !== 'string') {
      return c.json({ error: 'Recipient name is required' }, 400);
    }

    if (!Array.isArray(body.fields)) {
      return c.json({ error: 'Fields array is required' }, 400);
    }

    // Call send service
    const result = await sendDocumentForSigning({
      documentId,
      senderId: userId,
      recipientEmail: body.recipientEmail,
      recipientName: body.recipientName,
      fields: body.fields,
      message: body.message,
      deadline: body.deadline,
      paymentRequired: body.paymentRequired,
      paymentAmount: body.paymentAmount,
      paymentDescription: body.paymentDescription,
    });

    return c.json(result);
  } catch (error: any) {
    console.error('Send document for signing error:', error);

    if (error.message === 'Document not found') {
      return c.json({ error: error.message }, 404);
    }

    if (error.message === 'Unauthorized: document does not belong to sender') {
      return c.json({ error: error.message }, 403);
    }

    return c.json({ error: error.message || 'Failed to send document' }, 500);
  }
});

// ===== GET DOWNLOAD URL =====
// GET /documents/:documentId/download-url
// Get a presigned S3 URL to download the document
documentRoutes.get('/:documentId/download-url', async (c) => {
  try {
    const userId = getUser(c).id;
    const documentId = c.req.param('documentId');

    // Fetch the document
    const [document] = await db.select()
      .from(documents)
      .where(eq(documents.id, documentId));

    if (!document) {
      return c.json({ error: 'Document not found' }, 404);
    }

    // Verify ownership
    if (document.userId !== userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Get presigned URL from S3
    const downloadUrl = await getDownloadUrl(document.s3Key);

    return c.json({
      success: true,
      documentId: document.id,
      fileName: document.fileName,
      downloadUrl,
      expiresIn: 3600, // 1 hour
    });
  } catch (error: any) {
    console.error('Get download URL error:', error);
    return c.json({ error: error.message || 'Failed to get download URL' }, 500);
  }
});

export { documentRoutes };
