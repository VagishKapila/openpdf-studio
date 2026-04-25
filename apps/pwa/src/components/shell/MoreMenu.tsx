import { useExport } from '@/hooks/useExport';

type MoreMenuProps = { open: boolean; onClose: () => void };

export function MoreMenu({ open, onClose }: MoreMenuProps) {
  const { exportPdf, canExport, exporting } = useExport();

  if (!open) return null;

  const handleExport = async () => {
    await exportPdf();
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
        data-testid="more-menu-backdrop"
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-neutral-900 px-4 pt-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
        data-testid="more-menu"
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-white">More</span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="text-lg leading-none text-white/50 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Pages — coming soon */}
        <div className="flex items-center gap-3 rounded-xl px-2 py-3 opacity-50">
          <span className="w-7 text-center text-xl">📄</span>
          <div className="flex-1">
            <div className="text-sm text-white">Pages</div>
            <div className="text-xs text-white/40">View all pages</div>
          </div>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/50">Soon</span>
        </div>

        {/* Search — coming soon */}
        <div className="flex items-center gap-3 rounded-xl px-2 py-3 opacity-50">
          <span className="w-7 text-center text-xl">🔍</span>
          <div className="flex-1">
            <div className="text-sm text-white">Search</div>
            <div className="text-xs text-white/40">Find text in document</div>
          </div>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/50">Soon</span>
        </div>

        {/* Export — ACTIVE */}
        <button
          onClick={handleExport}
          disabled={!canExport || exporting}
          data-testid="export-button-mobile"
          className="flex w-full items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="w-7 text-center text-xl">⬇️</span>
          <div className="flex-1 text-left">
            <div className="text-sm text-white">
              {exporting ? 'Exporting…' : 'Export PDF'}
            </div>
            <div className="text-xs text-white/40">Download with annotations</div>
          </div>
          {exporting && (
            <span className="h-4 w-4 animate-spin rounded-full border border-white/30 border-t-white" />
          )}
        </button>

        {/* Print — coming soon */}
        <div className="flex items-center gap-3 rounded-xl px-2 py-3 opacity-50">
          <span className="w-7 text-center text-xl">🖨️</span>
          <div className="flex-1">
            <div className="text-sm text-white">Print</div>
            <div className="text-xs text-white/40">Print document</div>
          </div>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/50">Soon</span>
        </div>
      </div>
    </>
  );
}
