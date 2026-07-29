/**
 * useInsertImage — COWORK-50 F3: "Insert image" action.
 *
 * Reuses the signature placement pipeline end-to-end: the picked image becomes
 * a PendingSignature (source: 'upload'), the user taps to place it, and it is
 * stored/rendered/exported as a signature-type annotation — the exact same
 * mechanics (Konva.Image render, pdf-lib embedPng export, select/move/resize).
 *
 * Images are normalized to PNG data URLs via canvas (JPEG/WebP accepted as
 * input) and downscaled to MAX_DIM so Dexie rows and export payloads stay sane.
 */
import { useToolStore } from '@/store';

const MAX_DIM = 1600;

export function useInsertImage() {
  const setPendingSignature = useToolStore((s) => s.setPendingSignature);
  const setTool = useToolStore((s) => s.setTool);

  const processFile = async (file: File): Promise<void> => {
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('Could not read this image.'));
        el.src = objectUrl;
      });

      const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight, 1));
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable.');
      ctx.drawImage(img, 0, 0, w, h);
      const imageData = canvas.toDataURL('image/png');

      setPendingSignature({
        source: 'upload',
        imageData,
        naturalWidth: w,
        naturalHeight: h,
      });
      setTool('select'); // placement mode — tap the page to drop the image
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  const openImagePicker = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/webp';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      void processFile(file).catch((err) => {
        alert(err instanceof Error ? err.message : 'Could not insert this image.');
      });
    };
    input.click();
  };

  return { openImagePicker };
}
