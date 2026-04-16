import React, { useState, useRef, useEffect } from 'react';
import {
  Pointer,
  Type,
  PenTool,
  Highlighter,
  Square,
  Image,
  PenLine,
  Stamp,
  MessageSquare,
  Crop,
  Eye,
  ChevronRight,
  Circle,
  Minus,
  ArrowRight,
  Triangle,
  Star,
} from 'lucide-react';
import { useEditorStore } from '@/stores/editor-store';
import type { EditorTool, ShapeType } from '@/types';

interface ToolWithIcon {
  tool: EditorTool;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
}

export const ToolPalette: React.FC = () => {
  const { currentTool, setTool, shapeType, setShapeType } = useEditorStore();
  const [shapesOpen, setShapesOpen] = useState(false);
  const shapesRef = useRef<HTMLDivElement>(null);

  const tools: ToolWithIcon[] = [
    { tool: 'select', icon: <Pointer size={20} />, label: 'Select', shortcut: 'V' },
    { tool: 'text', icon: <Type size={20} />, label: 'Text', shortcut: 'T' },
    { tool: 'draw', icon: <PenTool size={20} />, label: 'Draw', shortcut: 'D' },
    { tool: 'highlight', icon: <Highlighter size={20} />, label: 'Highlight', shortcut: 'H' },
    {
      tool: 'shapes',
      icon: <Square size={20} />,
      label: 'Shapes',
      shortcut: 'S',
    },
    { tool: 'image', icon: <Image size={20} />, label: 'Image', shortcut: 'I' },
    { tool: 'signature', icon: <PenLine size={20} />, label: 'Signature', shortcut: 'G' },
    { tool: 'stamp', icon: <Stamp size={20} />, label: 'Stamp' },
    { tool: 'note', icon: <MessageSquare size={20} />, label: 'Note', shortcut: 'N' },
    { tool: 'crop', icon: <Crop size={20} />, label: 'Crop' },
    { tool: 'redact', icon: <Eye size={20} />, label: 'Redact' },
  ];

  const shapes: Array<{ type: ShapeType; icon: React.ReactNode; label: string }> = [
    { type: 'rect', icon: <Square size={20} />, label: 'Rectangle' },
    { type: 'circle', icon: <Circle size={20} />, label: 'Circle' },
    { type: 'line', icon: <Minus size={20} />, label: 'Line' },
    { type: 'arrow', icon: <ArrowRight size={20} />, label: 'Arrow' },
    { type: 'triangle', icon: <Triangle size={20} />, label: 'Triangle' },
    { type: 'star', icon: <Star size={20} />, label: 'Star' },
  ];

  // Close shapes menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shapesRef.current && !shapesRef.current.contains(event.target as Node)) {
        setShapesOpen(false);
      }
    };

    if (shapesOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [shapesOpen]);

  const handleToolClick = (tool: EditorTool) => {
    setTool(tool);
    if (tool === 'shapes') {
      setShapesOpen(!shapesOpen);
    } else {
      setShapesOpen(false);
    }
  };

  const handleShapeClick = (shape: ShapeType) => {
    setShapeType(shape);
    setTool('shapes');
    setShapesOpen(false);
  };

  return (
    <div className="w-14 bg-white border-r border-[#E8E5E0] flex flex-col items-center py-2 gap-1 overflow-y-auto shrink-0">
      {tools.map((item) => (
        <div key={item.tool} className="relative group">
          <button
            onClick={() => handleToolClick(item.tool)}
            className={`
              w-10 h-10 rounded flex items-center justify-center transition-all relative
              ${
                currentTool === item.tool
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-[#6B6A6D] hover:bg-[#F5F3F0]'
              }
            `}
            title={item.label}
          >
            {item.tool === 'shapes' && shapesOpen && (
              <ChevronRight size={14} className="absolute -right-1" />
            )}
            {item.icon}
          </button>

          {/* Tooltip */}
          <div className="absolute left-12 top-1/2 -translate-y-1/2 bg-[#2D2B2E] text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-40">
            {item.label}
            {item.shortcut && <span className="text-[#6B6A6D] ml-1">({item.shortcut})</span>}
          </div>

          {/* Shapes Submenu */}
          {item.tool === 'shapes' && shapesOpen && (
            <div
              ref={shapesRef}
              className="absolute left-12 top-0 bg-white rounded-lg shadow-lg border border-[#E8E5E0] p-2 z-50 grid grid-cols-2 gap-2"
            >
              {shapes.map((shape) => (
                <button
                  key={shape.type}
                  onClick={() => handleShapeClick(shape.type)}
                  className={`
                    w-10 h-10 rounded flex items-center justify-center transition-all
                    ${
                      shapeType === shape.type
                        ? 'bg-brand-50 text-brand-600'
                        : 'text-[#6B6A6D] hover:bg-[#F5F3F0]'
                    }
                  `}
                  title={shape.label}
                >
                  {shape.icon}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
