/**
 * API client for the public signing flow (no auth required).
 * Uses access token passed via URL to authenticate requests.
 */

import type { SignatureRequest, SignatureField, DocumentRecord } from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface GetSigningRequestResponse {
  request: SignatureRequest;
  document: DocumentRecord;
  sender: {
    name: string;
    email: string;
  };
  fields: SignatureField[];
}

interface SubmitSignaturesPayload {
  fields: Array<{
    fieldId: string;
    value: string; // base64 data URL or text value
    type: 'draw' | 'type' | 'date' | 'name' | 'text';
  }>;
}

export async function getSigningRequest(accessToken: string) {
  const res = await fetch(`${API_BASE}/sign/${accessToken}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.message || errorData.error || 'Failed to load signing request';
    throw new Error(message);
  }

  const data = await res.json();
  return data.data as GetSigningRequestResponse;
}

export async function submitSignatures(accessToken: string, payload: SubmitSignaturesPayload) {
  const res = await fetch(`${API_BASE}/sign/${accessToken}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.message || errorData.error || 'Failed to submit signatures';
    throw new Error(message);
  }

  const data = await res.json();
  return data.data;
}

export async function finalizeSignedDocument(accessToken: string, pdfBlob: Blob) {
  const formData = new FormData();
  formData.append('pdf', pdfBlob, 'signed-document.pdf');

  const res = await fetch(`${API_BASE}/sign/${accessToken}/finalize`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.message || errorData.error || 'Failed to finalize document';
    throw new Error(message);
  }

  const data = await res.json();
  return data.data;
}

export async function declineSigningRequest(accessToken: string, reason?: string) {
  const res = await fetch(`${API_BASE}/sign/${accessToken}/decline`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.message || errorData.error || 'Failed to decline request';
    throw new Error(message);
  }

  const data = await res.json();
  return data.data;
}

export async function getSignedDocumentDownloadUrl(accessToken: string) {
  const res = await fetch(`${API_BASE}/sign/${accessToken}/download`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.message || errorData.error || 'Failed to get download URL';
    throw new Error(message);
  }

  const data = await res.json();
  return data.data as { url: string };
}
