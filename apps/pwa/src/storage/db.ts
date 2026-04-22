import Dexie, { type Table } from 'dexie';
import type { Annotation } from '@/lib/annotations';

export interface StoredDocument {
  id: string;           // UUID provided explicitly
  fileName: string;
  fileSize: number;
  mimeType: string;
  data: ArrayBuffer;    // raw bytes stored locally, never uploaded
  pageCount: number;
  createdAt: number;
  lastOpenedAt: number;
  thumbnail?: Blob;
}

export interface StoredSignature {
  id: string;
  label: string;
  dataUrl: string;
  type: 'drawn' | 'typed' | 'image';
  createdAt: number;
}

class OpenPDFDatabase extends Dexie {
  documents!: Table<StoredDocument>;
  annotations!: Table<Annotation>;
  signatures!: Table<StoredSignature>;

  constructor() {
    super('openpdf_v1');

    // v1 — original schema (must be declared so Dexie knows the upgrade path)
    this.version(1).stores({
      documents:   '++id, fileName, createdAt, lastOpenedAt',
      annotations: '++id, documentId, pageNumber, type, createdAt',
      signatures:  '++id, label, type, createdAt',
    });

    // v11 — jump over v2-v10 (created by previous buggy migrations in dev sessions).
    // Documents: unchanged (keep ++id so existing UUID records are preserved).
    // Annotations: switch to &id (client-generated UUID) + add compound index.
    //   Safe because annotations were never successfully persisted in production.
    // Signatures: add createdAt index.
    this.version(11).stores({
      documents:   '++id, fileName, createdAt, lastOpenedAt',
      annotations: '&id, documentId, pageNumber, type, createdAt, updatedAt, [documentId+pageNumber]',
      signatures:  '++id, label, type, createdAt',
    });
  }
}

export const db = new OpenPDFDatabase();
