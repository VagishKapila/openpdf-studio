/**
 * loadPdf.ts — shared file-loading helper used by:
 *   - AppHeader (file input click)
 *   - AppShell (drag-drop)
 *
 * Responsibilities:
 *   1. Validate the file is a PDF
 *   2. Parse with PDF.js
 *   3. Save raw bytes + metadata to Dexie
 *   4. Push the parsed document into Zustand
 */

import { pdfjs } from '@/lib/pdfjs';
import { saveDocument, updatePageCount, touchDocument, listDocuments } from '@/storage/documents';
import { useDocumentStore } from '@/store';

export async function loadPdfFromFile(file: File): Promise<void> {
  const isPdf =
    file.type === 'application/pdf' ||
    file.type === 'application/x-pdf' ||
    file.name.toLowerCase().endsWith('.pdf');

  if (!isPdf) {
    throw new Error('Please select a PDF file.');
  }

  // Set loading state immediately so UI reflects activity
  useDocumentStore.getState().setLoadState('loading');

  try {
    // Save to Dexie first (uses the File object — includes raw bytes)
    const id = await saveDocument(file);

    // Parse with PDF.js (reads the same bytes via file.arrayBuffer inside saveDocument)
    // We need a fresh buffer here since saveDocument consumed the file
    const data = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data }).promise;

    // Back-fill pageCount in Dexie now that we know it
    await updatePageCount(id, pdf.numPages);

    // Push into Zustand — CanvasArea will react and render
    useDocumentStore.getState().setDocument({
      id,
      fileName: file.name,
      totalPages: pdf.numPages,
      pdf,
    });
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
 * loadMostRecentDocument — called once on app startup.
 * Finds the most recently opened doc in Dexie, re-parses it,
 * and hydrates the store so the last session is restored.
 */
export async function loadMostRecentDocument(): Promise<void> {
  // Avoid overwriting a document that was already set in this session
  if (useDocumentStore.getState().loadState !== 'idle') return;

  try {
    const docs = await listDocuments(); // ordered by lastOpenedAt desc
    if (docs.length === 0) return;

    const stored = docs[0];
    useDocumentStore.getState().setLoadState('loading');

    const pdf = await pdfjs.getDocument({ data: stored.data.slice(0) }).promise;
    await touchDocument(stored.id); // update lastOpenedAt

    useDocumentStore.getState().setDocument({
      id: stored.id,
      fileName: stored.fileName,
      totalPages: pdf.numPages,
      pdf,
    });
  } catch {
    // Silently fail — user can always click Open to load manually
    useDocumentStore.getState().setLoadState('idle');
  }
}
