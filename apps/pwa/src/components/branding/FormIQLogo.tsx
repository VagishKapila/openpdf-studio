import { cn } from '@/lib/utils';

interface FormIQLogoProps {
  /** Variant: 'icon' = squircle app icon, 'wordmark' = full Formiq lockup. Defaults to 'icon'. */
  variant?: 'icon' | 'wordmark';
  /** Pixel size for icon variant, OR pixel HEIGHT for wordmark variant. */
  size?: number;
  className?: string;
  /** Add a subtle hover/idle glow halo behind the mark. Defaults to true for icon, false for wordmark. */
  glow?: boolean;
}

/**
 * FormIQ brand mark — uses the real brand assets in /public/brand/.
 *
 * - variant="icon" → square app icon (use in app header, favicon, PWA)
 * - variant="wordmark" → full "Formiq" wordmark with tagline (use in welcome, marketing, email)
 *
 * Animation: subtle glow halo behind the icon that pulses every 4s. The logo
 * itself doesn't spin or animate — the asset already has visual energy from
 * the pixel-dissolve effect; we don't want to over-animate it.
 */
export function FormIQLogo({
  variant = 'icon',
  size,
  className,
  glow,
}: FormIQLogoProps) {
  const showGlow = glow ?? variant === 'icon';

  if (variant === 'wordmark') {
    const h = size ?? 80;
    return (
      <div
        className={cn('relative inline-flex shrink-0', className)}
        style={{ height: h }}
        aria-label="FormIQ"
      >
        <img
          src="/brand/formiq-wordmark.png"
          alt="FormIQ"
          style={{ height: '100%', width: 'auto' }}
          className="select-none"
          draggable={false}
        />
      </div>
    );
  }

  // Icon variant
  const s = size ?? 38;
  return (
    <div
      className={cn('relative inline-flex shrink-0', className)}
      style={{ width: s, height: s }}
      aria-label="FormIQ"
    >
      {showGlow && (
        <div
          aria-hidden
          className="absolute inset-0 -z-10 animate-formiq-icon-pulse rounded-[28%] blur-md"
          style={{
            background:
              'radial-gradient(circle, rgba(59,169,255,0.55) 0%, rgba(34,211,199,0.35) 50%, transparent 75%)',
          }}
        />
      )}
      <img
        src="/brand/formiq-icon.png"
        alt="FormIQ"
        style={{ width: '100%', height: '100%' }}
        className="select-none"
        draggable={false}
      />
    </div>
  );
}
