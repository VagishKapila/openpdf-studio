import React from 'react';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { useEditorStore } from '@/stores/editor-store';

export const StatusBar: React.FC = () => {
  const { activeDocument, setZoom } = useEditorStore();
  const activeDoc = activeDocument();

  const getStatusText = () => {
    if (!activeDoc) {
      return 'Ready';
    }
    return `Page ${activeDoc.currentPage} of ${activeDoc.totalPages}`;
  };

  return (
    <div className="h-7 bg-[#F5F3F0] border-t border-[#E8E5E0] flex items-center justify-between px-4 text-xs text-[#6B6A6D] shrink-0">
      {/* Left: Status */}
      <span>{getStatusText()}</span>

      {/* Center: Page Indicator */}
      {activeDoc && (
        <span className="text-[#2D2B2E]">
          {activeDoc.currentPage}/{activeDoc.totalPages}
        </span>
      )}

      {/* Right: Zoom Controls */}
      {activeDoc && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(activeDoc.id, activeDoc.zoom - 10)}
            className="p-0.5 text-[#6B6A6D] hover:text-[#2D2B2E] transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={14} />
          </button>
          <span className="min-w-[45px] text-center">{Math.round(activeDoc.zoom)}%</span>
          <button
            onClick={() => setZoom(activeDoc.id, activeDoc.zoom + 10)}
            className="p-0.5 text-[#6B6A6D] hover:text-[#2D2B2E] transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => setZoom(activeDoc.id, 100)}
            className="p-0.5 text-[#6B6A6D] hover:text-[#2D2B2E] transition-colors"
            title="Fit to page"
          >
            <Maximize size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
