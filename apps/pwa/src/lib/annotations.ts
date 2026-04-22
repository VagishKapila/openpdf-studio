/**
 * Annotation types — stored in PDF coordinate space.
 * Origin: top-left. Units: points (1 pt = 1/72 inch).
 * This matches PDF.js's getViewport({ scale: 1 }) coordinate system.
 */

export type AnnotationId = string;
export type DocumentId = string;
export type PageNumber = number;

export type AnnotationBase = {
  id: AnnotationId;
  documentId: DocumentId;
  pageNumber: PageNumber;
  createdAt: number;
  updatedAt: number;
};

export type TextAnnotation = AnnotationBase & {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;   // PDF points
  fontFamily: string;
  color: string;      // hex
};

export type DrawAnnotation = AnnotationBase & {
  type: 'draw';
  points: number[];   // flat [x1, y1, x2, y2, ...] in PDF coords
  strokeWidth: number;
  color: string;
};

export type HighlightAnnotation = AnnotationBase & {
  type: 'highlight';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string; // rgba recommended
};

export type SignatureAnnotation = AnnotationBase & {
  type: 'signature';
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string; // PNG dataURL or SVG path
  mode: 'drawn' | 'typed' | 'uploaded';
};

export type Annotation =
  | TextAnnotation
  | DrawAnnotation
  | HighlightAnnotation
  | SignatureAnnotation;

// ─── Factory helpers ────────────────────────────────────────────────────────

export function createTextAnnotation(args: {
  documentId: DocumentId;
  pageNumber: PageNumber;
  x: number;
  y: number;
  text?: string;
}): TextAnnotation {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    documentId: args.documentId,
    pageNumber: args.pageNumber,
    createdAt: now,
    updatedAt: now,
    type: 'text',
    x: args.x,
    y: args.y,
    text: args.text ?? '',
    fontSize: 12,
    fontFamily: 'Helvetica',
    color: '#111111',
  };
}

export function createHighlightAnnotation(args: {
  documentId: DocumentId;
  pageNumber: PageNumber;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}): HighlightAnnotation {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    documentId: args.documentId,
    pageNumber: args.pageNumber,
    createdAt: now,
    updatedAt: now,
    type: 'highlight',
    x: args.x,
    y: args.y,
    width: args.width,
    height: args.height,
    color: args.color ?? 'rgba(255, 230, 0, 0.5)',
  };
}

export function createDrawAnnotation(args: {
  documentId: DocumentId;
  pageNumber: PageNumber;
  points: number[];
  color?: string;
  strokeWidth?: number;
}): DrawAnnotation {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    documentId: args.documentId,
    pageNumber: args.pageNumber,
    createdAt: now,
    updatedAt: now,
    type: 'draw',
    points: args.points,
    strokeWidth: args.strokeWidth ?? 2,
    color: args.color ?? '#E53E3E',
  };
}

export function createSignatureAnnotation(args: {
  documentId: DocumentId;
  pageNumber: PageNumber;
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string;
  mode?: 'drawn' | 'typed' | 'uploaded';
}): SignatureAnnotation {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    documentId: args.documentId,
    pageNumber: args.pageNumber,
    createdAt: now,
    updatedAt: now,
    type: 'signature',
    x: args.x,
    y: args.y,
    width: args.width,
    height: args.height,
    dataUrl: args.dataUrl,
    mode: args.mode ?? 'drawn',
  };
}
