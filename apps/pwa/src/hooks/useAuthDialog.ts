import { create } from 'zustand';

type AuthDialogMode = 'login' | 'signup';

interface AuthDialogState {
  open: boolean;
  mode: AuthDialogMode;
  /** Optional message displayed under the dialog title when a gated action triggers it. */
  contextMessage?: string;
  /** Callback fired after successful auth — used by RequireAuth to resume gated actions. */
  onAuthed?: () => void;
  openDialog: (opts?: {
    mode?: AuthDialogMode;
    contextMessage?: string;
    onAuthed?: () => void;
  }) => void;
  closeDialog: () => void;
  setMode: (mode: AuthDialogMode) => void;
}

/**
 * Global auth dialog controller. Import from anywhere:
 *   const openDialog = useAuthDialog(s => s.openDialog);
 *   openDialog({ mode: 'signup', contextMessage: 'Sign in to send for signature' });
 */
export const useAuthDialog = create<AuthDialogState>((set) => ({
  open: false,
  mode: 'login',
  contextMessage: undefined,
  onAuthed: undefined,
  openDialog: (opts) =>
    set({
      open: true,
      mode: opts?.mode ?? 'login',
      contextMessage: opts?.contextMessage,
      onAuthed: opts?.onAuthed,
    }),
  closeDialog: () => set({ open: false, contextMessage: undefined, onAuthed: undefined }),
  setMode: (mode) => set({ mode }),
}));
