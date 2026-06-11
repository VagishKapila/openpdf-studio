/**
 * exportPdf — flatten all annotations onto the PDF and return new bytes.
 *
 * Coordinate system note:
 *   pdf-lib uses bottom-left origin (Y increases upward).
 *   Our annotations use top-left origin (Y increases downward, matching canvas).
 *   Conversion: pdfY = pageHeight - annotationY - elementHeight
 */
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { getStroke } from 'perfect-freehand';
import type { Annotation } from '@/lib/annotations';
import * as Sentry from '@sentry/react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '');
  const n = parseInt(clean.padEnd(6, '0'), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

// ─── Main export function ────────────────────────────────────────────────────

export async function exportAnnotatedPdf(
  originalPdfBytes: Uint8Array,
  annotations: Annotation[],
): Promise<Uint8Array> {
  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(originalPdfBytes);
  } catch {
    throw new Error('This PDF is protected and cannot be exported with annotations.');
  }

  const pages = pdfDoc.getPages();

  // Group by 0-based page index (annotations store 1-based pageNumber)
  const byPage = new Map<number, Annotation[]>();
  for (const ann of annotations) {
    const idx = ann.pageNumber - 1;
    if (!byPage.has(idx)) byPage.set(idx, []);
    byPage.get(idx)!.push(ann);
  }

  for (const [idx, anns] of byPage) {
    const page = pages[idx];
    if (!page) continue;
    const { width: pageW, height: pageH } = page.getSize();

    for (const ann of anns) {
      try {
        switch (ann.type) {
          case 'text': {
            if (!ann.text?.trim()) break;
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const fontSize = ann.fontSize ?? 16;
            // Clamp x/y to page bounds
            const x = Math.max(0, Math.min(ann.x, pageW - 4));
            const y = Math.max(0, pageH - ann.y - fontSize);
            page.drawText(ann.text, {
              x,
              y,
              size: fontSize,
              font,
              color: hexToRgb(ann.color ?? '#1a1a1a'),
              maxWidth: pageW - x,
            });
            break;
          }

          case 'highlight': {
            page.drawRectangle({
              x: ann.x,
              y: pageH - ann.y - ann.height,
              width: ann.width,
              height: ann.height,
              color: hexToRgb(ann.color ?? '#F6E05E'),
              opacity: ann.opacity ?? 0.35,
            });
            break;
          }

          case 'draw': {
            if (!ann.points || ann.points.length < 2) break;
            const strokeColor = hexToRgb(ann.color ?? '#e53e3e');
            const strokeWidth = ann.strokeWidth ?? 3;

            // Reconstruct perfect-freehand stroke in PDF space
            // (points are already in PDF-space from annotation store)
            const pf = getStroke(ann.points as number[][], {
              size: strokeWidth * 2,
              thinning: 0.5,
              smoothing: 0.5,
              streamline: 0.5,
            });

            // Draw as polyline segments (always works, slightly less smooth than SVG path)
            for (let i = 0; i < pf.length - 1; i++) {
              const [x1, y1] = pf[i];
              const [x2, y2] = pf[i + 1];
              page.drawLine({
                start: { x: x1, y: pageH - y1 },
                end: { x: x2, y: pageH - y2 },
                thickness: strokeWidth * 0.8,
                color: strokeColor,
                opacity: 0.9,
              });
            }
            break;
          }

          case 'signature': {
            if (!ann.imageData) break;
            const base64 = ann.imageData.replace(/^data:image\/png;base64,/, '');
            const pngBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
            const pngImage = await pdfDoc.embedPng(pngBytes);
            page.drawImage(pngImage, {
              x: ann.x,
              y: pageH - ann.y - ann.height,
              width: ann.width,
              height: ann.height,
            });
            break;
          }

          case 'cover': {
            // COWORK-45 Tier 1: bake white rectangle over existing text.
            // Underlying text remains in the PDF content stream (visual-only edit).
            // No border — borderWidth omitted so pdf-lib draws fill only.
            page.drawRectangle({
              x: ann.x,
              y: pageH - ann.y - ann.height,
              width: ann.width,
              height: ann.height,
              color: rgb(1, 1, 1),
              opacity: 1,
            });
            break;
          }
        }
      } catch (annErr) {
        // Skip individual annotation failures — don't abort the whole export
        Sentry.captureException(annErr, {
          extra: { annotationType: ann.type, annotationId: ann.id },
        });
        console.warn('[exportPdf] skipped annotation:', ann.type, annErr);
      }
    }
  }

  return pdfDoc.save();
}
