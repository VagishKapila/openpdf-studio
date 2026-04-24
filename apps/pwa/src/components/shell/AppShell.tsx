import { useCallback } from 'react';
import { AppHeader } from './AppHeader';
import { ToolPalette } from './ToolPalette';
import { MobileToolbar } from './MobileToolbar';
import { PageNavDock } from './PageNavDock';
import { DocumentSidebar } from './DocumentSidebar';
import { CanvasArea } from '@/components/canvas/CanvasArea';
import { SelectionActionBar } from '@/components/canvas/SelectionActionBar';
import { SignatureModal } from '@/components/canvas/SignatureModal';
import { loadPdfFromFile } from '@/lib/loadPdf';
import { useToolStore } from '@/store';
import type { PendingSignature } from '@/store/tool';

export function AppShell() {
  const { activeTool, setTool, setPendingSignature } = useToolStore();

  const isSignModalOpen = activeTool === 'sign';

  const handleSignClose = useCallback(() => {
    setTool('select');
  }, [setTool]);

  const handleSignPlace = useCallback(
    (sig: PendingSignature) => {
      setPendingSignature(sig);
      setTool('select');
    },
    [setPendingSignature, setTool],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    try {
      await loadPdfFromFile(file);
    } catch {
      // error surfaced in store
    }
  }, []);

  return (
    <div className="flex h-full flex-col bg-neutral-800">
      <AppHeader />

      {/* Floating annotation selection toolbar */}
      <SelectionActionBar />

      <div className="flex flex-1 overflow-hidden">
        <DocumentSidebar />
        <ToolPalette />
        <main
          className="relative flex flex-1 flex-col overflow-hidden"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          data-testid="main-content"
        >
          <CanvasArea />
          <PageNavDock />
        </main>
      </div>
      <MobileToolbar />

      {/* Sign tool modal */}
      <SignatureModal
        open={isSignModalOpen}
        onClose={handleSignClose}
        onPlace={handleSignPlace}
      />
    </div>
  );
}
