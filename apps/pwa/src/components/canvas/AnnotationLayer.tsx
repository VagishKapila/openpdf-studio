/**
 * AnnotationLayer — Konva canvas overlaid on the PDF canvas.
 *
 * Architecture:
 *   This component is mounted INSIDE the CSS-transformed div that wraps the
 *   PDF canvas. That means CSS scale/translate apply to BOTH canvases together,
 *   so annotations stay perfectly locked to PDF content at any zoom/pan level.
 *
 * Coordinate conversion:
 *   Annotations are stored in PDF coordinate space (points, scale=1 viewport).
 *   To place a Konva shape correctly:
 *     konvaX = pdfX * (canvasWidth / pdfPageWidth)
 *   where canvasWidth is the CSS pixel width and pdfPageWidth is the PDF page
 *   width in points at scale=1.
 */

import { useEffect, useRef } from 'react';
import Konva from 'konva';
import { useAnnotationStore } from '@/store';
import type { Annotation } from '@/lib/annotations';

export type AnnotationLayerProps = {
  /** CSS pixel width of the underlying PDF canvas */
  canvasWidth: number;
  /** CSS pixel height of the underlying PDF canvas */
  canvasHeight: number;
  /** Width of the PDF page at scale=1 (in PDF points), used for coord conversion */
  pdfPageWidth: number;
};

export function AnnotationLayer({ canvasWidth, canvasHeight, pdfPageWidth }: AnnotationLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);

  const annotations = useAnnotationStore((s) => s.annotations);
  const selectedId = useAnnotationStore((s) => s.selectedId);
  const setSelected = useAnnotationStore((s) => s.setSelected);

  // Scale factor: PDF coord (points) → Konva coord (CSS pixels)
  const pdfToKonva = (pdfCoord: number) =>
    pdfPageWidth > 0 ? pdfCoord * (canvasWidth / pdfPageWidth) : pdfCoord;

  // Create stage once on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const stage = new Konva.Stage({
      container,
      width: canvasWidth,
      height: canvasHeight,
    });
    const layer = new Konva.Layer();
    stage.add(layer);

    // Tap empty stage area → deselect
    stage.on('click tap', (e) => {
      if (e.target === stage) setSelected(null);
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
      const isSelected = ann.id === selectedId;
      const selColor = '#F59E0B';
      const selWidth = 2;

      let shape: Konva.Shape | null = null;

      switch (ann.type) {
        case 'text': {
          shape = new Konva.Text({
            x: pdfToKonva(ann.x),
            y: pdfToKonva(ann.y),
            text: ann.text || '[empty]',
            fontSize: pdfToKonva(ann.fontSize),
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
        shape.on('click tap', (e) => {
          e.cancelBubble = true;
          setSelected(capturedId);
        });
        layer.add(shape);
      }
    }

    layer.batchDraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annotations, selectedId, pdfPageWidth, canvasWidth]);

  return (
    <div
      ref={containerRef}
      data-testid="annotation-layer"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'auto',
      }}
    />
  );
}
