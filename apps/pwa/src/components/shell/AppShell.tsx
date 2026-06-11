import { useCallback, useEffect, useState } from 'react';
import { AppHeader } from './AppHeader';
import { ToolPalette } from './ToolPalette';
import { MobileToolbar } from './MobileToolbar';
import { MobileContextBar } from './MobileContextBar';
import { PageNavDock } from './PageNavDock';
import { DocumentSidebar } from './DocumentSidebar';
import { CanvasArea } from '@/components/canvas/CanvasArea';
import { SelectionActionBar } from '@/components/canvas/SelectionActionBar';
import { SignatureModal } from '@/components/canvas/SignatureModal';
import { loadPdfFromFile } from '@/lib/loadPdf';
import { useDocumentStore, useToolStore } from '@/store';
import type { PendingSignature } from '@/store/tool';

export function AppShell() {
  const { activeTool, setTool, setPendingSignature } = useToolStore();
  // COWORK-48 FIX-1: banner must never sit on top of PageNavDock while a document is open
  const hasOpenDocument = useDocumentStore((s) => s.document !== null);

  const isSignModalOpen = activeTool === 'sign';

  // iOS install banner — shown once to first-time Safari visitors who haven't installed the PWA
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    const hasSeenPrompt = localStorage.getItem('formiq-install-prompt-seen');
    if (isIOS && !isInStandaloneMode && !hasSeenPrompt) {
      const timer = setTimeout(() => setShowInstallBanner(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  // COWORK-48 FIX-1: hide the banner the moment a document opens — it overlaps
  // PageNavDock (z-50, bottom-20) and intercepts Prev/Next taps on iOS.
  useEffect(() => {
    if (hasOpenDocument) setShowInstallBanner(false);
  }, [hasOpenDocument]);

  // COWORK-48 FIX-1: auto-dismiss after 15s so the banner can never linger
  // into a document-open session (does not set the seen flag — banner may
  // reappear next visit until explicitly dismissed).
  useEffect(() => {
    if (!showInstallBanner) return;
    const timer = setTimeout(() => setShowInstallBanner(false), 15000);
    return () => clearTimeout(timer);
  }, [showInstallBanner]);

  // File Handler API — handle PDFs launched via "Open with FormIQ" on Android
  useEffect(() => {
    if (!('launchQueue' in window)) return;
    (window as any).launchQueue.setConsumer(async (launchParams: any) => {
      if (!launchParams.files || launchParams.files.length === 0) return;
      try {
        const fileHandle = launchParams.files[0];
        const file = await fileHandle.getFile();
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          await loadPdfFromFile(file);
        }
      } catch {
        // silently ignore — loadPdfFromFile surfaces errors in store
      }
    });
  }, []);

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

  // Keyboard shortcut: E → Edit tool (COWORK-45)
  // Skipped when focus is in an input/textarea/contentEditable to avoid intercepting typing
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if ((e.key === 'e' || e.key === 'E') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        setTool('edit');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setTool]);


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
      {/* COWORK-44.B.1: tool-specific options (color, font size, stroke width) for mobile */}
      <MobileContextBar />
      <MobileToolbar />

      {/* Sign tool modal */}
      <SignatureModal
        open={isSignModalOpen}
        onClose={handleSignClose}
        onPlace={handleSignPlace}
      />

      {/* iOS install prompt — one-time banner for first-time Safari visitors */}
      {showInstallBanner && !hasOpenDocument && (
        <div className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl bg-neutral-900 border border-white/10 p-4 shadow-xl">
          <div className="flex items-start gap-3">
            <img src="/icon-192.png" className="h-10 w-10 rounded-xl flex-shrink-0" alt="FormIQ" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">Add FormIQ to Home Screen</p>
              <p className="text-xs text-white/50 mt-0.5">
                Tap <strong className="text-white/70">Share</strong> then{' '}
                <strong className="text-white/70">"Add to Home Screen"</strong> — then tap <strong className="text-white/70">Share</strong> on any PDF to open it in FormIQ
              </p>
            </div>
            <button
              onClick={() => {
                setShowInstallBanner(false);
                localStorage.setItem('formiq-install-prompt-seen', '1');
              }}
              className="text-white/40 hover:text-white text-lg leading-none flex-shrink-0 ml-1"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
