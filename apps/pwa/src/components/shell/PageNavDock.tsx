import { useDocumentStore } from '@/store';

export function PageNavDock() {
  const { document: doc, currentPage, loadState, setPage } = useDocumentStore();

  if (loadState !== 'ready' || !doc) return null;

  const total = doc.totalPages;
  const prev = () => setPage(currentPage - 1);
  const next = () => setPage(currentPage + 1);

  // Show up to 7 page dots centred around the current page
  const windowSize = Math.min(total, 7);
  const start = Math.max(1, Math.min(total - windowSize + 1, currentPage - Math.floor(windowSize / 2)));
  const pages = Array.from({ length: windowSize }, (_, i) => start + i);

  return (
    <nav
      className="flex h-12 shrink-0 items-center justify-between border-t border-white/10 bg-navy-900 px-4"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Page navigation"
    >
      <button
        onClick={prev}
        disabled={currentPage <= 1}
        className="rounded-lg px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/10 disabled:opacity-30"
      >
        ← Prev
      </button>

      {total <= 5 ? (
        /* Dots for short documents */
        <div className="flex items-center gap-1" aria-label={`Page ${currentPage} of ${total}`}>
          {pages.map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              aria-current={p === currentPage ? 'page' : undefined}
              className="h-2 rounded-full transition-all"
              style={{
                width: p === currentPage ? '20px' : '8px',
                background: p === currentPage ? 'var(--color-amber, #f7b84b)' : 'rgba(246,244,238,0.25)',
              }}
            />
          ))}
        </div>
      ) : (
        /* Page counter for long documents (6+ pages) */
        <div
          className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-1"
          aria-label={`Page ${currentPage} of ${total}`}
        >
          <span className="text-xs text-white/70">
            {currentPage} / {total}
          </span>
        </div>
      )}

      <button
        onClick={next}
        disabled={currentPage >= total}
        className="rounded-lg px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/10 disabled:opacity-30"
      >
        Next →
      </button>
    </nav>
  );
}
