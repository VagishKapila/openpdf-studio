import { useRef } from 'react';
import { useDocumentStore, useUIStore } from '@/store';
import { FileText, Menu, Upload } from 'lucide-react';
import { loadPdfFromFile } from '@/lib/loadPdf';

export function AppHeader() {
  const { document: doc, loadState } = useDocumentStore();
  const toggleAside = useUIStore((s) => s.toggleAside);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await loadPdfFromFile(file);
    } catch {
      // error already set in store by loadPdfFromFile
    } finally {
      // reset so the same file can be re-opened
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <header
      className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 bg-navy-900 px-3"
      data-testid="app-header"
    >
      <div className="flex items-center gap-2">
        <button
          onClick={toggleAside}
          className="rounded p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
          aria-label="Toggle panel"
        >
          <Menu size={18} />
        </button>
        <span className="text-sm font-semibold tracking-tight text-amber-400">OpenPDF</span>
        <span className="hidden text-xs text-white/40 sm:inline">Studio</span>
      </div>

      <div className="flex items-center gap-1 truncate px-2 text-xs text-white/50">
        {loadState === 'ready' && doc ? (
          <>
            <FileText size={13} className="shrink-0" />
            <span className="truncate max-w-[160px]">{doc.fileName}</span>
            <span className="shrink-0 text-white/30">· {doc.totalPages}p</span>
          </>
        ) : loadState === 'loading' ? (
          <span className="animate-pulse">Loading…</span>
        ) : null}
      </div>

      <div className="flex items-center">
        <button
          onClick={handleOpenClick}
          className="flex items-center gap-1.5 rounded-md bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-400/20"
          aria-label="Open PDF"
          data-testid="open-button"
        >
          <Upload size={13} />
          <span>Open</span>
        </button>

        {/* Hidden file input — persists across renders; reset after use */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleFileChange}
          className="hidden"
          data-testid="file-input"
          aria-hidden="true"
        />
      </div>
    </header>
  );
}
