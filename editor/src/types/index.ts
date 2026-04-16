// Document types
export interface EditorDocument {
  id: string;
  fileName: string;
  pdfDoc: any; // PDF.js PDFDocumentProxy
  pdfBytes: Uint8Array | null;
  currentPage: number;
  totalPages: number;
  zoom: number;
  pageAnnotations: Record<number, string>; // pageNum → Fabric JSON string
  textEdits: Record<number, TextEdit[]>;
  history: HistoryEntry[];
  historyIndex: number;
  isImage: boolean;
  imageData: string | null; // data URL for images
  hasUnsavedChanges: boolean;
}

export interface TextEdit {
  origText: string;
  newText: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
}

export interface HistoryEntry {
  pageNum: number;
  annotationJson: string;
  textEdits: TextEdit[];
}

// Tool types
export type EditorTool = 'select' | 'text' | 'draw' | 'highlight' | 'shapes' | 'image' | 'signature' | 'stamp' | 'note' | 'redact' | 'crop';
export type ShapeType = 'rect' | 'circle' | 'line' | 'arrow' | 'triangle' | 'star';
export type EditorMode = 'pdf' | 'image';
export type EditorTab = 'editor' | 'merge' | 'convert' | 'ocr';

// Annotation properties
export interface AnnotationStyle {
  color: string;
  fontSize: number;
  fontFamily: string;
  strokeWidth: number;
  opacity: number;
}

// Image filters
export interface ImageFilters {
  brightness: number;
  contrast: number;
  saturate: number;
  blur: number;
  grayscale: number;
  sepia: number;
  hueRotate: number;
}

// Signing flow
export type SigningStep = 'upload' | 'setup' | 'review' | 'finalize';

export interface SignatureField {
  id: string;
  fieldType: 'signature' | 'initials' | 'date' | 'name' | 'text';
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  value?: string;
}

// Auth
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: string;
  emailVerified: boolean;
}

// Modal state
export type ModalType = 'signature' | 'merge' | 'ocr' | 'password' | 'compress' | 'convert' | 'feedback' | 'auth' | null;

// Toast
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
