import { useDocumentStore, useUIStore } from '@/store';
import { FileText, Menu, Upload } from 'lucide-react';

export function AppHeader() {
  const { document: doc, loadState } = useDocumentStore();
  const toggleAside = useUIStore((s) => s.toggleAside);
  const setDoc = useDocumentStore((s) => s.setDocument);

  const handleFileOpen = async () => {
    const input = globalThis.document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,application/pdf';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      useDocumentStore.getState().setLoadState('loading');
      try {
        const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
        const pdfWorkerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default as string;
        GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
        const data = await file.arrayBuffer();
        const pdf = await getDocument({ data }).promise;
        setDoc({ id: crypto.randomUUID(), fileName: file.name, totalPages: pdf.numPages, pdf });
      } catch (e) {
        useDocumentStore.getState().setError(e instanceof Error ? e.message : String(e));
      }
    };
    input.click();
  };

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 bg-navy-900 px-3">
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

      <button
        onClick={handleFileOpen}
        className="flex items-center gap-1.5 rounded-md bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-400/20"
        aria-label="Open PDF"
      >
        <Upload size={13} />
        <span>Open</span>
      </button>
    </header>
  );
}
