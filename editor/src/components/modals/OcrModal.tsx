import { useState } from 'react';
import { useEditorStore } from '@/stores/editor-store';
import { ModalShell } from './ModalShell';
import { Copy, Check, Loader } from 'lucide-react';

export function OcrModal() {
  const { closeModal, activeDocument } = useEditorStore();
  const [ocrText, setOcrText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleOcr = async () => {
    const doc = activeDocument();
    if (!doc || !doc.pdfDoc) {
      alert('No document loaded');
      return;
    }

    setIsProcessing(true);
    try {
      // Extract text from the PDF using pdf.js text content
      const { usePdfRenderer } = await import('@/hooks/usePdfRenderer');
      const textContent = await usePdfRenderer().getTextContent(
        doc.pdfDoc,
        doc.currentPage
      );

      const extractedText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      setOcrText(extractedText);
    } catch (error) {
      console.error('Error processing OCR:', error);
      alert('Failed to process OCR');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(ocrText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <ModalShell title="OCR Text Extraction" onClose={closeModal} width="max-w-2xl">
      <div className="space-y-4">
        {/* Info */}
        <p className="text-sm text-gray-600">
          Extract text from your PDF document using Optical Character Recognition
        </p>

        {/* Process Button */}
        {!ocrText && (
          <button
            onClick={handleOcr}
            disabled={isProcessing}
            className={`
              w-full px-4 py-2.5 text-sm font-medium rounded-lg
              flex items-center justify-center gap-2
              transition-opacity
              ${
                isProcessing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90'
              }
            `}
          >
            {isProcessing && <Loader size={16} className="animate-spin" />}
            {isProcessing ? 'Processing...' : 'Extract Text'}
          </button>
        )}

        {/* Results */}
        {ocrText && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Extracted Text</h3>
              <button
                onClick={handleCopyText}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy
                  </>
                )}
              </button>
            </div>
            <textarea
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              className="w-full h-64 px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono resize-none"
            />
            <p className="text-xs text-gray-500">
              {ocrText.length} characters
            </p>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader size={32} className="animate-spin text-indigo-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Processing document...</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
        <button
          onClick={closeModal}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Close
        </button>
        {ocrText && (
          <button
            onClick={() => {
              handleCopyText();
              closeModal();
            }}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg hover:opacity-90 transition-opacity"
          >
            Copy & Close
          </button>
        )}
      </div>
    </ModalShell>
  );
}
