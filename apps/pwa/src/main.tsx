import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  enabled: import.meta.env.PROD,
  tracesSampleRate: 0.1,
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection',
    'AbortError',
  ],
  beforeSend(event) {
    if (window.location.hostname === 'localhost') return null;
    return event;
  },
});

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}>
    <Sentry.ErrorBoundary
      fallback={({ resetError }) => (
        <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-900 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/10">
            <span className="text-3xl">⚠️</span>
          </div>
          <p className="text-xl font-bold text-white">Something went wrong</p>
          <p className="text-sm text-white/50 max-w-xs">
            This error has been reported automatically. Please try refreshing.
          </p>
          <button
            onClick={resetError}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400"
          >
            Try Again
          </button>
        </div>
      )}
    >
      <StrictMode>
        <App />
      </StrictMode>
    </Sentry.ErrorBoundary>
  </GoogleOAuthProvider>,
);

import('@/lib/analytics').then(({ trackEvent }) => {
  window.addEventListener('appinstalled', () => {
    trackEvent('pwa_installed');
  });
});

// Always expose store references for browser console testing and Playwright.
import('./store').then(({ useAnnotationStore, useDocumentStore, useViewportStore }) => {
  import('@/lib/annotations').then(({ createTextAnnotation }) => {
    (window as unknown as Record<string, unknown>).openpdfDebug = {
      annotations: useAnnotationStore,
      documents: useDocumentStore,
      viewport: useViewportStore,

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

      seedDocument: async () => {
        const [{ PDFDocument }, { pdfjs }, { saveDocument, updatePageCount }] = await Promise.all([
          import('pdf-lib'),
          import('@/lib/pdfjs'),
          import('@/storage/documents'),
        ]);
        const pdfDoc = await PDFDocument.create();
        pdfDoc.addPage([595, 842]);
        const bytes = await pdfDoc.save();
        const file = new File([bytes], 'test-document.pdf', { type: 'application/pdf' });
        const id = await saveDocument(file);
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
