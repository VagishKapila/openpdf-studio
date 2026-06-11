/**
 * MobileContextBar — COWORK-44.B.1
 *
 * Mobile-only (md:hidden) horizontal strip that surfaces the tool-specific
 * controls that ToolPalette provides on desktop (≥768 px).  Rendered just
 * above MobileToolbar so it never obscures canvas content.
 *
 * Visible for tools that have configurable options: text, draw, highlight.
 * Hidden (returns null) for select / sign / edit where no extra controls exist.
 */

import { useToolStore } from '@/store';
import {
  TEXT_COLORS,
  TEXT_FONT_SIZES,
  DRAW_COLORS,
  DRAW_STROKE_WIDTHS,
  HIGHLIGHT_COLORS,
} from '@/store/tool';
import type { DrawStrokeWidth, TextFontSize } from '@/store/tool';

export function MobileContextBar() {
  const {
    activeTool,
    textColor,     setTextColor,
    textFontSize,  setTextFontSize,
    drawColor,     setDrawColor,
    drawStrokeWidth, setDrawStrokeWidth,
    highlightColor,  setHighlightColor,
  } = useToolStore();

  // Only render for tools that have user-configurable options
  if (activeTool !== 'text' && activeTool !== 'draw' && activeTool !== 'highlight') {
    return null;
  }

  return (
    <div
      className="md:hidden shrink-0 border-t border-white/10 bg-navy-900"
      data-testid="mobile-context-bar"
      role="toolbar"
      aria-label="Tool options"
    >
      <div
        className="flex items-center gap-3 overflow-x-auto px-3 py-2"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >

        {/* ── TEXT TOOL CONTROLS ── */}
        {activeTool === 'text' && (
          <>
            {/* Font size selector */}
            <div className="flex items-center gap-1.5 shrink-0" data-testid="mobile-font-size">
              <span className="text-[10px] font-medium uppercase tracking-wide text-white/40">
                Size
              </span>
              <select
                value={textFontSize}
                onChange={(e) =>
                  setTextFontSize(Number(e.target.value) as TextFontSize)
                }
                aria-label="Font size"
                data-testid="mobile-font-size-select"
                className="rounded bg-white/10 px-1.5 py-1 text-xs text-white focus:outline-none"
              >
                {TEXT_FONT_SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Vertical divider */}
            <div className="h-5 w-px shrink-0 bg-white/15" aria-hidden />

            {/* Text color swatches */}
            <div
              className="flex items-center gap-2 shrink-0"
              role="group"
              aria-label="Text color"
              data-testid="mobile-text-colors"
            >
              <span className="text-[10px] font-medium uppercase tracking-wide text-white/40">
                Color
              </span>
              {TEXT_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setTextColor(c.value)}
                  aria-label={c.label}
                  aria-pressed={textColor === c.value}
                  title={c.label}
                  className="h-7 w-7 shrink-0 rounded-full border-2 transition-all active:scale-90"
                  style={{
                    background: c.value,
                    borderColor: textColor === c.value ? '#F59E0B' : 'rgba(255,255,255,0.15)',
                    transform: textColor === c.value ? 'scale(1.2)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </>
        )}

        {/* ── DRAW TOOL CONTROLS ── */}
        {activeTool === 'draw' && (
          <>
            {/* Stroke width buttons */}
            <div
              className="flex items-center gap-1.5 shrink-0"
              role="group"
              aria-label="Stroke width"
              data-testid="mobile-stroke-widths"
            >
              <span className="text-[10px] font-medium uppercase tracking-wide text-white/40">
                Width
              </span>
              {DRAW_STROKE_WIDTHS.map((w) => (
                <button
                  key={w.value}
                  onClick={() => setDrawStrokeWidth(w.value as DrawStrokeWidth)}
                  aria-label={w.label}
                  aria-pressed={drawStrokeWidth === w.value}
                  title={w.label}
                  className={[
                    'shrink-0 rounded px-2 py-1 text-xs font-medium transition-colors',
                    drawStrokeWidth === w.value
                      ? 'bg-amber-400/30 text-amber-400'
                      : 'text-white/50 hover:bg-white/10 hover:text-white',
                  ].join(' ')}
                >
                  {w.label}
                </button>
              ))}
            </div>

            {/* Vertical divider */}
            <div className="h-5 w-px shrink-0 bg-white/15" aria-hidden />

            {/* Draw color swatches */}
            <div
              className="flex items-center gap-2 shrink-0"
              role="group"
              aria-label="Draw color"
              data-testid="mobile-draw-colors"
            >
              <span className="text-[10px] font-medium uppercase tracking-wide text-white/40">
                Color
              </span>
              {DRAW_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setDrawColor(c.value)}
                  aria-label={c.label}
                  aria-pressed={drawColor === c.value}
                  title={c.label}
                  className="h-7 w-7 shrink-0 rounded-full border-2 transition-all active:scale-90"
                  style={{
                    background: c.value,
                    borderColor: drawColor === c.value ? '#F59E0B' : 'rgba(255,255,255,0.15)',
                    transform: drawColor === c.value ? 'scale(1.2)' : 'scale(1)',
                    boxShadow: c.value === '#ffffff' ? 'inset 0 0 0 1px rgba(255,255,255,0.3)' : 'none',
                  }}
                />
              ))}
            </div>
          </>
        )}

        {/* ── HIGHLIGHT TOOL CONTROLS ── */}
        {activeTool === 'highlight' && (
          <div
            className="flex items-center gap-2 shrink-0"
            role="group"
            aria-label="Highlight color"
            data-testid="mobile-highlight-colors"
          >
            <span className="text-[10px] font-medium uppercase tracking-wide text-white/40">
              Color
            </span>
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setHighlightColor(c.value)}
                aria-label={c.label}
                aria-pressed={highlightColor === c.value}
                title={c.label}
                className="h-7 w-7 shrink-0 rounded border-2 transition-all active:scale-90"
                style={{
                  background: c.value,
                  borderColor: highlightColor === c.value ? '#F59E0B' : 'rgba(0,0,0,0.15)',
                  transform: highlightColor === c.value ? 'scale(1.2)' : 'scale(1)',
                  opacity: 0.9,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
