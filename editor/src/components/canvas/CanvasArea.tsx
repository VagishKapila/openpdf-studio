import React from 'react';
import { useEditorStore } from '@/stores/editor-store';
import { WelcomeScreen } from './WelcomeScreen';

export const CanvasArea: React.FC = () => {
  const { activeDocument } = useEditorStore();
  const activeDoc = activeDocument();

  if (!activeDoc) {
    return <WelcomeScreen />;
  }

  return (
    <div className="flex-1 bg-[#FAFAFA] flex flex-col overflow-hidden">
      {/* Canvas Container */}
      <div className="flex-1 overflow-auto flex items-center justify-center">
        {/* Main PDF/Image Canvas */}
        <div className="canvas-container relative bg-white shadow-lg">
          {/* PDF Canvas Placeholder */}
          <div className="w-[8.5in] h-[11in] bg-gray-100 flex items-center justify-center border border-[#E8E5E0]">
            <div className="text-center text-[#6B6A6D]">
              <p className="text-sm font-medium mb-2">{activeDoc.fileName}</p>
              <p className="text-xs">Page {activeDoc.currentPage} of {activeDoc.totalPages}</p>
              <p className="text-xs mt-3 text-[#999]">
                PDF rendering via PDF.js (to be connected)
              </p>
            </div>
          </div>

          {/* Annotation Canvas Overlay */}
          <canvas
            className="absolute inset-0 cursor-crosshair"
            style={{
              display: 'none', // Will be shown when needed
            }}
          />

          {/* Text Layer */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              display: 'none', // Will be shown for text selection
            }}
          />
        </div>
      </div>

      {/* Ruler/Guides (optional, minimal) */}
      <div className="border-t border-[#E8E5E0] bg-white px-4 py-1 text-xs text-[#6B6A6D]">
        {/* Placeholder for rulers */}
      </div>
    </div>
  );
};
