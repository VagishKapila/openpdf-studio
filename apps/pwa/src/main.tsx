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

// Dev-only: expose store references in window for console testing and Playwright
if (import.meta.env.DEV) {
  import('./store').then(({ useAnnotationStore, useDocumentStore, useViewportStore }) => {
    (window as unknown as Record<string, unknown>).openpdfDebug = {
      annotations: useAnnotationStore,
      documents: useDocumentStore,
      viewport: useViewportStore,
    };
  });
}
