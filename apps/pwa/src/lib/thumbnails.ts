/**
 * thumbnails — page-1 preview images for the document sidebar (COWORK-50 F2).
 *
 * StoredDocument.thumbnail has existed in the Dexie schema since v1; this
 * module finally populates it. Generation is fire-and-forget: failures are
 * silent (the sidebar falls back to the file icon) and never block loading.
 */
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { db } from '@/storage/db';

const THUMB_WIDTH = 120; // CSS px — small enough to keep Dexie rows light

export async function ensureThumbnail(pdf: PDFDocumentProxy, documentId: string): Promise<void> {
  try {
    const existing = await db.documents.get(documentId);
    if (!existing || existing.thumbnail) return;

    const page = await pdf.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: THUMB_WIDTH / base.width });

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png'),
    );
    if (blob) await db.documents.update(documentId, { thumbnail: blob });
  } catch {
    // Non-fatal — sidebar shows the icon fallback
  }
}
