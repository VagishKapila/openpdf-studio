import { useRef, useCallback, useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { useDocumentStore, useViewportStore, useAnnotationStore, useToolStore } from '@/store';
import { useDocumentGestures } from '@/hooks/useDocumentGestures';
import { useCanvasTransform } from '@/hooks/useCanvasTransform';
import { loadMostRecentDocument } from '@/lib/loadPdf';
import { createTextAnnotation, createSignatureAnnotation } from '@/lib/annotations';
import type { TextAnnotation } from '@/lib/annotations';
import { AnnotationLayer } from './AnnotationLayer';
import { TextEditor } from './TextEditor';

const CLOSED_FLAG_KEY = 'openpdf_doc_explicitly_closed';

// Tracks the CSS dimensions of the rendered PDF canvas + the PDF page width at scale=1
type CanvasMeta = { cssW: number; cssH: number; pdfPageWidth: number };

export function CanvasArea() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gestureContainerRef = useRef<HTMLDivElement>(null);
  const transformDivRef = useRef<HTMLDivElement>(null);
  const renderingRef = useRef(false);
  const prevDocIdRef = useRef<string | null>(null);

  const { document: doc, currentPage, loadState } = useDocumentStore();
  const { scale, offsetX, offsetY, renderedScale, resetTransform } = useViewportStore();
  const {
    annotations,
    editingAnnotationId,
    loadForPage,
    clearAll: clearAllAnnotations,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    setEditingAnnotationId,
  } = useAnnotationStore();
  const { activeTool, textFontSize, textColor, pendingSignature, setPendingSignature } = useToolStore();

  const [isInitializing, setIsInitializing] = useState(true);
  const [canvasMeta, setCanvasMeta] = useState<CanvasMeta | null>(null);
  // Position of the ghost signature overlay in transformDiv-local CSS pixels
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);

  // ── Init: restore last doc (unless explicitly closed) ─────────────────────
  useEffect(() => {
    const wasClosed = sessionStorage.getItem(CLOSED_FLAG_KEY) === 'true';
    if (wasClosed) {
      sessionStorage.removeItem(CLOSED_FLAG_KEY);
      setIsInitializing(false);
      return;
    }
    loadMostRecentDocument().finally(() => setIsInitializing(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (loadState === 'ready') setIsInitializing(false);
  }, [loadState]);

  // ── Load annotations whenever document or page changes ────────────────────
  useEffect(() => {
    if (!doc) {
      clearAllAnnotations();
      return;
    }
    void loadForPage(doc.id, currentPage);
  }, [doc?.id, currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── PDF rendering ──────────────────────────────────────────────────────────
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
        const cssH = (containerWidth * viewport.height) / viewport.width;
        canvas.style.height = `${cssH}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        await page.render({ canvasContext: ctx, viewport }).promise;

        setCanvasMeta({ cssW: containerWidth, cssH, pdfPageWidth: baseViewport.width });
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
      setCanvasMeta(null);
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

  // Initial render + page changes
  useEffect(() => {
    if (loadState === 'ready') {
      const raf = requestAnimationFrame(() => void renderPdfPage(renderedScale));
      return () => cancelAnimationFrame(raf);
    }
  }, [loadState, currentPage, renderPdfPage, renderedScale, isInitializing]); // isInitializing: re-fire when canvas mounts after init

  useDocumentGestures(gestureContainerRef, transformDivRef);
  useCanvasTransform(renderPdfPage);

  // ── Placement mode: track pointer + commit pending signature ──────────────
  useEffect(() => {
    const container = gestureContainerRef.current;
    const transformDiv = transformDivRef.current;
    if (!container || !transformDiv || !pendingSignature) {
      setGhostPos(null);
      return;
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return; // touch handled separately
      const tRect = transformDiv.getBoundingClientRect();
      setGhostPos({
        x: (e.clientX - tRect.left) / scale,
        y: (e.clientY - tRect.top) / scale,
      });
    };

    const onCommit = async (e: PointerEvent) => {
      if (!pendingSignature || !canvasMeta || !doc) return;
      const tRect = transformDiv.getBoundingClientRect();
      const localX = (e.clientX - tRect.left) / scale;
      const localY = (e.clientY - tRect.top) / scale;
      const pdfScale = canvasMeta.pdfPageWidth / canvasMeta.cssW;

      const maxPdfW = 200;
      const aspectRatio = pendingSignature.naturalWidth / Math.max(pendingSignature.naturalHeight, 1);
      const pdfW = Math.min(pendingSignature.naturalWidth * pdfScale, maxPdfW);
      const pdfH = pdfW / aspectRatio;

      const ann = createSignatureAnnotation({
        documentId: doc.id,
        pageNumber: currentPage,
        x: Math.max(0, localX * pdfScale - pdfW / 2),
        y: Math.max(0, localY * pdfScale - pdfH / 2),
        width: pdfW,
        height: pdfH,
        source: pendingSignature.source,
        imageData: pendingSignature.imageData,
        text: pendingSignature.text,
        fontFamily: pendingSignature.fontFamily,
      });
      await addAnnotation(ann);
      setPendingSignature(null);
      setGhostPos(null);
    };

    // Touch: track touchmove, commit on touchend
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      const tRect = transformDiv.getBoundingClientRect();
      setGhostPos({
        x: (touch.clientX - tRect.left) / scale,
        y: (touch.clientY - tRect.top) / scale,
      });
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!pendingSignature || !canvasMeta || !doc) return;
      const touch = e.changedTouches[0];
      if (!touch) return;
      const tRect = transformDiv.getBoundingClientRect();
      const localX = (touch.clientX - tRect.left) / scale;
      const localY = (touch.clientY - tRect.top) / scale;
      const pdfScale = canvasMeta.pdfPageWidth / canvasMeta.cssW;
      const maxPdfW = 200;
      const aspectRatio = pendingSignature.naturalWidth / Math.max(pendingSignature.naturalHeight, 1);
      const pdfW = Math.min(pendingSignature.naturalWidth * pdfScale, maxPdfW);
      const pdfH = pdfW / aspectRatio;

      const ann = createSignatureAnnotation({
        documentId: doc.id,
        pageNumber: currentPage,
        x: Math.max(0, localX * pdfScale - pdfW / 2),
        y: Math.max(0, localY * pdfScale - pdfH / 2),
        width: pdfW,
        height: pdfH,
        source: pendingSignature.source,
        imageData: pendingSignature.imageData,
        text: pendingSignature.text,
        fontFamily: pendingSignature.fontFamily,
      });
      void addAnnotation(ann);
      setPendingSignature(null);
      setGhostPos(null);
    };

    container.addEventListener('pointermove', onMove);
    container.addEventListener('pointerdown', onCommit);
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('pointermove', onMove);
      container.removeEventListener('pointerdown', onCommit);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, [pendingSignature, scale, canvasMeta, doc, currentPage, addAnnotation, setPendingSignature]);

  // ── Debug mode: enabled via ?debug=1 URL param ───────────────────────────
  const [debugMode, setDebugMode] = useState(false);
  useEffect(() => {
    setDebugMode(new URLSearchParams(window.location.search).get('debug') === '1');
  }, []);

  const seedTestAnnotation = async () => {
    if (!doc) return;
    const ann = createTextAnnotation({
      documentId: doc.id,
      pageNumber: currentPage,
      x: 100,
      y: 150,
      text: 'Test annotation — Day 4 foundation',
    });
    await addAnnotation(ann);
  };

  // ── Text tool: place a new text annotation at click position ──────────────
  const onPlaceText = useCallback(
    async (pdfX: number, pdfY: number) => {
      if (!doc) return;
      const ann = createTextAnnotation({
        documentId: doc.id,
        pageNumber: currentPage,
        x: pdfX,
        y: pdfY,
        text: '',
      });
      // Apply current text tool settings
      ann.fontSize = textFontSize;
      ann.color = textColor;
      await addAnnotation(ann);
      setEditingAnnotationId(ann.id);
    },
    [doc, currentPage, textFontSize, textColor, addAnnotation, setEditingAnnotationId],
  );

  // ── Live-update editing annotation when font/color settings change ─────────
  const editingAnnotationIdRef = useRef(editingAnnotationId);
  useEffect(() => { editingAnnotationIdRef.current = editingAnnotationId; }, [editingAnnotationId]);

  useEffect(() => {
    const id = editingAnnotationIdRef.current;
    if (!id) return;
    void updateAnnotation(id, { fontSize: textFontSize, color: textColor });
  }, [textFontSize, textColor]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── TextEditor commit handler ──────────────────────────────────────────────
  const onCommitText = useCallback(
    async (text: string) => {
      if (!editingAnnotationId) return;
      if (text.trim() === '') {
        await removeAnnotation(editingAnnotationId);
      } else {
        await updateAnnotation(editingAnnotationId, { text, updatedAt: Date.now() });
      }
      setEditingAnnotationId(null);
    },
    [editingAnnotationId, updateAnnotation, removeAnnotation, setEditingAnnotationId],
  );

  // Find the annotation currently being edited (must be a text annotation)
  const editingAnnotation =
    editingAnnotationId != null
      ? (annotations.find(
          (a) => a.id === editingAnnotationId && a.type === 'text',
        ) as TextAnnotation | undefined)
      : undefined;

  // Scale factor PDF-space → CSS-pixel space (for TextEditor positioning)
  const pdfToCss = canvasMeta ? canvasMeta.cssW / canvasMeta.pdfPageWidth : 1;

  // ── Render states ──────────────────────────────────────────────────────────
  if (isInitializing) {
    return (
      <div className="flex flex-1 w-full items-center justify-center" data-testid="canvas-area">
        <div className="flex flex-col items-center gap-3 opacity-50">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          <p className="text-xs text-white/60">Loading…</p>
        </div>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div className="flex flex-1 w-full items-center justify-center" data-testid="canvas-area">
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
          <h3 className="mt-4 text-base font-medium text-white/80">No document open</h3>
          <p className="mt-2 text-xs text-white/50">
            Click <span className="text-amber-400 font-medium">Open</span> in the header
            to load a PDF, or drag one onto this area.
          </p>
        </div>
      </div>
    );
  }

  // ── Canvas (document loaded) ───────────────────────────────────────────────
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
          position: 'relative',
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

        {/* Annotation overlay — absolutely positioned, same CSS size as canvas */}
        {canvasMeta && (
          <AnnotationLayer
            canvasWidth={canvasMeta.cssW}
            canvasHeight={canvasMeta.cssH}
            pdfPageWidth={canvasMeta.pdfPageWidth}
            activeTool={activeTool}
            editingAnnotationId={editingAnnotationId}
            onPlaceText={onPlaceText}
            documentId={doc.id}
            pageNumber={currentPage}
          />
        )}

        {/* Inline text editor — lives inside transformDiv so it tracks zoom/pan */}
        {editingAnnotation && canvasMeta && (
          <TextEditor
            ann={editingAnnotation}
            pdfToCss={pdfToCss}
            onCommit={onCommitText}
          />
        )}

        {/* Signature placement ghost */}
        {pendingSignature && ghostPos && (
          <div
            data-testid="sig-placement-ghost"
            style={{
              position: 'absolute',
              left: ghostPos.x,
              top: ghostPos.y,
              transform: 'translate(-50%, -50%)',
              opacity: 0.7,
              pointerEvents: 'none',
              border: '2px dashed #F59E0B',
              borderRadius: 4,
              padding: 4,
              background: 'rgba(255,255,255,0.85)',
              maxWidth: 220,
            }}
          >
            {pendingSignature.imageData && (
              <img
                src={pendingSignature.imageData}
                style={{
                  width: Math.min(pendingSignature.naturalWidth, 200),
                  height: Math.min(pendingSignature.naturalWidth, 200) /
                    Math.max(pendingSignature.naturalWidth / Math.max(pendingSignature.naturalHeight, 1), 0.01),
                  display: 'block',
                }}
                alt="Signature ghost"
              />
            )}
          </div>
        )}
      </div>

      {/* 1:1 reset badge */}
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

      {/* Cancel placement mode button */}
      {pendingSignature && (
        <button
          onClick={() => { setPendingSignature(null); setGhostPos(null); }}
          className="pointer-events-auto fixed right-4 z-20 rounded-full bg-black/60 px-3 py-2 text-xs text-white/80 backdrop-blur hover:bg-red-900/60"
          style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom) + 3rem)' }}
          aria-label="Cancel signature placement"
          data-testid="sig-placement-cancel"
        >
          ✕ Cancel placement
        </button>
      )}

      {/* Debug mode: seed a test annotation — enabled via ?debug=1 */}
      {debugMode && doc && (
        <button
          onClick={() => void seedTestAnnotation()}
          className="pointer-events-auto fixed bottom-32 right-4 z-30 rounded bg-green-700/80 px-3 py-1.5 text-xs text-white shadow"
          title="Debug: seed test annotation at (100, 150)"
        >
          + Test ann
        </button>
      )}
    </div>
  );
}
