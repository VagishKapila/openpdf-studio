import { AppHeader } from './AppHeader';
import { MobileToolbar } from './MobileToolbar';
import { ToolPalette } from './ToolPalette';
import { PageNavDock } from './PageNavDock';
import { CanvasArea } from '../canvas/CanvasArea';
import { useUIStore } from '@/store';

export function AppShell() {
  const aside = useUIStore((s) => s.aside);

  return (
    <div className="flex h-full flex-col bg-neutral-800">
      {/* Fixed header — always at 1:1, never inside gesture container */}
      <AppHeader />

      {/* Body row */}
      <div className="flex flex-1 overflow-hidden">
        {/* Vertical tool palette — desktop only */}
        <ToolPalette />

        {/* Aside panel */}
        {aside && (
          <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-white/10 bg-navy-900 p-4 text-sm text-white/60">
            <p className="font-semibold text-white/80 mb-2">Document</p>
            <p className="text-xs">Thumbnails, bookmarks, and annotations will appear here.</p>
          </aside>
        )}

        {/* Canvas — gesture layer lives here */}
        <main className="relative flex-1 overflow-hidden">
          <CanvasArea />
        </main>
      </div>

      {/* Fixed page navigation — mobile only */}
      <PageNavDock />

      {/* Mobile toolbar — always at 1:1, never inside gesture container */}
      <MobileToolbar />
    </div>
  );
}
