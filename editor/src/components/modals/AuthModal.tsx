import React, { useState } from 'react';
import { useEditorStore } from '@/stores/editor-store';
import { ModalShell } from './ModalShell';
import { Eye, EyeOff, Loader } from 'lucide-react';

type AuthTab = 'login' | 'register' | 'forgot';

export function AuthModal() {
  const { closeModal } = useEditorStore();
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [isLoading, setIsLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] =
    useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // TODO: Call auth service to login
      console.log('Login:', { email: loginEmail, password: loginPassword });
      alert('Login functionality coming soon');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (registerPassword !== registerConfirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (registerPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Call auth service to register
      console.log('Register:', {
        name: registerName,
        email: registerEmail,
        password: registerPassword,
      });
      alert('Register functionality coming soon');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // TODO: Call auth service to send reset email
      console.log('Forgot password:', { email: forgotEmail });
      setForgotSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalShell title="" onClose={closeModal} width="max-w-md">
      {/* Purple Gradient Header */}
      <div className="flex items-center justify-center mb-6 h-16 -mx-6 -mt-5 mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-2xl">
        <div className="text-center">
          <div className="text-white text-2xl font-bold">📄</div>
          <p className="text-white text-sm font-semibold mt-1">DocPix Studio</p>
        </div>
      </div>

      {/* Tabs */}
      {!forgotSent && (
        <div className="flex gap-3 mb-6 border-b border-gray-200 -mx-6 px-6">
          <button
            onClick={() => setActiveTab('login')}
            className={`
              px-4 py-3 text-sm font-medium border-b-2 transition-colors
              ${
                activeTab === 'login'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }
            `}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`
              px-4 py-3 text-sm font-medium border-b-2 transition-colors
              ${
                activeTab === 'register'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }
            `}
          >
            Create Account
          </button>
        </div>
      )}

      {/* Login Tab */}
      {activeTab === 'login' && (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showLoginPassword ? 'text' : 'password'}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
              >
                {showLoginPassword ? (
                  <EyeOff size={18} className="text-gray-500" />
                ) : (
                  <Eye size={18} className="text-gray-500" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-indigo-600"
              />
              <span className="text-sm text-gray-700">Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => setActiveTab('forgot')}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`
              w-full py-2.5 px-4 rounded-lg font-medium text-white
              flex items-center justify-center gap-2 transition-opacity
              ${
                isLoading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90'
              }
            `}
          >
            {isLoading && <Loader size={16} className="animate-spin" />}
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            className="w-full py-2.5 px-4 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <span>🔵</span>
            Google
          </button>
        </form>
      )}

      {/* Register Tab */}
      {activeTab === 'register' && (
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={registerName}
              onChange={(e) => setRegisterName(e.target.value)}
              placeholder="John Doe"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showRegisterPassword ? 'text' : 'password'}
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
              >
                {showRegisterPassword ? (
                  <EyeOff size={18} className="text-gray-500" />
                ) : (
                  <Eye size={18} className="text-gray-500" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              At least 8 characters, 1 uppercase letter, 1 number
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showRegisterConfirmPassword ? 'text' : 'password'}
                value={registerConfirmPassword}
                onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() =>
                  setShowRegisterConfirmPassword(!showRegisterConfirmPassword)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
              >
                {showRegisterConfirmPassword ? (
                  <EyeOff size={18} className="text-gray-500" />
                ) : (
                  <Eye size={18} className="text-gray-500" />
                )}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              required
              className="w-4 h-4 rounded border-gray-300 text-indigo-600"
            />
            <span className="text-sm text-gray-600">
              I agree to the Terms of Service and Privacy Policy
            </span>
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className={`
              w-full py-2.5 px-4 rounded-lg font-medium text-white
              flex items-center justify-center gap-2 transition-opacity
              ${
                isLoading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90'
              }
            `}
          >
            {isLoading && <Loader size={16} className="animate-spin" />}
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      )}

      {/* Forgot Password Tab */}
      {activeTab === 'forgot' && !forgotSent && (
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <p className="text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your
            password.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`
              w-full py-2.5 px-4 rounded-lg font-medium text-white
              flex items-center justify-center gap-2 transition-opacity
              ${
                isLoading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90'
              }
            `}
          >
            {isLoading && <Loader size={16} className="animate-spin" />}
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Back to Sign In
          </button>
        </form>
      )}

      {/* Forgot Password Sent */}
      {activeTab === 'forgot' && forgotSent && (
        <div className="space-y-4 text-center">
          <div className="text-4xl mb-2">✓</div>
          <h3 className="text-lg font-semibold text-gray-900">Check your email</h3>
          <p className="text-sm text-gray-600">
            We've sent a password reset link to {forgotEmail}
          </p>
          <p className="text-xs text-gray-500">
            The link will expire in 24 hours.
          </p>

          <button
            onClick={() => {
              setForgotSent(false);
              setActiveTab('login');
            }}
            className="w-full py-2.5 px-4 rounded-lg font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 transition-opacity"
          >
            Back to Sign In
          </button>
        </div>
      )}
    </ModalShell>
  );
}
