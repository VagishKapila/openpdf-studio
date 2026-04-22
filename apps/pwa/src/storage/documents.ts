import { db, type StoredDocument } from './db';
export type { StoredDocument };

export async function saveDocument(file: File): Promise<string> {
  const data = await file.arrayBuffer();
  const id = crypto.randomUUID();
  const now = Date.now();
  await db.documents.add({
    id,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || 'application/pdf',
    data,
    pageCount: 0,   // updated after PDF.js loads
    createdAt: now,
    lastOpenedAt: now,
  });
  return id;
}

export async function updatePageCount(id: string, pageCount: number): Promise<void> {
  await db.documents.update(id, { pageCount });
}

export async function touchDocument(id: string): Promise<void> {
  await db.documents.update(id, { lastOpenedAt: Date.now() });
}

export async function getDocument(id: string): Promise<StoredDocument | undefined> {
  return db.documents.get(id);
}

export async function listDocuments(): Promise<StoredDocument[]> {
  return db.documents.orderBy('lastOpenedAt').reverse().toArray();
}

export async function deleteDocument(id: string): Promise<void> {
  await db.transaction('rw', [db.documents, db.annotations], async () => {
    await db.documents.delete(id);
    await db.annotations.where('documentId').equals(id).delete();
  });
}
