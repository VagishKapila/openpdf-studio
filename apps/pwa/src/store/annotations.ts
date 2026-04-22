import { create } from 'zustand';
import type { Annotation, AnnotationId, DocumentId, PageNumber } from '@/lib/annotations';
import * as annStorage from '@/storage/annotations';

export type AnnotationState = {
  annotations: Annotation[];
  selectedId: AnnotationId | null;

  loadForPage: (documentId: DocumentId, pageNumber: PageNumber) => Promise<void>;
  addAnnotation: (ann: Annotation) => Promise<void>;
  updateAnnotation: (id: AnnotationId, patch: Partial<Annotation>) => Promise<void>;
  removeAnnotation: (id: AnnotationId) => Promise<void>;
  setSelected: (id: AnnotationId | null) => void;
  clearAll: () => void;
};

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  annotations: [],
  selectedId: null,

  loadForPage: async (documentId, pageNumber) => {
    const annotations = await annStorage.getAnnotationsForPage(documentId, pageNumber);
    set({ annotations, selectedId: null });
  },

  addAnnotation: async (ann) => {
    await annStorage.saveAnnotation(ann);
    set((s) => ({ annotations: [...s.annotations, ann] }));
  },

  updateAnnotation: async (id, patch) => {
    const existing = get().annotations.find((a) => a.id === id);
    if (!existing) return;
    const updated = { ...existing, ...patch, updatedAt: Date.now() } as Annotation;
    await annStorage.saveAnnotation(updated);
    set((s) => ({
      annotations: s.annotations.map((a) => (a.id === id ? updated : a)),
    }));
  },

  removeAnnotation: async (id) => {
    await annStorage.deleteAnnotation(id);
    set((s) => ({
      annotations: s.annotations.filter((a) => a.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    }));
  },

  setSelected: (id) => set({ selectedId: id }),
  clearAll: () => set({ annotations: [], selectedId: null }),
}));
