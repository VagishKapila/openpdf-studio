import { useGoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/stores/auth';

interface GoogleButtonProps {
  onSuccess?: () => void;
}

/**
 * Google OAuth button using implicit flow with ID token return.
 * Styled to match the dialog aesthetic (white pill, lifts on hover, shimmer on press).
 */
export function GoogleButton({ onSuccess }: GoogleButtonProps) {
  const loginWithGoogle = useAuth((s) => s.loginWithGoogle);
  const [loading, setLoading] = useState(false);

  const login = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (response) => {
      try {
        setLoading(true);
        // The implicit flow returns access_token; we exchange it for an ID token
        // server-side via the auth store's loginWithGoogle action.
        await loginWithGoogle(response.access_token);
        onSuccess?.();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Google sign-in failed');
      } finally {
        setLoading(false);
      }
    },
    onError: () => toast.error('Google sign-in cancelled'),
  });

  return (
    <motion.button
      type="button"
      disabled={loading}
      onClick={() => login()}
      whileHover={{ y: -2 }}
      whileTap={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="relative flex h-[46px] w-full items-center justify-center gap-3 overflow-hidden rounded-[11px] bg-white/95 text-[14px] font-medium text-zinc-900 shadow-[0_4px_14px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.5)] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
    >
      <GoogleIcon />
      {loading ? 'Signing in…' : 'Continue with Google'}
    </motion.button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
