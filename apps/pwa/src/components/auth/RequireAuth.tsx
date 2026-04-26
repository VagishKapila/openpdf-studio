import type { ReactElement } from 'react';
import { cloneElement } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useAuthDialog } from '@/hooks/useAuthDialog';

interface RequireAuthProps {
  children: ReactElement;
  /** Message shown in dialog explaining why auth is needed. */
  contextMessage?: string;
  /** Callback fired after successful auth — use to resume the gated action. */
  onAuthed?: () => void;
}

/**
 * Wraps any clickable child. If the user is signed in, click passes through.
 * If not, click is intercepted and the AuthDialog opens with an optional
 * context message. After successful auth, onAuthed fires automatically.
 */
export function RequireAuth({ children, contextMessage, onAuthed }: RequireAuthProps) {
  const user = useAuthStore((s) => s.user);
  const openDialog = useAuthDialog((s) => s.openDialog);

  const handleClick = (e: React.MouseEvent) => {
    if (user) {
      const originalOnClick = (children.props as { onClick?: (e: React.MouseEvent) => void })
        .onClick;
      originalOnClick?.(e);
      onAuthed?.();
    } else {
      e.preventDefault();
      e.stopPropagation();
      openDialog({ contextMessage, onAuthed });
    }
  };

  return cloneElement(children, { onClick: handleClick });
}
