import { useGesture } from '@use-gesture/react';
import { useRef, useCallback } from 'react';
import { useViewportStore } from '@/store';

export function useDocumentGestures(targetRef: React.RefObject<HTMLElement | null>) {
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
        if (first) {
          memo = {
            offsetX: stateRef.current.offsetX,
            offsetY: stateRef.current.offsetY,
            originX: ox,
            originY: oy,
            scaleAtStart: stateRef.current.scale,
          };
        }
        const m = memo as { offsetX: number; offsetY: number; originX: number; originY: number; scaleAtStart: number };
        const scaleDelta = clamped / (m?.scaleAtStart ?? 1);
        const newOffsetX = (m?.offsetX ?? 0) - (m?.originX ?? 0) * (scaleDelta - 1);
        const newOffsetY = (m?.offsetY ?? 0) - (m?.originY ?? 0) * (scaleDelta - 1);
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
