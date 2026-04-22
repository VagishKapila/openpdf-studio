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
      className="fixed left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/80 px-2 py-1.5 shadow-lg backdrop-blur"
      style={{ top: 'calc(4rem + env(safe-area-inset-top))' }}
      data-testid="selection-action-bar"
    >
      {/* Duplicate — stubbed, enabled in Day 5+ */}
      <button
        disabled
        className="rounded-full p-1.5 opacity-30"
        aria-label="Duplicate (not yet available)"
        title="Duplicate — coming in Day 5"
      >
        <Copy className="h-4 w-4" />
      </button>

      <div className="mx-1 h-4 w-px bg-white/20" aria-hidden />

      {/* Delete */}
      <button
        onClick={handleDelete}
        className="rounded-full p-1.5 hover:bg-red-900/40 hover:text-red-300 transition-colors"
        aria-label="Delete annotation"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {/* Deselect */}
      <button
        onClick={() => setSelected(null)}
        className="rounded-full p-1.5 hover:bg-white/10 transition-colors"
        aria-label="Deselect"
        title="Done"
      >
        <X className="h-4 w-4 opacity-60" />
      </button>
    </div>
  );
}
