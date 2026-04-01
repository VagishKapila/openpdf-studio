import React, { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { TopNav } from './TopNav';
import { DocumentTabBar } from './DocumentTabBar';
import { Toolbar } from '../toolbar/Toolbar';
import { ToolPalette } from '../toolbar/ToolPalette';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';
import { CanvasArea } from '../canvas/CanvasArea';

export const EditorLayout: React.FC = () => {
  const { hydrate } = useAuthStore();

  // Initialize auth state from localStorage
  useEffect(() => {
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
    </div>
  );
};
