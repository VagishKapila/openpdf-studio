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
  /** [x, y, pressure] triplets in PDF-space. pressure ∈ [0, 1]. */
  points: Array<[number, number, number]>;
  strokeWidth: number; // default 4 (PDF points, matches Medium preset)
  color: string;       // hex, default '#e53e3e'
};

export type HighlightAnnotation = AnnotationBase & {
  type: 'highlight';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;   // hex, default '#F6E05E'
  opacity: number; // default 0.35
};

export type SignatureAnnotation = AnnotationBase & {
  type: 'signature';
  x: number;       // PDF-space
  y: number;       // PDF-space
  width: number;   // PDF-space
  height: number;  // PDF-space
  source: 'draw' | 'type' | 'upload';
  /** base64 PNG data URL — present for draw + upload */
  imageData?: string;
  /** typed text — present for type source */
  text?: string;
  /** CSS font-family string — present for type source */
  fontFamily?: string;
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
  opacity?: number;
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
    color: args.color ?? '#F6E05E',
    opacity: args.opacity ?? 0.35,
  };
}

export function createDrawAnnotation(args: {
  documentId: DocumentId;
  pageNumber: PageNumber;
  points: Array<[number, number, number]>;
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
    strokeWidth: args.strokeWidth ?? 4,
    color: args.color ?? '#e53e3e',
  };
}

export function createSignatureAnnotation(args: {
  documentId: DocumentId;
  pageNumber: PageNumber;
  x: number;
  y: number;
  width: number;
  height: number;
  source: 'draw' | 'type' | 'upload';
  imageData?: string;
  text?: string;
  fontFamily?: string;
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
    source: args.source,
    imageData: args.imageData,
    text: args.text,
    fontFamily: args.fontFamily,
  };
}
