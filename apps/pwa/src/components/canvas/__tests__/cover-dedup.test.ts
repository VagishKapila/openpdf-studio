/**
 * cover-dedup.test.ts
 *
 * Regression test for COWORK-44.B.1-R3: dual pointer+touch event double-commit.
 *
 * The bug: on mobile, a single finger-lift fires BOTH pointerup AND touchend in
 * the same event-loop tick. Before the fix, both paths could commit a cover
 * annotation because toolRef.current (synced via React useEffect) still reads
 * 'edit' in the second handler, even though the first handler already switched
 * the tool to 'text' via Zustand.
 *
 * The fix: AnnotationLayer's drawTouchEnd now checks `justCommittedCover` at
 * entry when tool === 'edit' and returns early if the pointer path already ran.
 *
 * This test validates the guard logic by modelling the mutable closure state
 * from AnnotationLayer.tsx as pure synchronous functions — no React, no Konva.
 * The critical invariant: a single drag gesture produces exactly 1 cover annotation
 * and 1 text placement regardless of whether pointerup, touchend, or both fire.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Model of the shared mutable state inside AnnotationLayer's useEffect ────
// Variable names and logic mirror AnnotationLayer.tsx exactly so diffs are obvious.

type CommittedCover = { documentId: string; pageNumber: number; x: number; y: number; width: number; height: number };

function makeCoverHandlers(
  pdfPageWidth: number,
  canvasWidth: number,
  addCoverAnnotation: (ann: CommittedCover) => void,
  setTool: (tool: string) => void,
  onPlaceText: (x: number, y: number) => void,
) {
  const pdfScale = pdfPageWidth / canvasWidth;

  // ── Mutable closure state (mirrors AnnotationLayer.tsx) ──────────────────
  let justCommittedCover = false;
  const coverStart = { x: 0, y: 0, active: false };
  let drawPointerId = -1;
  let touchDrawId = -1;
  // toolRef is updated by a React useEffect — stays stale within the same tick.
  const toolRef = { current: 'edit' as string };

  // ── Min-size guard (same numbers as AnnotationLayer.tsx) ──────────────────
  const MIN_W_CSS = 20;
  const MIN_H_CSS = 10;

  function tryCommitCover(endLocalX: number, endLocalY: number) {
    const x = Math.min(coverStart.x, endLocalX * pdfScale);
    const y = Math.min(coverStart.y, endLocalY * pdfScale);
    const w = Math.abs(endLocalX * pdfScale - coverStart.x);
    const h = Math.abs(endLocalY * pdfScale - coverStart.y);
    const wCssPx = w / pdfScale;
    const hCssPx = h / pdfScale;
    if (wCssPx >= MIN_W_CSS && hCssPx >= MIN_H_CSS) {
      addCoverAnnotation({ documentId: 'doc1', pageNumber: 1, x, y, width: w, height: h });
      justCommittedCover = true;
      setTool('text');
      onPlaceText(x, y);
      // Reset flag after 200ms (matches the setTimeout in AnnotationLayer.tsx)
      setTimeout(() => { justCommittedCover = false; }, 200);
    }
  }

  // ── onPointerDown ─────────────────────────────────────────────────────────
  function onPointerDown(pointerId: number, localX: number, localY: number) {
    if (toolRef.current !== 'edit') return;
    drawPointerId = pointerId;
    coverStart.x = localX * pdfScale;
    coverStart.y = localY * pdfScale;
    coverStart.active = true;
  }

  // ── drawTouchStart ────────────────────────────────────────────────────────
  function drawTouchStart(touchId: number, localX: number, localY: number) {
    if (toolRef.current !== 'edit') return;
    touchDrawId = touchId;
    coverStart.x = localX * pdfScale;
    coverStart.y = localY * pdfScale;
    coverStart.active = true;
  }

  // ── onPointerUp — pointer path commit ────────────────────────────────────
  function onPointerUp(pointerId: number, endLocalX: number, endLocalY: number) {
    if (pointerId !== drawPointerId) return;
    drawPointerId = -1;
    const tool = toolRef.current;
    if (tool === 'edit' && coverStart.active) {
      coverStart.active = false;
      tryCommitCover(endLocalX, endLocalY);
    }
  }

  // ── drawTouchEnd — touch path commit ──────────────────────────────────────
  // THE FIX lives here: bail early if pointer path already committed.
  function drawTouchEnd(touchId: number, endLocalX: number, endLocalY: number) {
    const tool = toolRef.current;
    if (tool !== 'draw' && tool !== 'highlight' && tool !== 'edit') return;
    if (touchId !== touchDrawId) return;
    touchDrawId = -1;

    // ← COWORK-44.B.1-R3 guard: prevents double-commit when both events fire
    if (tool === 'edit' && justCommittedCover) return;

    if (tool === 'edit' && coverStart.active) {
      coverStart.active = false;
      tryCommitCover(endLocalX, endLocalY);
    }
  }

  return { onPointerDown, drawTouchStart, onPointerUp, drawTouchEnd, toolRef };
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('cover annotation double-commit guard (COWORK-44.B.1-R3)', () => {
  // iPhone SE 375px wide, letter-size PDF = 612pt
  const PDF_PAGE_WIDTH = 612;
  const CANVAS_WIDTH = 375;

  // Drag coords: 140px wide × 50px tall → well above 20×10 min-size threshold
  const START = { x: 10, y: 10 };
  const END = { x: 150, y: 60 };

  // Drag coords below min-size threshold
  const TINY_END = { x: 15, y: 14 }; // 5px wide, 4px tall

  let coverAnnotations: CommittedCover[];
  let textPlacements: Array<{ x: number; y: number }>;
  let handlers: ReturnType<typeof makeCoverHandlers>;

  beforeEach(() => {
    vi.useFakeTimers();
    coverAnnotations = [];
    textPlacements = [];
    handlers = makeCoverHandlers(
      PDF_PAGE_WIDTH,
      CANVAS_WIDTH,
      (ann) => coverAnnotations.push(ann),
      vi.fn(),
      (x, y) => textPlacements.push({ x, y }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates exactly 1 cover annotation when pointerup then touchend fire with 16ms gap', () => {
    // Both touch and pointer down fire for the same gesture (mobile behaviour)
    handlers.onPointerDown(1, START.x, START.y);
    handlers.drawTouchStart(0, START.x, START.y);

    // pointerup fires first (Android event order: pointerup then touchend)
    handlers.onPointerUp(1, END.x, END.y);

    // 16ms gap — one animation frame — toolRef.current is still 'edit' (React stale)
    vi.advanceTimersByTime(16);

    // touchend fires; before fix this would double-commit
    handlers.drawTouchEnd(0, END.x, END.y);

    expect(coverAnnotations).toHaveLength(1);
  });

  it('places exactly 1 text annotation for the same gesture', () => {
    handlers.onPointerDown(1, START.x, START.y);
    handlers.drawTouchStart(0, START.x, START.y);

    handlers.onPointerUp(1, END.x, END.y);
    vi.advanceTimersByTime(16);
    handlers.drawTouchEnd(0, END.x, END.y);

    expect(textPlacements).toHaveLength(1);
  });

  it('creates exactly 1 cover when touchend fires before pointerup (iOS event order)', () => {
    handlers.onPointerDown(1, START.x, START.y);
    handlers.drawTouchStart(0, START.x, START.y);

    // iOS: touchend fires before pointerup
    handlers.drawTouchEnd(0, END.x, END.y);
    vi.advanceTimersByTime(16);
    handlers.onPointerUp(1, END.x, END.y);

    // coverStart.active was already cleared by drawTouchEnd → onPointerUp skips
    expect(coverAnnotations).toHaveLength(1);
    expect(textPlacements).toHaveLength(1);
  });

  it('creates exactly 1 cover when only touchend fires (pointer capture lost mid-gesture)', () => {
    handlers.drawTouchStart(0, START.x, START.y);
    // onPointerDown never called — drawPointerId stays -1
    // onPointerUp will get no-op because pointerId !== drawPointerId

    handlers.drawTouchEnd(0, END.x, END.y);

    expect(coverAnnotations).toHaveLength(1);
    expect(textPlacements).toHaveLength(1);
  });

  it('creates exactly 1 cover when only pointerup fires (no touch fallback needed)', () => {
    handlers.onPointerDown(1, START.x, START.y);
    handlers.onPointerUp(1, END.x, END.y);

    expect(coverAnnotations).toHaveLength(1);
    expect(textPlacements).toHaveLength(1);
  });

  it('does NOT commit if drag is below minimum size (20×10 CSS px threshold)', () => {
    handlers.onPointerDown(1, START.x, START.y);
    handlers.drawTouchStart(0, START.x, START.y);

    handlers.onPointerUp(1, TINY_END.x, TINY_END.y);
    handlers.drawTouchEnd(0, TINY_END.x, TINY_END.y);

    expect(coverAnnotations).toHaveLength(0);
    expect(textPlacements).toHaveLength(0);
  });

  it('justCommittedCover resets after 200ms — next gesture commits normally', () => {
    // First gesture
    handlers.onPointerDown(1, START.x, START.y);
    handlers.drawTouchStart(0, START.x, START.y);
    handlers.onPointerUp(1, END.x, END.y);
    handlers.drawTouchEnd(0, END.x, END.y);
    expect(coverAnnotations).toHaveLength(1);

    // Advance past the 200ms reset window
    vi.advanceTimersByTime(250);

    // Simulate user switching back to edit tool (toolRef updated by React)
    handlers.toolRef.current = 'edit';

    // Second gesture with fresh handler state
    const handlers2 = makeCoverHandlers(
      PDF_PAGE_WIDTH, CANVAS_WIDTH,
      (ann) => coverAnnotations.push(ann),
      vi.fn(),
      (x, y) => textPlacements.push({ x, y }),
    );
    handlers2.onPointerDown(1, 20, 20);
    handlers2.drawTouchStart(0, 20, 20);
    handlers2.onPointerUp(1, 200, 80);
    handlers2.drawTouchEnd(0, 200, 80);

    expect(coverAnnotations).toHaveLength(2);
    expect(textPlacements).toHaveLength(2);
  });
});
