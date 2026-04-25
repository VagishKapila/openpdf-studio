import { useState } from 'react';
import { useToolStore } from '@/store';
import type { Tool } from '@/store';
import { MousePointer2, Type, Pen, Highlighter, PenLine, MoreHorizontal } from 'lucide-react';
import { MoreMenu } from './MoreMenu';

const PRIMARY_TOOLS: { id: Tool; icon: React.ReactNode; label: string }[] = [
  { id: 'select',    icon: <MousePointer2 size={18} />, label: 'Move' },
  { id: 'text',      icon: <Type size={18} />,          label: 'Text' },
  { id: 'draw',      icon: <Pen size={18} />,           label: 'Draw' },
  { id: 'highlight', icon: <Highlighter size={18} />,   label: 'Mark' },
  { id: 'sign',      icon: <PenLine size={18} />,       label: 'Sign' },
];

export function MobileToolbar() {
  const [moreOpen, setMoreOpen] = useState(false);
  const { activeTool, setTool } = useToolStore();

  return (
    <div className="md:hidden shrink-0">
      <nav
        className="flex h-16 items-center justify-around border-t border-white/10 bg-navy-900 px-1"
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
              'relative flex flex-col h-14 w-14 items-center justify-center gap-0.5 rounded-xl transition-colors',
              activeTool === t.id
                ? 'text-amber-400'
                : 'text-white/50 hover:bg-white/10 hover:text-white',
            ].join(' ')}
          >
            {t.icon}
            <span className="text-[10px] leading-none">{t.label}</span>
            {activeTool === t.id && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-amber-400" />
            )}
          </button>
        ))}

        <button
          aria-label="More tools"
          onClick={() => setMoreOpen(true)}
          className="relative flex flex-col h-14 w-14 items-center justify-center gap-0.5 rounded-xl text-white/50 hover:bg-white/10 hover:text-white transition-colors"
        >
          <MoreHorizontal size={18} />
          <span className="text-[10px] leading-none">More</span>
        </button>
      </nav>

      <MoreMenu open={moreOpen} onClose={() => setMoreOpen(false)} />
    </div>
  );
}
