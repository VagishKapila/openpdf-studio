import React, { useState } from 'react';
import { Upload, FileText, Combine, BarChart3, Sparkles } from 'lucide-react';

const OpenPDF StudioLogo: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="13" x2="8" y2="13" />
    <line x1="12" y1="17" x2="8" y2="17" />
  </svg>
);

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const WelcomeScreen: React.FC = () => {
  const [isDragActive, setIsDragActive] = useState(false);

  const features: Feature[] = [
    {
      icon: <FileText size={32} className="text-brand-600" />,
      title: 'Edit PDFs',
      description: 'Add text, images, and annotations to your documents',
    },
    {
      icon: <Combine size={32} className="text-brand-600" />,
      title: 'Merge & Split',
      description: 'Combine multiple PDFs or split them into parts',
    },
    {
      icon: <BarChart3 size={32} className="text-brand-600" />,
      title: 'Sign Documents',
      description: 'Add e-signatures and collect signatures from others',
    },
    {
      icon: <Sparkles size={32} className="text-brand-600" />,
      title: 'AI OCR',
      description: 'Extract text from scanned documents with AI',
    },
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    // Handle files: e.dataTransfer.files
  };

  const handleOpenFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.png,.jpg,.jpeg,.gif,.bmp';
    input.click();
  };

  return (
    <div
      className={`
        flex-1 flex flex-col items-center justify-center px-6 py-12
        transition-colors ${
          isDragActive ? 'bg-brand-50' : 'bg-[#FAFAFA]'
        }
      `}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {/* Logo */}
      <div className="w-16 h-16 text-brand-600 mb-6">
        <OpenPDF StudioLogo />
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-[#2D2B2E] mb-2">Welcome to OpenPDF Studio</h1>

      {/* Subtitle */}
      <p className="text-[#6B6A6D] text-center mb-8 max-w-lg">
        Open a PDF or drop a file to get started
      </p>

      {/* Drop Zone */}
      <div
        className={`
          w-full max-w-md p-8 rounded-lg border-2 border-dashed mb-8
          transition-all flex flex-col items-center justify-center
          ${
            isDragActive
              ? 'border-brand-500 bg-brand-50'
              : 'border-[#E8E5E0] hover:border-brand-300'
          }
        `}
      >
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${isDragActive ? 'bg-brand-100' : 'bg-[#F5F3F0]'}`}>
          <Upload
            size={24}
            className={isDragActive ? 'text-brand-600' : 'text-[#6B6A6D]'}
          />
        </div>
        <p className="text-sm text-[#2D2B2E] font-medium mb-1">Drag and drop your files</p>
        <p className="text-xs text-[#6B6A6D]">PDF, PNG, JPG, GIF or BMP</p>
      </div>

      {/* Open File Button */}
      <button
        onClick={handleOpenFile}
        className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded transition-colors mb-12"
      >
        Open File
      </button>

      {/* Features Grid */}
      <div className="w-full max-w-2xl">
        <p className="text-sm text-[#6B6A6D] text-center mb-6 font-medium">What you can do</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="p-4 bg-white rounded-lg border border-[#E8E5E0] hover:border-brand-300 transition-all hover:shadow-md"
            >
              <div className="mb-3">{feature.icon}</div>
              <h3 className="font-medium text-[#2D2B2E] mb-1">{feature.title}</h3>
              <p className="text-sm text-[#6B6A6D]">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
