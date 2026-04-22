import { useEffect, useState } from 'react';
import { loadPdfFromFile } from '@/lib/loadPdf';
import { FileText, Trash2, Upload, X } from 'lucide-react';
import { useDocumentStore, useUIStore } from '@/store';
import { pdfjs } from '@/lib/pdfjs';
import { listDocuments, deleteDocument, type StoredDocument } from '@/storage/documents';
import { db } from '@/storage/db';

export function DocumentSidebar() {
  const aside = useUIStore((s) => s.aside);
  const setAside = useUIStore((s) => s.setAside);
  const currentId = useDocumentStore((s) => s.document?.id);
  const setDocument = useDocumentStore((s) => s.setDocument);

  const [docs, setDocs] = useState<StoredDocument[]>([]);

  // Refresh list whenever sidebar opens or active doc changes
  useEffect(() => {
    if (!aside) return;
    void refreshList();
  }, [aside, currentId]);

  const refreshList = async () => {
    const list = await listDocuments();
    setDocs(list);
  };

  const handleSelect = async (doc: StoredDocument) => {
    try {
      const pdf = await pdfjs.getDocument({ data: doc.data.slice(0) }).promise;
      setDocument({
        id: doc.id,
        fileName: doc.fileName,
        totalPages: pdf.numPages,
        pdf,
      });
    } catch {
      // leave current doc in place if load fails
    }
    // On mobile, close sidebar after selection
    if (window.innerWidth < 768) setAside(false);
  };

  const handleDelete = async (doc: StoredDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${doc.fileName}"? This cannot be undone.`)) return;
    await deleteDocument(doc.id);
    // If the deleted doc is currently open, clear it
    if (doc.id === currentId) {
      useDocumentStore.getState().clearDocument();
    }
    void refreshList();
  };

  const handleOpenNew = () => {
    // Reuse the header's file input by triggering a fresh input click
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf,.pdf';
    input.onchange = async (ev) => {
      const file = (ev.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        await loadPdfFromFile(file);
        void refreshList();
        if (window.innerWidth < 768) setAside(false);
      } catch {
        // error surfaced in store
      }
    };
    input.click();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {aside && (
        <div
          onClick={() => setAside(false)}
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        data-testid="document-sidebar"
        className={[
          'fixed left-0 top-0 z-40 flex h-full w-64 flex-col',
          'border-r border-white/10 bg-[#0f1623]',
          'transition-transform duration-200 ease-in-out',
          'md:relative md:shrink-0',
          aside ? 'translate-x-0' : '-translate-x-full md:-translate-x-full',
          aside ? 'md:flex' : 'md:hidden',
        ].join(' ')}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-semibold text-white/80">Documents</h2>
          <button
            onClick={() => setAside(false)}
            className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Open new PDF button */}
        <div className="border-b border-white/10 p-3">
          <button
            onClick={handleOpenNew}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-amber-400/10 px-3 py-2 text-xs font-medium text-amber-400 hover:bg-amber-400/20"
          >
            <Upload size={14} />
            Open new PDF
          </button>
        </div>

        {/* Document list */}
        <div className="flex-1 overflow-y-auto">
          {docs.length === 0 ? (
            <div className="p-6 text-center text-xs text-white/40">
              No documents yet.
              <br />
              Open a PDF to get started.
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {docs.map((stored) => {
                const isCurrent = stored.id === currentId;
                return (
                  <li key={stored.id}>
                    <button
                      onClick={() => void handleSelect(stored)}
                      className={[
                        'group flex w-full items-start gap-3 px-4 py-3 text-left',
                        'hover:bg-white/5 transition-colors',
                        isCurrent ? 'bg-white/10' : '',
                      ].join(' ')}
                    >
                      <FileText
                        size={15}
                        className="mt-0.5 shrink-0 text-amber-400/70"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-medium text-white/80">
                          {stored.fileName}
                        </div>
                        <div className="mt-0.5 text-[10px] text-white/40">
                          {stored.pageCount} {stored.pageCount === 1 ? 'page' : 'pages'}
                          {' · '}
                          {new Date(stored.lastOpenedAt).toLocaleDateString()}
                        </div>
                      </div>
                      {/* Delete button — visible on hover */}
                      <button
                        onClick={(e) => void handleDelete(stored, e)}
                        className="rounded p-1 opacity-0 hover:bg-red-900/40 hover:text-red-300 group-hover:opacity-60 transition-opacity text-white/40"
                        aria-label={`Delete ${stored.fileName}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Escape hatch — recovers from DB schema corruption */}
        <div className="border-t border-white/10 p-3">
          <button
            onClick={async () => {
              if (!confirm('Clear all stored documents and annotations? This cannot be undone.')) return;
              await db.delete();
              window.location.reload();
            }}
            className="w-full rounded px-2 py-1.5 text-[10px] text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
            title="Clear all local storage and reload"
          >
            Clear local storage
          </button>
        </div>
      </aside>
    </>
  );
}
