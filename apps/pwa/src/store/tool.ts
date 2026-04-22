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

type ToolState = {
  activeTool: Tool;
  setTool: (tool: Tool) => void;
  textFontSize: TextFontSize;
  textColor: string;
  setTextFontSize: (size: TextFontSize) => void;
  setTextColor: (color: string) => void;
};

export const useToolStore = create<ToolState>((set) => ({
  activeTool: 'select',
  setTool: (activeTool) => set({ activeTool }),
  textFontSize: 16,
  textColor: '#1a1a1a',
  setTextFontSize: (textFontSize) => set({ textFontSize }),
  setTextColor: (textColor) => set({ textColor }),
}));
