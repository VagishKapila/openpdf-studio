import { Trash2, Copy, X } from 'lucide-react';
import { useAnnotationStore } from '@/store';

export function SelectionActionBar() {
  const selectedId = useAnnotationStore((s) => s.selectedId);
  const removeAnnotation = useAnnotationStore((s) => s.removeAnnotation);
  const setSelected = useAnnotationStore((s) => s.setSelected);

  if (!selectedId) return null;

  const handleDelete = () => {
    void removeAnnotation(selectedId);
  };

  return (
    <div
      className="fixed left-1/2 z-50 flex -translate-x-1/2 items-center gap-0.5 rounded-xl bg-white px-2 py-1.5 shadow-lg shadow-black/30 border border-gray-100"
      style={{ top: 'calc(4rem + env(safe-area-inset-top))' }}
      data-testid="selection-action-bar"
    >
      {/* Duplicate — stubbed, coming later */}
      <button
        disabled
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-300 cursor-not-allowed"
        aria-label="Duplicate (not yet available)"
        title="Duplicate — coming soon"
      >
        <Copy size={15} />
      </button>

      <div className="mx-1 h-4 w-px bg-gray-200" aria-hidden />

      {/* Delete */}
      <button
        onClick={handleDelete}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        aria-label="Delete annotation"
        title="Delete"
      >
        <Trash2 size={15} />
      </button>

      {/* Deselect */}
      <button
        onClick={() => setSelected(null)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        aria-label="Deselect"
        title="Done"
      >
        <X size={15} />
      </button>
    </div>
  );
}
