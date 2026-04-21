import { create } from 'zustand';

export type ViewportState = {
  scale: number;
  offsetX: number;
  offsetY: number;
  renderedScale: number;
  minScale: number;
  maxScale: number;
  setTransform: (scale: number, offsetX: number, offsetY: number) => void;
  setRenderedScale: (scale: number) => void;
  resetTransform: () => void;
  setScale: (scale: number) => void;
};

export const useViewportStore = create<ViewportState>((set) => ({
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  renderedScale: 1.5,
  minScale: 0.5,
  maxScale: 5,
  setTransform: (scale, offsetX, offsetY) => set({ scale, offsetX, offsetY }),
  setRenderedScale: (renderedScale) => set({ renderedScale }),
  resetTransform: () => set({ scale: 1, offsetX: 0, offsetY: 0 }),
  setScale: (scale) => set({ scale }),
}));
