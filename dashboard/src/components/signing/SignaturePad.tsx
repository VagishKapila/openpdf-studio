import { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCcw, Pen, Type } from 'lucide-react';

interface SignaturePadProps {
  onCapture: (dataUrl: string, type: 'draw' | 'type') => void;
  width?: number;
  height?: number;
}

export function SignaturePad({ onCapture, width = 300, height = 150 }: SignaturePadProps) {
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [isDrawing, setIsDrawing] = useState(false);
  const [typeText, setTypeText] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = width;
    canvas.height = height;

    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);
    context.strokeStyle = '#6366f1';
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    contextRef.current = context;
  }, [width, height]);

  // Handle canvas drawing
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !contextRef.current) return;

    let x, y;
    if ('touches' in e) {
      const rect = canvas.getBoundingClientRect();
      x = e.touches[0]!.clientX - rect.left;
      y = e.touches[0]!.clientY - rect.top;
    } else {
      const rect = canvas.getBoundingClientRect();
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
  }, []);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let x, y;
    if ('touches' in e) {
      const rect = canvas.getBoundingClientRect();
      x = e.touches[0]!.clientX - rect.left;
      y = e.touches[0]!.clientY - rect.top;
    } else {
      const rect = canvas.getBoundingClientRect();
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  }, [isDrawing]);

  const stopDrawing = useCallback(() => {
    if (!contextRef.current) return;
    contextRef.current.closePath();
    setIsDrawing(false);
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !contextRef.current) return;

    contextRef.current.fillStyle = 'white';
    contextRef.current.fillRect(0, 0, width, height);
  };

  const handleCaptureDrawn = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    onCapture(dataUrl, 'draw');
  };

  const handleCaptureType = () => {
    if (!typeText.trim()) return;

    // Create canvas with typed text
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    // Use a cursive font for signature
    ctx.font = 'italic 48px "Dancing Script", cursive';
    ctx.fillStyle = '#6366f1';
    ctx.textBaseline = 'middle';

    // Center the text
    const textWidth = ctx.measureText(typeText).width;
    const x = (width - textWidth) / 2;
    const y = height / 2;
    ctx.fillText(typeText, x, y);

    // Add border
    ctx.strokeStyle = '#e8e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/png');
    onCapture(dataUrl, 'type');
  };

  return (
    <div className="w-full space-y-4">
      {/* Mode Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setMode('draw')}
          className={`pb-3 px-4 flex items-center gap-2 font-medium transition-colors ${
            mode === 'draw'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Pen size={18} />
          Draw
        </button>
        <button
          onClick={() => setMode('type')}
          className={`pb-3 px-4 flex items-center gap-2 font-medium transition-colors ${
            mode === 'type'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Type size={18} />
          Type
        </button>
      </div>

      {/* Draw Mode */}
      {mode === 'draw' && (
        <div className="space-y-3">
          <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseUp={stopDrawing}
              onMouseMove={draw}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchEnd={stopDrawing}
              onTouchMove={draw}
              className="block w-full cursor-crosshair touch-none"
              style={{ height: `${height}px` }}
            />
          </div>
          <button
            onClick={clearCanvas}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RotateCcw size={16} />
            Clear
          </button>
          <button
            onClick={handleCaptureDrawn}
            className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            Use This Signature
          </button>
        </div>
      )}

      {/* Type Mode */}
      {mode === 'type' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Your Name</label>
            <input
              type="text"
              value={typeText}
              onChange={e => setTypeText(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          {typeText && (
            <div className="border-2 border-gray-200 rounded-lg bg-white p-8 text-center">
              <div
                style={{
                  fontSize: '48px',
                  fontStyle: 'italic',
                  fontFamily: '"Dancing Script", cursive',
                  color: '#6366f1',
                }}
              >
                {typeText}
              </div>
            </div>
          )}
          <button
            onClick={handleCaptureType}
            disabled={!typeText.trim()}
            className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            Use This Signature
          </button>
        </div>
      )}
    </div>
  );
}
