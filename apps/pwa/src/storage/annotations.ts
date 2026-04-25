import { db } from './db';
import type { Annotation, AnnotationId, DocumentId, PageNumber } from '@/lib/annotations';

export async function saveAnnotation(ann: Annotation): Promise<void> {
  await db.annotations.put(ann);
}

export async function deleteAnnotation(id: AnnotationId): Promise<void> {
  await db.annotations.delete(id);
}

export async function getAnnotationsForPage(
  documentId: DocumentId,
  pageNumber: PageNumber,
): Promise<Annotation[]> {
  const rows = await db.annotations
    .where('[documentId+pageNumber]')
    .equals([documentId, pageNumber])
    .sortBy('createdAt');
  return rows as Annotation[];
}

export async function deleteAllAnnotationsForDocument(
  documentId: DocumentId,
): Promise<void> {
  await db.annotations.where('documentId').equals(documentId).delete();
}

export async function getAllAnnotationsForDocument(
  documentId: DocumentId,
): Promise<Annotation[]> {
  const rows = await db.annotations.where('documentId').equals(documentId).toArray();
  return rows as Annotation[];
}

export async function deleteAnnotationsForPage(
  documentId: DocumentId,
  pageNumber: PageNumber,
): Promise<void> {
  await db.annotations
    .where('[documentId+pageNumber]')
    .equals([documentId, pageNumber])
    .delete();
}
