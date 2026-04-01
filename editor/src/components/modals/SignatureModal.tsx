import { useRef, useState } from 'react';
import { useEditorStore } from '@/stores/editor-store';
import { ModalShell } from './ModalShell';

type SignatureMode = 'draw' | 'type';

export function SignatureModal() {
  const { closeModal, addSignature } = useEditorStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<SignatureMode>('draw');
  const [typedSignature, setTypedSignature] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    setIsDrawing(true);

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const initializeCanvas = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  const handleSave = () => {
    if (mode === 'draw') {
      if (canvasRef.current) {
        const dataUrl = canvasRef.current.toDataURL('image/png');
        addSignature({ type: 'draw', data: dataUrl });
      }
    } else {
      if (typedSignature.trim()) {
        addSignature({ type: 'type', data: typedSignature });
      }
    }
    closeModal();
  };

  return (
    <ModalShell title="Create Signature" onClose={closeModal} width="max-w-2xl">
      {/* Mode Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setMode('draw')}
          className={`
            px-4 py-2 rounded-lg font-medium transition-colors
            ${
              mode === 'draw'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          Draw
        </button>
        <button
          onClick={() => setMode('type')}
          className={`
            px-4 py-2 rounded-lg font-medium transition-colors
            ${
              mode === 'type'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          Type
        </button>
      </div>

      {/* Draw Mode */}
      {mode === 'draw' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Sign on the canvas below</p>
          <canvas
            ref={(el) => {
              canvasRef.current = el;
              initializeCanvas(el);
            }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            width={500}
            height={200}
            className="w-full border border-gray-300 rounded-lg cursor-crosshair bg-white"
          />
          <button
            onClick={clearCanvas}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Type Mode */}
      {mode === 'type' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Type your signature</p>
          <input
            type="text"
            value={typedSignature}
            onChange={(e) => setTypedSignature(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <div className="p-4 bg-gray-50 rounded-lg min-h-[100px] flex items-center justify-center">
            <div
              style={{
                fontSize: '48px',
                fontFamily: 'cursive',
                color: '#000',
              }}
            >
              {typedSignature || 'Your Signature'}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
        <button
          onClick={closeModal}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg hover:opacity-90 transition-opacity"
        >
          Save Signature
        </button>
      </div>
    </ModalShell>
  );
}
