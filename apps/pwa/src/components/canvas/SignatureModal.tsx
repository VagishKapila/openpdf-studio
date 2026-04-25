/**
 * SignatureModal — three-tab modal for capturing signatures.
 * Tabs: Draw (signature_pad) | Type (cursive font) | Upload (image file)
 */
import { useEffect, useRef, useState } from 'react';
import SignaturePad from 'signature_pad';
import type { PendingSignature } from '@/store/tool';

type Tab = 'draw' | 'type' | 'upload';

const FONTS = [
  { label: 'Script', family: "'Dancing Script', cursive" },
  { label: 'Round',  family: "'Pacifico', cursive" },
  { label: 'Thin',   family: "'Sacramento', cursive" },
] as const;

let fontsLoaded = false;
function ensureFontsLoaded() {
  if (fontsLoaded || typeof document === 'undefined') return;
  fontsLoaded = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href =
    'https://fonts.googleapis.com/css2?family=Dancing+Script&family=Pacifico&family=Sacramento&display=swap';
  document.head.appendChild(link);
}

type SignatureModalProps = {
  open: boolean;
  onClose: () => void;
  onPlace: (sig: PendingSignature) => void;
};

export function SignatureModal({ open, onClose, onPlace }: SignatureModalProps) {
  const [tab, setTab] = useState<Tab>('draw');

  // Draw tab
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const sigPadRef = useRef<SignaturePad | null>(null);

  // Type tab
  const [typedText, setTypedText] = useState('');
  const [selectedFont, setSelectedFont] = useState<string>(FONTS[0].family);

  // Upload tab
  const [uploadDataUrl, setUploadDataUrl] = useState<string | null>(null);
  const [uploadNaturalW, setUploadNaturalW] = useState(0);
  const [uploadNaturalH, setUploadNaturalH] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { ensureFontsLoaded(); }, []);

  // Initialize signature_pad once when modal opens (draw tab is default).
  // The pad lives for the whole modal session — we only resize when the
  // draw tab becomes visible again after being hidden with display:none.
  useEffect(() => {
    if (!open) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;

    // Cap at 480x200 to keep dataURL small
    const maxW = Math.min(window.innerWidth * 0.9, 480);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = maxW * dpr;
    canvas.height = 200 * dpr;
    canvas.style.width = `${maxW}px`;
    canvas.style.height = '200px';
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);

    const pad = new SignaturePad(canvas, {
      backgroundColor: 'rgba(255,255,255,1)',
      penColor: '#1a1a1a',
      minWidth: 2,
      maxWidth: 4,
    });
    sigPadRef.current = pad;

    return () => {
      pad.off();
      sigPadRef.current = null;
    };
  }, [open]);

  // When the user switches back to the Draw tab the canvas was hidden
  // (display:none) so its offsetWidth may have been 0. Re-size it now that
  // it is visible again. v1 behaviour: switching back shows a blank canvas.
  useEffect(() => {
    if (tab !== 'draw') return;
    const canvas = drawCanvasRef.current;
    if (!canvas || !sigPadRef.current) return;
    const timer = setTimeout(() => {
      const ratio = window.devicePixelRatio || 1;
      const maxW = Math.min(window.innerWidth * 0.9, 480);
      canvas.width = maxW * ratio;
      canvas.height = 200 * ratio;
      canvas.style.width = `${maxW}px`;
      canvas.style.height = '200px';
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(ratio, ratio);
      sigPadRef.current!.clear();
    }, 50);
    return () => clearTimeout(timer);
  }, [tab]);

  const handleClear = () => { sigPadRef.current?.clear(); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        // Auto-crop transparent PNG
        if (file.type === 'image/png') {
          const off = document.createElement('canvas');
          off.width = img.naturalWidth;
          off.height = img.naturalHeight;
          const ctx = off.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const d = ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight).data;
            let minX = img.naturalWidth, minY = img.naturalHeight, maxX = 0, maxY = 0;
            for (let y = 0; y < img.naturalHeight; y++) {
              for (let x = 0; x < img.naturalWidth; x++) {
                if (d[(y * img.naturalWidth + x) * 4 + 3] > 0) {
                  if (x < minX) minX = x; if (x > maxX) maxX = x;
                  if (y < minY) minY = y; if (y > maxY) maxY = y;
                }
              }
            }
            if (maxX > minX && maxY > minY) {
              const cw = maxX - minX + 1, ch = maxY - minY + 1;
              const crop = document.createElement('canvas');
              crop.width = cw; crop.height = ch;
              const cCtx = crop.getContext('2d');
              if (cCtx) {
                cCtx.drawImage(off, minX, minY, cw, ch, 0, 0, cw, ch);
                setUploadDataUrl(crop.toDataURL('image/png'));
                setUploadNaturalW(cw);
                setUploadNaturalH(ch);
                return;
              }
            }
          }
        }
        setUploadDataUrl(dataUrl);
        setUploadNaturalW(img.naturalWidth);
        setUploadNaturalH(img.naturalHeight);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handlePlace = () => {
    if (tab === 'draw') {
      const pad = sigPadRef.current;
      if (!pad || pad.isEmpty()) return;
      const canvas = drawCanvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      onPlace({
        source: 'draw',
        imageData: canvas.toDataURL('image/png'),
        naturalWidth: canvas.width / dpr,
        naturalHeight: canvas.height / dpr,
      });
    } else if (tab === 'type') {
      if (!typedText.trim()) return;
      // Render text to offscreen canvas for consistent PNG imageData
      const fontSize = 64;
      const off = document.createElement('canvas');
      const ctx = off.getContext('2d');
      if (!ctx) return;
      ctx.font = `${fontSize}px ${selectedFont}`;
      const tw = Math.ceil(ctx.measureText(typedText).width) + 24;
      const th = Math.ceil(fontSize * 1.5);
      off.width = tw; off.height = th;
      ctx.font = `${fontSize}px ${selectedFont}`;
      ctx.fillStyle = '#1a1a1a';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedText, 12, th / 2);
      onPlace({
        source: 'type',
        imageData: off.toDataURL('image/png'),
        text: typedText,
        fontFamily: selectedFont,
        naturalWidth: tw,
        naturalHeight: th,
      });
    } else {
      if (!uploadDataUrl) return;
      onPlace({
        source: 'upload',
        imageData: uploadDataUrl,
        naturalWidth: uploadNaturalW,
        naturalHeight: uploadNaturalH,
      });
    }
  };

  const canPlace =
    tab === 'draw' ||
    (tab === 'type' && typedText.trim().length > 0) ||
    (tab === 'upload' && uploadDataUrl !== null);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Add signature"
      data-testid="signature-modal"
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full md:w-auto md:min-w-[520px] bg-neutral-900 rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white">Add Signature</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white text-xl leading-none" aria-label="Close">x</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {(['draw', 'type', 'upload'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              data-testid={`sig-tab-${t}`}
              className={[
                'flex-1 py-2.5 text-xs font-medium capitalize transition-colors',
                tab === t ? 'text-amber-400 border-b-2 border-amber-400' : 'text-white/40 hover:text-white/70',
              ].join(' ')}
            >
              {t === 'draw' ? 'Draw' : t === 'type' ? 'Type' : 'Upload'}
            </button>
          ))}
        </div>

        {/* Content — all three tabs are always mounted; display:none hides inactive ones.
             This preserves drawn signatures and typed text when the user switches tabs. */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Draw tab */}
          <div style={{ display: tab === 'draw' ? 'block' : 'none' }}>
            <div className="flex flex-col items-center gap-3">
              <p className="text-xs text-white/50">Draw your signature below</p>
              <div className="rounded-lg overflow-hidden border border-white/10 bg-white">
                <canvas ref={drawCanvasRef} data-testid="signature-canvas" className="block touch-none" />
              </div>
              <button onClick={handleClear} className="text-xs text-white/40 hover:text-white/70 transition-colors" data-testid="sig-clear">
                Clear
              </button>
            </div>
          </div>

          {/* Type tab */}
          <div style={{ display: tab === 'type' ? 'block' : 'none' }}>
            <div className="flex flex-col gap-4">
              <input
                type="text"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                placeholder="Type your name..."
                data-testid="sig-type-input"
                className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <div className="flex gap-2" data-testid="sig-font-buttons">
                {FONTS.map((f) => (
                  <button
                    key={f.family}
                    onClick={() => setSelectedFont(f.family)}
                    aria-pressed={selectedFont === f.family}
                    className={[
                      'flex-1 rounded-lg py-1.5 text-xs transition-colors',
                      selectedFont === f.family ? 'bg-amber-400/20 text-amber-400' : 'bg-white/5 text-white/50 hover:bg-white/10',
                    ].join(' ')}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div
                className="min-h-[72px] flex items-center justify-center rounded-lg bg-white px-4 py-2"
                data-testid="sig-type-preview"
                style={{ fontFamily: selectedFont, fontSize: 48, color: '#1a1a1a', lineHeight: 1.2 }}
              >
                {typedText || <span className="text-gray-300 text-base" style={{ fontFamily: 'inherit' }}>Preview</span>}
              </div>
            </div>
          </div>

          {/* Upload tab */}
          <div style={{ display: tab === 'upload' ? 'block' : 'none' }}>
            <div className="flex flex-col items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleFileChange}
                className="hidden"
                data-testid="sig-file-input"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-dashed border-white/20 px-6 py-4 text-sm text-white/50 hover:border-amber-400/50 hover:text-white/70 transition-colors"
              >
                Click to choose image (PNG or JPG)
              </button>
              {uploadDataUrl && (
                <div className="rounded-lg overflow-hidden bg-white p-2 max-w-full">
                  <img src={uploadDataUrl} alt="Signature preview" data-testid="sig-upload-preview" className="max-h-32 max-w-full object-contain" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-white/10">
          <button
            onClick={onClose}
            data-testid="sig-cancel"
            className="flex-1 rounded-lg py-2.5 text-sm font-medium text-white/60 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePlace}
            disabled={!canPlace}
            data-testid="sig-place"
            className={[
              'flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors',
              canPlace ? 'bg-amber-400 text-black hover:bg-amber-300' : 'bg-white/10 text-white/30 cursor-not-allowed',
            ].join(' ')}
          >
            Place Signature
          </button>
        </div>
      </div>
    </div>
  );
}
