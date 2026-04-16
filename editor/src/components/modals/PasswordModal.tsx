import { useState } from 'react';
import { useEditorStore } from '@/stores/editor-store';
import { ModalShell } from './ModalShell';
import { Eye, EyeOff, Loader } from 'lucide-react';

export function PasswordModal() {
  const { closeModal, activeDocument } = useEditorStore();
  const [ownerPassword, setOwnerPassword] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);

  const handleEncrypt = async () => {
    const doc = activeDocument();
    if (!doc || !doc.pdfDoc) {
      alert('No document loaded');
      return;
    }

    if (!ownerPassword && !userPassword) {
      alert('Please enter at least one password');
      return;
    }

    setIsEncrypting(true);
    try {
      // Placeholder: In production, this would encrypt the PDF with the provided passwords
      // For now, we'll just show a success message
      alert('PDF encryption feature coming soon!');
      closeModal();
    } catch (error) {
      console.error('Error encrypting PDF:', error);
      alert('Failed to encrypt PDF');
    } finally {
      setIsEncrypting(false);
    }
  };

  return (
    <ModalShell title="Protect with Password" onClose={closeModal} width="max-w-md">
      <div className="space-y-4">
        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <p className="text-xs text-blue-900">
            Owner password: Can modify document restrictions
          </p>
          <p className="text-xs text-blue-900 mt-1">
            User password: Required to open the document
          </p>
        </div>

        {/* Owner Password */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Owner Password
          </label>
          <div className="relative">
            <input
              type={showOwnerPassword ? 'text' : 'password'}
              value={ownerPassword}
              onChange={(e) => setOwnerPassword(e.target.value)}
              placeholder="Leave empty for no restrictions"
              className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={() => setShowOwnerPassword(!showOwnerPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
            >
              {showOwnerPassword ? (
                <EyeOff size={18} className="text-gray-500" />
              ) : (
                <Eye size={18} className="text-gray-500" />
              )}
            </button>
          </div>
        </div>

        {/* User Password */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            User Password
          </label>
          <div className="relative">
            <input
              type={showUserPassword ? 'text' : 'password'}
              value={userPassword}
              onChange={(e) => setUserPassword(e.target.value)}
              placeholder="Leave empty for open access"
              className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={() => setShowUserPassword(!showUserPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
            >
              {showUserPassword ? (
                <EyeOff size={18} className="text-gray-500" />
              ) : (
                <Eye size={18} className="text-gray-500" />
              )}
            </button>
          </div>
        </div>

        {/* Restrictions Info */}
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          <p className="text-xs text-gray-600">
            <strong>Restrictions:</strong> Printing, copying, and modifying will be disabled
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
        <button
          onClick={closeModal}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleEncrypt}
          disabled={isEncrypting || (!ownerPassword && !userPassword)}
          className={`
            flex-1 px-4 py-2 text-sm font-medium rounded-lg text-white
            flex items-center justify-center gap-2 transition-opacity
            ${
              isEncrypting || (!ownerPassword && !userPassword)
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90'
            }
          `}
        >
          {isEncrypting && <Loader size={16} className="animate-spin" />}
          {isEncrypting ? 'Encrypting...' : 'Encrypt PDF'}
        </button>
      </div>
    </ModalShell>
  );
}
