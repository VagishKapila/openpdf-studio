import { AppHeader } from './AppHeader';
import { MobileToolbar } from './MobileToolbar';
import { ToolPalette } from './ToolPalette';
import { PageNavDock } from './PageNavDock';
import { CanvasArea } from '../canvas/CanvasArea';

export function AppShell() {
  return (
    <div className="flex h-full flex-col bg-neutral-800">
      {/* Header — always visible, always at 1:1 scale */}
      <AppHeader />

      {/* Body row: tool palette (desktop) + canvas area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Tool palette — hidden on mobile (hidden), visible on desktop (md:flex) */}
        <ToolPalette />

        {/* Main column: canvas + page navigation */}
        <main className="relative flex flex-1 flex-col overflow-hidden">
          {/* Canvas fills all available height */}
          <CanvasArea />
          {/* Page navigation — always visible, docks to bottom of main */}
          <PageNavDock />
        </main>
      </div>

      {/* Mobile bottom toolbar — hidden on desktop (md:hidden) */}
      <MobileToolbar />
    </div>
  );
}
