import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { brand, gradients, shadows } from '@/lib/brand';

interface AnimatedSubmitButtonProps {
  children: ReactNode;
  loading?: boolean;
  className?: string;
}

/**
 * Submit button with infinite gradient shift (cyan → teal → lime) and
 * shimmer-on-hover. Used in LoginForm, SignupForm, and any other primary
 * CTA in dialogs.
 */
export function AnimatedSubmitButton({
  children,
  loading,
  className,
}: AnimatedSubmitButtonProps) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileHover={{ y: loading ? 0 : -2 }}
      whileTap={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'group relative mt-2 h-[46px] w-full overflow-hidden rounded-[11px] text-[14px] font-semibold text-white',
        'disabled:cursor-not-allowed disabled:opacity-80',
        'animate-formiq-gradient-shift',
        className
      )}
      style={{
        background: gradients.primary,
        backgroundSize: '200% 200%',
        boxShadow: shadows.glow,
      }}
      onMouseEnter={(e) => {
        if (!loading) e.currentTarget.style.boxShadow = shadows.glowStrong;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = shadows.glow;
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-full"
      />
      <span className="relative z-10">{loading ? 'Working…' : children}</span>
    </motion.button>
  );
}
