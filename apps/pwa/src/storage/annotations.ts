import { db, type StoredAnnotation } from './db';

export async function addAnnotation(annotation: Omit<StoredAnnotation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const id = crypto.randomUUID();
  const now = Date.now();
  await db.annotations.add({ ...annotation, id, createdAt: now, updatedAt: now });
  return id;
}

export async function updateAnnotation(id: string, data: unknown): Promise<void> {
  await db.annotations.update(id, { data, updatedAt: Date.now() });
}

export async function deleteAnnotation(id: string): Promise<void> {
  await db.annotations.delete(id);
}

export async function getAnnotationsForPage(documentId: string, pageNumber: number): Promise<StoredAnnotation[]> {
  return db.annotations
    .where('[documentId+pageNumber]')
    .equals([documentId, pageNumber])
    .toArray();
}

export async function getAllAnnotations(documentId: string): Promise<StoredAnnotation[]> {
  return db.annotations.where('documentId').equals(documentId).toArray();
}
