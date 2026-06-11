/**
 * twin-tap-placement-dedup.test.ts
 *
 * Regression test for COWORK-48 BUG-3 (FIX-3): blank annotation created at
 * PLACEMENT time by the touch/click twin.
 *
 * Root cause: one physical tap on a touch device fires BOTH:
 *   (1) the DOM onTouchEnd listener on the container, and
 *   (2) Konva's synthesized stage 'click' event, 2-4ms later.
 *
 * The COWORK-44.B.2-R2 guard (editingAnnotationIdRef) cannot stop the twin:
 * the ref is synced via useEffect, which runs AFTER the event cascade, so when
 * the synthesized click arrives the ref still reads null and a duplicate blank
 * annotation is placed.
 *
 * The fix: a synchronous closure flag `justPlacedText` (same pattern as
 * justCommittedCover from COWORK-45), set via markTextPlaced() at placement and
 * reset after 300ms. Both handlers check it before placing.
 *
 * Invariant: one physical tap = exactly 1 annotation, regardless of how many
 * event representations of that tap arrive within the flag window.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

type Annotation = { id: string; text: string };

function makeHandlers(onAddAnnotation: (ann: Annotation) => void) {
  const toolRef = { current: 'text' as string };
  const editingAnnotationIdRef = { current: null as string | null };

  let nextId = 1;

  // COWORK-48 FIX-3 closure flag — mirrors AnnotationLayer.tsx
  let justPlacedText = false;
  const markTextPlaced = () => {
    justPlacedText = true;
    setTimeout(() => { justPlacedText = false; }, 300);
  };

  function onPlaceText(_x: number, _y: number) {
    onAddAnnotation({ id: `ann-${nextId++}`, text: '' });
  }

  // Mirrors the fixed DOM onTouchEnd text branch
  function onTouchEnd(hitNode: boolean, x: number, y: number) {
    if (hitNode) return;
    if (toolRef.current !== 'text') return;
    if (editingAnnotationIdRef.current !== null) return;
    if (justPlacedText) return;
    markTextPlaced();
    onPlaceText(x, y);
  }

  // Mirrors the fixed Konva stage 'click' text branch
  function stageClick(isBackground: boolean, x: number, y: number) {
    if (!isBackground) return;
    if (toolRef.current !== 'text') return;
    if (editingAnnotationIdRef.current !== null) return;
    if (justPlacedText) return;
    markTextPlaced();
    onPlaceText(x, y);
  }

  return { toolRef, editingAnnotationIdRef, onTouchEnd, stageClick };
}

describe('twin-tap placement dedup (COWORK-48 FIX-3)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('touchend followed 3ms later by synthesized click places exactly 1 annotation', () => {
    const annotations: Annotation[] = [];
    const { onTouchEnd, stageClick } = makeHandlers((a) => annotations.push(a));

    // One physical tap: DOM touchend fires first...
    onTouchEnd(false, 100, 100);
    // ...Konva's synthesized click arrives 3ms later (observed 2-4ms on device)
    vi.advanceTimersByTime(3);
    stageClick(true, 100, 100);

    expect(annotations).toHaveLength(1);
  });

  it('reverse order (click first, touchend second) also places exactly 1', () => {
    const annotations: Annotation[] = [];
    const { onTouchEnd, stageClick } = makeHandlers((a) => annotations.push(a));

    stageClick(true, 100, 100);
    vi.advanceTimersByTime(4);
    onTouchEnd(false, 100, 100);

    expect(annotations).toHaveLength(1);
  });

  it('a second intentional tap AFTER the 300ms window places a second annotation', () => {
    const annotations: Annotation[] = [];
    const { onTouchEnd, stageClick } = makeHandlers((a) => annotations.push(a));

    onTouchEnd(false, 100, 100);
    vi.advanceTimersByTime(3);
    stageClick(true, 100, 100);   // twin — suppressed

    vi.advanceTimersByTime(400);  // window elapsed

    onTouchEnd(false, 200, 200);  // new physical tap
    vi.advanceTimersByTime(3);
    stageClick(true, 200, 200);   // its twin — suppressed

    expect(annotations).toHaveLength(2);
  });

  it('desktop single click (no touch twin) still places exactly 1 annotation', () => {
    const annotations: Annotation[] = [];
    const { stageClick } = makeHandlers((a) => annotations.push(a));

    stageClick(true, 50, 50);

    expect(annotations).toHaveLength(1);
  });

  it('editing guard still suppresses both handlers independently of the flag', () => {
    const annotations: Annotation[] = [];
    const h = makeHandlers((a) => annotations.push(a));
    h.editingAnnotationIdRef.current = 'ann-open';

    h.onTouchEnd(false, 100, 100);
    h.stageClick(true, 100, 100);

    expect(annotations).toHaveLength(0);
  });
});
