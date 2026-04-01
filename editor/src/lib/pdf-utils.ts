import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export async function loadPdfFromBytes(
  bytes: Uint8Array
): Promise<pdfjsLib.PDFDocumentProxy> {
  return pdfjsLib.getDocument({ data: bytes }).promise;
}

export async function loadPdfFromFile(
  file: File
): Promise<{ pdfDoc: pdfjsLib.PDFDocumentProxy; pdfBytes: Uint8Array }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdfDoc = await loadPdfFromBytes(bytes);
  return { pdfDoc, pdfBytes: bytes };
}

export async function mergePdfs(files: File[]): Promise<Uint8Array> {
  const merged = await PDFDocument.create();

  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }

  return merged.save();
}

export async function splitPdf(
  bytes: Uint8Array,
  ranges: Array<[number, number]>
): Promise<Uint8Array[]> {
  const doc = await PDFDocument.load(bytes);
  const results: Uint8Array[] = [];

  for (const [start, end] of ranges) {
    const newDoc = await PDFDocument.create();
    const indices = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    const pages = await newDoc.copyPages(doc, indices);
    pages.forEach((p) => newDoc.addPage(p));
    results.push(await newDoc.save());
  }

  return results;
}

export async function rotatePage(
  bytes: Uint8Array,
  pageIndex: number,
  degrees: number
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);
  const page = doc.getPage(pageIndex);
  const currentRotation = page.getRotation().angle || 0;
  const newRotation = (currentRotation + degrees) % 360;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (page as any).setRotation(newRotation as any);
  return doc.save();
}

export async function deletePage(
  bytes: Uint8Array,
  pageIndex: number
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);
  doc.removePage(pageIndex);
  return doc.save();
}

export async function getPdfPageCount(
  bytes: Uint8Array
): Promise<number> {
  const doc = await loadPdfFromBytes(bytes);
  return doc.numPages;
}

export async function extractPageAsImage(
  bytes: Uint8Array,
  pageIndex: number,
  scale: number = 1.5
): Promise<string> {
  const doc = await loadPdfFromBytes(bytes);
  const page = await doc.getPage(pageIndex + 1);

  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Failed to get canvas context');

  const renderTask = page.render({
    canvasContext: context,
    viewport,
  });

  await renderTask.promise;
  return canvas.toDataURL('image/png');
}

export function generateDocId(): string {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isValidPdf(bytes: Uint8Array): boolean {
  // Check PDF magic bytes
  const header = new TextDecoder().decode(bytes.slice(0, 5));
  return header === '%PDF-';
}

export async function getPdfText(bytes: Uint8Array): Promise<string> {
  const doc = await loadPdfFromBytes(bytes);
  let text = '';

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    text += `\n--- Page ${i} ---\n${pageText}`;
  }

  return text;
}

export async function compressPdf(
  bytes: Uint8Array,
  _quality: 'low' | 'medium' | 'high' = 'medium'
): Promise<Uint8Array> {
  // Note: pdf-lib doesn't have built-in compression
  // This would need server-side processing with tools like qpdf or ghostscript
  // For now, return original bytes
  console.warn(
    'PDF compression requires server-side processing. Returning original bytes.'
  );
  return bytes;
}

export async function encryptPdf(
  bytes: Uint8Array,
  _ownerPassword: string,
  _userPassword?: string
): Promise<Uint8Array> {
  // Note: pdf-lib doesn't support encryption natively
  // This would need server-side processing with tools like qpdf
  // For now, return original bytes with warning
  console.warn(
    'PDF encryption requires server-side processing. Returning original bytes.'
  );
  return bytes;
}
