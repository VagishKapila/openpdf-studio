import { useCallback, useRef, useEffect } from 'react';
import { fabric } from 'fabric';
import { useEditorStore } from '@/stores/editor-store';

interface UseFabricCanvasReturn {
  containerRef: React.RefObject<HTMLCanvasElement | null>;
  fabricRef: React.MutableRefObject<fabric.Canvas | null>;
  initCanvas: (width: number, height: number) => fabric.Canvas | null;
  addText: (text: string, x: number, y: number) => void;
  addShape: (type: string, x: number, y: number) => void;
  addImage: (dataUrl: string, x: number, y: number) => void;
  toJSON: () => string;
  fromJSON: (json: string) => void;
  deleteSelected: () => void;
  clear: () => void;
}

export function useFabricCanvas(): UseFabricCanvasReturn {
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLCanvasElement>(null);
  const { currentTool, style } = useEditorStore();

  const initCanvas = useCallback(
    (width: number, height: number): fabric.Canvas | null => {
      if (!containerRef.current) return null;

      if (fabricRef.current) {
        fabricRef.current.dispose();
      }

      const canvas = new fabric.Canvas(containerRef.current, {
        width,
        height,
        selection: currentTool === 'select',
        isDrawingMode: currentTool === 'draw' || currentTool === 'highlight',
      });

      fabricRef.current = canvas;
      return canvas;
    },
    [currentTool]
  );

  // Update canvas mode when tool changes
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = currentTool === 'draw' || currentTool === 'highlight';
    canvas.selection = currentTool === 'select';

    if (currentTool === 'draw') {
      canvas.freeDrawingBrush.color = style.color;
      canvas.freeDrawingBrush.width = style.strokeWidth;
    }

    if (currentTool === 'highlight') {
      canvas.freeDrawingBrush.color = 'rgba(255, 255, 0, 0.3)';
      canvas.freeDrawingBrush.width = 20;
    }

    canvas.renderAll();
  }, [currentTool, style]);

  const addText = useCallback(
    (text: string, x: number, y: number) => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      const textObj = new fabric.IText(text, {
        left: x,
        top: y,
        fontSize: style.fontSize,
        fontFamily: style.fontFamily,
        fill: style.color,
      });

      canvas.add(textObj);
      canvas.setActiveObject(textObj);
      canvas.renderAll();
    },
    [style]
  );

  const addShape = useCallback(
    (type: string, x: number, y: number) => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      let shape: fabric.Object;
      const opts = {
        left: x,
        top: y,
        fill: 'transparent',
        stroke: style.color,
        strokeWidth: 2,
      };

      switch (type) {
        case 'rect':
          shape = new fabric.Rect({ ...opts, width: 120, height: 80 });
          break;
        case 'circle':
          shape = new fabric.Circle({ ...opts, radius: 50 });
          break;
        case 'line':
          shape = new fabric.Line([x, y, x + 150, y], {
            stroke: style.color,
            strokeWidth: 2,
          });
          break;
        case 'triangle':
          shape = new fabric.Triangle({ ...opts, width: 100, height: 100 });
          break;
        default:
          shape = new fabric.Rect({ ...opts, width: 100, height: 60 });
      }

      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.renderAll();
    },
    [style]
  );

  const addImage = useCallback(
    (dataUrl: string, x: number, y: number) => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      fabric.Image.fromURL(
        dataUrl,
        (img: fabric.Image) => {
          img.set({ left: x, top: y, scaleX: 0.5, scaleY: 0.5 });
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
        },
        { crossOrigin: 'anonymous' }
      );
    },
    []
  );

  const toJSON = useCallback(() => {
    return fabricRef.current ? JSON.stringify(fabricRef.current.toJSON()) : '';
  }, []);

  const fromJSON = useCallback((json: string) => {
    const canvas = fabricRef.current;
    if (!canvas || !json) return;

    try {
      canvas.loadFromJSON(json, () => {
        canvas.renderAll();
      });
    } catch (error) {
      console.error('Error loading canvas from JSON:', error);
    }
  }, []);

  const deleteSelected = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const active = canvas.getActiveObject();
    if (active) {
      canvas.remove(active);
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  }, []);

  const clear = useCallback(() => {
    if (fabricRef.current) {
      fabricRef.current.clear();
    }
  }, []);

  return {
    containerRef,
    fabricRef,
    initCanvas,
    addText,
    addShape,
    addImage,
    toJSON,
    fromJSON,
    deleteSelected,
    clear,
  };
}
