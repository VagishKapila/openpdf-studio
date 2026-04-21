import { useToolStore } from '@/store';
import type { Tool } from '@/store';
import { MousePointer2, Type, Pen, Highlighter, PenLine } from 'lucide-react';

const TOOLS: { id: Tool; icon: React.ReactNode; label: string }[] = [
  { id: 'select',    icon: <MousePointer2 size={18} />, label: 'Select' },
  { id: 'text',      icon: <Type size={18} />,          label: 'Text' },
  { id: 'draw',      icon: <Pen size={18} />,           label: 'Draw' },
  { id: 'highlight', icon: <Highlighter size={18} />,   label: 'Highlight' },
  { id: 'sign',      icon: <PenLine size={18} />,       label: 'Sign' },
];

export function ToolPalette() {
  const { activeTool, setTool } = useToolStore();

  return (
    <aside className="hidden md:flex flex-col w-14 shrink-0 border-r border-white/10 bg-navy-900 py-2 gap-1 items-center" data-testid="tool-palette">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          onClick={() => setTool(t.id)}
          aria-label={t.label}
          aria-pressed={activeTool === t.id}
          data-testid={`tool-${t.id}`}
          title={t.label}
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
    </aside>
  );
}
