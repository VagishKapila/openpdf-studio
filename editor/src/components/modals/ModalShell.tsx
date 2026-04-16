import React from 'react';
import { X } from 'lucide-react';

interface ModalShellProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}

export function ModalShell({
  title,
  onClose,
  children,
  width = 'max-w-md',
}: ModalShellProps) {
  return (
    <div
      className={`
        bg-white rounded-2xl shadow-2xl overflow-hidden
        ${width}
        w-full mx-4
        max-h-[90vh] overflow-y-auto
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Close modal"
        >
          <X size={20} className="text-gray-500" />
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}
