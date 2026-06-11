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

/**
 * COWORK-48 FIX-2: repair sweep for blank text annotations.
 *
 * The twin-tap placement bug (COWORK-48 BUG-3) left empty text annotations in
 * users' Dexie stores — invisible records rendered as nothing (or '…') that
 * pollute exports and selection. A text annotation whose text is empty or
 * whitespace-only and older than 5s is never legitimate: current UX always
 * commits or deletes within the active editing session.
 *
 * Runs on every loadForPage so existing users' stores self-heal.
 * Returns the number of records deleted.
 */
const BLANK_PURGE_MIN_AGE_MS = 5_000;

export async function purgeBlankTextAnnotations(
  documentId: DocumentId,
  pageNumber: PageNumber,
): Promise<number> {
  const rows = (await db.annotations
    .where('[documentId+pageNumber]')
    .equals([documentId, pageNumber])
    .toArray()) as Annotation[];
  const now = Date.now();
  const stale = rows.filter(
    (a) =>
      a.type === 'text' &&
      a.text.trim() === '' &&
      now - a.createdAt > BLANK_PURGE_MIN_AGE_MS,
  );
  if (stale.length === 0) return 0;
  await db.annotations.bulkDelete(stale.map((a) => a.id));
  return stale.length;
}
