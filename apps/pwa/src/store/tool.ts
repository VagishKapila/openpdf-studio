import { create } from 'zustand';

// v1 scope: exactly 5 primary tools; "More" is a UI affordance handled in MobileToolbar
export type Tool = 'select' | 'text' | 'draw' | 'highlight' | 'sign';

type ToolState = {
  activeTool: Tool;
  setTool: (tool: Tool) => void;
};

export const useToolStore = create<ToolState>((set) => ({
  activeTool: 'select',
  setTool: (activeTool) => set({ activeTool }),
}));
