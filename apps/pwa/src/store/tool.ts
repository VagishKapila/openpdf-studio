import { create } from 'zustand';

export type Tool = 'select' | 'highlight' | 'draw' | 'text' | 'sign' | 'stamp' | 'eraser' | 'comment' | 'zoom-in' | 'zoom-out';

type ToolState = {
  activeTool: Tool;
  setTool: (tool: Tool) => void;
};

export const useToolStore = create<ToolState>((set) => ({
  activeTool: 'select',
  setTool: (activeTool) => set({ activeTool }),
}));
