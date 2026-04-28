import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useAuthDialog } from '@/hooks/useAuthDialog';
import { useAuth } from '@/stores/auth';
import { brand, gradients, shadows } from '@/lib/brand';
import { FormIQLogo } from '@/components/branding/FormIQLogo';
import { GoogleButton } from './GoogleButton';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';

// COWORK-41.E: GoogleButton restored with VITE_GOOGLE_CLIENT_ID guard.
// When clientId is unset (staging), the button is hidden — no crash.
// When VITE_GOOGLE_CLIENT_ID is configured, the Google button appears automatically.

export function AuthDialog() {
  const { open, mode, contextMessage, onAuthed, closeDialog, setMode } = useAuthDialog();
  const user = useAuth((s) => s.user);

  useEffect(() => {
    if (open && user) {
      onAuthed?.();
      closeDialog();
    }
  }, [open, user, onAuthed, closeDialog]);

  // iOS-5: When the software keyboard appears the fixed dialog stays put and
  // can hide the active input. scrollIntoView after keyboard animation (350ms)
  // reliably lifts the input above the keyboard on all iOS/Safari/PWA versions.
  useEffect(() => {
    if (!open) return;
    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') return;
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 350);
    };
    window.addEventListener('focusin', onFocusIn);
    return () => window.removeEventListener('focusin', onFocusIn);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeDialog()}>
      <DialogContent className="border-none bg-transparent p-0 shadow-none sm:max-w-[420px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          className="relative overflow-hidden overflow-y-auto max-h-[90dvh] rounded-[20px]"
          style={{
            background: brand.surface,
            backdropFilter: 'blur(50px) saturate(200%)',
            WebkitBackdropFilter: 'blur(50px) saturate(200%)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: shadows.dialog,
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-[3px] -z-10 animate-formiq-logo-spin rounded-[22px] opacity-35 blur-md"
            style={{ background: gradients.conic }}
          />
          <div className="px-5 pb-5 pt-7 sm:px-8">
            <div className="mb-4 flex justify-center">
              <FormIQLogo variant="icon" size={56} glow />
            </div>
            <DialogTitle
              className="mb-2 text-center text-[24px] font-bold tracking-tight"
              style={{
                background: gradients.title,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Welcome to FormIQ
            </DialogTitle>
            <DialogDescription
              className="text-center text-[13.5px] leading-snug"
              style={{ color: brand.textSecondary }}
            >
              {contextMessage ??
                'Sign in to send signature requests, save your work, and access your documents anywhere.'}
            </DialogDescription>
          </div>
          <div className="px-5 pb-8 sm:px-8">
            <TabSwitcher mode={mode} onChange={setMode} />
            <AnimatePresence mode="wait">
              {mode === 'login' ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.18 }}
                >
                  <LoginForm onSuccess={() => closeDialog()} />
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  <SignupForm onSuccess={() => closeDialog()} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Google OAuth — only shown when VITE_GOOGLE_CLIENT_ID is configured.
                Guards against useGoogleLogin crash with empty clientId. */}
            {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
              <div className="mt-4">
                <div className="flex items-center gap-3 py-2">
                  <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <span className="text-[11px]" style={{ color: brand.textSecondary }}>or</span>
                  <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
                </div>
                <GoogleButton onSuccess={() => closeDialog()} />
              </div>
            ) : null}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

function TabSwitcher({
  mode,
  onChange,
}: {
  mode: 'login' | 'signup';
  onChange: (m: 'login' | 'signup') => void;
}) {
  return (
    <div
      className="relative mb-5 flex rounded-[11px] p-1"
      style={{
        background: 'rgba(0,0,0,0.35)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <motion.div
        layout
        animate={{ x: mode === 'login' ? 0 : '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-lg"
        style={{
          background: gradients.primarySoft,
          boxShadow: `0 2px 10px ${brand.cyan}55, inset 0 1px 0 rgba(255,255,255,0.18)`,
        }}
      />
      <button
        type="button"
        onClick={() => onChange('login')}
        className="relative z-10 flex-1 py-2.5 text-[13px] font-medium transition-colors"
        style={{ color: mode === 'login' ? '#fff' : brand.textSecondary }}
      >
        Sign in
      </button>
      <button
        type="button"
        onClick={() => onChange('signup')}
        className="relative z-10 flex-1 py-2.5 text-[13px] font-medium transition-colors"
        style={{ color: mode === 'signup' ? '#fff' : brand.textSecondary }}
      >
        Create account
      </button>
    </div>
  );
}
