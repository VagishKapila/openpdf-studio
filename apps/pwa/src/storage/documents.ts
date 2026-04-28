import { db, type StoredDocument } from './db';
export type { StoredDocument };

export async function saveDocument(file: File): Promise<string> {
  const data = await file.arrayBuffer();

  // Deterministic ID: SHA-256 of first 64 KB ensures the same PDF always gets
  // the same document ID, so annotations survive a page refresh or app restart.
  // (A random UUID was previously used, causing annotations to be orphaned each
  // time the same file was reopened — COWORK-44.A Bug B)
  const sample = data.slice(0, 65536);
  const hashBuffer = await crypto.subtle.digest('SHA-256', sample);
  const id = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32); // 128-bit hex prefix — collision-free for typical usage

  const now = Date.now();

  const existing = await db.documents.get(id);
  if (existing) {
    // Same PDF reopened — bump lastOpenedAt so it appears first in the list;
    // leave annotations untouched.
    await db.documents.update(id, { lastOpenedAt: now });
    return id;
  }

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
