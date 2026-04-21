import { useRef, useCallback, useEffect } from 'react';
import { useDocumentStore, useViewportStore } from '@/store';
import { useDocumentGestures } from '@/hooks/useDocumentGestures';
import { useCanvasTransform } from '@/hooks/useCanvasTransform';

export function CanvasArea() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gestureContainerRef = useRef<HTMLDivElement>(null);
  const renderingRef = useRef(false);

  const { document: doc, currentPage, loadState } = useDocumentStore();
  const { scale, offsetX, offsetY, renderedScale, resetTransform } = useViewportStore();

  // visibleScale = user-visible zoom / the scale the PDF was rendered at
  const visibleScale = scale / renderedScale;

  const renderPdfPage = useCallback(
    async (renderAtScale: number) => {
      const pdf = doc?.pdf;
      const canvas = canvasRef.current;
      if (!pdf || !canvas || renderingRef.current) return;
      renderingRef.current = true;
      try {
        const page = await pdf.getPage(currentPage);
        const dpr = window.devicePixelRatio || 1;
        const containerWidth = Math.min(window.innerWidth - 32, 900);
        const baseViewport = page.getViewport({ scale: 1 });
        const fitScale = (containerWidth / baseViewport.width) * dpr;
        const viewport = page.getViewport({ scale: fitScale * renderAtScale });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        // CSS size stays fixed — CSS transform handles visible zoom
        canvas.style.width = `${containerWidth}px`;
        canvas.style.height = `${(containerWidth * viewport.height) / viewport.width}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        await page.render({ canvasContext: ctx, viewport }).promise;
      } finally {
        renderingRef.current = false;
      }
    },
    [doc, currentPage],
  );

  // Initial render and page changes
  useEffect(() => {
    if (loadState === 'ready') void renderPdfPage(renderedScale);
  }, [loadState, currentPage, renderPdfPage, renderedScale]);

  // Attach gesture recogniser to the scroll container
  useDocumentGestures(gestureContainerRef);

  // Bump render resolution when user zooms in past 1.25× of current render
  useCanvasTransform(renderPdfPage);

  return (
    <div
      ref={gestureContainerRef}
      className="flex h-full w-full items-center justify-center overflow-hidden"
      style={{ touchAction: 'none', userSelect: 'none' }}
    >
      {/* Only this inner div gets the CSS transform — all chrome stays fixed */}
      <div
        style={{
          transform: `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${visibleScale})`,
          transformOrigin: 'center center',
          willChange: 'transform',
        }}
      >
        <canvas
          ref={canvasRef}
          className="block bg-white shadow-lg"
          style={{ touchAction: 'none' }}
          aria-label={doc ? `Page ${currentPage} of ${doc.totalPages}` : 'PDF canvas'}
        />
      </div>

      {/* 1:1 reset badge — only shown when scale > 1.05 */}
      {scale > 1.05 && (
        <button
          onClick={resetTransform}
          className="pointer-events-auto fixed right-4 z-20 rounded-full bg-black/60 px-3 py-2 text-xs text-white backdrop-blur"
          style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
          aria-label="Reset zoom"
        >
          1:1
        </button>
      )}

      {/* Empty state */}
      {loadState === 'idle' && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/30">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <p className="text-sm">Tap <strong className="text-white/50">Open</strong> to load a PDF</p>
        </div>
      )}

      {loadState === 'error' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-red-400 text-sm">
          Failed to load PDF
        </div>
      )}
    </div>
  );
}
