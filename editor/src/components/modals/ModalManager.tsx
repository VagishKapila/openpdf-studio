// ModalManager — dispatches the correct modal based on store state
import { useEditorStore } from '@/stores/editor-store';
import { SignatureModal } from './SignatureModal';
import { MergeModal } from './MergeModal';
import { OcrModal } from './OcrModal';
import { PasswordModal } from './PasswordModal';
import { CompressModal } from './CompressModal';
import { ConvertModal } from './ConvertModal';
import { AuthModal } from './AuthModal';

export function ModalManager() {
  const { activeModal, closeModal } = useEditorStore();

  if (!activeModal) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={closeModal}
    >
      <div
        className="animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {activeModal === 'signature' && <SignatureModal />}
        {activeModal === 'merge' && <MergeModal />}
        {activeModal === 'ocr' && <OcrModal />}
        {activeModal === 'password' && <PasswordModal />}
        {activeModal === 'compress' && <CompressModal />}
        {activeModal === 'convert' && <ConvertModal />}
        {activeModal === 'auth' && <AuthModal />}
      </div>
    </div>
  );
}
