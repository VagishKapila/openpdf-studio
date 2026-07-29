import { pdfjs } from '@/lib/pdfjs';
import { saveDocument, updatePageCount, touchDocument, listDocuments } from '@/storage/documents';
import { useDocumentStore } from '@/store';
import { trackEvent } from '@/lib/analytics';
import { ensureThumbnail } from '@/lib/thumbnails';

export async function loadPdfFromFile(file: File): Promise<void> {
  const isPdf =
    file.type === 'application/pdf' ||
    file.type === 'application/x-pdf' ||
    file.name.toLowerCase().endsWith('.pdf');

  if (!isPdf) throw new Error('Please select a PDF file.');

  if (file.size > 50 * 1024 * 1024) {
    const proceed = confirm(
      'This PDF is large (over 50MB) and may be slow on mobile. Continue?',
    );
    if (!proceed) return;
  }

  useDocumentStore.getState().setLoadState('loading');

  try {
    const id = await saveDocument(file);

    // Re-read bytes after saveDocument consumed the file stream
    const data = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({
      data,
      annotationMode: 0, // DISABLE — FormIQ uses Konva; PDF.js editor layer unused (COWORK-44.A.1)
    }).promise;

    await updatePageCount(id, pdf.numPages);
    void ensureThumbnail(pdf, id); // COWORK-50 F2 — fire and forget

    useDocumentStore.getState().setDocument({
      id,
      fileName: file.name,
      totalPages: pdf.numPages,
      pdf,
    });
    trackEvent('pdf_opened', { source: 'file-picker' });
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : 'Could not load this PDF. It may be corrupted or password-protected.';
    useDocumentStore.getState().setError(msg);
    throw err;
  }
}

/**
 * Called once on app startup to restore the most-recently-opened document.
 * Uses defensive error handling so any storage / schema / parse failure
 * results in the empty state (not the red error banner).
 */
export async function loadMostRecentDocument(): Promise<void> {
  if (useDocumentStore.getState().loadState !== 'idle') return;

  try {
    const docs = await listDocuments();
    if (docs.length === 0) return;

    const stored = docs[0];
    useDocumentStore.getState().setLoadState('loading');

    // Defensive: handle both ArrayBuffer (current) and any future Blob storage
    const rawData = stored.data as unknown;
    let bytes: ArrayBuffer;
    if (rawData instanceof ArrayBuffer) {
      bytes = rawData.slice(0);
    } else if (rawData instanceof Blob) {
      bytes = await rawData.arrayBuffer();
    } else {
      throw new Error('Unrecognized document storage format — please re-open the PDF.');
    }

    const pdf = await pdfjs.getDocument({
      data: bytes,
      annotationMode: 0, // DISABLE — FormIQ uses Konva; PDF.js editor layer unused (COWORK-44.A.1)
    }).promise;
    await touchDocument(stored.id);
    void ensureThumbnail(pdf, stored.id); // COWORK-50 F2 — backfills existing docs

    useDocumentStore.getState().setDocument({
      id: stored.id,
      fileName: stored.fileName,
      totalPages: pdf.numPages,
      pdf,
    });
  } catch (err) {
    // Silently fall back to empty state — never show red error on startup
    console.warn('[OpenPDF] loadMostRecentDocument failed:', err);
    useDocumentStore.getState().setLoadState('idle');
  }
}
