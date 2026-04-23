import { useToolStore } from '@/store';
import type { Tool } from '@/store';
import {
  TEXT_FONT_SIZES, TEXT_COLORS,
  DRAW_COLORS, DRAW_STROKE_WIDTHS,
  HIGHLIGHT_COLORS,
} from '@/store/tool';
import type { DrawStrokeWidth } from '@/store/tool';
import { MousePointer2, Type, Pen, Highlighter, PenLine } from 'lucide-react';

const TOOLS: { id: Tool; icon: React.ReactNode; label: string }[] = [
  { id: 'select',    icon: <MousePointer2 size={18} />, label: 'Select' },
  { id: 'text',      icon: <Type size={18} />,          label: 'Text' },
  { id: 'draw',      icon: <Pen size={18} />,           label: 'Draw' },
  { id: 'highlight', icon: <Highlighter size={18} />,   label: 'Highlight' },
  { id: 'sign',      icon: <PenLine size={18} />,       label: 'Sign' },
];

export function ToolPalette() {
  const {
    activeTool, setTool,
    textFontSize, textColor, setTextFontSize, setTextColor,
    drawColor, drawStrokeWidth, setDrawColor, setDrawStrokeWidth,
    highlightColor, setHighlightColor,
  } = useToolStore();

  return (
    <aside
      className="hidden md:flex flex-col w-14 shrink-0 border-r border-white/10 bg-navy-900 py-2 gap-1 items-center overflow-y-auto"
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

      {/* Text tool controls */}
      {activeTool === 'text' && (
        <div
          className="mt-2 flex flex-col items-center gap-2 w-full px-1"
          data-testid="text-tool-controls"
        >
          <div className="h-px w-8 bg-white/10" />
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
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
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

      {/* Draw tool controls */}
      {activeTool === 'draw' && (
        <div
          className="mt-2 flex flex-col items-center gap-2 w-full px-1"
          data-testid="draw-tool-controls"
        >
          <div className="h-px w-8 bg-white/10" />
          <span className="text-[10px] text-white/40">Width</span>
          <div className="flex flex-col gap-1" data-testid="stroke-width-buttons">
            {DRAW_STROKE_WIDTHS.map((w) => (
              <button
                key={w.value}
                onClick={() => setDrawStrokeWidth(w.value as DrawStrokeWidth)}
                aria-label={w.label}
                aria-pressed={drawStrokeWidth === w.value}
                title={w.label}
                className={[
                  'h-7 w-11 rounded text-[10px] transition-colors',
                  drawStrokeWidth === w.value
                    ? 'bg-amber-400/30 text-amber-400'
                    : 'text-white/50 hover:bg-white/10',
                ].join(' ')}
              >
                {w.label}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-white/40">Color</span>
          <div className="flex flex-col gap-1" aria-label="Draw color" data-testid="draw-color-swatches">
            {DRAW_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setDrawColor(c.value)}
                title={c.label}
                aria-label={c.label}
                className="h-5 w-5 rounded-full border-2 transition-all"
                style={{
                  background: c.value,
                  borderColor: drawColor === c.value ? '#F59E0B' : 'transparent',
                  transform: drawColor === c.value ? 'scale(1.2)' : 'scale(1)',
                  boxShadow: c.value === '#ffffff' ? 'inset 0 0 0 1px rgba(255,255,255,0.3)' : 'none',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Highlight tool controls */}
      {activeTool === 'highlight' && (
        <div
          className="mt-2 flex flex-col items-center gap-2 w-full px-1"
          data-testid="highlight-tool-controls"
        >
          <div className="h-px w-8 bg-white/10" />
          <span className="text-[10px] text-white/40">Color</span>
          <div className="flex flex-col gap-1" aria-label="Highlight color" data-testid="highlight-color-swatches">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setHighlightColor(c.value)}
                title={c.label}
                aria-label={c.label}
                className="h-5 w-5 rounded border-2 transition-all"
                style={{
                  background: c.value,
                  borderColor: highlightColor === c.value ? '#F59E0B' : 'transparent',
                  transform: highlightColor === c.value ? 'scale(1.2)' : 'scale(1)',
                  opacity: 0.9,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
