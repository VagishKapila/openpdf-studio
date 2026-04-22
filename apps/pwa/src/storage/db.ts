import Dexie, { type Table } from 'dexie';
import type { Annotation } from '@/lib/annotations';

export interface StoredDocument {
  id: string;           // crypto.randomUUID()
  fileName: string;
  fileSize: number;
  mimeType: string;
  data: ArrayBuffer;    // raw bytes stored locally, never uploaded
  pageCount: number;
  createdAt: number;    // Date.now()
  lastOpenedAt: number;
  thumbnail?: Blob;     // first-page preview (future)
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
  annotations!: Table<Annotation>;
  signatures!: Table<StoredSignature>;

  constructor() {
    super('openpdf_v1');
    // Version 1: original schema (preserved for migration)
    this.version(1).stores({
      documents:   '++id, fileName, createdAt, lastOpenedAt',
      annotations: '++id, documentId, pageNumber, type, createdAt',
      signatures:  '++id, label, type, createdAt',
    });
    // Version 2: client-generated UUIDs (&id) + compound index for fast page queries
    this.version(2).stores({
      documents:   '++id, fileName, createdAt, lastOpenedAt',
      annotations: '&id, documentId, pageNumber, type, createdAt, updatedAt, [documentId+pageNumber]',
      signatures:  '++id, label, type, createdAt',
    });
  }
}

export const db = new OpenPDFDatabase();
