import { useEffect, useRef, useState } from 'react';
import { useDocumentStore, useUIStore, useViewportStore, useAnnotationStore } from '@/store';
import { FileText, Menu, Upload, X, Download, Undo2, Redo2 } from 'lucide-react';
import { loadPdfFromFile } from '@/lib/loadPdf';
import { useExport } from '@/hooks/useExport';

export function AppHeader() {
  const { document: doc, loadState, clearDocument } = useDocumentStore();
  const toggleAside = useUIStore((s) => s.toggleAside);
  const resetTransform = useViewportStore((s) => s.resetTransform);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { exportPdf, canExport, exporting } = useExport();
  const [exportError, setExportError] = useState(false);

  const undoStack = useAnnotationStore((s) => s.undoStack);
  const redoStack = useAnnotationStore((s) => s.redoStack);
  const undo = useAnnotationStore((s) => s.undo);
  const redo = useAnnotationStore((s) => s.redo);
  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  // Keyboard shortcut: Cmd/Ctrl+Z → undo, Cmd/Ctrl+Shift+Z → redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key !== 'z') return;
      e.preventDefault();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

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
        <img src="/formiq-logo.png" alt="FormIQ" className="h-7 w-auto object-contain" style={{ maxWidth: '120px' }} />
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

        {/* Undo / Redo — only when a document is open */}
        {loadState === 'ready' && doc && (
          <>
            <button
              onClick={() => undo()}
              disabled={!canUndo}
              aria-label="Undo"
              title="Undo (⌘Z)"
              data-testid="undo-button"
              className="flex h-8 items-center gap-1 rounded-lg px-2 text-white/70 hover:bg-white/15 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            >
              <Undo2 size={15} />
              <span className="hidden lg:inline text-[11px] font-mono">⌘Z</span>
            </button>
            <button
              onClick={() => redo()}
              disabled={!canRedo}
              aria-label="Redo"
              title="Redo (⌘⇧Z)"
              data-testid="redo-button"
              className="flex h-8 items-center gap-1 rounded-lg px-2 text-white/70 hover:bg-white/15 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            >
              <Redo2 size={15} />
              <span className="hidden lg:inline text-[11px] font-mono">⌘⇧Z</span>
            </button>
          </>
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
                ? 'bg-amber-400/50 text-black/50 cursor-wait'
                : 'bg-amber-400 text-black hover:bg-amber-300',
            ].join(' ')}
            title="Export annotated PDF"
          >
            {exporting ? (
              <>
                <span className="inline-block animate-spin">⏳</span>
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
