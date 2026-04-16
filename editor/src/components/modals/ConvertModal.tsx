import { useState } from 'react';
import { useEditorStore } from '@/stores/editor-store';
import { ModalShell } from './ModalShell';
import { Loader } from 'lucide-react';

type Format = 'png' | 'jpg' | 'docx' | 'xlsx' | 'pptx';

interface FormatOption {
  format: Format;
  label: string;
  description: string;
  icon: string;
}

const formatOptions: FormatOption[] = [
  {
    format: 'png',
    label: 'PNG',
    description: 'Lossless image format',
    icon: '🖼️',
  },
  {
    format: 'jpg',
    label: 'JPG',
    description: 'Compressed image format',
    icon: '📸',
  },
  {
    format: 'docx',
    label: 'Word',
    description: 'Microsoft Word document',
    icon: '📝',
  },
  {
    format: 'xlsx',
    label: 'Excel',
    description: 'Microsoft Excel spreadsheet',
    icon: '📊',
  },
  {
    format: 'pptx',
    label: 'PowerPoint',
    description: 'Microsoft PowerPoint presentation',
    icon: '🎯',
  },
];

export function ConvertModal() {
  const { closeModal, activeDocument } = useEditorStore();
  const [selectedFormat, setSelectedFormat] = useState<Format>('png');
  const [isConverting, setIsConverting] = useState(false);

  const handleConvert = async () => {
    if (!activeDocument()) {
      alert('No document loaded');
      return;
    }

    setIsConverting(true);
    try {
      // Placeholder: In production, this would convert the document
      // For now, we'll just show a success message
      alert(`Converting to ${selectedFormat.toUpperCase()}...`);
      closeModal();
    } catch (error) {
      console.error('Error converting document:', error);
      alert('Failed to convert document');
    } finally {
      setIsConverting(false);
    }
  };

  const selectedOption = formatOptions.find(
    (opt) => opt.format === selectedFormat
  );

  return (
    <ModalShell title="Convert Document" onClose={closeModal} width="max-w-2xl">
      <div className="space-y-4">
        {/* Info */}
        <p className="text-sm text-gray-600">
          Convert your document to a different format
        </p>

        {/* Format Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {formatOptions.map((option) => (
            <button
              key={option.format}
              onClick={() => setSelectedFormat(option.format)}
              className={`
                p-4 rounded-lg border-2 transition-all text-center
                ${
                  selectedFormat === option.format
                    ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
            >
              <div className="text-2xl mb-2">{option.icon}</div>
              <h3 className="font-semibold text-sm text-gray-900">
                {option.label}
              </h3>
            </button>
          ))}
        </div>

        {/* Selected Format Details */}
        {selectedOption && (
          <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selectedOption.icon}</span>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selectedOption.label}
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedOption.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <p className="text-xs text-blue-900">
            <strong>Note:</strong> For image formats (PNG, JPG), each page will
            be converted to a separate image file. For document formats, the
            entire PDF will be converted to a single document.
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
          onClick={handleConvert}
          disabled={isConverting}
          className={`
            flex-1 px-4 py-2 text-sm font-medium rounded-lg text-white
            flex items-center justify-center gap-2 transition-opacity
            ${
              isConverting
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90'
            }
          `}
        >
          {isConverting && <Loader size={16} className="animate-spin" />}
          {isConverting ? 'Converting...' : `Convert to ${selectedFormat.toUpperCase()}`}
        </button>
      </div>
    </ModalShell>
  );
}
