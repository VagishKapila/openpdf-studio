import { useState } from 'react';
import { useEditorStore } from '@/stores/editor-store';
import { useFileHandler } from '@/hooks/useFileHandler';
import { ModalShell } from './ModalShell';
import { Upload, X, Loader } from 'lucide-react';
import { mergePdfs } from '@/lib/pdf-utils';

export function MergeModal() {
  const { closeModal } = useEditorStore();
  const { openFile } = useFileHandler();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isMerging, setIsMerging] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (selectedFiles.length < 2) {
      alert('Please select at least 2 PDF files');
      return;
    }

    setIsMerging(true);
    try {
      // Merge PDFs — mergePdfs accepts File[] and returns Uint8Array
      const mergedBytes = await mergePdfs(selectedFiles);

      // Create a blob and open it
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });
      const file = new File([blob], 'merged.pdf', { type: 'application/pdf' });
      openFile(file);

      closeModal();
    } catch (error) {
      console.error('Error merging PDFs:', error);
      alert('Failed to merge PDFs');
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <ModalShell title="Merge PDFs" onClose={closeModal} width="max-w-lg">
      <div className="space-y-4">
        {/* File Input */}
        <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
          <input
            type="file"
            multiple
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="merge-file-input"
          />
          <label
            htmlFor="merge-file-input"
            className="flex flex-col items-center gap-2 cursor-pointer"
          >
            <Upload size={24} className="text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                Click to select PDFs
              </p>
              <p className="text-xs text-gray-500">or drag and drop</p>
            </div>
          </label>
        </div>

        {/* File List */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">
              Selected Files ({selectedFiles.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-700 truncate">
                      {index + 1}. {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                  >
                    <X size={16} className="text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <p className="text-xs text-gray-500">
          Files will be merged in the order shown above
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
        <button
          onClick={closeModal}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleMerge}
          disabled={isMerging || selectedFiles.length < 2}
          className={`
            flex-1 px-4 py-2 text-sm font-medium rounded-lg text-white
            flex items-center justify-center gap-2 transition-opacity
            ${
              isMerging || selectedFiles.length < 2
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90'
            }
          `}
        >
          {isMerging && <Loader size={16} className="animate-spin" />}
          {isMerging ? 'Merging...' : 'Merge PDFs'}
        </button>
      </div>
    </ModalShell>
  );
}
