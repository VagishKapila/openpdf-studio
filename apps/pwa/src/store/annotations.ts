import { create } from 'zustand';
import type { Annotation, AnnotationId, DocumentId, PageNumber } from '@/lib/annotations';
import * as annStorage from '@/storage/annotations';
import { trackEvent } from '@/lib/analytics';

const HISTORY_LIMIT = 50;

export type AnnotationState = {
  annotations: Annotation[];
  selectedId: AnnotationId | null;
  editingAnnotationId: AnnotationId | null;
  /** Snapshots of annotations[] before each mutation — most-recent last */
  undoStack: Annotation[][];
  /** Snapshots pushed to redo after an undo — most-recent last */
  redoStack: Annotation[][];
  /** documentId for the currently-loaded page (needed by undo/redo Dexie sync) */
  currentDocumentId: DocumentId | null;
  /** pageNumber for the currently-loaded page */
  currentPageNumber: PageNumber | null;

  loadForPage: (documentId: DocumentId, pageNumber: PageNumber) => Promise<void>;
  addAnnotation: (ann: Annotation) => Promise<void>;
  updateAnnotation: (id: AnnotationId, patch: Partial<Annotation>) => Promise<void>;
  removeAnnotation: (id: AnnotationId) => Promise<void>;
  setSelected: (id: AnnotationId | null) => void;
  setEditingAnnotationId: (id: AnnotationId | null) => void;
  clearAll: () => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
};

function pushHistory(undoStack: Annotation[][], snapshot: Annotation[]): Annotation[][] {
  const next = [...undoStack, [...snapshot]];
  return next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next;
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  annotations: [],
  selectedId: null,
  editingAnnotationId: null,
  undoStack: [],
  redoStack: [],
  currentDocumentId: null,
  currentPageNumber: null,

  loadForPage: async (documentId, pageNumber) => {
    const annotations = await annStorage.getAnnotationsForPage(documentId, pageNumber);
    set({
      annotations,
      selectedId: null,
      editingAnnotationId: null,
      undoStack: [],
      redoStack: [],
      currentDocumentId: documentId,
      currentPageNumber: pageNumber,
    });
  },

  addAnnotation: async (ann) => {
    const { annotations, undoStack } = get();
    await annStorage.saveAnnotation(ann);
    set({
      annotations: [...annotations, ann],
      undoStack: pushHistory(undoStack, annotations),
      redoStack: [],
    });
    trackEvent('annotation_created', { type: ann.type });
  },

  updateAnnotation: async (id, patch) => {
    const { annotations, undoStack } = get();
    const existing = annotations.find((a) => a.id === id);
    if (!existing) return;
    const updated = { ...existing, ...patch, updatedAt: Date.now() } as Annotation;
    await annStorage.saveAnnotation(updated);
    set({
      annotations: annotations.map((a) => (a.id === id ? updated : a)),
      undoStack: pushHistory(undoStack, annotations),
      redoStack: [],
    });
  },

  removeAnnotation: async (id) => {
    const { annotations, undoStack, selectedId, editingAnnotationId } = get();
    await annStorage.deleteAnnotation(id);
    set({
      annotations: annotations.filter((a) => a.id !== id),
      undoStack: pushHistory(undoStack, annotations),
      redoStack: [],
      selectedId: selectedId === id ? null : selectedId,
      editingAnnotationId: editingAnnotationId === id ? null : editingAnnotationId,
    });
  },

  setSelected: (id) => set({ selectedId: id }),
  setEditingAnnotationId: (id) => set({ editingAnnotationId: id }),
  clearAll: () =>
    set({ annotations: [], selectedId: null, editingAnnotationId: null, undoStack: [], redoStack: [] }),

  undo: async () => {
    const { undoStack, redoStack, annotations, currentDocumentId, currentPageNumber } = get();
    if (undoStack.length === 0 || !currentDocumentId || currentPageNumber === null) return;

    const snapshot = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);
    const newRedoStack = [...redoStack, [...annotations]];

    await annStorage.deleteAnnotationsForPage(currentDocumentId, currentPageNumber);
    await Promise.all(snapshot.map((ann) => annStorage.saveAnnotation(ann)));

    set({
      annotations: snapshot,
      undoStack: newUndoStack,
      redoStack: newRedoStack,
      selectedId: null,
      editingAnnotationId: null,
    });
  },

  redo: async () => {
    const { undoStack, redoStack, annotations, currentDocumentId, currentPageNumber } = get();
    if (redoStack.length === 0 || !currentDocumentId || currentPageNumber === null) return;

    const snapshot = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);
    const newUndoStack = pushHistory(undoStack, annotations);

    await annStorage.deleteAnnotationsForPage(currentDocumentId, currentPageNumber);
    await Promise.all(snapshot.map((ann) => annStorage.saveAnnotation(ann)));

    set({
      annotations: snapshot,
      undoStack: newUndoStack,
      redoStack: newRedoStack,
      selectedId: null,
      editingAnnotationId: null,
    });
  },
}));
