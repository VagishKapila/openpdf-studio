import { useEffect } from 'react';
import { useEditorStore } from '@/stores/editor-store';
import { useFileHandler } from './useFileHandler';

import type { EditorTool } from '@/types';

export function useKeyboardShortcuts() {
  const {
    setCurrentTool,
    undo,
    redo,
    openModal,
    deleteActive,
    downloadDocument,
  } = useEditorStore();

  const { openFileDialog } = useFileHandler();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.ctrlKey || e.metaKey;

      // Ctrl/Cmd + O: Open file
      if (isMeta && e.key === 'o') {
        e.preventDefault();
        openFileDialog();
      }

      // Ctrl/Cmd + S: Save/Download
      if (isMeta && e.key === 's') {
        e.preventDefault();
        downloadDocument();
      }

      // Ctrl/Cmd + Z: Undo
      if (isMeta && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y: Redo
      if ((isMeta && e.shiftKey && e.key === 'z') || (isMeta && e.key === 'y')) {
        e.preventDefault();
        redo();
      }

      // Delete: Delete selected object
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteActive();
      }

      // Tool shortcuts (V, T, D, H, S, I, G, N)
      if (!isMeta && !e.shiftKey && !e.altKey) {
        const toolMap: Record<string, EditorTool> = {
          v: 'select',
          t: 'text',
          d: 'draw',
          h: 'highlight',
          s: 'shapes',
          i: 'image',
          g: 'signature',
          n: 'stamp',
        };

        const tool = toolMap[e.key.toLowerCase()];
        if (tool) {
          e.preventDefault();
          setCurrentTool(tool);
        }
      }

      // Ctrl/Cmd + Alt + S: Signature modal
      if (isMeta && e.altKey && e.key === 's') {
        e.preventDefault();
        openModal('signature');
      }

      // Ctrl/Cmd + Alt + M: Merge modal
      if (isMeta && e.altKey && e.key === 'm') {
        e.preventDefault();
        openModal('merge');
      }

      // Ctrl/Cmd + Alt + O: OCR modal
      if (isMeta && e.altKey && e.key === 'o') {
        e.preventDefault();
        openModal('ocr');
      }

      // Ctrl/Cmd + Alt + P: Password modal
      if (isMeta && e.altKey && e.key === 'p') {
        e.preventDefault();
        openModal('password');
      }

      // Ctrl/Cmd + Alt + C: Compress modal
      if (isMeta && e.altKey && e.key === 'c') {
        e.preventDefault();
        openModal('compress');
      }

      // Ctrl/Cmd + Alt + V: Convert modal
      if (isMeta && e.altKey && e.key === 'v') {
        e.preventDefault();
        openModal('convert');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCurrentTool, undo, redo, openModal, deleteActive, openFileDialog, downloadDocument]);
}
