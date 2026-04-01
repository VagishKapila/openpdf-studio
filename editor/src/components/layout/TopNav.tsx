import React, { useRef, useEffect, useState } from 'react';
import { LogOut, Menu, User, FileText } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

const DocuFlowLogo: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="13" x2="8" y2="13" />
    <line x1="12" y1="17" x2="8" y2="17" />
  </svg>
);

export const TopNav: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  return (
    <nav className="h-11 bg-white border-b border-[#E8E5E0] flex items-center justify-between px-4 shrink-0">
      {/* Left: Logo + Brand */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 text-brand-600">
          <DocuFlowLogo />
        </div>
        <span className="font-semibold text-sm text-[#2D2B2E]">DocuFlow</span>
      </div>

      {/* Right: Auth Area */}
      <div className="flex items-center gap-3">
        {!isAuthenticated ? (
          <button className="px-4 py-1.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded transition-colors">
            Sign In
          </button>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#F5F3F0] rounded transition-colors"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center">
                  <span className="text-xs font-semibold text-brand-600">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-sm text-[#2D2B2E]">{user?.name}</span>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-[#E8E5E0] z-50 py-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    // Navigate to profile
                  }}
                  className="w-full px-4 py-2 text-sm text-left text-[#2D2B2E] hover:bg-[#F5F3F0] flex items-center gap-2 transition-colors"
                >
                  <User size={16} />
                  Profile
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    // Navigate to my documents
                  }}
                  className="w-full px-4 py-2 text-sm text-left text-[#2D2B2E] hover:bg-[#F5F3F0] flex items-center gap-2 transition-colors"
                >
                  <FileText size={16} />
                  My Documents
                </button>
                <hr className="my-1 border-[#E8E5E0]" />
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    // Navigate to settings
                  }}
                  className="w-full px-4 py-2 text-sm text-left text-[#2D2B2E] hover:bg-[#F5F3F0] flex items-center gap-2 transition-colors"
                >
                  <Menu size={16} />
                  Settings
                </button>
                <hr className="my-1 border-[#E8E5E0]" />
                <button
                  onClick={() => {
                    logout();
                    setDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 text-sm text-left text-[#DC2626] hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
