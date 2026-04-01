import React, { useRef, useEffect, useState } from 'react';
import {
  FileText,
  RotateCcw,
  RotateCw,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize,
  ChevronDown,
  Files,
  Save,
  Printer,
  Combine,
  Split,
  Lock,
  Zap,
  Languages,
} from 'lucide-react';
import { useEditorStore } from '@/stores/editor-store';

interface MenuState {
  file: boolean;
  edit: boolean;
  tools: boolean;
}

export const Toolbar: React.FC = () => {
  const { mode, setMode, activeDocument, setZoom, undo, redo } =
    useEditorStore();
  const [menus, setMenus] = useState<MenuState>({ file: false, edit: false, tools: false });
  const menuRefs = useRef<Record<string, HTMLDivElement>>({});
  const activeDoc = activeDocument();

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isClickInMenu = Object.values(menuRefs.current).some(
        (ref) => ref?.contains(target)
      );
      if (!isClickInMenu) {
        setMenus({ file: false, edit: false, tools: false });
      }
    };

    if (menus.file || menus.edit || menus.tools) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menus]);

  const toggleMenu = (menuName: keyof MenuState) => {
    setMenus((prev) => ({
      file: false,
      edit: false,
      tools: false,
      [menuName]: !prev[menuName],
    }));
  };

  return (
    <div className="h-11 bg-white border-b border-[#E8E5E0] flex items-center px-3 gap-4 shrink-0">
      {/* Menu Bar */}
      <div className="flex items-center gap-1">
        {/* File Menu */}
        <div className="relative" ref={(el) => { if (el) menuRefs.current.file = el; }}>
          <button
            onClick={() => toggleMenu('file')}
            className="px-3 py-1.5 text-sm font-medium text-[#2D2B2E] hover:bg-[#F5F3F0] rounded transition-colors flex items-center gap-1"
          >
            File <ChevronDown size={14} />
          </button>
          {menus.file && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-[#E8E5E0] z-50 py-1">
              <button className="w-full px-4 py-2 text-sm text-left text-[#2D2B2E] hover:bg-[#F5F3F0] flex items-center gap-2 transition-colors">
                <FileText size={16} />
                Open
              </button>
              <button className="w-full px-4 py-2 text-sm text-left text-[#2D2B2E] hover:bg-[#F5F3F0] flex items-center gap-2 transition-colors">
                <Files size={16} />
                Recent Files
              </button>
              <hr className="my-1 border-[#E8E5E0]" />
              <button className="w-full px-4 py-2 text-sm text-left text-[#2D2B2E] hover:bg-[#F5F3F0] flex items-center gap-2 transition-colors">
                <Save size={16} />
                Save
              </button>
              <button className="w-full px-4 py-2 text-sm text-left text-[#2D2B2E] hover:bg-[#F5F3F0] flex items-center gap-2 transition-colors">
                <Save size={16} />
                Save As
              </button>
              <hr className="my-1 border-[#E8E5E0]" />
              <button className="w-full px-4 py-2 text-sm text-left text-[#2D2B2E] hover:bg-[#F5F3F0] flex items-center gap-2 transition-colors">
                <Printer size={16} />
                Print
              </button>
              <button className="w-full px-4 py-2 text-sm text-left text-[#2D2B2E] hover:bg-[#F5F3F0] flex items-center gap-2 transition-colors">
                Close
              </button>
            </div>
          )}
        </div>

        {/* Edit Menu */}
        <div className="relative" ref={(el) => { if (el) menuRefs.current.edit = el; }}>
          <button
            onClick={() => toggleMenu('edit')}
            className="px-3 py-1.5 text-sm font-medium text-[#2D2B2E] hover:bg-[#F5F3F0] rounded transition-colors flex items-center gap-1"
          >
            Edit <ChevronDown size={14} />
          </button>
          {menus.edit && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-[#E8E5E0] z-50 py-1">
              <button
                onClick={() => {
                  if (activeDoc) undo(activeDoc.id);
                  toggleMenu('edit');
                }}
                className="w-full px-4 py-2 text-sm text-left text-[#2D2B2E] hover:bg-[#F5F3F0] flex items-center gap-2 transition-colors"
              >
                <RotateCcw size={16} />
                Undo (Ctrl+Z)
              </button>
              <button
                onClick={() => {
                  if (activeDoc) redo(activeDoc.id);
                  toggleMenu('edit');
                }}
                className="w-full px-4 py-2 text-sm text-left text-[#2D2B2E] hover:bg-[#F5F3F0] flex items-center gap-2 transition-colors"
              >
                <RotateCw size={16} />
                Redo (Ctrl+Y)
              </button>
              <hr className="my-1 border-[#E8E5E0]" />
              <button className="w-full px-4 py-2 text-sm text-left text-[#2D2B2E] hover:bg-[#F5F3F0] flex items-center gap-2 transition-colors">
                <Trash2 size={16} />
                Delete Selected (Del)
              </button>
            </div>
          )}
        </div>

        {/* Tools Menu */}
        <div className="relative" ref={(el) => { if (el) menuRefs.current.tools = el; }}>
          <button
            onClick={() => toggleMenu('tools')}
            className="px-3 py-1.5 text-sm font-medium text-[#2D2B2E] hover:bg-[#F5F3F0] rounded transition-colors flex items-center gap-1"
          >
            Tools <ChevronDown size={14} />
          </button>
          {menus.tools && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-[#E8E5E0] z-50 py-1">
              <button className="w-full px-4 py-2 text-sm text-left text-[#2D2B2E] hover:bg-[#F5F3F0] flex items-center gap-2 transition-colors">
                <Combine size={16} />
                Merge PDFs
              </button>
              <button className="w-full px-4 py-2 text-sm text-left text-[#2D2B2E] hover:bg-[#F5F3F0] flex items-center gap-2 transition-colors">
                <Split size={16} />
                Split PDF
              </button>
              <button className="w-full px-4 py-2 text-sm text-left text-[#2D2B2E] hover:bg-[#F5F3F0] flex items-center gap-2 transition-colors">
                <Lock size={16} />
                Encrypt
              </button>
              <button className="w-full px-4 py-2 text-sm text-left text-[#2D2B2E] hover:bg-[#F5F3F0] flex items-center gap-2 transition-colors">
                <Zap size={16} />
                Compress
              </button>
              <button className="w-full px-4 py-2 text-sm text-left text-[#2D2B2E] hover:bg-[#F5F3F0] flex items-center gap-2 transition-colors">
                <FileText size={16} />
                Convert
              </button>
              <button className="w-full px-4 py-2 text-sm text-left text-[#2D2B2E] hover:bg-[#F5F3F0] flex items-center gap-2 transition-colors">
                <Languages size={16} />
                OCR
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 border-l border-[#E8E5E0]" />

      {/* Mode Tabs */}
      <div className="flex items-center gap-1 border-l border-r border-[#E8E5E0] px-3">
        <button
          onClick={() => setMode('pdf')}
          className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
            mode === 'pdf'
              ? 'text-brand-600 bg-brand-50 border-b-2 border-brand-500'
              : 'text-[#6B6A6D] hover:bg-[#F5F3F0]'
          }`}
        >
          PDF Editor
        </button>
        <button
          onClick={() => setMode('image')}
          className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
            mode === 'image'
              ? 'text-brand-600 bg-brand-50 border-b-2 border-brand-500'
              : 'text-[#6B6A6D] hover:bg-[#F5F3F0]'
          }`}
        >
          Image Editor
        </button>
      </div>

      {/* Zoom Controls */}
      {activeDoc && (
        <div className="flex items-center gap-2 ml-2">
          <button
            onClick={() => setZoom(activeDoc.id, activeDoc.zoom - 10)}
            className="p-1.5 text-[#6B6A6D] hover:bg-[#F5F3F0] rounded transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-sm text-[#6B6A6D] min-w-[45px] text-center">
            {Math.round(activeDoc.zoom)}%
          </span>
          <button
            onClick={() => setZoom(activeDoc.id, activeDoc.zoom + 10)}
            className="p-1.5 text-[#6B6A6D] hover:bg-[#F5F3F0] rounded transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={() => setZoom(activeDoc.id, 100)}
            className="p-1.5 text-[#6B6A6D] hover:bg-[#F5F3F0] rounded transition-colors"
            title="Fit to page"
          >
            <Maximize size={18} />
          </button>
        </div>
      )}
    </div>
  );
};
