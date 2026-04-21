import { create } from 'zustand';

type UIState = {
  aside: boolean;
  statusMsg: string;
  toggleAside: () => void;
  setAside: (open: boolean) => void;
  setStatus: (msg: string) => void;
  clearStatus: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  aside: false,
  statusMsg: '',
  toggleAside: () => set((s) => ({ aside: !s.aside })),
  setAside: (aside) => set({ aside }),
  setStatus: (statusMsg) => set({ statusMsg }),
  clearStatus: () => set({ statusMsg: '' }),
}));
