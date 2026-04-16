import { Hono } from 'hono';
import { requireAuth, getUser } from '../../shared/middleware/auth';
import { db } from '../../shared/db';
import { signatureRequests, signatureRequestSigners, signatureFields, documents, users } from '../../shared/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '../../shared/utils/s3';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { sendSigningRequestEmail, sendSignedConfirmationEmail, sendCompletionEmail, sendReminderEmail } from '../../shared/services/email.service';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env';

export const signatureRequestRoutes = new Hono();
export const publicSignRoutes = new Hono();

signatureRequestRoutes.use('*', requireAuth);

// POST /api/signature-requests — create new multi-signer request
signatureRequestRoutes.post('/', async (c) => {
  try {
    const userId = getUser(c).id;
    const formData = await c.req.parseBody();

    const file = formData['file'] as File;
    const title = formData['title'] as string;
    const note = formData['note'] as string || '';
    const signersJson = formData['signers'] as string;

    if (!file || !title || !signersJson) {
      return c.json({ error: 'Missing required fields: file, title, signers' }, 400);
    }

    const signers: { name: string; email: string }[] = JSON.parse(signersJson);
    if (!Array.isArray(signers) || signers.length === 0) {
      return c.json({ error: 'At least one signer is required' }, 400);
    }

    // Upload PDF to S3
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const s3Key = `signature-requests/${userId}/${uuidv4()}/${file.name}`;

    await s3Client.send(new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: 'application/pdf',
    }));

    // Create document record
    const [doc] = await db.insert(documents).values({
      userId,
      fileName: file.name,
      originalFileName: file.name,
      mimeType: 'application/pdf',
      fileSize: file.size,
      s3Key,
      status: 'sent',
    }).returning();

    // Create signature request
    const [request] = await db.insert(signatureRequests).values({
      documentId: doc.id,
      senderId: userId,
      recipientEmail: signers[0].email,
      recipientName: signers[0].name,
      message: note,
      status: 'pending',
      accessToken: uuidv4(),
    }).returning();

    // Create signer rows with unique tokens
    const signerRows = await db.insert(signatureRequestSigners).values(
      signers.map((s, i) => ({
        requestId: request.id,
        name: s.name,
        email: s.email,
        order: i,
        status: 'pending' as const,
      }))
    ).returning();

    // Get sender info for emails
    const sender = getUser(c);

    // Send signing request emails
    for (const signer of signerRows) {
      const signingLink = `https://snaphw.com/app/sign.html?token=${signer.signingToken}`;
      await sendSigningRequestEmail({
        to: signer.email,
        signerName: signer.name,
        senderName: sender.name || sender.email,
        documentTitle: title,
        note,
        signingLink,
      }).catch(err => console.error('Email send failed:', err));
    }

    return c.json({
      success: true,
      requestId: request.id,
      documentId: doc.id,
      signers: signerRows.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        signingToken: s.signingToken,
        status: s.status,
      })),
    }, 201);
  } catch (err: any) {
    console.error('Create signature request error:', err);
    return c.json({ error: err.message || 'Failed to create signature request' }, 500);
  }
});

// GET /api/signature-requests — list user's requests
signatureRequestRoutes.get('/', async (c) => {
  try {
    const userId = getUser(c).id;

    const requests = await db
      .select()
      .from(signatureRequests)
      .leftJoin(documents, eq(signatureRequests.documentId, documents.id))
      .where(eq(signatureRequests.senderId, userId));

    const requestIds = requests.map(r => r.signature_requests.id);

    const signers = requestIds.length > 0
      ? await db.select().from(signatureRequestSigners).where(
          inArray(signatureRequestSigners.requestId, requestIds)
        )
      : [];

    return c.json({
      requests: requests.map(r => ({
        ...r.signature_requests,
        documentName: r.documents?.originalFileName || r.documents?.fileName,
        signers: signers.filter(s => s.requestId === r.signature_requests.id),
      })),
    });
  } catch (err: any) {
    console.error('List requests error:', err);
    return c.json({ error: 'Failed to fetch requests' }, 500);
  }
});

// GET /api/signature-requests/:id
signatureRequestRoutes.get('/:id', async (c) => {
  try {
    const userId = getUser(c).id;
    const requestId = c.req.param('id');

    const [request] = await db
      .select()
      .from(signatureRequests)
      .leftJoin(documents, eq(signatureRequests.documentId, documents.id))
      .where(and(
        eq(signatureRequests.id, requestId),
        eq(signatureRequests.senderId, userId)
      ));

    if (!request) return c.json({ error: 'Not found' }, 404);

    const signers = await db.select().from(signatureRequestSigners)
      .where(eq(signatureRequestSigners.requestId, requestId));

    const fields = await db.select().from(signatureFields)
      .where(eq(signatureFields.requestId, requestId));

    // Generate presigned URL for the document
    const downloadUrl = await getSignedUrl(s3Client, new GetObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: request.documents!.s3Key,
    }), { expiresIn: 3600 });

    return c.json({
      ...request.signature_requests,
      document: request.documents,
      downloadUrl,
      signers,
      fields,
    });
  } catch (err: any) {
    console.error('Get request error:', err);
    return c.json({ error: 'Failed to fetch request' }, 500);
  }
});

// DELETE /api/signature-requests/:id
signatureRequestRoutes.delete('/:id', async (c) => {
  try {
    const userId = getUser(c).id;
    const requestId = c.req.param('id');

    const [request] = await db.select().from(signatureRequests)
      .where(and(eq(signatureRequests.id, requestId), eq(signatureRequests.senderId, userId)));

    if (!request) return c.json({ error: 'Not found' }, 404);

    await db.delete(signatureRequests).where(eq(signatureRequests.id, requestId));

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: 'Failed to delete request' }, 500);
  }
});

// POST /api/signature-requests/:id/send-reminders
signatureRequestRoutes.post('/:id/send-reminders', async (c) => {
  try {
    const userId = getUser(c).id;
    const requestId = c.req.param('id');

    const [request] = await db
      .select()
      .from(signatureRequests)
      .leftJoin(documents, eq(signatureRequests.documentId, documents.id))
      .where(and(eq(signatureRequests.id, requestId), eq(signatureRequests.senderId, userId)));

    if (!request) return c.json({ error: 'Not found' }, 404);

    const pendingSigners = await db.select().from(signatureRequestSigners)
      .where(and(
        eq(signatureRequestSigners.requestId, requestId),
        eq(signatureRequestSigners.status, 'pending')
      ));

    const sender = getUser(c);

    for (const signer of pendingSigners) {
      const signingLink = `https://snaphw.com/app/sign.html?token=${signer.signingToken}`;
      await sendReminderEmail({
        to: signer.email,
        signerName: signer.name,
        senderName: sender.name || sender.email,
        documentTitle: request.documents?.originalFileName || 'Document',
        signingLink,
      }).catch(console.error);
    }

    return c.json({ success: true, remindersSent: pendingSigners.length });
  } catch (err: any) {
    return c.json({ error: 'Failed to send reminders' }, 500);
  }
});

// ===== PUBLIC SIGN ROUTES (no auth) =====

// GET /sign/:token — fetch document for signing
publicSignRoutes.get('/:token', async (c) => {
  try {
    const token = c.req.param('token');

    const [signer] = await db.select().from(signatureRequestSigners)
      .where(eq(signatureRequestSigners.signingToken, token));

    if (!signer) return c.json({ error: 'Invalid or expired signing link' }, 404);
    if (signer.status === 'signed') {
      // Return signed document URL if available
      const downloadUrl = signer.signedDocS3Key
        ? await getSignedUrl(s3Client, new GetObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: signer.signedDocS3Key }), { expiresIn: 3600 })
        : null;
      return c.json({ error: 'already_signed', signerName: signer.name, downloadUrl }, 200);
    }

    const [request] = await db
      .select()
      .from(signatureRequests)
      .leftJoin(documents, eq(signatureRequests.documentId, documents.id))
      .where(eq(signatureRequests.id, signer.requestId));

    if (!request) return c.json({ error: 'Request not found' }, 404);

    const documentUrl = await getSignedUrl(s3Client, new GetObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: request.documents!.s3Key,
    }), { expiresIn: 3600 });

    const fields = await db.select().from(signatureFields)
      .where(eq(signatureFields.requestId, signer.requestId));

    // Mark as viewed
    await db.update(signatureRequestSigners)
      .set({ viewedAt: new Date() })
      .where(eq(signatureRequestSigners.id, signer.id));

    return c.json({
      signerName: signer.name,
      signerEmail: signer.email,
      documentTitle: request.documents?.originalFileName || 'Document',
      senderMessage: request.signature_requests.message,
      documentUrl,
      fields,
      requestId: request.signature_requests.id,
    });
  } catch (err: any) {
    console.error('Get signing page error:', err);
    return c.json({ error: 'Failed to load document' }, 500);
  }
});

// POST /sign/:token — submit signature
publicSignRoutes.post('/:token', async (c) => {
  try {
    const token = c.req.param('token');
    const body = await c.req.json();
    const { signatureDataUrl, signerName, fieldValues } = body;

    const [signer] = await db.select().from(signatureRequestSigners)
      .where(eq(signatureRequestSigners.signingToken, token));

    if (!signer) return c.json({ error: 'Invalid signing link' }, 404);
    if (signer.status === 'signed') return c.json({ error: 'Already signed' }, 400);

    const [request] = await db
      .select()
      .from(signatureRequests)
      .leftJoin(documents, eq(signatureRequests.documentId, documents.id))
      .where(eq(signatureRequests.id, signer.requestId));

    if (!request) return c.json({ error: 'Request not found' }, 404);

    // Fetch original PDF from S3
    const { Body } = await s3Client.send(new GetObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: request.documents!.s3Key,
    }));

    const pdfBytes = await streamToBuffer(Body as any);

    // Flatten signature into PDF using pdf-lib
    const pdfDoc = await PDFDocument.load(pdfBytes);

    if (signatureDataUrl) {
      // Embed signature image on each page that has fields
      const fields = await db.select().from(signatureFields)
        .where(eq(signatureFields.requestId, signer.requestId));

      const signatureImageBytes = Buffer.from(signatureDataUrl.split(',')[1], 'base64');
      const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

      for (const field of fields) {
        if (field.fieldType === 'signature' || field.fieldType === 'initials') {
          const page = pdfDoc.getPage(field.pageNumber - 1);
          const { height } = page.getSize();
          page.drawImage(signatureImage, {
            x: field.x,
            y: height - field.y - field.height,
            width: field.width,
            height: field.height,
          });
        } else if (field.fieldType === 'date') {
          const page = pdfDoc.getPage(field.pageNumber - 1);
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          const { height } = page.getSize();
          page.drawText(new Date().toLocaleDateString(), {
            x: field.x,
            y: height - field.y - field.height + 4,
            size: 12,
            font,
            color: rgb(0, 0, 0),
          });
        } else if (field.fieldType === 'name') {
          const page = pdfDoc.getPage(field.pageNumber - 1);
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          const { height } = page.getSize();
          page.drawText(signerName || signer.name, {
            x: field.x,
            y: height - field.y - field.height + 4,
            size: 12,
            font,
            color: rgb(0, 0, 0),
          });
        }
      }
    }

    const signedPdfBytes = await pdfDoc.save();

    // Save signed PDF to S3
    const signedS3Key = `signed-documents/${signer.requestId}/${signer.id}-signed.pdf`;
    await s3Client.send(new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: signedS3Key,
      Body: Buffer.from(signedPdfBytes),
      ContentType: 'application/pdf',
    }));

    const ipAddress = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '';

    // Update signer status
    await db.update(signatureRequestSigners)
      .set({
        status: 'signed',
        signedAt: new Date(),
        ipAddress: ipAddress.split(',')[0].trim(),
        signedDocS3Key: signedS3Key,
      })
      .where(eq(signatureRequestSigners.id, signer.id));

    // Check if all signers have signed
    const allSigners = await db.select().from(signatureRequestSigners)
      .where(eq(signatureRequestSigners.requestId, signer.requestId));

    const allSigned = allSigners.every(s => s.status === 'signed' || s.id === signer.id);

    if (allSigned) {
      // Update request status to completed
      await db.update(signatureRequests)
        .set({ status: 'completed', signedAt: new Date(), signedDocumentS3Key: signedS3Key })
        .where(eq(signatureRequests.id, signer.requestId));

      // Send completion email to owner
      const [ownerRecord] = await db.select({ email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, request.signature_requests.senderId));

      if (ownerRecord) {
        await sendCompletionEmail({
          to: ownerRecord.email,
          ownerName: ownerRecord.name || ownerRecord.email,
          documentTitle: request.documents?.originalFileName || 'Document',
          signers: allSigners.map(s => ({ name: s.name, email: s.email, signedAt: s.signedAt?.toISOString() || new Date().toISOString() })),
          downloadUrl: await getSignedUrl(s3Client, new GetObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: signedS3Key }), { expiresIn: 86400 }),
        }).catch(console.error);
      }
    }

    // Send signed confirmation to signer
    const downloadUrl = await getSignedUrl(s3Client, new GetObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: signedS3Key,
    }), { expiresIn: 86400 });

    await sendSignedConfirmationEmail({
      to: signer.email,
      signerName: signer.name,
      documentTitle: request.documents?.originalFileName || 'Document',
      downloadUrl,
    }).catch(console.error);

    return c.json({ success: true, downloadUrl, allSigned });
  } catch (err: any) {
    console.error('Sign document error:', err);
    return c.json({ error: err.message || 'Failed to sign document' }, 500);
  }
});

async function streamToBuffer(stream: any): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
