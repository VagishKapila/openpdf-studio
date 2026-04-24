import { create } from 'zustand';

// v1 scope: exactly 5 primary tools; "More" is a UI affordance handled in MobileToolbar
export type Tool = 'select' | 'text' | 'draw' | 'highlight' | 'sign';

export const TEXT_FONT_SIZES = [12, 14, 16, 20, 24, 32] as const;
export type TextFontSize = (typeof TEXT_FONT_SIZES)[number];

export const TEXT_COLORS = [
  { label: 'Black', value: '#1a1a1a' },
  { label: 'Red',   value: '#e53e3e' },
  { label: 'Blue',  value: '#2b6cb0' },
  { label: 'Green', value: '#276749' },
  { label: 'Gray',  value: '#718096' },
] as const;

export const DRAW_COLORS = [
  { label: 'Red',   value: '#e53e3e' },
  { label: 'Black', value: '#1a1a1a' },
  { label: 'Blue',  value: '#2b6cb0' },
  { label: 'Green', value: '#276749' },
  { label: 'White', value: '#ffffff' },
] as const;

export const DRAW_STROKE_WIDTHS = [
  { label: 'Thin',   value: 2 },
  { label: 'Medium', value: 4 },
  { label: 'Thick',  value: 7 },
] as const;
export type DrawStrokeWidth = (typeof DRAW_STROKE_WIDTHS)[number]['value'];

export const HIGHLIGHT_COLORS = [
  { label: 'Yellow', value: '#F6E05E' },
  { label: 'Green',  value: '#9AE6B4' },
  { label: 'Blue',   value: '#90CDF4' },
  { label: 'Pink',   value: '#FEB2B2' },
] as const;

/** Data returned by SignatureModal — used for placement mode */
export type PendingSignature = {
  source: 'draw' | 'type' | 'upload';
  /** base64 PNG data URL for draw/upload */
  imageData?: string;
  /** typed text for type source */
  text?: string;
  /** CSS font-family string for type source */
  fontFamily?: string;
  /** Width in pixels at source resolution (for aspect-ratio calc) */
  naturalWidth: number;
  /** Height in pixels at source resolution */
  naturalHeight: number;
};

type ToolState = {
  activeTool: Tool;
  setTool: (tool: Tool) => void;
  // Text settings
  textFontSize: TextFontSize;
  textColor: string;
  setTextFontSize: (size: TextFontSize) => void;
  setTextColor: (color: string) => void;
  // Draw settings
  drawColor: string;
  drawStrokeWidth: DrawStrokeWidth;
  setDrawColor: (color: string) => void;
  setDrawStrokeWidth: (width: DrawStrokeWidth) => void;
  // Highlight settings
  highlightColor: string;
  setHighlightColor: (color: string) => void;
  // Signature placement
  pendingSignature: PendingSignature | null;
  setPendingSignature: (sig: PendingSignature | null) => void;
};

export const useToolStore = create<ToolState>((set) => ({
  activeTool: 'select',
  setTool: (activeTool) => set({ activeTool }),
  textFontSize: 16,
  textColor: '#1a1a1a',
  setTextFontSize: (textFontSize) => set({ textFontSize }),
  setTextColor: (textColor) => set({ textColor }),
  drawColor: '#e53e3e',
  drawStrokeWidth: 4,
  setDrawColor: (drawColor) => set({ drawColor }),
  setDrawStrokeWidth: (drawStrokeWidth) => set({ drawStrokeWidth }),
  highlightColor: '#F6E05E',
  setHighlightColor: (highlightColor) => set({ highlightColor }),
  pendingSignature: null,
  setPendingSignature: (pendingSignature) => set({ pendingSignature }),
}));
