import { useRef, useCallback, useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { useDocumentStore, useViewportStore } from '@/store';
import { useDocumentGestures } from '@/hooks/useDocumentGestures';
import { useCanvasTransform } from '@/hooks/useCanvasTransform';
import { loadMostRecentDocument } from '@/lib/loadPdf';

const CLOSED_FLAG_KEY = 'openpdf_doc_explicitly_closed';

export function CanvasArea() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gestureContainerRef = useRef<HTMLDivElement>(null);
  const transformDivRef = useRef<HTMLDivElement>(null);
  const renderingRef = useRef(false);
  const prevDocIdRef = useRef<string | null>(null);

  const { document: doc, currentPage, loadState } = useDocumentStore();
  const { scale, offsetX, offsetY, renderedScale, resetTransform } = useViewportStore();

  // Track whether we're still checking Dexie for a document to restore
  const [isInitializing, setIsInitializing] = useState(true);

  // On first mount: check sessionStorage flag, then attempt to restore last doc
  useEffect(() => {
    const wasClosed = sessionStorage.getItem(CLOSED_FLAG_KEY) === 'true';
    if (wasClosed) {
      // User explicitly closed the doc in this session — show empty state immediately
      sessionStorage.removeItem(CLOSED_FLAG_KEY);
      setIsInitializing(false);
      return;
    }
    // Try to reload most recent document from Dexie
    loadMostRecentDocument().finally(() => setIsInitializing(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Once a document loads during init, stop showing the spinner
  useEffect(() => {
    if (loadState === 'ready') setIsInitializing(false);
  }, [loadState]);

  const renderPdfPage = useCallback(
    async (renderAtScale: number) => {
      const pdf = doc?.pdf;
      const canvas = canvasRef.current;
      const container = gestureContainerRef.current;
      if (!pdf || !canvas || !container || renderingRef.current) return;
      renderingRef.current = true;
      try {
        const page = await pdf.getPage(currentPage);
        const dpr = window.devicePixelRatio || 1;
        const containerWidth = container.clientWidth || Math.min(window.innerWidth, 900);
        const baseViewport = page.getViewport({ scale: 1 });
        const fitScale = (containerWidth / baseViewport.width) * dpr;
        const viewport = page.getViewport({ scale: fitScale * renderAtScale });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
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

  // Reset zoom when a new document is opened
  useEffect(() => {
    if (doc?.id && doc.id !== prevDocIdRef.current) {
      prevDocIdRef.current = doc.id;
      resetTransform();
    }
  }, [doc?.id, resetTransform]);

  // Re-render on container resize
  useEffect(() => {
    const container = gestureContainerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      if (loadState === 'ready') void renderPdfPage(renderedScale);
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [loadState, renderedScale, renderPdfPage]);

  // Initial render + page changes — defer one rAF so layout settles
  useEffect(() => {
    if (loadState === 'ready') {
      const raf = requestAnimationFrame(() => void renderPdfPage(renderedScale));
      return () => cancelAnimationFrame(raf);
    }
  }, [loadState, currentPage, renderPdfPage, renderedScale]);

  // Attach gesture recogniser (handles null ref internally)
  useDocumentGestures(gestureContainerRef, transformDivRef);

  // Bump render resolution on zoom
  useCanvasTransform(renderPdfPage);

  // ── Render states ────────────────────────────────────────────────────────────

  if (isInitializing) {
    return (
      <div
        className="flex flex-1 w-full items-center justify-center"
        data-testid="canvas-area"
      >
        <div className="flex flex-col items-center gap-3 opacity-50">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          <p className="text-xs text-white/60">Loading…</p>
        </div>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div
        className="flex flex-1 w-full items-center justify-center"
        data-testid="canvas-area"
      >
        <p className="text-sm text-red-400">Failed to load PDF. Try opening it again.</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div
        className="flex flex-1 w-full items-center justify-center p-8 text-center"
        data-testid="canvas-area"
      >
        <div className="max-w-xs">
          <FileText className="mx-auto h-16 w-16 text-white/20" />
          <h3 className="mt-4 text-base font-medium text-white/80">
            No document open
          </h3>
          <p className="mt-2 text-xs text-white/50">
            Click <span className="text-amber-400 font-medium">Open</span> in the header
            to load a PDF, or drag one onto this area.
          </p>
        </div>
      </div>
    );
  }

  // ── Canvas (document loaded) ─────────────────────────────────────────────────

  return (
    <div
      ref={gestureContainerRef}
      className="flex flex-1 w-full items-start justify-center overflow-y-auto overflow-x-hidden"
      data-testid="canvas-area"
      style={{ touchAction: 'none', userSelect: 'none' }}
    >
      <div
        ref={transformDivRef}
        style={{
          transform: `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${scale})`,
          transformOrigin: 'center center',
          willChange: 'transform',
        }}
      >
        <canvas
          ref={canvasRef}
          className="block bg-white shadow-lg"
          style={{ touchAction: 'none' }}
          aria-label={`Page ${currentPage} of ${doc.totalPages}`}
        />
      </div>

      {/* 1:1 reset badge — only shown when zoomed in */}
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
    </div>
  );
}
