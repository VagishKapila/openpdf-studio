import { useEffect } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { Toaster } from '@/components/ui/sonner';
import { useAuthStore } from '@/stores/auth';

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);

  // Verify persisted token is still valid on mount
  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <>
      <AppShell />
      <AuthDialog />
      <Toaster />
    </>
  );
}
