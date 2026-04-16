import React, { useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { useEditorStore } from '@/stores/editor-store';

export const DocumentTabBar: React.FC = () => {
  const { documents, activeDocId, setActiveDocument, removeDocument } = useEditorStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleRemoveDocument = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeDocument(id);
  };

  // Auto-scroll active tab into view
  useEffect(() => {
    if (scrollRef.current && activeDocId) {
      const activeTab = scrollRef.current.querySelector(`[data-doc-id="${activeDocId}"]`);
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  }, [activeDocId]);

  const handleAddDocument = () => {
    // Will be connected to file input logic
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.png,.jpg,.jpeg,.gif,.bmp';
    input.click();
  };

  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="h-9 bg-white border-b border-[#E8E5E0] flex items-center px-2 gap-1 shrink-0 overflow-x-auto scroll-smooth" ref={scrollRef}>
      {documents.map((doc) => (
        <button
          key={doc.id}
          data-doc-id={doc.id}
          onClick={() => setActiveDocument(doc.id)}
          className={`
            inline-flex items-center gap-2 px-3 py-1.5 rounded text-sm whitespace-nowrap
            transition-all border-b-2
            ${
              activeDocId === doc.id
                ? 'border-b-brand-500 bg-brand-50 text-brand-600 font-medium'
                : 'border-b-transparent text-[#6B6A6D] hover:bg-[#F5F3F0]'
            }
          `}
        >
          <span className="max-w-[120px] overflow-hidden text-ellipsis">
            {doc.fileName}
          </span>
          <button
            onClick={(e) => handleRemoveDocument(doc.id, e)}
            className="p-0.5 hover:bg-black/10 rounded transition-colors"
            title="Close document"
          >
            <X size={14} />
          </button>
        </button>
      ))}

      {/* Add Document Button */}
      <button
        onClick={handleAddDocument}
        className="ml-auto p-1.5 text-[#6B6A6D] hover:bg-[#F5F3F0] rounded transition-colors"
        title="Open new document"
      >
        <Plus size={18} />
      </button>
    </div>
  );
};
