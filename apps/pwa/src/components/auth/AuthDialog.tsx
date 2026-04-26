import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAuthDialog } from '@/hooks/useAuthDialog';
import { useAuthStore } from '@/stores/auth';
import { GoogleButton } from './GoogleButton';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';

export function AuthDialog() {
  const { open, mode, contextMessage, onAuthed, closeDialog, setMode } = useAuthDialog();
  const user = useAuthStore((s) => s.user);

  // Close and fire callback when auth completes while dialog is open
  useEffect(() => {
    if (open && user) {
      onAuthed?.();
      closeDialog();
    }
  }, [open, user, onAuthed, closeDialog]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeDialog()}>
      <DialogContent className="max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 text-white shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-center text-xl font-bold">
            {mode === 'login' ? 'Sign in to FormIQ' : 'Create your account'}
          </DialogTitle>
          {contextMessage && (
            <DialogDescription className="text-center text-sm text-white/60">
              {contextMessage}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4">
          <GoogleButton onSuccess={() => closeDialog()} />

          {/* Divider */}
          <div className="relative flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs uppercase tracking-widest text-white/30">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-lg bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'bg-amber-400/20 text-amber-400'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                mode === 'signup'
                  ? 'bg-amber-400/20 text-amber-400'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              Create account
            </button>
          </div>

          {mode === 'login' ? (
            <LoginForm onSuccess={() => closeDialog()} />
          ) : (
            <SignupForm onSuccess={() => closeDialog()} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
