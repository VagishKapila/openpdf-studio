import { useRef, useState } from 'react';
import { useDocumentStore, useUIStore, useViewportStore } from '@/store';
import { FileText, Menu, Upload, X, Download } from 'lucide-react';
import { loadPdfFromFile } from '@/lib/loadPdf';
import { useExport } from '@/hooks/useExport';

export function AppHeader() {
  const { document: doc, loadState, clearDocument } = useDocumentStore();
  const toggleAside = useUIStore((s) => s.toggleAside);
  const resetTransform = useViewportStore((s) => s.resetTransform);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { exportPdf, canExport, exporting } = useExport();
  const [exportError, setExportError] = useState(false);

  const handleOpenClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await loadPdfFromFile(file);
    } catch {
      // error already set in store
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCloseDocument = () => {
    clearDocument();
    resetTransform();
  };

  const handleExport = async () => {
    setExportError(false);
    try {
      await exportPdf();
    } catch {
      setExportError(true);
      setTimeout(() => setExportError(false), 3000);
    }
  };

  return (
    <header
      className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 bg-navy-900 px-3"
      data-testid="app-header"
    >
      {/* Left: menu + logo */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleAside}
          className="rounded p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
          aria-label="Menu"
        >
          <Menu size={18} />
        </button>
        <span className="text-sm font-semibold tracking-tight text-amber-400">OpenPDF</span>
        <span className="hidden text-xs text-white/40 sm:inline">Studio</span>
      </div>

      {/* Centre: document name */}
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

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        {/* Close button */}
        {loadState === 'ready' && doc && (
          <button
            onClick={handleCloseDocument}
            className="rounded p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
            aria-label="Close document"
            title="Close document"
            data-testid="close-button"
          >
            <X size={16} />
          </button>
        )}

        {/* Export button — only when a document is open */}
        {canExport && (
          <button
            onClick={handleExport}
            disabled={exporting}
            data-testid="export-button"
            className={[
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              exportError
                ? 'bg-red-700/60 text-red-200'
                : exporting
                ? 'bg-amber-500/50 text-black/60 cursor-not-allowed'
                : 'bg-amber-500 text-black hover:bg-amber-400',
            ].join(' ')}
            title="Export annotated PDF"
          >
            {exporting ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border border-black/40 border-t-transparent" />
                <span>Exporting…</span>
              </>
            ) : (
              <>
                <Download size={13} />
                <span>Export</span>
              </>
            )}
          </button>
        )}

        {/* Open button */}
        <button
          onClick={handleOpenClick}
          className="flex items-center gap-1.5 rounded-md bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-400/20"
          aria-label="Open PDF"
          data-testid="open-button"
        >
          <Upload size={13} />
          <span>Open</span>
        </button>

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
