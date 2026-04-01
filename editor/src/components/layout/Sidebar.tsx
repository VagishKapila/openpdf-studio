import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Copy, Trash2, RotateCw, ArrowUp, ArrowDown } from 'lucide-react';
import { useEditorStore } from '@/stores/editor-store';

export const Sidebar: React.FC = () => {
  const { sidebarOpen, toggleSidebar, activeDocument, goToPage } = useEditorStore();
  const [contextMenu, setContextMenu] = useState<{ page: number; x: number; y: number } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const activeDoc = activeDocument();

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target as Node)
      ) {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenu]);

  if (!sidebarOpen || !activeDoc) {
    return (
      <button
        onClick={toggleSidebar}
        className="w-12 bg-white border-r border-[#E8E5E0] flex items-center justify-center hover:bg-[#F5F3F0] transition-colors shrink-0"
        title="Show sidebar"
      >
        <ChevronLeft size={20} className="text-[#6B6A6D]" />
      </button>
    );
  }

  const pages = Array.from({ length: activeDoc.totalPages }, (_, i) => i + 1);

  return (
    <div className="w-52 bg-white border-r border-[#E8E5E0] flex flex-col shrink-0">
      {/* Header */}
      <div className="h-11 border-b border-[#E8E5E0] flex items-center justify-between px-3">
        <h3 className="text-sm font-semibold text-[#2D2B2E]">Pages</h3>
        <button
          onClick={toggleSidebar}
          className="p-1 hover:bg-[#F5F3F0] rounded transition-colors"
          title="Hide sidebar"
        >
          <ChevronLeft size={18} className="text-[#6B6A6D]" />
        </button>
      </div>

      {/* Page Thumbnails */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="space-y-2">
          {pages.map((pageNum) => (
            <div
              key={pageNum}
              className="relative"
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ page: pageNum, x: e.clientX, y: e.clientY });
              }}
            >
              <button
                onClick={() => goToPage(activeDoc.id, pageNum)}
                className={`
                  w-full aspect-[8.5/11] rounded border-2 transition-all flex flex-col items-center justify-center
                  ${
                    activeDoc.currentPage === pageNum
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-[#E8E5E0] bg-white hover:border-brand-300'
                  }
                `}
              >
                {/* Placeholder thumbnail */}
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-sm flex items-center justify-center">
                  <span className="text-xs text-[#6B6A6D] font-medium">{pageNum}</span>
                </div>
              </button>
              {activeDoc.currentPage === pageNum && (
                <div className="absolute inset-0 border-2 border-brand-500 rounded pointer-events-none" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-white rounded-lg shadow-lg border border-[#E8E5E0] z-50 py-1"
          style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
        >
          <button className="w-full px-4 py-2 text-sm text-left text-[#2D2B2E] hover:bg-[#F5F3F0] flex items-center gap-2 transition-colors whitespace-nowrap">
            <Copy size={16} />
            Duplicate Page
          </button>
          <button className="w-full px-4 py-2 text-sm text-left text-[#2D2B2E] hover:bg-[#F5F3F0] flex items-center gap-2 transition-colors whitespace-nowrap">
            <RotateCw size={16} />
            Rotate Page
          </button>
          <button className="w-full px-4 py-2 text-sm text-left text-[#2D2B2E] hover:bg-[#F5F3F0] flex items-center gap-2 transition-colors whitespace-nowrap">
            <ArrowUp size={16} />
            Move Up
          </button>
          <button className="w-full px-4 py-2 text-sm text-left text-[#2D2B2E] hover:bg-[#F5F3F0] flex items-center gap-2 transition-colors whitespace-nowrap">
            <ArrowDown size={16} />
            Move Down
          </button>
          <hr className="my-1 border-[#E8E5E0]" />
          <button className="w-full px-4 py-2 text-sm text-left text-[#DC2626] hover:bg-red-50 flex items-center gap-2 transition-colors whitespace-nowrap">
            <Trash2 size={16} />
            Delete Page
          </button>
        </div>
      )}
    </div>
  );
};
