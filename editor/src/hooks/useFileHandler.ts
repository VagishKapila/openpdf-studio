import { useCallback } from 'react';
import { useEditorStore } from '@/stores/editor-store';
import { loadPdfFromFile, generateDocId } from '@/lib/pdf-utils';
import type { EditorDocument } from '@/types';

export function useFileHandler() {
  const addDocument = useEditorStore((s) => s.addDocument);

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const openFile = useCallback(
    async (file: File) => {
      try {
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          const result = await loadPdfFromFile(file);
          const doc: EditorDocument = {
            id: generateDocId(),
            fileName: file.name,
            pdfDoc: result.pdfDoc,
            pdfBytes: result.pdfBytes,
            currentPage: 1,
            totalPages: result.pdfDoc.numPages,
            zoom: 1.0,
            pageAnnotations: {},
            textEdits: {},
            history: [],
            historyIndex: -1,
            isImage: false,
            imageData: null,
            hasUnsavedChanges: false,
          };
          addDocument(doc);
        } else if (file.type.startsWith('image/')) {
          const dataUrl = await readFileAsDataUrl(file);
          const doc: EditorDocument = {
            id: generateDocId(),
            fileName: file.name,
            pdfDoc: null,
            pdfBytes: null,
            currentPage: 1,
            totalPages: 1,
            zoom: 1.0,
            pageAnnotations: {},
            textEdits: {},
            history: [],
            historyIndex: -1,
            isImage: true,
            imageData: dataUrl,
            hasUnsavedChanges: false,
          };
          addDocument(doc);
        }
      } catch (error) {
        console.error('Error opening file:', error);
      }
    },
    [addDocument]
  );

  const openFileDialog = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.png,.jpg,.jpeg,.gif,.bmp,.webp';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) openFile(file);
    };
    input.click();
  }, [openFile]);

  return {
    openFile,
    openFileDialog,
  };
}
