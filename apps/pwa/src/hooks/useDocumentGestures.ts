import { useGesture } from '@use-gesture/react';
import { useRef, useCallback } from 'react';
import { useViewportStore } from '@/store';

export function useDocumentGestures(
  targetRef: React.RefObject<HTMLElement | null>,
  _transformRef?: React.RefObject<HTMLElement | null>,
) {
  const setTransform = useViewportStore((s) => s.setTransform);
  const resetTransform = useViewportStore((s) => s.resetTransform);
  const minScale = useViewportStore((s) => s.minScale);
  const maxScale = useViewportStore((s) => s.maxScale);

  // Mirror store state into a ref so gesture callbacks read current values
  // without needing to re-subscribe on every render
  const stateRef = useRef({ scale: 1, offsetX: 0, offsetY: 0 });
  useViewportStore.subscribe((s) => {
    stateRef.current = { scale: s.scale, offsetX: s.offsetX, offsetY: s.offsetY };
  });

  const lastTap = useRef<number>(0);
  const handleDoubleTap = useCallback(
    (_e: PointerEvent) => {
      const now = performance.now();
      if (now - lastTap.current < 300) {
        resetTransform();
        lastTap.current = 0;
      } else {
        lastTap.current = now;
      }
    },
    [resetTransform],
  );

  useGesture(
    {
      onPinch: ({ origin: [ox, oy], offset: [scale], first, memo }) => {
        const clamped = Math.max(minScale, Math.min(maxScale, scale));
        const container = targetRef.current;

        if (first) {
          // Convert page-coordinate pinch origin → container-relative coordinates.
          // These are captured once at the start of the gesture so that moving
          // fingers don't shift the perceived zoom anchor.
          const rect = container?.getBoundingClientRect() ?? { left: 0, top: 0, width: 0, height: 0 };
          memo = {
            offsetX: stateRef.current.offsetX,
            offsetY: stateRef.current.offsetY,
            // Pinch point in container-local space
            pinchX: ox - rect.left,
            pinchY: oy - rect.top,
            containerW: rect.width,
            containerH: rect.height,
            scaleAtStart: stateRef.current.scale,
          };
        }

        const m = memo as {
          offsetX: number; offsetY: number;
          pinchX: number; pinchY: number;
          containerW: number; containerH: number;
          scaleAtStart: number;
        };

        // Zoom-around-a-point math (derivation in CONTRIBUTING.md):
        //   tx_new = tx_old * k  +  (pinchX − cW/2) * (1 − k)
        //   ty_new = ty_old * k  +  (pinchY − cH/2) * (1 − k)
        // where k = s_new / s_old, and the pivot (cW/2, cH/2) is the container centre.
        // This keeps the content directly under the fingers stationary during the pinch.
        const k = clamped / m.scaleAtStart;
        const newOffsetX = m.offsetX * k + (m.pinchX - m.containerW / 2) * (1 - k);
        const newOffsetY = m.offsetY * k + (m.pinchY - m.containerH / 2) * (1 - k);

        setTransform(clamped, newOffsetX, newOffsetY);
        return memo;
      },

      onDrag: ({ offset: [ox, oy], pinching, cancel }) => {
        if (pinching) {
          cancel?.();
          return;
        }
        // Only pan when zoomed in
        if (stateRef.current.scale > 1.05) {
          setTransform(stateRef.current.scale, ox, oy);
        }
      },

      onPointerDown: ({ event }) => {
        handleDoubleTap(event as PointerEvent);
      },
    },
    {
      target: targetRef as React.RefObject<EventTarget>,
      pinch: {
        scaleBounds: { min: minScale, max: maxScale },
        rubberband: 0.05,
        from: () => [stateRef.current.scale, 0] as [number, number],
      },
      drag: {
        from: () => [stateRef.current.offsetX, stateRef.current.offsetY] as [number, number],
        filterTaps: true,
      },
      eventOptions: { passive: false },
    },
  );
}
