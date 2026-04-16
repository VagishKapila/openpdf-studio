import { useState } from 'react';
import { useEditorStore } from '@/stores/editor-store';
import { ModalShell } from './ModalShell';
import { Loader } from 'lucide-react';

type CompressionLevel = 'low' | 'medium' | 'high';

interface CompressionOption {
  level: CompressionLevel;
  label: string;
  description: string;
  quality: string;
}

const compressionOptions: CompressionOption[] = [
  {
    level: 'low',
    label: 'Low',
    description: 'Best quality, larger file size',
    quality: '95%',
  },
  {
    level: 'medium',
    label: 'Medium',
    description: 'Good balance between quality and size',
    quality: '75%',
  },
  {
    level: 'high',
    label: 'High',
    description: 'Best compression, reduced quality',
    quality: '55%',
  },
];

export function CompressModal() {
  const { closeModal, activeDocument } = useEditorStore();
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>(
    'medium'
  );
  const [isCompressing, setIsCompressing] = useState(false);

  const handleCompress = async () => {
    const doc = activeDocument();
    if (!doc || !doc.pdfDoc) {
      alert('No document loaded');
      return;
    }

    setIsCompressing(true);
    try {
      // Placeholder: In production, this would compress the PDF
      // For now, we'll just show a success message
      alert(`Compressing with ${compressionLevel} compression...`);
      closeModal();
    } catch (error) {
      console.error('Error compressing PDF:', error);
      alert('Failed to compress PDF');
    } finally {
      setIsCompressing(false);
    }
  };

  const selectedOption = compressionOptions.find(
    (opt) => opt.level === compressionLevel
  );

  return (
    <ModalShell title="Compress PDF" onClose={closeModal} width="max-w-md">
      <div className="space-y-4">
        {/* Info */}
        <p className="text-sm text-gray-600">
          Choose a compression level to reduce your PDF file size
        </p>

        {/* Compression Options Grid */}
        <div className="space-y-2">
          {compressionOptions.map((option) => (
            <button
              key={option.level}
              onClick={() => setCompressionLevel(option.level)}
              className={`
                w-full p-4 rounded-lg border-2 transition-colors text-left
                ${
                  compressionLevel === option.level
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-gray-900">{option.label}</h3>
                <span className="text-xs font-medium text-gray-500">
                  {option.quality} quality
                </span>
              </div>
              <p className="text-sm text-gray-600">{option.description}</p>
            </button>
          ))}
        </div>

        {/* Selected Option Preview */}
        {selectedOption && (
          <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Selected:</span>
              <span className="font-medium text-gray-900">
                {selectedOption.label} compression
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Quality:</span>
              <span className="font-medium text-gray-900">
                {selectedOption.quality}
              </span>
            </div>
          </div>
        )}

        {/* Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <p className="text-xs text-amber-900">
            Higher compression levels may reduce image quality. Make sure to
            review the result before saving.
          </p>
        </div>
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
          onClick={handleCompress}
          disabled={isCompressing}
          className={`
            flex-1 px-4 py-2 text-sm font-medium rounded-lg text-white
            flex items-center justify-center gap-2 transition-opacity
            ${
              isCompressing
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90'
            }
          `}
        >
          {isCompressing && <Loader size={16} className="animate-spin" />}
          {isCompressing ? 'Compressing...' : 'Compress PDF'}
        </button>
      </div>
    </ModalShell>
  );
}
