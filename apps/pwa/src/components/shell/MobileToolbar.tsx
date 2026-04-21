import { useToolStore } from '@/store';
import type { Tool } from '@/store';
import { MousePointer2, Type, Pen, Highlighter, PenLine, MoreHorizontal } from 'lucide-react';

const PRIMARY_TOOLS: { id: Tool; icon: React.ReactNode; label: string }[] = [
  { id: 'select',    icon: <MousePointer2 size={18} />, label: 'Select' },
  { id: 'text',      icon: <Type size={18} />,          label: 'Text' },
  { id: 'draw',      icon: <Pen size={18} />,           label: 'Draw' },
  { id: 'highlight', icon: <Highlighter size={18} />,   label: 'Highlight' },
  { id: 'sign',      icon: <PenLine size={18} />,       label: 'Sign' },
];

export function MobileToolbar() {
  const { activeTool, setTool } = useToolStore();

  return (
    <nav
      className="flex h-14 shrink-0 items-center justify-around border-t border-white/10 bg-navy-900 px-1"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Tool palette"
      data-testid="mobile-toolbar"
    >
      {PRIMARY_TOOLS.map((t) => (
        <button
          key={t.id}
          onClick={() => setTool(t.id)}
          aria-label={t.label}
          aria-pressed={activeTool === t.id}
          className={[
            'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
            activeTool === t.id
              ? 'bg-amber-400/20 text-amber-400'
              : 'text-white/50 hover:bg-white/10 hover:text-white',
          ].join(' ')}
        >
          {t.icon}
        </button>
      ))}

      {/* More — placeholder for future tools */}
      <button
        aria-label="More tools"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-white/50 hover:bg-white/10 hover:text-white transition-colors"
      >
        <MoreHorizontal size={18} />
      </button>
    </nav>
  );
}
