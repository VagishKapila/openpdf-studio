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

      // Trigger browser download
      const blob = new Blob([annotatedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const base = doc.fileName.replace(/\.pdf$/i, '');
      a.download = `${base}-annotated.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      trackEvent('pdf_exported', { annotation_count: allAnnotations.length });
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
