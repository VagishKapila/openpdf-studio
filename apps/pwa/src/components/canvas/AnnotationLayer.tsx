/**
 * AnnotationLayer — Konva canvas overlaid on the PDF canvas.
 *
 * Lives INSIDE the CSS-transformed div so zoom/pan apply to both canvases,
 * keeping annotations locked to PDF content.
 *
 * Coordinate conversion:
 *   pdfToKonva(coord) = coord * (canvasWidth / pdfPageWidth)
 *   konvaToPdf(coord) = coord * (pdfPageWidth / canvasWidth)
 */
import { useEffect, useRef } from 'react';
import Konva from 'konva';
import { getStroke } from 'perfect-freehand';
import { useAnnotationStore } from '@/store';
import type { Tool } from '@/store';
import { useToolStore } from '@/store';
import { createDrawAnnotation, createHighlightAnnotation, createCoverAnnotation } from '@/lib/annotations';

/** Convert perfect-freehand output polygon to an SVG path `d` string. */
function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return '';
  const d = stroke.reduce(
    (acc: (string | number)[], [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q'],
  );
  d.push('Z');
  return d.join(' ');
}

export type AnnotationLayerProps = {
  canvasWidth: number;
  canvasHeight: number;
  pdfPageWidth: number;
  activeTool: Tool;
  editingAnnotationId: string | null;
  onPlaceText: (pdfX: number, pdfY: number) => void;
  documentId: string;
  pageNumber: number;
};

export function AnnotationLayer({
  canvasWidth,
  canvasHeight,
  pdfPageWidth,
  activeTool,
  editingAnnotationId,
  onPlaceText,
  documentId,
  pageNumber,
}: AnnotationLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);

  // Refs to keep event handlers up-to-date without recreating the stage
  const toolRef = useRef(activeTool);
  const onPlaceTextRef = useRef(onPlaceText);
  const canvasWidthRef = useRef(canvasWidth);
  const pdfPageWidthRef = useRef(pdfPageWidth);

  useEffect(() => { toolRef.current = activeTool; }, [activeTool]);
  useEffect(() => { onPlaceTextRef.current = onPlaceText; }, [onPlaceText]);
  useEffect(() => { canvasWidthRef.current = canvasWidth; }, [canvasWidth]);
  useEffect(() => { pdfPageWidthRef.current = pdfPageWidth; }, [pdfPageWidth]);

  const annotations = useAnnotationStore((s) => s.annotations);
  const selectedId = useAnnotationStore((s) => s.selectedId);
  const setSelected = useAnnotationStore((s) => s.setSelected);
  const setEditingAnnotationId = useAnnotationStore((s) => s.setEditingAnnotationId);
  const addAnnotation = useAnnotationStore((s) => s.addAnnotation);
  const updateAnnotation = useAnnotationStore((s) => s.updateAnnotation);

  const drawColor = useToolStore((s) => s.drawColor);
  const drawStrokeWidth = useToolStore((s) => s.drawStrokeWidth);
  const highlightColor = useToolStore((s) => s.highlightColor);

  // Refs so event handlers always read current values without stage recreation
  const drawColorRef = useRef(drawColor);
  const drawStrokeWidthRef = useRef(drawStrokeWidth);
  const highlightColorRef = useRef(highlightColor);
  const addAnnotationRef = useRef(addAnnotation);
  const updateAnnotationRef = useRef(updateAnnotation);
  const documentIdRef = useRef(documentId);
  const pageNumberRef = useRef(pageNumber);

  // setTool ref for auto-switching to text after cover commit (COWORK-45)
  const setTool = useToolStore((s) => s.setTool);
  const setToolRef = useRef(setTool);

  useEffect(() => { drawColorRef.current = drawColor; }, [drawColor]);
  useEffect(() => { drawStrokeWidthRef.current = drawStrokeWidth; }, [drawStrokeWidth]);
  useEffect(() => { highlightColorRef.current = highlightColor; }, [highlightColor]);
  useEffect(() => { addAnnotationRef.current = addAnnotation; }, [addAnnotation]);
  useEffect(() => { updateAnnotationRef.current = updateAnnotation; }, [updateAnnotation]);
  useEffect(() => { documentIdRef.current = documentId; }, [documentId]);
  useEffect(() => { pageNumberRef.current = pageNumber; }, [pageNumber]);
  useEffect(() => { setToolRef.current = setTool; }, [setTool]);

  // Stable ref to setEditingAnnotationId for use inside once-created event handler
  const setEditingIdRef = useRef(setEditingAnnotationId);
  useEffect(() => { setEditingIdRef.current = setEditingAnnotationId; }, [setEditingAnnotationId]);

  // Live preview Konva layer (separate from the committed-annotations layer)
  const liveLayerRef = useRef<Konva.Layer | null>(null);

  // Image cache: avoids async re-fetch of signature imageData on every render.
  // Maps imageData URL → resolved HTMLImageElement.
  // COWORK-44 Bug 2: eliminates the flash when activeTool changes.
  const imgCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Highlight drag start point
  const highlightStartRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0, y: 0, active: false,
  });

  const pdfToKonva = (pdfCoord: number) =>
    pdfPageWidth > 0 ? pdfCoord * (canvasWidth / pdfPageWidth) : pdfCoord;

  // Create stage once on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const stage = new Konva.Stage({ container, width: canvasWidth, height: canvasHeight });
    const layer = new Konva.Layer();
    stage.add(layer);

    const liveLayer = new Konva.Layer();
    stage.add(liveLayer);
    liveLayerRef.current = liveLayer;

    // Desktop: Konva mouse-click on stage background → place text or deselect
    stage.on('click', (e) => {
      if (e.target !== stage) return;
      // Skip click that fires immediately after a cover commit (COWORK-45 — prevents double text placement)
      if (justCommittedCover) { justCommittedCover = false; return; }
      if (toolRef.current === 'text') {
        const pos = stage.getPointerPosition();
        if (!pos) return;
        const scale = pdfPageWidthRef.current / canvasWidthRef.current;
        onPlaceTextRef.current(pos.x * scale, pos.y * scale);
      } else {
        setSelected(null);
      }
    });

    // Mobile: @use-gesture/react (passive:false) can prevent Konva's synthetic tap
    // from firing. Bypass with direct DOM touch listeners on the container div.
    // passive:true keeps scroll performance intact for non-text tools.
    const touchOrigin = { x: 0, y: 0 };

    // Mutable state for in-progress draws (not React state — no re-render overhead)
    const livePoints: Array<[number, number, number]> = [];
    let isPointerDrawing = false;
    let drawPointerId = -1;

    // Cover-tool mutable state (COWORK-45)
    const coverStart = { x: 0, y: 0, active: false };
    // Suppresses the Konva stage 'click' that fires immediately after a cover pointerUp,
    // preventing a double text-annotation placement (cover auto-switches to text + places ann).
    let justCommittedCover = false;

    const onTouchStart = (evt: TouchEvent) => {
      const t = evt.touches[0];
      touchOrigin.x = t.clientX;
      touchOrigin.y = t.clientY;
    };

    const onTouchEnd = (evt: TouchEvent) => {
      const t = evt.changedTouches[0];
      // Ignore pans/swipes — only act on true taps (<10 px movement)
      if (Math.abs(t.clientX - touchOrigin.x) > 10 || Math.abs(t.clientY - touchOrigin.y) > 10) return;

      const rect = container.getBoundingClientRect();
      const localX = t.clientX - rect.left;
      const localY = t.clientY - rect.top;

      // Check whether a Konva shape is under the tap
      const hitNode = stageRef.current?.getIntersection({ x: localX, y: localY });

      if (!hitNode) {
        // Tapped background — place new text annotation
        if (toolRef.current === 'text') {
          const scale = pdfPageWidthRef.current / canvasWidthRef.current;
          onPlaceTextRef.current(localX * scale, localY * scale);
        }
      }
      // Shape taps are handled by each shape's own 'click tap' listener
    };

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });

    // ── Pointer handlers for draw + highlight capture ─────────────────────────
    const onPointerDown = (e: PointerEvent) => {
      const tool = toolRef.current;
      if (tool !== 'draw' && tool !== 'highlight' && tool !== 'edit') return;
      e.stopPropagation();
      container.setPointerCapture(e.pointerId);
      drawPointerId = e.pointerId;

      const rect = container.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      const scale = pdfPageWidthRef.current / canvasWidthRef.current;

      if (tool === 'draw') {
        livePoints.length = 0;
        livePoints.push([localX * scale, localY * scale, e.pressure || 0.5]);
        isPointerDrawing = true;
      } else if (tool === 'highlight') {
        highlightStartRef.current.x = localX * scale;
        highlightStartRef.current.y = localY * scale;
        highlightStartRef.current.active = true;
      } else {
        // 'edit' — start cover rectangle
        coverStart.x = localX * scale;
        coverStart.y = localY * scale;
        coverStart.active = true;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerId !== drawPointerId) return;
      const tool = toolRef.current;
      if (tool !== 'draw' && tool !== 'highlight' && tool !== 'edit') return;
      if (!isPointerDrawing && !highlightStartRef.current.active && !coverStart.active) return;

      const rect = container.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      const scale = pdfPageWidthRef.current / canvasWidthRef.current;
      const ll = liveLayerRef.current;
      if (!ll) return;

      if (tool === 'draw') {
        livePoints.push([localX * scale, localY * scale, e.pressure || 0.5]);

        ll.destroyChildren();
        if (livePoints.length > 1) {
          const kScale = canvasWidthRef.current / pdfPageWidthRef.current;
          const screenPts = livePoints.map(([x, y, p]) => [x * kScale, y * kScale, p]);
          const poly = getStroke(screenPts, {
            size: drawStrokeWidthRef.current * kScale * 2,
            thinning: 0.5,
            smoothing: 0.5,
            streamline: 0.5,
          });
          const livePath = new Konva.Path({
            data: getSvgPathFromStroke(poly),
            fill: drawColorRef.current,
            opacity: 0.85,
          });
          ll.add(livePath);
        }
        ll.batchDraw();
      } else if (tool === 'highlight') {
        // highlight live rect
        const x = Math.min(highlightStartRef.current.x, localX * scale);
        const y = Math.min(highlightStartRef.current.y, localY * scale);
        const w = Math.abs(localX * scale - highlightStartRef.current.x);
        const h = Math.abs(localY * scale - highlightStartRef.current.y);
        const kScale = canvasWidthRef.current / pdfPageWidthRef.current;

        ll.destroyChildren();
        const liveRect = new Konva.Rect({
          x: x * kScale, y: y * kScale,
          width: w * kScale, height: h * kScale,
          fill: highlightColorRef.current,
          opacity: 0.4,
        });
        ll.add(liveRect);
        ll.batchDraw();
      } else {
        // 'edit' — live white cover rect preview (COWORK-45)
        const x = Math.min(coverStart.x, localX * scale);
        const y = Math.min(coverStart.y, localY * scale);
        const w = Math.abs(localX * scale - coverStart.x);
        const h = Math.abs(localY * scale - coverStart.y);
        const kScale = canvasWidthRef.current / pdfPageWidthRef.current;

        ll.destroyChildren();
        const coverPreview = new Konva.Rect({
          x: x * kScale, y: y * kScale,
          width: w * kScale, height: h * kScale,
          fill: '#ffffff',
          opacity: 0.9,
          stroke: '#94a3b8',
          strokeWidth: 1.5,
          dash: [4, 3],
        });
        ll.add(coverPreview);
        ll.batchDraw();
      }
    };

    const onPointerUp = async (e: PointerEvent) => {
      if (e.pointerId !== drawPointerId) return;
      drawPointerId = -1;
      const tool = toolRef.current;

      // Clear live preview
      const ll = liveLayerRef.current;
      if (ll) { ll.destroyChildren(); ll.batchDraw(); }

      if (tool === 'draw' && isPointerDrawing) {
        isPointerDrawing = false;
        if (livePoints.length > 1) {
          const ann = createDrawAnnotation({
            documentId: documentIdRef.current,
            pageNumber: pageNumberRef.current,
            points: [...livePoints] as Array<[number, number, number]>,
            color: drawColorRef.current,
            strokeWidth: drawStrokeWidthRef.current,
          });
          await addAnnotationRef.current(ann);
        }
        livePoints.length = 0;
      } else if (tool === 'highlight' && highlightStartRef.current.active) {
        highlightStartRef.current.active = false;
        const rect = container.getBoundingClientRect();
        const localX = e.clientX - rect.left;
        const localY = e.clientY - rect.top;
        const scale = pdfPageWidthRef.current / canvasWidthRef.current;
        const x = Math.min(highlightStartRef.current.x, localX * scale);
        const y = Math.min(highlightStartRef.current.y, localY * scale);
        const w = Math.abs(localX * scale - highlightStartRef.current.x);
        const h = Math.abs(localY * scale - highlightStartRef.current.y);
        if (w > 5 && h > 5) {
          const ann = createHighlightAnnotation({
            documentId: documentIdRef.current,
            pageNumber: pageNumberRef.current,
            x, y, width: w, height: h,
            color: highlightColorRef.current,
          });
          await addAnnotationRef.current(ann);
        }
      } else if (tool === 'edit' && coverStart.active) {
        // COWORK-45: Cover annotation commit
        coverStart.active = false;
        const rect = container.getBoundingClientRect();
        const localX = e.clientX - rect.left;
        const localY = e.clientY - rect.top;
        const pdfScale = pdfPageWidthRef.current / canvasWidthRef.current;
        const x = Math.min(coverStart.x, localX * pdfScale);
        const y = Math.min(coverStart.y, localY * pdfScale);
        const w = Math.abs(localX * pdfScale - coverStart.x);
        const h = Math.abs(localY * pdfScale - coverStart.y);
        // Min-size enforcement: 20px CSS wide × 10px CSS tall
        // At pdfScale≈1.57 (612pt page / 390px): 20px→31pt, 10px→16pt
        const wCssPx = w / pdfScale;
        const hCssPx = h / pdfScale;
        if (wCssPx >= 20 && hCssPx >= 10) {
          const ann = createCoverAnnotation({
            documentId: documentIdRef.current,
            pageNumber: pageNumberRef.current,
            x, y, width: w, height: h,
          });
          await addAnnotationRef.current(ann);
          // Auto-switch to text tool + place text annotation at cover top-left (COWORK-45 §3)
          justCommittedCover = true;
          setToolRef.current('text');
          onPlaceTextRef.current(x, y);
          setTimeout(() => { justCommittedCover = false; }, 200);
        }
      }
    };

    const onPointerCancel = () => {
      drawPointerId = -1;
      isPointerDrawing = false;
      highlightStartRef.current.active = false;
      coverStart.active = false; // COWORK-45
      livePoints.length = 0;
      const ll = liveLayerRef.current;
      if (ll) { ll.destroyChildren(); ll.batchDraw(); }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      drawPointerId = -1;
      isPointerDrawing = false;
      highlightStartRef.current.active = false;
      coverStart.active = false; // COWORK-45
      livePoints.length = 0;
      const ll = liveLayerRef.current;
      if (ll) { ll.destroyChildren(); ll.batchDraw(); }
    };
    window.addEventListener('keydown', onKeyDown);

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointercancel', onPointerCancel);

    // ── Touch fallback for Android/mobile (pointer capture unreliable on some devices) ──
    let touchDrawId = -1;

    const drawTouchStart = (e: TouchEvent) => {
      const tool = toolRef.current;
      if (tool !== 'draw' && tool !== 'highlight' && tool !== 'edit') return;
      if (e.touches.length > 1) return;
      e.preventDefault();
      e.stopPropagation();
      const touch = e.changedTouches[0];
      touchDrawId = touch.identifier;

      const rect = container.getBoundingClientRect();
      const localX = touch.clientX - rect.left;
      const localY = touch.clientY - rect.top;
      const scale = pdfPageWidthRef.current / canvasWidthRef.current;

      if (tool === 'draw') {
        livePoints.length = 0;
        livePoints.push([localX * scale, localY * scale, (touch as Touch & { force?: number }).force || 0.5]);
        isPointerDrawing = true;
      } else if (tool === 'highlight') {
        highlightStartRef.current.x = localX * scale;
        highlightStartRef.current.y = localY * scale;
        highlightStartRef.current.active = true;
      } else {
        // 'edit' — cover start
        coverStart.x = localX * scale;
        coverStart.y = localY * scale;
        coverStart.active = true;
      }
    };

    const drawTouchMove = (e: TouchEvent) => {
      const tool = toolRef.current;
      if (tool !== 'draw' && tool !== 'highlight' && tool !== 'edit') return;
      const touch = Array.from(e.changedTouches).find((t) => t.identifier === touchDrawId);
      if (!touch) return;
      if (!isPointerDrawing && !highlightStartRef.current.active && !coverStart.active) return;
      e.preventDefault();

      const rect = container.getBoundingClientRect();
      const localX = touch.clientX - rect.left;
      const localY = touch.clientY - rect.top;
      const scale = pdfPageWidthRef.current / canvasWidthRef.current;
      const ll = liveLayerRef.current;
      if (!ll) return;

      if (tool === 'draw') {
        livePoints.push([localX * scale, localY * scale, (touch as Touch & { force?: number }).force || 0.5]);
        ll.destroyChildren();
        if (livePoints.length > 1) {
          const kScale = canvasWidthRef.current / pdfPageWidthRef.current;
          const screenPts = livePoints.map(([x, y, p]) => [x * kScale, y * kScale, p]);
          const poly = getStroke(screenPts, {
            size: drawStrokeWidthRef.current * kScale * 2,
            thinning: 0.5,
            smoothing: 0.5,
            streamline: 0.5,
          });
          ll.add(new Konva.Path({ data: getSvgPathFromStroke(poly), fill: drawColorRef.current, opacity: 0.85 }));
        }
        ll.batchDraw();
      } else if (tool === 'highlight') {
        const x = Math.min(highlightStartRef.current.x, localX * scale);
        const y = Math.min(highlightStartRef.current.y, localY * scale);
        const w = Math.abs(localX * scale - highlightStartRef.current.x);
        const h = Math.abs(localY * scale - highlightStartRef.current.y);
        const kScale = canvasWidthRef.current / pdfPageWidthRef.current;
        ll.destroyChildren();
        ll.add(new Konva.Rect({ x: x * kScale, y: y * kScale, width: w * kScale, height: h * kScale, fill: highlightColorRef.current, opacity: 0.4 }));
        ll.batchDraw();
      } else if (tool === 'edit') {
        // 'edit' — live cover rect preview (COWORK-45)
        const x = Math.min(coverStart.x, localX * scale);
        const y = Math.min(coverStart.y, localY * scale);
        const w = Math.abs(localX * scale - coverStart.x);
        const h = Math.abs(localY * scale - coverStart.y);
        const kScale = canvasWidthRef.current / pdfPageWidthRef.current;
        ll.destroyChildren();
        ll.add(new Konva.Rect({
          x: x * kScale, y: y * kScale, width: w * kScale, height: h * kScale,
          fill: '#ffffff', opacity: 0.9, stroke: '#94a3b8', strokeWidth: 1.5, dash: [4, 3],
        }));
        ll.batchDraw();
      }
    };

    const drawTouchEnd = async (e: TouchEvent) => {
      const tool = toolRef.current;
      if (tool !== 'draw' && tool !== 'highlight' && tool !== 'edit') return;
      const touch = Array.from(e.changedTouches).find((t) => t.identifier === touchDrawId);
      if (!touch) return;
      touchDrawId = -1;
      // COWORK-44.B.1-R3: Guard against double-commit when both pointerup and touchend
      // fire for the same finger-lift gesture on mobile (iOS/Android).
      //
      // Root cause: on mobile, a single finger-lift fires BOTH pointerup and touchend in
      // the same event-loop tick. toolRef.current is synced via a React useEffect, so it
      // still reads 'edit' when the second handler runs. The coverStart.active = false set
      // by the first handler normally prevents a double cover annotation, but if pointerup
      // fires first it also sets justCommittedCover = true before its 200ms reset. Checking
      // that flag here prevents the touch path from committing a second time in that window.
      if (tool === 'edit' && justCommittedCover) return;

      const ll = liveLayerRef.current;
      if (ll) { ll.destroyChildren(); ll.batchDraw(); }

      if (tool === 'draw' && isPointerDrawing) {
        isPointerDrawing = false;
        if (livePoints.length > 1) {
          const ann = createDrawAnnotation({
            documentId: documentIdRef.current,
            pageNumber: pageNumberRef.current,
            points: [...livePoints] as Array<[number, number, number]>,
            color: drawColorRef.current,
            strokeWidth: drawStrokeWidthRef.current,
          });
          await addAnnotationRef.current(ann);
        }
        livePoints.length = 0;
      } else if (tool === 'highlight' && highlightStartRef.current.active) {
        highlightStartRef.current.active = false;
        const rect = container.getBoundingClientRect();
        const localX = touch.clientX - rect.left;
        const localY = touch.clientY - rect.top;
        const scale = pdfPageWidthRef.current / canvasWidthRef.current;
        const x = Math.min(highlightStartRef.current.x, localX * scale);
        const y = Math.min(highlightStartRef.current.y, localY * scale);
        const w = Math.abs(localX * scale - highlightStartRef.current.x);
        const h = Math.abs(localY * scale - highlightStartRef.current.y);
        if (w > 5 && h > 5) {
          const ann = createHighlightAnnotation({
            documentId: documentIdRef.current,
            pageNumber: pageNumberRef.current,
            x, y, width: w, height: h,
            color: highlightColorRef.current,
          });
          await addAnnotationRef.current(ann);
        }
      } else if (tool === 'edit' && coverStart.active) {
        // COWORK-45: Cover annotation commit (touch path)
        coverStart.active = false;
        const rect = container.getBoundingClientRect();
        const localX = touch.clientX - rect.left;
        const localY = touch.clientY - rect.top;
        const pdfScale = pdfPageWidthRef.current / canvasWidthRef.current;
        const x = Math.min(coverStart.x, localX * pdfScale);
        const y = Math.min(coverStart.y, localY * pdfScale);
        const w = Math.abs(localX * pdfScale - coverStart.x);
        const h = Math.abs(localY * pdfScale - coverStart.y);
        // Min-size enforcement: 20px CSS wide × 10px CSS tall
        const wCssPx = w / pdfScale;
        const hCssPx = h / pdfScale;
        if (wCssPx >= 20 && hCssPx >= 10) {
          const ann = createCoverAnnotation({
            documentId: documentIdRef.current,
            pageNumber: pageNumberRef.current,
            x, y, width: w, height: h,
          });
          await addAnnotationRef.current(ann);
          // Auto-switch to text tool + place text at cover top-left (COWORK-45 §3)
          justCommittedCover = true;
          setToolRef.current('text');
          onPlaceTextRef.current(x, y);
          setTimeout(() => { justCommittedCover = false; }, 200);
        }
      }
    };

    container.addEventListener('touchstart', drawTouchStart, { passive: false });
    container.addEventListener('touchmove', drawTouchMove, { passive: false });
    container.addEventListener('touchend', drawTouchEnd);

    stageRef.current = stage;
    layerRef.current = layer;

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointercancel', onPointerCancel);
      container.removeEventListener('touchstart', drawTouchStart);
      container.removeEventListener('touchmove', drawTouchMove);
      container.removeEventListener('touchend', drawTouchEnd);
      liveLayerRef.current = null;
      stage.destroy();
      stageRef.current = null;
      layerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resize stage when canvas dimensions change
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.width(canvasWidth);
    stage.height(canvasHeight);
    stage.batchDraw();
  }, [canvasWidth, canvasHeight]);

  // Re-draw all annotation shapes when state changes
  useEffect(() => {
    // COWORK-44 Bug 2: cancellation flag prevents stale imgEl.onload callbacks
    // (from a previous activeTool dep change) from adding Konva.Image nodes to a
    // layer that has already been destroyed and rebuilt by a newer effect run.
    let cancelled = false;

    const layer = layerRef.current;
    if (!layer) return;

    layer.destroyChildren();

    const isSelectTool = activeTool === 'select';

    for (const ann of annotations) {
      // Skip the annotation currently being edited — TextEditor renders its content
      if (ann.id === editingAnnotationId) continue;

      const isSelected = ann.id === selectedId;
      const selColor = '#F59E0B';
      const selWidth = 2;

      // Capture for closures
      const capturedId = ann.id;
      const capturedType = ann.type;
      // All annotation types are draggable in select mode — draw uses dragend delta to offset points
      const isDraggable = isSelectTool;

      const konvaToPdf = (k: number) =>
        pdfPageWidth > 0 ? k * (pdfPageWidth / canvasWidth) : k;

      let shape: Konva.Shape | null = null;

      switch (ann.type) {
        case 'text': {
          shape = new Konva.Text({
            x: pdfToKonva(ann.x),
            y: pdfToKonva(ann.y),
            text: ann.text || '…',
            fontSize: Math.max(4, pdfToKonva(ann.fontSize)),
            fontFamily: ann.fontFamily,
            fill: ann.color,
            stroke: isSelected ? selColor : undefined,
            strokeWidth: isSelected ? 1 : 0,
            draggable: isDraggable,
          });
          if (isDraggable) {
            shape.on('dragend', () => {
              const pos = (shape as Konva.Text).position();
              updateAnnotationRef.current(capturedId, {
                x: konvaToPdf(pos.x),
                y: konvaToPdf(pos.y),
              });
            });
          }
          break;
        }
        case 'draw': {
          if (!ann.points.length) break;
          const screenPoints = ann.points.map(([x, y, p]) => [
            pdfToKonva(x),
            pdfToKonva(y),
            p,
          ]);
          const strokePoly = getStroke(screenPoints, {
            size: pdfToKonva(ann.strokeWidth) * 2,
            thinning: 0.5,
            smoothing: 0.5,
            streamline: 0.5,
          });
          const pathData = getSvgPathFromStroke(strokePoly);
          shape = new Konva.Path({
            data: pathData,
            fill: ann.color,
            stroke: isSelected ? selColor : undefined,
            strokeWidth: isSelected ? 1.5 : 0,
            hitStrokeWidth: 12,   // wider hit area for finger-tap on mobile
            draggable: isDraggable,
          });
          if (isDraggable) {
            shape.on('dragend', () => {
              // Konva applies x/y offset during drag. Convert offset to PDF space
              // and bake it into each point so the stroke redraws at its new position.
              const dxPdf = konvaToPdf((shape as Konva.Path).x());
              const dyPdf = konvaToPdf((shape as Konva.Path).y());
              updateAnnotationRef.current(capturedId, {
                points: (ann.points as Array<[number, number, number]>).map(
                  ([px, py, pr]) => [px + dxPdf, py + dyPdf, pr] as [number, number, number]
                ),
              });
            });
          }
          break;
        }
        case 'highlight': {
          shape = new Konva.Rect({
            x: pdfToKonva(ann.x),
            y: pdfToKonva(ann.y),
            width: pdfToKonva(ann.width),
            height: pdfToKonva(ann.height),
            fill: ann.color,
            opacity: ann.opacity ?? 0.35,
            stroke: isSelected ? selColor : undefined,
            strokeWidth: isSelected ? selWidth : 0,
            listening: !isDraggable,
            draggable: isDraggable,
          });
          if (isDraggable) {
            (shape as Konva.Rect).listening(true);
            shape.on('dragend', () => {
              const pos = (shape as Konva.Rect).position();
              updateAnnotationRef.current(capturedId, {
                x: konvaToPdf(pos.x),
                y: konvaToPdf(pos.y),
              });
            });
          }
          break;
        }
        case 'cover': {
          // COWORK-45 Tier 1: opaque white rectangle covering existing PDF text.
          // Underlying text is preserved in the exported PDF (visual edit only).
          shape = new Konva.Rect({
            x: pdfToKonva(ann.x),
            y: pdfToKonva(ann.y),
            width: pdfToKonva(ann.width),
            height: pdfToKonva(ann.height),
            fill: '#ffffff',
            opacity: 1,
            stroke: isSelected ? selColor : undefined,
            strokeWidth: isSelected ? selWidth : 0,
            listening: !isDraggable,
            draggable: isDraggable,
          });
          if (isDraggable) {
            (shape as Konva.Rect).listening(true);
            shape.on('dragend', () => {
              const pos = (shape as Konva.Rect).position();
              updateAnnotationRef.current(capturedId, {
                x: konvaToPdf(pos.x),
                y: konvaToPdf(pos.y),
              });
            });
          }
          break;
        }
        case 'signature': {
          if (ann.imageData) {
            const capturedSelected = isSelected;
            const capturedDraggable = isDraggable;

            const addKonvaImg = (imgEl: HTMLImageElement) => {
              if (cancelled) return; // stale render run — skip
              const konvaImg = new Konva.Image({
                x: pdfToKonva(ann.x),
                y: pdfToKonva(ann.y),
                width: pdfToKonva(ann.width),
                height: pdfToKonva(ann.height),
                image: imgEl,
                opacity: capturedSelected ? 0.7 : 1,
                stroke: capturedSelected ? selColor : undefined,
                strokeWidth: capturedSelected ? selWidth : 0,
                draggable: capturedDraggable,
              });
              konvaImg.on('click tap', (e) => {
                e.cancelBubble = true;
                setSelected(capturedId);
              });
              if (capturedDraggable) {
                // Fix B (iOS): stop touch propagation so Konva drag wins
                konvaImg.on('touchstart', (e) => {
                  e.cancelBubble = true;
                });
                konvaImg.on('dragend', () => {
                  const pos = konvaImg.position();
                  updateAnnotationRef.current(capturedId, {
                    x: konvaToPdf(pos.x),
                    y: konvaToPdf(pos.y),
                  });
                });
              }
              layer.add(konvaImg);
              layer.batchDraw();
            };

            // Check image cache — if already loaded, add synchronously (no flash on tool switch)
            const cached = imgCacheRef.current.get(ann.imageData);
            if (cached) {
              addKonvaImg(cached);
            } else {
              // Async path: load image, cache it, then add
              const imgEl = new window.Image();
              imgEl.onload = () => {
                if (cancelled) return; // guard against stale callbacks
                imgCacheRef.current.set(ann.imageData, imgEl);
                addKonvaImg(imgEl);
              };
              imgEl.src = ann.imageData;
            }
            // shape stays null — Konva.Image adds itself via addKonvaImg
          } else {
            // Fallback placeholder for legacy annotations without imageData
            shape = new Konva.Rect({
              x: pdfToKonva(ann.x),
              y: pdfToKonva(ann.y),
              width: pdfToKonva(ann.width),
              height: pdfToKonva(ann.height),
              fill: 'rgba(0,0,0,0.04)',
              stroke: isSelected ? selColor : '#888',
              strokeWidth: isSelected ? selWidth : 1,
              dash: isSelected ? undefined : [4, 3],
              draggable: isDraggable,
            });
            if (isDraggable) {
              shape.on('dragend', () => {
                const pos = (shape as Konva.Rect).position();
                updateAnnotationRef.current(capturedId, {
                  x: konvaToPdf(pos.x),
                  y: konvaToPdf(pos.y),
                });
              });
            }
          }
          break;
        }
      }

      if (shape) {
        shape.on('click tap', (e) => {
          e.cancelBubble = true;
          if (toolRef.current === 'text' && capturedType === 'text') {
            setEditingIdRef.current(capturedId);
          } else {
            setSelected(capturedId);
          }
        });
        // Fix B (iOS): stop touch propagation to the gesture hook so Konva
        // draggable can capture single-finger drag on iOS.
        if (isDraggable) {
          shape.on('touchstart', (e) => {
            e.cancelBubble = true;
          });
        }
        layer.add(shape);
      }
    }

    layer.batchDraw();

    return () => {
      // Cancel any pending imgEl.onload callbacks from this render run.
      // Without this, a tool switch that fires the effect again clears the layer
      // and rebuilds, but the old onload fires AFTER the rebuild and adds stale
      // Konva.Image nodes — causing visual glitches or duplicate shapes.
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annotations, selectedId, editingAnnotationId, pdfPageWidth, canvasWidth, activeTool]);

  return (
    <div
      ref={containerRef}
      data-testid="annotation-layer"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'auto' }}
    />
  );
}

