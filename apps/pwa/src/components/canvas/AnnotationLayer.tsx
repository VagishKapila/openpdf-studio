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

  // Stable ref to setEditingAnnotationId for use inside once-created event handler
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
        // Convert Konva CSS-px coords back to PDF-space using fresh refs
        const scale = pdfPageWidthRef.current / canvasWidthRef.current;
        const pdfX = pos.x * scale;
        const pdfY = pos.y * scale;
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
