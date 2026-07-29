/**
 * pdfImages — locate embedded images on a PDF page (COWORK-50 F4).
 *
 * Walks the page operator list maintaining a minimal CTM stack (save/restore/
 * transform) and records the rect of every paintImageXObject /
 * paintInlineImageXObject. An image is drawn into the unit square mapped
 * through the CTM, so its device rect is the CTM applied to (0,0)-(1,1).
 *
 * Returned rects are in FormIQ annotation space: PDF points, TOP-LEFT origin
 * (y increases downward), matching every annotation type.
 *
 * Limitations (accepted for v1.2): rotation/skew in the CTM is reduced to the
 * axis-aligned bounding box; images drawn inside Form XObjects are not
 * traversed. Covers the overwhelmingly common case of directly placed images.
 */
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { pdfjs } from '@/lib/pdfjs';

export type ImageRect = {
  x: number;      // PDF points, top-left origin
  y: number;
  width: number;
  height: number;
};

type Matrix = [number, number, number, number, number, number];

const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

function multiply(m1: Matrix, m2: Matrix): Matrix {
  return [
    m1[0] * m2[0] + m1[1] * m2[2],
    m1[0] * m2[1] + m1[1] * m2[3],
    m1[2] * m2[0] + m1[3] * m2[2],
    m1[2] * m2[1] + m1[3] * m2[3],
    m1[4] * m2[0] + m1[5] * m2[2] + m2[4],
    m1[4] * m2[1] + m1[5] * m2[3] + m2[5],
  ];
}

function applyPoint(m: Matrix, x: number, y: number): [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

export async function getPageImageRects(
  pdf: PDFDocumentProxy,
  pageNumber: number,
): Promise<ImageRect[]> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  const pageH = viewport.height;
  const opList = await page.getOperatorList();

  const OPS = pdfjs.OPS;
  const stack: Matrix[] = [];
  let ctm: Matrix = IDENTITY;
  const rects: ImageRect[] = [];

  for (let i = 0; i < opList.fnArray.length; i++) {
    const fn = opList.fnArray[i];
    const args = opList.argsArray[i];

    switch (fn) {
      case OPS.save:
        stack.push(ctm);
        break;
      case OPS.restore:
        ctm = stack.pop() ?? IDENTITY;
        break;
      case OPS.transform:
        ctm = multiply(args as Matrix, ctm);
        break;
      case OPS.paintImageXObject:
      case OPS.paintInlineImageXObject:
      case OPS.paintImageMaskXObject: {
        // Unit square through the CTM → axis-aligned bounding box
        const corners = [
          applyPoint(ctm, 0, 0),
          applyPoint(ctm, 1, 0),
          applyPoint(ctm, 0, 1),
          applyPoint(ctm, 1, 1),
        ];
        const xs = corners.map((c) => c[0]);
        const ys = corners.map((c) => c[1]);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const width = maxX - minX;
        const height = maxY - minY;
        // Ignore degenerate/decorative slivers (< 8pt in either dimension)
        if (width >= 8 && height >= 8) {
          rects.push({
            x: minX,
            y: pageH - maxY, // bottom-left PDF space → top-left annotation space
            width,
            height,
          });
        }
        break;
      }
      default:
        break;
    }
  }

  return rects;
}
