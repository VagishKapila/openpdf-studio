import { gradients } from '@/lib/brand';

/**
 * Animated gradient mesh background using FormIQ brand colors (cyan/teal/lime).
 * Three blurred blobs drifting on independent timers + grain overlay for texture.
 *
 * USE FOR: welcome screen, empty state, marketing landing.
 * DO NOT USE behind the active editor — the blur tanks PDF canvas perf.
 */
export function MeshBackground() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="animate-formiq-mesh-drift-1 absolute rounded-full opacity-50 blur-[110px]"
          style={{
            width: 600,
            height: 600,
            top: -180,
            left: -120,
            background: gradients.meshBlob1,
          }}
        />
        <div
          className="animate-formiq-mesh-drift-2 absolute rounded-full opacity-50 blur-[110px]"
          style={{
            width: 700,
            height: 700,
            bottom: -240,
            right: -180,
            background: gradients.meshBlob2,
          }}
        />
        <div
          className="animate-formiq-mesh-drift-3 absolute rounded-full opacity-30 blur-[110px]"
          style={{
            width: 500,
            height: 500,
            top: '35%',
            left: '40%',
            background: gradients.meshBlob3,
          }}
        />
      </div>
      <div
        className="pointer-events-none fixed inset-0 z-[1] opacity-50 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
        }}
      />
    </>
  );
}
