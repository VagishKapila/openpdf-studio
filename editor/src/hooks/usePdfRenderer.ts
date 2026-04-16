import { useCallback, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

interface TextContent {
  items: Array<{
    str: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

interface UsePdfRendererReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  renderPage: (pdfDoc: pdfjsLib.PDFDocumentProxy, pageNum: number, zoom: number) => Promise<void>;
  getTextContent: (pdfDoc: pdfjsLib.PDFDocumentProxy, pageNum: number) => Promise<TextContent>;
}

export function usePdfRenderer(): UsePdfRendererReturn {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const renderPage = useCallback(
    async (pdfDoc: pdfjsLib.PDFDocumentProxy, pageNum: number, zoom: number) => {
      if (!canvasRef.current || !pdfDoc) return;

      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: zoom });
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: ctx,
          viewport,
        }).promise;
      } catch (error) {
        console.error('Error rendering PDF page:', error);
      }
    },
    []
  );

  const getTextContent = useCallback(
    async (pdfDoc: pdfjsLib.PDFDocumentProxy, pageNum: number): Promise<TextContent> => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        return textContent as unknown as TextContent;
      } catch (error) {
        console.error('Error extracting text content:', error);
        return { items: [] };
      }
    },
    []
  );

  return {
    canvasRef,
    renderPage,
    getTextContent,
  };
}
