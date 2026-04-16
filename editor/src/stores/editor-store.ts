import { create } from 'zustand';
import type {
  EditorDocument,
  EditorTool,
  ShapeType,
  EditorMode,
  EditorTab,
  AnnotationStyle,
  ImageFilters,
  ModalType,
  HistoryEntry,
} from '@/types';

interface EditorState {
  // Documents
  documents: EditorDocument[];
  activeDocId: string | null;

  // Tools
  currentTool: EditorTool;
  shapeType: ShapeType;
  mode: EditorMode;
  tab: EditorTab;
  style: AnnotationStyle;
  imageFilters: ImageFilters;

  // UI
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  activeModal: ModalType;

  // Actions - Documents
  addDocument: (doc: EditorDocument) => void;
  removeDocument: (id: string) => void;
  setActiveDocument: (id: string) => void;
  updateDocument: (id: string, updates: Partial<EditorDocument>) => void;

  // Actions - Tools
  setTool: (tool: EditorTool) => void;
  setCurrentTool: (tool: EditorTool) => void; // alias for setTool
  setShapeType: (shape: ShapeType) => void;
  setMode: (mode: EditorMode) => void;
  setTab: (tab: EditorTab) => void;
  updateStyle: (updates: Partial<AnnotationStyle>) => void;
  updateImageFilters: (updates: Partial<ImageFilters>) => void;

  // Actions - UI
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;

  // Actions - Page navigation
  goToPage: (docId: string, page: number) => void;
  setZoom: (docId: string, zoom: number) => void;

  // Actions - History
  saveHistory: (docId: string) => void;
  undo: (docId?: string) => void;
  redo: (docId?: string) => void;

  // Actions - Misc
  deleteActive: () => void;
  downloadDocument: () => void;
  addSignature: (sig: { type: string; data: string }) => void;

  // Computed
  activeDocument: () => EditorDocument | null;
}

const defaultStyle: AnnotationStyle = {
  color: '#000000',
  fontSize: 12,
  fontFamily: 'Arial',
  strokeWidth: 2,
  opacity: 1,
};

const defaultFilters: ImageFilters = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  blur: 0,
  grayscale: 0,
  sepia: 0,
  hueRotate: 0,
};

export const useEditorStore = create<EditorState>((set, get) => ({
  // Initial state
  documents: [],
  activeDocId: null,
  currentTool: 'select',
  shapeType: 'rect',
  mode: 'pdf',
  tab: 'editor',
  style: { ...defaultStyle },
  imageFilters: { ...defaultFilters },
  sidebarOpen: true,
  rightPanelOpen: true,
  activeModal: null,

  // Document actions
  addDocument: (doc) =>
    set((state) => ({
      documents: [...state.documents, doc],
      activeDocId: doc.id,
    })),

  removeDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
      activeDocId: state.activeDocId === id ? (state.documents[0]?.id ?? null) : state.activeDocId,
    })),

  setActiveDocument: (id) =>
    set((state) => ({
      activeDocId: state.documents.some((d) => d.id === id) ? id : null,
    })),

  updateDocument: (id, updates) =>
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      ),
    })),

  // Tool actions
  setTool: (tool) => set({ currentTool: tool }),
  setCurrentTool: (tool) => set({ currentTool: tool }),

  setShapeType: (shape) => set({ shapeType: shape }),

  setMode: (mode) => set({ mode }),

  setTab: (tab) => set({ tab }),

  updateStyle: (updates) =>
    set((state) => ({
      style: { ...state.style, ...updates },
    })),

  updateImageFilters: (updates) =>
    set((state) => ({
      imageFilters: { ...state.imageFilters, ...updates },
    })),

  // UI actions
  toggleSidebar: () =>
    set((state) => ({
      sidebarOpen: !state.sidebarOpen,
    })),

  toggleRightPanel: () =>
    set((state) => ({
      rightPanelOpen: !state.rightPanelOpen,
    })),

  openModal: (modal) => set({ activeModal: modal }),

  closeModal: () => set({ activeModal: null }),

  // Page navigation
  goToPage: (docId, page) =>
    set((state) => ({
      documents: state.documents.map((d) => {
        if (d.id === docId) {
          const validPage = Math.max(1, Math.min(page, d.totalPages));
          return { ...d, currentPage: validPage };
        }
        return d;
      }),
    })),

  setZoom: (docId, zoom) =>
    set((state) => ({
      documents: state.documents.map((d) => {
        if (d.id === docId) {
          const validZoom = Math.max(50, Math.min(zoom, 400));
          return { ...d, zoom: validZoom };
        }
        return d;
      }),
    })),

  // History actions
  saveHistory: (docId) =>
    set((state) => ({
      documents: state.documents.map((d) => {
        if (d.id === docId) {
          const newEntry: HistoryEntry = {
            pageNum: d.currentPage,
            annotationJson: d.pageAnnotations[d.currentPage] || '[]',
            textEdits: d.textEdits[d.currentPage] || [],
          };

          // Trim future history if we've undone and are making a new change
          const historyUpToIndex = d.history.slice(0, d.historyIndex + 1);

          return {
            ...d,
            history: [...historyUpToIndex, newEntry],
            historyIndex: historyUpToIndex.length,
            hasUnsavedChanges: true,
          };
        }
        return d;
      }),
    })),

  undo: (docId?) =>
    set((state) => {
      const id = docId ?? state.activeDocId;
      return {
      documents: state.documents.map((d) => {
        if (d.id === id && d.historyIndex > 0) {
          const newIndex = d.historyIndex - 1;
          const entry = d.history[newIndex];
          if (!entry) return d;
          return {
            ...d,
            historyIndex: newIndex,
            currentPage: entry.pageNum,
            pageAnnotations: {
              ...d.pageAnnotations,
              [entry.pageNum]: entry.annotationJson,
            },
            textEdits: {
              ...d.textEdits,
              [entry.pageNum]: entry.textEdits,
            },
          };
        }
        return d;
      }),
    }; }),

  redo: (docId?) =>
    set((state) => {
      const id = docId ?? state.activeDocId;
      return {
      documents: state.documents.map((d) => {
        if (d.id === id && d.historyIndex < d.history.length - 1) {
          const newIndex = d.historyIndex + 1;
          const entry = d.history[newIndex];
          if (!entry) return d;
          return {
            ...d,
            historyIndex: newIndex,
            currentPage: entry.pageNum,
            pageAnnotations: {
              ...d.pageAnnotations,
              [entry.pageNum]: entry.annotationJson,
            },
            textEdits: {
              ...d.textEdits,
              [entry.pageNum]: entry.textEdits,
            },
          };
        }
        return d;
      }),
    }; }),

  // Misc actions
  deleteActive: () => {
    // Placeholder — actual deletion of Fabric objects handled in useFabricCanvas
    console.warn('deleteActive: Use useFabricCanvas().deleteSelected() for canvas objects');
  },

  downloadDocument: () => {
    const state = get();
    const doc = state.documents.find((d) => d.id === state.activeDocId);
    if (!doc || !doc.pdfBytes) return;
    const blob = new Blob([doc.pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.fileName;
    a.click();
    URL.revokeObjectURL(url);
  },

  addSignature: (_sig: { type: string; data: string }) => {
    // Placeholder — will be wired to Fabric canvas in canvas integration
    console.log('Signature added:', _sig.type);
  },

  // Computed
  activeDocument: () => {
    const state = get();
    return state.documents.find((d) => d.id === state.activeDocId) ?? null;
  },
}));
