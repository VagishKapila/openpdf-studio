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
    };
    console.info('[OpenPDF] Debug API ready — try: openpdfDebug.seed()');
  });
});
