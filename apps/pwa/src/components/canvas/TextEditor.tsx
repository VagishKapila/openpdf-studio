// apps/pwa/src/components/canvas/TextEditor.tsx
//
// Floating <textarea> overlay positioned inside the CSS-transformed div.
// The parent div already has scale/translate applied, so we position in
// CSS-pixel space (same coordinate system as AnnotationLayer / Konva).

import { useEffect, useRef, useState } from 'react';
import type { TextAnnotation } from '@/lib/annotations';

export type TextEditorProps = {
  /** The annotation being edited */
  ann: TextAnnotation;
  /** Scale factor: PDF points → CSS pixels. Equals cssW / pdfPageWidth. */
  pdfToCss: number;
  /** Called when editing is committed (blur, Enter, or Escape) */
  onCommit: (text: string) => void;
};

export function TextEditor({ ann, pdfToCss, onCommit }: TextEditorProps) {
  const [text, setText] = useState(ann.text);
  const committed = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    // Place cursor at end of existing text
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  // Reflect external annotation text changes only when a DIFFERENT annotation is opened
  useEffect(() => {
    setText(ann.text);
    committed.current = false;
  }, [ann.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = () => {
    if (committed.current) return;
    committed.current = true;
    onCommit(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      commit();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      commit();
    }
  };

  const left = ann.x * pdfToCss;
  const top = ann.y * pdfToCss;
  const scaledFontSize = Math.max(8, ann.fontSize * pdfToCss);

  return (
    <textarea
      ref={textareaRef}
      data-testid="text-editor"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      rows={1}
      style={{
        position: 'absolute',
        top,
        left,
        fontSize: scaledFontSize,
        fontFamily: ann.fontFamily,
        color: ann.color,
        background: 'rgba(255,255,255,0.92)',
        border: '1.5px dashed #F59E0B',
        borderRadius: 2,
        outline: 'none',
        minWidth: 120,
        padding: '1px 4px',
        lineHeight: 1.4,
        resize: 'none',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        zIndex: 20,
        pointerEvents: 'auto',
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
      }}
    />
  );
}
