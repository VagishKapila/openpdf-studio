/** MoreMenu — bottom sheet with coming-soon items for future features. */

type MenuItem = { id: string; emoji: string; title: string; subtitle: string };

const MORE_ITEMS: MenuItem[] = [
  { id: 'pages',  emoji: '📄', title: 'Pages',  subtitle: 'View all pages' },
  { id: 'search', emoji: '🔍', title: 'Search', subtitle: 'Find text in document' },
  { id: 'export', emoji: '⬇️', title: 'Export', subtitle: 'Download with annotations' },
  { id: 'print',  emoji: '🖨️', title: 'Print',  subtitle: 'Print document' },
];

type MoreMenuProps = { open: boolean; onClose: () => void };

export function MoreMenu({ open, onClose }: MoreMenuProps) {
  if (!open) return null;
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
        data-testid="more-menu-backdrop"
      />
      {/* Sheet */}
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
            className="text-white/50 hover:text-white transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>
        {MORE_ITEMS.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-xl px-2 py-3 opacity-50"
          >
            <span className="text-xl w-7 text-center">{item.emoji}</span>
            <div className="flex-1">
              <div className="text-sm text-white">{item.title}</div>
              <div className="text-xs text-white/40">{item.subtitle}</div>
            </div>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/50">
              Soon
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
