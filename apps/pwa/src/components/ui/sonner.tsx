import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      style={{
        // React 19 + sonner 1.4 compat: ref-based inline styles not applied,
        // so force positioning explicitly to ensure toasts appear above dialogs.
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        zIndex: 999999,
      }}
      toastOptions={{
        style: {
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#fff',
          backdropFilter: 'blur(20px)',
        },
      }}
    />
  );
}
