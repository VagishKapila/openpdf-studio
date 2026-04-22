import { create } from 'zustand';
import * as pdfjs from 'pdfjs-dist';

export type LoadState = 'idle' | 'loading' | 'ready' | 'error';

export type LoadedDocument = {
  id: string;
  fileName: string;
  totalPages: number;
  pdf: pdfjs.PDFDocumentProxy;
};

type DocumentState = {
  loadState: LoadState;
  errorMsg: string;
  currentPage: number;
  document: LoadedDocument | null;
  setLoadState: (s: LoadState) => void;
  setError: (msg: string) => void;
  setDocument: (doc: LoadedDocument) => void;
  setPage: (page: number) => void;
  clearDocument: () => void;
};

const CLOSED_FLAG_KEY = 'openpdf_doc_explicitly_closed';

export const useDocumentStore = create<DocumentState>((set, get) => ({
  loadState: 'idle',
  errorMsg: '',
  currentPage: 1,
  document: null,
  setLoadState: (loadState) => set({ loadState }),
  setError: (errorMsg) => set({ errorMsg, loadState: 'error' }),
  setDocument: (document) => set({ document, loadState: 'ready', currentPage: 1 }),
  setPage: (page) => {
    const doc = get().document;
    if (!doc) return;
    const clamped = Math.max(1, Math.min(doc.totalPages, page));
    set({ currentPage: clamped });
  },
  clearDocument: () => {
    // Set flag so CanvasArea init effect doesn't auto-reload on next render
    try {
      sessionStorage.setItem(CLOSED_FLAG_KEY, 'true');
    } catch {
      // sessionStorage unavailable (private browsing quirks) — ignore
    }
    set({ document: null, loadState: 'idle', currentPage: 1, errorMsg: '' });
  },
}));
