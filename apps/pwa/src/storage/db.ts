import Dexie, { type Table } from 'dexie';

export interface StoredDocument {
  id: string;           // crypto.randomUUID()
  fileName: string;
  fileSize: number;
  mimeType: string;
  data: ArrayBuffer;    // raw bytes stored locally, never uploaded
  pageCount: number;
  createdAt: number;    // Date.now()
  lastOpenedAt: number;
  thumbnail?: Blob;     // first-page preview
}

export interface StoredAnnotation {
  id: string;
  documentId: string;
  pageNumber: number;
  type: 'highlight' | 'draw' | 'text' | 'stamp' | 'comment';
  data: unknown;        // type-specific payload
  createdAt: number;
  updatedAt: number;
}

export interface StoredSignature {
  id: string;
  label: string;        // "My Signature", "Initials", etc.
  dataUrl: string;      // base64 PNG / SVG
  type: 'drawn' | 'typed' | 'image';
  createdAt: number;
}

class OpenPDFDatabase extends Dexie {
  documents!: Table<StoredDocument>;
  annotations!: Table<StoredAnnotation>;
  signatures!: Table<StoredSignature>;

  constructor() {
    super('openpdf_v1');
    this.version(1).stores({
      documents:   '++id, fileName, createdAt, lastOpenedAt',
      annotations: '++id, documentId, pageNumber, type, createdAt',
      signatures:  '++id, label, type, createdAt',
    });
  }
}

export const db = new OpenPDFDatabase();
