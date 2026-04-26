import { create } from 'zustand';

type AuthDialogMode = 'login' | 'signup';

interface AuthDialogState {
  open: boolean;
  mode: AuthDialogMode;
  /** Optional message displayed under the title — used when gated actions trigger the dialog. */
  contextMessage?: string;
  /** Callback fired after successful auth — used by RequireAuth to resume gated actions. */
  onAuthed?: () => void;
  openDialog: (opts?: { mode?: AuthDialogMode; contextMessage?: string; onAuthed?: () => void }) => void;
  closeDialog: () => void;
  setMode: (mode: AuthDialogMode) => void;
}

/**
 * Global auth dialog controller. Imported from anywhere in the app:
 *   const open = useAuthDialog(s => s.openDialog);
 *   open({ mode: 'signup', contextMessage: 'Sign in to send for signature' });
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
