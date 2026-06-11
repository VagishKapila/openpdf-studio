/**
 * FormIQ brand tokens — single source of truth.
 * Change values here, the entire UI updates.
 *
 * Derived from the v1.1 logo (cyan→teal→lime, document-with-AI-dissolve).
 * If marketing changes the palette, change ONLY this file.
 */

export const brand = {
  // Primary blues — the document body
  cyan: '#3BA9FF',
  cyanDeep: '#1E6FE0',
  cyanDark: '#1E40AF',

  // Mid teal — the curve flowing under the document
  teal: '#22D3C7',
  tealDark: '#0E9488',

  // Accent lime/yellow — the AI pixel dissolve
  lime: '#A3E635',
  yellow: '#FACC15',

  // Surfaces
  bg: '#06060d',
  surface: 'rgba(18, 18, 28, 0.55)',
  surfaceSolid: 'rgba(18, 18, 28, 0.85)',

  // Text
  textPrimary: '#ffffff',
  textSecondary: 'rgba(232, 232, 240, 0.7)',
  textMuted: 'rgba(232, 232, 240, 0.4)',

  // Status
  danger: '#f87171',
  dangerDark: '#dc2626',
} as const;

/**
 * Pre-built gradient strings used across the app.
 * Reference these by name instead of repeating gradient definitions.
 */
export const gradients = {
  /** Primary brand gradient — used on submit buttons, active CTAs, avatar rings. */
  primary: `linear-gradient(135deg, ${brand.cyan} 0%, ${brand.teal} 50%, ${brand.lime} 100%)`,

  /** Soft brand gradient — used on hover states, tab indicators. */
  primarySoft: `linear-gradient(135deg, ${brand.cyan}66 0%, ${brand.teal}55 100%)`,

  /** Animated conic gradient — used on logo glow ring and dialog glow. */
  conic: `conic-gradient(from 220deg, ${brand.cyan}, ${brand.teal}, ${brand.lime}, ${brand.yellow}, ${brand.cyan})`,

  /** Title gradient — white to cyan to teal text fade. */
  title: `linear-gradient(135deg, #ffffff, ${brand.cyan} 60%, ${brand.teal})`,

  /** Background mesh blob 1 — top-left. */
  meshBlob1: `radial-gradient(circle, ${brand.cyan} 0%, transparent 70%)`,

  /** Background mesh blob 2 — bottom-right. */
  meshBlob2: `radial-gradient(circle, ${brand.teal} 0%, transparent 70%)`,

  /** Background mesh blob 3 — center. */
  meshBlob3: `radial-gradient(circle, ${brand.lime} 0%, transparent 70%)`,
} as const;

/**
 * Shadows for layered depth.
 */
export const shadows = {
  glow: `0 4px 14px ${brand.cyan}66, inset 0 1px 0 rgba(255,255,255,0.2)`,
  glowStrong: `0 12px 30px ${brand.cyan}88, inset 0 1px 0 rgba(255,255,255,0.2)`,
  dialog:
    '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.1)',
  card: '0 24px 70px rgba(0,0,0,0.6)',
  button: '0 4px 14px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.5)',
} as const;
