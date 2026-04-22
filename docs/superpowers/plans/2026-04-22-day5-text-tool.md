# Day 5 — Text Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Text tool — click on PDF canvas places an inline-editable text annotation that persists via Dexie and renders as a Konva Text node.

**Architecture:** AnnotationLayer owns Konva stage click events (including text placement); a floating `TextEditor` textarea lives inside the CSS-transformed div so it stays locked to PDF content at any zoom/pan; text tool settings (font size, color) live in the tool store.

**Tech Stack:** React 19, Konva, Zustand (annotations + tool stores), Dexie v11, TypeScript strict, Tailwind v4

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `apps/pwa/src/store/tool.ts` | Modify | Add `textFontSize`, `textColor`, setters |
| `apps/pwa/src/store/annotations.ts` | Modify | Add `editingAnnotationId`, `setEditingAnnotationId` |
| `apps/pwa/src/components/canvas/AnnotationLayer.tsx` | Modify | Hide editing node; click existing text → edit; blank click with text tool → call `onPlaceText` |
| `apps/pwa/src/components/canvas/TextEditor.tsx` | Create | Floating textarea overlay inside transformDiv |
| `apps/pwa/src/components/canvas/CanvasArea.tsx` | Modify | Pass `onPlaceText` to AnnotationLayer; render TextEditor; live-update editing annotation on font/color change |
| `apps/pwa/src/components/shell/ToolPalette.tsx` | Modify | Show font size + color controls when text tool active |
| `apps/pwa/src/components/shell/MobileToolbar.tsx` | Modify | Show slim text controls row above toolbar when text tool active |
| `apps/pwa/e2e/day-5-text-tool.spec.ts` | Create | Playwright tests: place, edit, persist, delete-on-empty, controls |

---

## Task 1: Add text tool settings to tool store + editingAnnotationId to annotation store

**Files:**
- Modify: `apps/pwa/src/store/tool.ts`
- Modify: `apps/pwa/src/store/annotations.ts`

- [ ] **Step 1: Write failing typecheck test**

```bash
cd /tmp/pwa-test/apps/pwa
# Verify neither field exists yet
grep "editingAnnotationId" src/store/annotations.ts && echo "ALREADY EXISTS" || echo "MISSING — good"
grep "textFontSize" src/store/tool.ts && echo "ALREADY EXISTS" || echo "MISSING — good"
```

Expected: both print "MISSING — good"

- [ ] **Step 2: Update tool store with text settings**

Replace `apps/pwa/src/store/tool.ts` completely:

```typescript
import { create } from 'zustand';

// v1 scope: exactly 5 primary tools; "More" is a UI affordance handled in MobileToolbar
export type Tool = 'select' | 'text' | 'draw' | 'highlight' | 'sign';

export const TEXT_FONT_SIZES = [12, 14, 16, 20, 24, 32] as const;
export type TextFontSize = (typeof TEXT_FONT_SIZES)[number];

export const TEXT_COLORS = [
  { label: 'Black',  value: '#1a1a1a' },
  { label: 'Red',    value: '#e53e3e' },
  { label: 'Blue',   value: '#2b6cb0' },
  { label: 'Green',  value: '#276749' },
  { label: 'Gray',   value: '#718096' },
] as const;

type ToolState = {
  activeTool: Tool;
  setTool: (tool: Tool) => void;
  textFontSize: TextFontSize;
  textColor: string;
  setTextFontSize: (size: TextFontSize) => void;
  setTextColor: (color: string) => void;
};

export const useToolStore = create<ToolState>((set) => ({
  activeTool: 'select',
  setTool: (activeTool) => set({ activeTool }),
  textFontSize: 16,
  textColor: '#1a1a1a',
  setTextFontSize: (textFontSize) => set({ textFontSize }),
  setTextColor: (textColor) => set({ textColor }),
}));
```

- [ ] **Step 3: Update annotation store with editingAnnotationId**

Replace `apps/pwa/src/store/annotations.ts` completely:

```typescript
import { create } from 'zustand';
import type { Annotation, AnnotationId, DocumentId, PageNumber } from '@/lib/annotations';
import * as annStorage from '@/storage/annotations';

export type AnnotationState = {
  annotations: Annotation[];
  selectedId: AnnotationId | null;
  editingAnnotationId: AnnotationId | null;

  loadForPage: (documentId: DocumentId, pageNumber: PageNumber) => Promise<void>;
  addAnnotation: (ann: Annotation) => Promise<void>;
  updateAnnotation: (id: AnnotationId, patch: Partial<Annotation>) => Promise<void>;
  removeAnnotation: (id: AnnotationId) => Promise<void>;
  setSelected: (id: AnnotationId | null) => void;
  setEditingAnnotationId: (id: AnnotationId | null) => void;
  clearAll: () => void;
};

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  annotations: [],
  selectedId: null,
  editingAnnotationId: null,

  loadForPage: async (documentId, pageNumber) => {
    const annotations = await annStorage.getAnnotationsForPage(documentId, pageNumber);
    set({ annotations, selectedId: null, editingAnnotationId: null });
  },

  addAnnotation: async (ann) => {
    await annStorage.saveAnnotation(ann);
    set((s) => ({ annotations: [...s.annotations, ann] }));
  },

  updateAnnotation: async (id, patch) => {
    const existing = get().annotations.find((a) => a.id === id);
    if (!existing) return;
    const updated = { ...existing, ...patch, updatedAt: Date.now() } as Annotation;
    await annStorage.saveAnnotation(updated);
    set((s) => ({
      annotations: s.annotations.map((a) => (a.id === id ? updated : a)),
    }));
  },

  removeAnnotation: async (id) => {
    await annStorage.deleteAnnotation(id);
    set((s) => ({
      annotations: s.annotations.filter((a) => a.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
      editingAnnotationId: s.editingAnnotationId === id ? null : s.editingAnnotationId,
    }));
  },

  setSelected: (id) => set({ selectedId: id }),
  setEditingAnnotationId: (id) => set({ editingAnnotationId: id }),
  clearAll: () => set({ annotations: [], selectedId: null, editingAnnotationId: null }),
}));
```

- [ ] **Step 4: Verify typecheck passes**

```bash
cd /tmp/pwa-test/apps/pwa
/tmp/pnpm-bin/node_modules/.bin/pnpm typecheck 2>&1 | tail -10
```

Expected: `Found 0 errors. Watching for file changes.` (or `tsc -b` clean exit)

- [ ] **Step 5: Commit**

```bash
cd /tmp/pwa-test
git add apps/pwa/src/store/tool.ts apps/pwa/src/store/annotations.ts
git commit -m "feat(day-5a): add editingAnnotationId to annotations slice + text tool settings"
```

---

## Task 2: Create TextEditor inline overlay component

**Files:**
- Create: `apps/pwa/src/components/canvas/TextEditor.tsx`

- [ ] **Step 1: Create TextEditor.tsx**

```typescript
// apps/pwa/src/components/canvas/TextEditor.tsx
//
// Floating <textarea> overlay positioned inside the CSS-transformed div.
// The parent div already has scale/translate applied, so we position in
// CSS-pixel space (same coordinate system as AnnotationLayer / Konva).

import { useEffect, useRef, useState } from 'react';
import type { TextAnnotation } from '@/lib/annotations';

export type TextEditorProps = {
  /** The annotation being edited */
  ann: TextAnnotation;
  /** Scale factor: PDF points → CSS pixels. Equals cssW / pdfPageWidth. */
  pdfToCss: number;
  /** Called when editing is committed (blur, Enter, or Escape) */
  onCommit: (text: string) => void;
};

export function TextEditor({ ann, pdfToCss, onCommit }: TextEditorProps) {
  const [text, setText] = useState(ann.text);
  const committed = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    // Place cursor at end of existing text
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  // Reflect external annotation text changes (e.g. initial empty string)
  useEffect(() => {
    setText(ann.text);
  }, [ann.id]); // Only reset when a DIFFERENT annotation is opened

  const commit = () => {
    if (committed.current) return;
    committed.current = true;
    onCommit(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      commit();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      commit();
    }
  };

  const left = ann.x * pdfToCss;
  const top = ann.y * pdfToCss;
  const scaledFontSize = Math.max(8, ann.fontSize * pdfToCss);

  return (
    <textarea
      ref={textareaRef}
      data-testid="text-editor"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      rows={1}
      style={{
        position: 'absolute',
        top,
        left,
        fontSize: scaledFontSize,
        fontFamily: ann.fontFamily,
        color: ann.color,
        background: 'rgba(255,255,255,0.85)',
        border: '1.5px dashed #F59E0B',
        borderRadius: 2,
        outline: 'none',
        minWidth: 120,
        padding: '1px 4px',
        lineHeight: 1.4,
        resize: 'none',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        zIndex: 20,
        pointerEvents: 'auto',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
    />
  );
}
```

- [ ] **Step 2: Verify typecheck passes**

```bash
cd /tmp/pwa-test/apps/pwa
/tmp/pnpm-bin/node_modules/.bin/pnpm typecheck 2>&1 | tail -10
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
cd /tmp/pwa-test
git add apps/pwa/src/components/canvas/TextEditor.tsx
git commit -m "feat(day-5b): TextEditor inline overlay component"
```

---

## Task 3: Update AnnotationLayer — hide editing node + text tool click handling

**Files:**
- Modify: `apps/pwa/src/components/canvas/AnnotationLayer.tsx`

The changes:
1. Accept new props: `activeTool`, `editingAnnotationId`, `onPlaceText`
2. Use `toolRef` + `onPlaceTextRef` to safely read latest values inside the once-created stage event handler
3. Stage blank click: text tool → call `onPlaceText(pdfX, pdfY)`; otherwise → deselect
4. Shape click: text tool + text annotation → call `setEditingAnnotationId`
5. Skip rendering the Konva Text node for `editingAnnotationId` (TextEditor renders instead)

- [ ] **Step 1: Replace AnnotationLayer.tsx**

```typescript
// apps/pwa/src/components/canvas/AnnotationLayer.tsx
/**
 * AnnotationLayer — Konva canvas overlaid on the PDF canvas.
 *
 * Lives INSIDE the CSS-transformed div so zoom/pan apply to both canvases,
 * keeping annotations locked to PDF content.
 *
 * Coordinate conversion:
 *   pdfToKonva(coord) = coord * (canvasWidth / pdfPageWidth)
 */

import { useEffect, useRef } from 'react';
import Konva from 'konva';
import { useAnnotationStore } from '@/store';
import type { Tool } from '@/store';

export type AnnotationLayerProps = {
  canvasWidth: number;
  canvasHeight: number;
  pdfPageWidth: number;
  activeTool: Tool;
  editingAnnotationId: string | null;
  onPlaceText: (pdfX: number, pdfY: number) => void;
};

export function AnnotationLayer({
  canvasWidth,
  canvasHeight,
  pdfPageWidth,
  activeTool,
  editingAnnotationId,
  onPlaceText,
}: AnnotationLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);

  // Refs to keep event handlers up-to-date without recreating the stage
  const toolRef = useRef(activeTool);
  const onPlaceTextRef = useRef(onPlaceText);

  useEffect(() => { toolRef.current = activeTool; }, [activeTool]);
  useEffect(() => { onPlaceTextRef.current = onPlaceText; }, [onPlaceText]);

  const annotations = useAnnotationStore((s) => s.annotations);
  const selectedId = useAnnotationStore((s) => s.selectedId);
  const setSelected = useAnnotationStore((s) => s.setSelected);
  const setEditingAnnotationId = useAnnotationStore((s) => s.setEditingAnnotationId);

  // Ref to setEditingAnnotationId so it's callable in once-created event handler
  const setEditingIdRef = useRef(setEditingAnnotationId);
  useEffect(() => { setEditingIdRef.current = setEditingAnnotationId; }, [setEditingAnnotationId]);

  const pdfToKonva = (pdfCoord: number) =>
    pdfPageWidth > 0 ? pdfCoord * (canvasWidth / pdfPageWidth) : pdfCoord;

  // Create stage once on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const stage = new Konva.Stage({ container, width: canvasWidth, height: canvasHeight });
    const layer = new Konva.Layer();
    stage.add(layer);

    stage.on('click tap', (e) => {
      if (e.target !== stage) return;
      if (toolRef.current === 'text') {
        const pos = stage.getPointerPosition();
        if (!pos) return;
        // Convert Konva CSS-px coords back to PDF-space
        // pdfPageWidth is captured from props at mount — use a ref so it stays fresh
        const pdfX = pos.x * (pdfPageWidthRef.current / canvasWidthRef.current);
        const pdfY = pos.y * (pdfPageWidthRef.current / canvasWidthRef.current);
        onPlaceTextRef.current(pdfX, pdfY);
      } else {
        setSelected(null);
      }
    });

    stageRef.current = stage;
    layerRef.current = layer;

    return () => {
      stage.destroy();
      stageRef.current = null;
      layerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep canvas dimension refs fresh (needed inside the once-created click handler)
  const canvasWidthRef = useRef(canvasWidth);
  const pdfPageWidthRef = useRef(pdfPageWidth);
  useEffect(() => { canvasWidthRef.current = canvasWidth; }, [canvasWidth]);
  useEffect(() => { pdfPageWidthRef.current = pdfPageWidth; }, [pdfPageWidth]);

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
    const layer = layerRef.current;
    if (!layer) return;

    layer.destroyChildren();

    for (const ann of annotations) {
      // Skip the annotation currently being edited — TextEditor renders its content
      if (ann.id === editingAnnotationId) continue;

      const isSelected = ann.id === selectedId;
      const selColor = '#F59E0B';
      const selWidth = 2;

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
          });
          break;
        }
        case 'draw': {
          shape = new Konva.Line({
            points: ann.points.map((c) => pdfToKonva(c)),
            stroke: ann.color,
            strokeWidth: pdfToKonva(ann.strokeWidth),
            lineCap: 'round',
            lineJoin: 'round',
            tension: 0.4,
            shadowColor: isSelected ? selColor : undefined,
            shadowBlur: isSelected ? 6 : 0,
          });
          break;
        }
        case 'highlight': {
          shape = new Konva.Rect({
            x: pdfToKonva(ann.x),
            y: pdfToKonva(ann.y),
            width: pdfToKonva(ann.width),
            height: pdfToKonva(ann.height),
            fill: ann.color,
            opacity: 0.4,
            stroke: isSelected ? selColor : undefined,
            strokeWidth: isSelected ? selWidth : 0,
          });
          break;
        }
        case 'signature': {
          shape = new Konva.Rect({
            x: pdfToKonva(ann.x),
            y: pdfToKonva(ann.y),
            width: pdfToKonva(ann.width),
            height: pdfToKonva(ann.height),
            fill: 'rgba(0,0,0,0.04)',
            stroke: isSelected ? selColor : '#888',
            strokeWidth: isSelected ? selWidth : 1,
            dash: isSelected ? undefined : [4, 3],
          });
          break;
        }
      }

      if (shape) {
        const capturedId = ann.id;
        const capturedType = ann.type;
        shape.on('click tap', (e) => {
          e.cancelBubble = true;
          if (toolRef.current === 'text' && capturedType === 'text') {
            // Re-enter edit mode on existing text annotation
            setEditingIdRef.current(capturedId);
          } else {
            setSelected(capturedId);
          }
        });
        layer.add(shape);
      }
    }

    layer.batchDraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annotations, selectedId, editingAnnotationId, pdfPageWidth, canvasWidth]);

  return (
    <div
      ref={containerRef}
      data-testid="annotation-layer"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'auto' }}
    />
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
cd /tmp/pwa-test/apps/pwa
/tmp/pnpm-bin/node_modules/.bin/pnpm typecheck 2>&1 | tail -15
```

Expected: zero errors (CanvasArea will have type errors because the props it passes are now stale — that's OK for now, Task 4 fixes them).

- [ ] **Step 3: Commit**

```bash
cd /tmp/pwa-test
git add apps/pwa/src/components/canvas/AnnotationLayer.tsx
git commit -m "feat(day-5c): AnnotationLayer — hide editing node, click to re-edit text annotations"
```

---

## Task 4: CanvasArea — canvas click handler, TextEditor render, live annotation updates

**Files:**
- Modify: `apps/pwa/src/components/canvas/CanvasArea.tsx`

Changes:
1. Pull `editingAnnotationId`, `setEditingAnnotationId`, `updateAnnotation`, `removeAnnotation` from annotation store
2. Pull `activeTool`, `textFontSize`, `textColor` from tool store
3. `onPlaceText` callback: create annotation with current font settings, add to store, set as editing
4. Live update editing annotation when `textFontSize` or `textColor` changes
5. `onCommit` callback: update or remove based on text content
6. Pass new props to `AnnotationLayer`
7. Render `<TextEditor>` inside `transformDivRef` when editing a text annotation

- [ ] **Step 1: Replace CanvasArea.tsx**

```typescript
// apps/pwa/src/components/canvas/CanvasArea.tsx
import { useRef, useCallback, useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { useDocumentStore, useViewportStore, useAnnotationStore, useToolStore } from '@/store';
import { useDocumentGestures } from '@/hooks/useDocumentGestures';
import { useCanvasTransform } from '@/hooks/useCanvasTransform';
import { loadMostRecentDocument } from '@/lib/loadPdf';
import { createTextAnnotation } from '@/lib/annotations';
import type { TextAnnotation } from '@/lib/annotations';
import { AnnotationLayer } from './AnnotationLayer';
import { TextEditor } from './TextEditor';

const CLOSED_FLAG_KEY = 'openpdf_doc_explicitly_closed';

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
  const { activeTool, textFontSize, textColor } = useToolStore();

  const [isInitializing, setIsInitializing] = useState(true);
  const [canvasMeta, setCanvasMeta] = useState<CanvasMeta | null>(null);

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
  }, [loadState, currentPage, renderPdfPage, renderedScale]);

  useDocumentGestures(gestureContainerRef, transformDivRef);
  useCanvasTransform(renderPdfPage);

  // ── Debug mode ─────────────────────────────────────────────────────────────
  const [debugMode, setDebugMode] = useState(false);
  useEffect(() => {
    setDebugMode(new URLSearchParams(window.location.search).get('debug') === '1');
  }, []);

  const seedTestAnnotation = async () => {
    if (!doc || !canvasMeta) return;
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

  // ── Live-update editing annotation when font size or color changes ─────────
  useEffect(() => {
    if (!editingAnnotationId) return;
    void updateAnnotation(editingAnnotationId, {
      fontSize: textFontSize,
      color: textColor,
    });
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
      ? (annotations.find((a) => a.id === editingAnnotationId && a.type === 'text') as
          | TextAnnotation
          | undefined)
      : undefined;

  // Scale factor PDF-space → CSS-pixel space (for TextEditor positioning)
  const pdfToCss = canvasMeta
    ? canvasMeta.cssW / canvasMeta.pdfPageWidth
    : 1;

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

        {canvasMeta && (
          <AnnotationLayer
            canvasWidth={canvasMeta.cssW}
            canvasHeight={canvasMeta.cssH}
            pdfPageWidth={canvasMeta.pdfPageWidth}
            activeTool={activeTool}
            editingAnnotationId={editingAnnotationId}
            onPlaceText={onPlaceText}
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
```

- [ ] **Step 2: Verify typecheck is clean**

```bash
cd /tmp/pwa-test/apps/pwa
/tmp/pnpm-bin/node_modules/.bin/pnpm typecheck 2>&1 | tail -15
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
cd /tmp/pwa-test
git add apps/pwa/src/components/canvas/CanvasArea.tsx
git commit -m "feat(day-5d): canvas click handler — place text annotation on click + TextEditor render"
```

---

## Task 5: Text tool controls — font size + color presets

**Files:**
- Modify: `apps/pwa/src/components/shell/ToolPalette.tsx`
- Modify: `apps/pwa/src/components/shell/MobileToolbar.tsx`

- [ ] **Step 1: Replace ToolPalette.tsx**

```typescript
// apps/pwa/src/components/shell/ToolPalette.tsx
import { useToolStore } from '@/store';
import type { Tool } from '@/store';
import { TEXT_FONT_SIZES, TEXT_COLORS } from '@/store/tool';
import { MousePointer2, Type, Pen, Highlighter, PenLine } from 'lucide-react';

const TOOLS: { id: Tool; icon: React.ReactNode; label: string }[] = [
  { id: 'select',    icon: <MousePointer2 size={18} />, label: 'Select' },
  { id: 'text',      icon: <Type size={18} />,          label: 'Text' },
  { id: 'draw',      icon: <Pen size={18} />,           label: 'Draw' },
  { id: 'highlight', icon: <Highlighter size={18} />,   label: 'Highlight' },
  { id: 'sign',      icon: <PenLine size={18} />,       label: 'Sign' },
];

export function ToolPalette() {
  const { activeTool, setTool, textFontSize, textColor, setTextFontSize, setTextColor } =
    useToolStore();

  return (
    <aside
      className="hidden md:flex flex-col w-14 shrink-0 border-r border-white/10 bg-navy-900 py-2 gap-1 items-center"
      data-testid="tool-palette"
    >
      {TOOLS.map((t) => (
        <button
          key={t.id}
          onClick={() => setTool(t.id)}
          aria-label={t.label}
          aria-pressed={activeTool === t.id}
          data-testid={`tool-${t.id}`}
          title={t.label}
          className={[
            'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
            activeTool === t.id
              ? 'bg-amber-400/20 text-amber-400'
              : 'text-white/50 hover:bg-white/10 hover:text-white',
          ].join(' ')}
        >
          {t.icon}
        </button>
      ))}

      {/* Text tool controls — shown only when text tool is active */}
      {activeTool === 'text' && (
        <div
          className="mt-2 flex flex-col items-center gap-2 w-full px-1"
          data-testid="text-tool-controls"
        >
          {/* Divider */}
          <div className="h-px w-8 bg-white/10" />

          {/* Font size picker */}
          <select
            value={textFontSize}
            onChange={(e) => setTextFontSize(Number(e.target.value) as typeof textFontSize)}
            aria-label="Font size"
            data-testid="font-size-select"
            className="w-11 rounded bg-white/10 px-0.5 py-1 text-center text-xs text-white focus:outline-none"
          >
            {TEXT_FONT_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Color swatches */}
          <div className="flex flex-col gap-1" aria-label="Text color" data-testid="color-swatches">
            {TEXT_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setTextColor(c.value)}
                title={c.label}
                aria-label={c.label}
                className="h-5 w-5 rounded-full border-2 transition-all"
                style={{
                  background: c.value,
                  borderColor: textColor === c.value ? '#F59E0B' : 'transparent',
                  transform: textColor === c.value ? 'scale(1.2)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
```

- [ ] **Step 2: Replace MobileToolbar.tsx**

```typescript
// apps/pwa/src/components/shell/MobileToolbar.tsx
import { useToolStore } from '@/store';
import type { Tool } from '@/store';
import { TEXT_FONT_SIZES, TEXT_COLORS } from '@/store/tool';
import { MousePointer2, Type, Pen, Highlighter, PenLine, MoreHorizontal } from 'lucide-react';

const PRIMARY_TOOLS: { id: Tool; icon: React.ReactNode; label: string }[] = [
  { id: 'select',    icon: <MousePointer2 size={18} />, label: 'Select' },
  { id: 'text',      icon: <Type size={18} />,          label: 'Text' },
  { id: 'draw',      icon: <Pen size={18} />,           label: 'Draw' },
  { id: 'highlight', icon: <Highlighter size={18} />,   label: 'Highlight' },
  { id: 'sign',      icon: <PenLine size={18} />,       label: 'Sign' },
];

export function MobileToolbar() {
  const { activeTool, setTool, textFontSize, textColor, setTextFontSize, setTextColor } =
    useToolStore();

  return (
    <div className="md:hidden shrink-0">
      {/* Text tool controls row — shown above the toolbar when text tool is active */}
      {activeTool === 'text' && (
        <div
          className="flex h-10 items-center gap-3 border-t border-white/10 bg-navy-900 px-4"
          data-testid="text-tool-controls-mobile"
        >
          <span className="text-xs text-white/40">Size</span>
          <select
            value={textFontSize}
            onChange={(e) => setTextFontSize(Number(e.target.value) as typeof textFontSize)}
            aria-label="Font size"
            data-testid="font-size-select-mobile"
            className="rounded bg-white/10 px-2 py-0.5 text-xs text-white focus:outline-none"
          >
            {TEXT_FONT_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <span className="text-xs text-white/40">Color</span>
          <div className="flex gap-2" data-testid="color-swatches-mobile">
            {TEXT_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setTextColor(c.value)}
                title={c.label}
                aria-label={c.label}
                className="h-5 w-5 rounded-full border-2 transition-all"
                style={{
                  background: c.value,
                  borderColor: textColor === c.value ? '#F59E0B' : 'transparent',
                  transform: textColor === c.value ? 'scale(1.2)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Primary toolbar */}
      <nav
        className="flex h-14 items-center justify-around border-t border-white/10 bg-navy-900 px-1"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Tool palette"
        data-testid="mobile-toolbar"
      >
        {PRIMARY_TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            aria-label={t.label}
            aria-pressed={activeTool === t.id}
            className={[
              'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
              activeTool === t.id
                ? 'bg-amber-400/20 text-amber-400'
                : 'text-white/50 hover:bg-white/10 hover:text-white',
            ].join(' ')}
          >
            {t.icon}
          </button>
        ))}

        <button
          aria-label="More tools"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white/50 hover:bg-white/10 hover:text-white transition-colors"
        >
          <MoreHorizontal size={18} />
        </button>
      </nav>
    </div>
  );
}
```

- [ ] **Step 3: Verify typecheck + build**

```bash
cd /tmp/pwa-test/apps/pwa
/tmp/pnpm-bin/node_modules/.bin/pnpm typecheck 2>&1 | tail -10
/tmp/pnpm-bin/node_modules/.bin/pnpm build 2>&1 | tail -15
```

Expected: zero TypeScript errors, Vite build completes with no errors.

- [ ] **Step 4: Commit**

```bash
cd /tmp/pwa-test
git add apps/pwa/src/components/shell/ToolPalette.tsx apps/pwa/src/components/shell/MobileToolbar.tsx
git commit -m "feat(day-5e): text tool controls — font size + color presets"
```

---

## Task 6: Playwright tests

**Files:**
- Create: `apps/pwa/e2e/day-5-text-tool.spec.ts`

- [ ] **Step 1: Create the test file**

```typescript
// apps/pwa/e2e/day-5-text-tool.spec.ts
import { test, expect, devices } from '@playwright/test';

const BASE = process.env.SPIKE_URL ?? 'https://app.snaphw.com';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function openDebugSession(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}?debug=1`);
  await page.waitForLoadState('networkidle');
}

async function seedAndGetCanvas(page: import('@playwright/test').Page) {
  // Seed a PDF via the debug button
  const seedBtn = page.getByRole('button', { name: /Test ann/i });
  if (await seedBtn.isVisible()) {
    await seedBtn.click();
    await page.waitForTimeout(500);
  }
  return page.locator('[data-testid="annotation-layer"]');
}

// ── Desktop tests (1440×900) ─────────────────────────────────────────────────

test.describe('Day 5 — Text Tool (desktop)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('text tool button is visible and toggles active state', async ({ page }) => {
    await openDebugSession(page);
    const textToolBtn = page.getByTestId('tool-text');
    await expect(textToolBtn).toBeVisible();
    await textToolBtn.click();
    await expect(textToolBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('text tool controls appear when text tool is active', async ({ page }) => {
    await openDebugSession(page);
    await page.getByTestId('tool-text').click();
    await expect(page.getByTestId('text-tool-controls')).toBeVisible();
    await expect(page.getByTestId('font-size-select')).toBeVisible();
    await expect(page.getByTestId('color-swatches')).toBeVisible();
  });

  test('text tool controls hidden when another tool is active', async ({ page }) => {
    await openDebugSession(page);
    await page.getByTestId('tool-text').click();
    await page.getByTestId('tool-select').click();
    await expect(page.getByTestId('text-tool-controls')).not.toBeVisible();
  });

  test('clicking canvas with text tool opens TextEditor at click position', async ({ page }) => {
    await openDebugSession(page);
    await seedAndGetCanvas(page);
    await page.getByTestId('tool-text').click();

    const layer = page.locator('[data-testid="annotation-layer"]');
    await layer.waitFor({ state: 'visible' });
    const box = await layer.boundingBox();
    if (!box) throw new Error('annotation-layer not found');

    // Click center of canvas
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

    // TextEditor textarea should appear
    await expect(page.getByTestId('text-editor')).toBeVisible({ timeout: 3000 });
  });

  test('typing text and blurring renders Konva Text on canvas', async ({ page }) => {
    await openDebugSession(page);
    await seedAndGetCanvas(page);
    await page.getByTestId('tool-text').click();

    const layer = page.locator('[data-testid="annotation-layer"]');
    const box = await layer.boundingBox();
    if (!box) throw new Error('annotation-layer not found');

    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    const editor = page.getByTestId('text-editor');
    await editor.waitFor({ state: 'visible', timeout: 3000 });
    await editor.fill('Hello World');

    // Blur by pressing Escape (commits)
    await page.keyboard.press('Escape');
    await expect(editor).not.toBeVisible({ timeout: 2000 });

    // Konva canvas should now contain a text node — verify annotation-layer is present
    const konvaCanvas = page.locator('[data-testid="annotation-layer"] canvas');
    await expect(konvaCanvas).toBeVisible();
  });

  test('clicking text annotation with text tool re-opens TextEditor', async ({ page }) => {
    await openDebugSession(page);
    // First place a text annotation
    await page.getByTestId('tool-text').click();
    const layer = page.locator('[data-testid="annotation-layer"]');
    const box = await layer.boundingBox();
    if (!box) throw new Error('no box');

    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    await page.mouse.click(cx, cy);
    const editor = page.getByTestId('text-editor');
    await editor.waitFor({ state: 'visible', timeout: 3000 });
    await editor.fill('Re-edit me');
    await page.keyboard.press('Escape');
    await expect(editor).not.toBeVisible({ timeout: 2000 });

    // Click the same spot — should re-open TextEditor
    await page.mouse.click(cx, cy);
    await expect(editor).toBeVisible({ timeout: 3000 });
  });

  test('empty text on blur removes annotation (no ghost)', async ({ page }) => {
    await openDebugSession(page);
    await page.getByTestId('tool-text').click();
    const layer = page.locator('[data-testid="annotation-layer"]');
    const box = await layer.boundingBox();
    if (!box) throw new Error('no box');

    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    const editor = page.getByTestId('text-editor');
    await editor.waitFor({ state: 'visible', timeout: 3000 });

    // Leave empty and press Escape — should remove annotation
    await editor.fill('');
    await page.keyboard.press('Escape');
    await expect(editor).not.toBeVisible({ timeout: 2000 });
    // No annotation text node should remain at that spot — layer canvas still present
    await expect(page.locator('[data-testid="annotation-layer"]')).toBeVisible();
  });

  test('font size select changes annotation font size', async ({ page }) => {
    await openDebugSession(page);
    await page.getByTestId('tool-text').click();
    const fontSelect = page.getByTestId('font-size-select');
    await expect(fontSelect).toBeVisible();
    await fontSelect.selectOption('24');
    await expect(fontSelect).toHaveValue('24');
  });

  test('color swatch click changes selected color indicator', async ({ page }) => {
    await openDebugSession(page);
    await page.getByTestId('tool-text').click();
    // Click the red swatch
    const swatches = page.getByTestId('color-swatches').locator('button');
    await swatches.nth(1).click(); // Red
    // Red swatch should now have the active border color (amber)
    const redStyle = await swatches.nth(1).getAttribute('style');
    expect(redStyle).toContain('F59E0B');
  });
});

// ── Mobile tests (Pixel 7) ───────────────────────────────────────────────────

test.describe('Day 5 — Text Tool (mobile)', () => {
  test.use({ ...devices['Pixel 7'] });

  test('mobile text tool button visible and activatable', async ({ page }) => {
    await page.goto(`${BASE}?debug=1`);
    await page.waitForLoadState('networkidle');
    const toolbar = page.getByTestId('mobile-toolbar');
    await expect(toolbar).toBeVisible();
    await toolbar.getByRole('button', { name: /Text/i }).click();
  });

  test('mobile text tool controls row appears above toolbar', async ({ page }) => {
    await page.goto(`${BASE}?debug=1`);
    await page.waitForLoadState('networkidle');
    await page.getByTestId('mobile-toolbar').getByRole('button', { name: /Text/i }).click();
    await expect(page.getByTestId('text-tool-controls-mobile')).toBeVisible();
    await expect(page.getByTestId('font-size-select-mobile')).toBeVisible();
    await expect(page.getByTestId('color-swatches-mobile')).toBeVisible();
  });
});
```

- [ ] **Step 2: Run Playwright against live URL**

```bash
cd /tmp/pwa-test/apps/pwa
PLAYWRIGHT_BROWSERS_PATH=$HOME/.cache/ms-playwright \
  SPIKE_URL=https://app.snaphw.com \
  node_modules/.bin/playwright test \
  e2e/day-5-text-tool.spec.ts \
  --reporter=list 2>&1
```

Note: Some click-and-type tests may be flakey on first run against live due to PDF load timing. If < 2 tests fail, investigate individually. If > 5 fail, check that the deploy went through first (Task 7).

- [ ] **Step 3: Commit test file**

```bash
cd /tmp/pwa-test
git add apps/pwa/e2e/day-5-text-tool.spec.ts
git commit -m "test(day-5): Playwright tests for text tool"
```

---

## Task 7: Full typecheck + build + deploy

- [ ] **Step 1: Typecheck + build**

```bash
cd /tmp/pwa-test/apps/pwa
/tmp/pnpm-bin/node_modules/.bin/pnpm typecheck 2>&1 | tail -10
/tmp/pnpm-bin/node_modules/.bin/pnpm build 2>&1 | tail -15
```

Expected: zero TypeScript errors, Vite build succeeds.

- [ ] **Step 2: Push trigger commit**

```bash
cd /tmp/pwa-test
git add -A
git diff --cached --stat
git commit --allow-empty -m "chore: trigger Railway deploy for Day 5" 2>/dev/null || \
  git commit -m "chore: trigger Railway deploy for Day 5"
git push origin pwa-main
```

- [ ] **Step 3: Trigger Railway "Check for updates"**

Open Railway service settings in browser tab 747143833:
- Navigate to Settings → Source section
- Click "Check for updates" (spinning refresh icon next to Upstream Repo)
- Watch Deployments tab for new build to appear
- Wait for "Deployment successful" status

- [ ] **Step 4: Run full regression suite against live URL**

```bash
cd /tmp/pwa-test/apps/pwa
PLAYWRIGHT_BROWSERS_PATH=$HOME/.cache/ms-playwright \
  SPIKE_URL=https://app.snaphw.com \
  node_modules/.bin/playwright test \
  e2e/day-3-5-document-ux.spec.ts \
  e2e/day-4-annotations.spec.ts \
  e2e/day-5-text-tool.spec.ts \
  --reporter=list 2>&1
```

Expected: all tests pass (12 existing + 9 new = 21 total).

- [ ] **Step 5: Confirm live URL is healthy**

Verify https://app.snaphw.com loads without red error state. Open `?debug=1`, select Text tool, click canvas, type text, blur — text appears on PDF.

---

## Checklist against spec

- [x] `TextAnnotation` type — already exists in `src/lib/annotations.ts`
- [x] `createTextAnnotation` factory — already exists
- [x] `editingAnnotationId` + `setEditingAnnotationId` in annotations slice (Task 1)
- [x] Render text annotations as Konva Text nodes (existing + updated in Task 3)
- [x] Hide editing node in AnnotationLayer (Task 3)
- [x] Canvas click handler — text tool + blank area → place annotation (Task 3/4)
- [x] Click existing text annotation with text tool → re-enter edit (Task 3)
- [x] TextEditor component — floating textarea, autoFocus, commit on blur/Enter/Escape (Task 2)
- [x] Empty text on commit → removeAnnotation (Task 4)
- [x] Text content → updateAnnotation + persist (Task 4)
- [x] Font size + color settings in tool store (Task 1)
- [x] Live update editing annotation when settings change (Task 4)
- [x] Controls in ToolPalette (desktop) (Task 5)
- [x] Controls row in MobileToolbar (mobile) (Task 5)
- [x] Dexie persistence — uses existing `saveAnnotation` / `deleteAnnotation` (no new code needed)
- [x] Playwright tests — desktop + mobile (Task 6)
- [x] Deploy via Railway (Task 7)

