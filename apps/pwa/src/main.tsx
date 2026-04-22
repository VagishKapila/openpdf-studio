import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Always expose store references for browser console testing and Playwright.
// These are read-only references to Zustand stores — no security risk
// (React DevTools already exposes this; this just makes it convenient).
import('./store').then(({ useAnnotationStore, useDocumentStore, useViewportStore }) => {
  import('@/lib/annotations').then(({ createTextAnnotation }) => {
    (window as unknown as Record<string, unknown>).openpdfDebug = {
      annotations: useAnnotationStore,
      documents: useDocumentStore,
      viewport: useViewportStore,

      /** Console helper: openpdfDebug.seed() or openpdfDebug.seed(2) for page 2 */
      seed: async (pageNumber = 1) => {
        const doc = useDocumentStore.getState().document;
        if (!doc) { console.warn('[OpenPDF] No document open — open a PDF first'); return; }
        const ann = createTextAnnotation({
          documentId: doc.id,
          pageNumber,
          x: 100,
          y: 150,
          text: 'Test annotation — Day 4 foundation',
        });
        await useAnnotationStore.getState().addAnnotation(ann);
        console.info('[OpenPDF] Annotation seeded:', ann.id);
        return ann;
      },

      /**
       * Playwright/console helper: create a blank 1-page test PDF, save it to
       * Dexie, and load it into the document store — all without needing an
       * existing document.  Call this from a test via:
       *   await page.evaluate(() => window.openpdfDebug.seedDocument())
       */
      seedDocument: async () => {
        const [{ PDFDocument }, { pdfjs }, { saveDocument, updatePageCount }] = await Promise.all([
          import('pdf-lib'),
          import('@/lib/pdfjs'),
          import('@/storage/documents'),
        ]);
        // Build a minimal blank A4 page
        const pdfDoc = await PDFDocument.create();
        pdfDoc.addPage([595, 842]);
        const bytes = await pdfDoc.save();

        // Save to Dexie (saveDocument expects a File)
        const file = new File([bytes], 'test-document.pdf', { type: 'application/pdf' });
        const id = await saveDocument(file);

        // Load via PDF.js then set in store
        const data = (bytes as Uint8Array).buffer.slice(0);
        const pdf = await pdfjs.getDocument({ data }).promise;
        await updatePageCount(id, pdf.numPages);

        useDocumentStore.getState().setDocument({
          id,
          fileName: 'test-document.pdf',
          totalPages: pdf.numPages,
          pdf,
        });

        console.info('[OpenPDF] Test document seeded:', id);
        return id;
      },
    };
    console.info('[OpenPDF] Debug API ready — try: openpdfDebug.seed() / openpdfDebug.seedDocument()');
  });
});
