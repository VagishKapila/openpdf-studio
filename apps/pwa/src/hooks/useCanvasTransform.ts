import { useEffect } from 'react';
import { useViewportStore } from '@/store';

/**
 * Watches the viewport scale and triggers a hi-res re-render when the user
 * has zoomed in far enough that the canvas would start looking blurry.
 *
 * visibleScale = scale / renderedScale
 * When visibleScale > 1.25 we bump renderedScale up to scale × 1.5 (capped at 3×).
 */
export function useCanvasTransform(triggerRerender: (renderScale: number) => void) {
  const scale = useViewportStore((s) => s.scale);
  const renderedScale = useViewportStore((s) => s.renderedScale);
  const setRenderedScale = useViewportStore((s) => s.setRenderedScale);

  useEffect(() => {
    const zoomRatio = scale / renderedScale;
    if (zoomRatio > 1.25) {
      const targetRenderScale = Math.min(scale * 1.5, 3);
      setRenderedScale(targetRenderScale);
      triggerRerender(targetRenderScale);
    }
  }, [scale, renderedScale, setRenderedScale, triggerRerender]);
}
