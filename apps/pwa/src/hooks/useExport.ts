import { useState } from 'react';
import { trackEvent } from '@/lib/analytics';
import { useDocumentStore } from '@/store';

import { getDocument } from '@/storage/documents';
import { getAllAnnotationsForDocument } from '@/storage/annotations';
import { exportAnnotatedPdf } from '@/lib/exportPdf';

export function useExport() {
  const [exporting, setExporting] = useState(false);
  const doc = useDocumentStore((s) => s.document);
  // annotations in store are only for the current page; we load all for the doc
  // (useAnnotationStore.annotations is the current-page slice — we need all pages)

  const canExport = !!doc;

  const exportPdf = async () => {
    if (!doc) return;
    setExporting(true);
    try {
      // Load raw PDF bytes from Dexie
      const stored = await getDocument(doc.id);
      if (!stored?.data) {
        alert('Could not load the original PDF. Please close and reopen the document.');
        return;
      }

      // Load ALL annotations for this document (all pages)
      const allAnnotations = await getAllAnnotationsForDocument(doc.id);

      const pdfBytes =
        stored.data instanceof Uint8Array
          ? stored.data
          : new Uint8Array(stored.data as ArrayBuffer);

      const annotatedBytes = await exportAnnotatedPdf(pdfBytes, allAnnotations);

      // COWORK-50 F1: open the exported PDF in a new tab so the browser's
      // native viewer shows a preview (with its own download/share controls).
      // Falls back to a direct download when the popup is blocked or we're in
      // a standalone PWA context where window.open returns null.
      const blob = new Blob([annotatedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const base = doc.fileName.replace(/\.pdf$/i, '');
      const previewWin = window.open(url, '_blank');
      if (!previewWin) {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${base}-annotated.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      // Delay revocation so the preview tab has time to load the blob
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      trackEvent('pdf_exported', {
        annotation_count: allAnnotations.length,
        mode: previewWin ? 'preview' : 'download',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export failed. Please try again.';
      alert(msg);
      console.error('[useExport]', err);
    } finally {
      setExporting(false);
    }
  };

  return { exportPdf, canExport, exporting };
}
