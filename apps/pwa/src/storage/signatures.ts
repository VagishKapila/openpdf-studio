import { db, type StoredSignature } from './db';

export async function saveSignature(sig: Omit<StoredSignature, 'id' | 'createdAt'>): Promise<string> {
  const id = crypto.randomUUID();
  await db.signatures.add({ ...sig, id, createdAt: Date.now() });
  return id;
}

export async function listSignatures(): Promise<StoredSignature[]> {
  return db.signatures.orderBy('createdAt').reverse().toArray();
}

export async function deleteSignature(id: string): Promise<void> {
  await db.signatures.delete(id);
}
