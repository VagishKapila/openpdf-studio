import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth-store';
import { TopNav } from '@/components/layout/TopNav';
import { DocumentTabBar } from '@/components/layout/DocumentTabBar';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { ToolPalette } from '@/components/toolbar/ToolPalette';
import { Sidebar } from '@/components/layout/Sidebar';
import { CanvasArea } from '@/components/canvas/CanvasArea';
import { StatusBar } from '@/components/layout/StatusBar';
import { ModalManager } from '@/components/modals/ModalManager';

export function App() {
  const { hydrate } = useAuthStore();

  useEffect(() => {
    // Hydrate auth state from localStorage on app start
    hydrate();
  }, [hydrate]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#FAFAFA]">
      {/* Top Navigation */}
      <TopNav />

      {/* Document Tabs */}
      <DocumentTabBar />

      {/* Main Toolbar */}
      <Toolbar />

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tool Palette (left side) */}
        <ToolPalette />

        {/* Sidebar with Page Thumbnails */}
        <Sidebar />

        {/* Canvas Area */}
        <CanvasArea />
      </div>

      {/* Status Bar */}
      <StatusBar />

      {/* Modal Manager */}
      <ModalManager />

      {/* Toast Notifications */}
      <Toaster position="bottom-right" />
    </div>
  );
}
