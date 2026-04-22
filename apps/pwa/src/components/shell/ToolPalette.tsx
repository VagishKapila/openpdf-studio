import { useToolStore } from '@/store';
import type { Tool } from '@/store';
import { TEXT_FONT_SIZES, TEXT_COLORS } from '@/store/tool';
import { MousePointer2, Type, Pen, Highlighter, PenLine } from 'lucide-react';

const TOOLS: { id: Tool; icon: React.ReactNode; label: string }[] = [
  { id: 'select',    icon: <MousePointer2 size={18} />, label: 'Select' },
  { id: 'text',      icon: <Type size={18} />,          label: 'Text' },
  { id: 'draw',      icon: <Pen size={18} />,           label: 'Draw' },
  { id: 'highlight', icon: <Highlighter size={18} />,   label: 'Highlight' },
  { id: 'sign',      icon: <PenLine size={18} />,       label: 'Sign' },
];

export function ToolPalette() {
  const { activeTool, setTool, textFontSize, textColor, setTextFontSize, setTextColor } =
    useToolStore();

  return (
    <aside
      className="hidden md:flex flex-col w-14 shrink-0 border-r border-white/10 bg-navy-900 py-2 gap-1 items-center"
      data-testid="tool-palette"
    >
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

      {/* Text tool controls — shown only when text tool is active */}
      {activeTool === 'text' && (
        <div
          className="mt-2 flex flex-col items-center gap-2 w-full px-1"
          data-testid="text-tool-controls"
        >
          <div className="h-px w-8 bg-white/10" />

          {/* Font size picker */}
          <select
            value={textFontSize}
            onChange={(e) =>
              setTextFontSize(Number(e.target.value) as (typeof TEXT_FONT_SIZES)[number])
            }
            aria-label="Font size"
            data-testid="font-size-select"
            className="w-11 rounded bg-white/10 px-0.5 py-1 text-center text-xs text-white focus:outline-none"
          >
            {TEXT_FONT_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Color swatches */}
          <div className="flex flex-col gap-1" aria-label="Text color" data-testid="color-swatches">
            {TEXT_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setTextColor(c.value)}
                title={c.label}
                aria-label={c.label}
                className="h-5 w-5 rounded-full border-2 transition-all"
                style={{
                  background: c.value,
                  borderColor: textColor === c.value ? '#F59E0B' : 'transparent',
                  transform: textColor === c.value ? 'scale(1.2)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
