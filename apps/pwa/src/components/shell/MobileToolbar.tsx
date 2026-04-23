import { useToolStore } from '@/store';
import type { Tool } from '@/store';
import {
  TEXT_FONT_SIZES, TEXT_COLORS,
  DRAW_COLORS, DRAW_STROKE_WIDTHS,
  HIGHLIGHT_COLORS,
} from '@/store/tool';
import type { DrawStrokeWidth } from '@/store/tool';
import { MousePointer2, Type, Pen, Highlighter, PenLine, MoreHorizontal } from 'lucide-react';

const PRIMARY_TOOLS: { id: Tool; icon: React.ReactNode; label: string }[] = [
  { id: 'select',    icon: <MousePointer2 size={18} />, label: 'Select' },
  { id: 'text',      icon: <Type size={18} />,          label: 'Text' },
  { id: 'draw',      icon: <Pen size={18} />,           label: 'Draw' },
  { id: 'highlight', icon: <Highlighter size={18} />,   label: 'Highlight' },
  { id: 'sign',      icon: <PenLine size={18} />,       label: 'Sign' },
];

export function MobileToolbar() {
  const {
    activeTool, setTool,
    textFontSize, textColor, setTextFontSize, setTextColor,
    drawColor, drawStrokeWidth, setDrawColor, setDrawStrokeWidth,
    highlightColor, setHighlightColor,
  } = useToolStore();

  return (
    <div className="md:hidden shrink-0">
      {/* Text tool controls */}
      {activeTool === 'text' && (
        <div
          className="flex h-10 items-center gap-3 border-t border-white/10 bg-navy-900 px-4"
          data-testid="text-tool-controls-mobile"
        >
          <span className="text-xs text-white/40">Size</span>
          <select
            value={textFontSize}
            onChange={(e) =>
              setTextFontSize(Number(e.target.value) as (typeof TEXT_FONT_SIZES)[number])
            }
            aria-label="Font size"
            data-testid="font-size-select-mobile"
            className="rounded bg-white/10 px-2 py-0.5 text-xs text-white focus:outline-none"
          >
            {TEXT_FONT_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span className="text-xs text-white/40">Color</span>
          <div className="flex gap-2" data-testid="color-swatches-mobile">
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
          className="flex h-10 items-center gap-3 border-t border-white/10 bg-navy-900 px-4"
          data-testid="draw-tool-controls-mobile"
        >
          <span className="text-xs text-white/40">Width</span>
          <div className="flex gap-1" data-testid="stroke-width-buttons-mobile">
            {DRAW_STROKE_WIDTHS.map((w) => (
              <button
                key={w.value}
                onClick={() => setDrawStrokeWidth(w.value as DrawStrokeWidth)}
                aria-label={w.label}
                aria-pressed={drawStrokeWidth === w.value}
                className={[
                  'rounded px-2 py-0.5 text-xs transition-colors',
                  drawStrokeWidth === w.value
                    ? 'bg-amber-400/30 text-amber-400'
                    : 'text-white/50 hover:bg-white/10',
                ].join(' ')}
              >
                {w.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-white/40">Color</span>
          <div className="flex gap-2" data-testid="draw-color-swatches-mobile">
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
          className="flex h-10 items-center gap-3 border-t border-white/10 bg-navy-900 px-4"
          data-testid="highlight-tool-controls-mobile"
        >
          <span className="text-xs text-white/40">Color</span>
          <div className="flex gap-2" data-testid="highlight-color-swatches-mobile">
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

      {/* Primary toolbar */}
      <nav
        className="flex h-14 items-center justify-around border-t border-white/10 bg-navy-900 px-1"
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
        <button
          aria-label="More tools"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white/50 hover:bg-white/10 hover:text-white transition-colors"
        >
          <MoreHorizontal size={18} />
        </button>
      </nav>
    </div>
  );
}
