import type { ReactElement } from 'react';
import { cloneElement } from 'react';
import { useAuth } from '@/stores/auth';
import { useAuthDialog } from '@/hooks/useAuthDialog';

interface RequireAuthProps {
  children: ReactElement;
  /** Message shown in the dialog header explaining why auth is needed. */
  contextMessage?: string;
  /** Action to fire after successful auth — e.g., open the Request Signatures flow. */
  onAuthed?: () => void;
}

/**
 * Wraps a clickable element. If user is signed in, click passes through.
 * If not, click intercepts → opens AuthDialog with optional context message.
 * After successful auth, the original onAuthed callback fires.
 *
 * Usage:
 *   <RequireAuth
 *     contextMessage="Sign in to send for signature"
 *     onAuthed={() => openRequestSignaturesFlow()}
 *   >
 *     <Button>Request Signatures</Button>
 *   </RequireAuth>
 */
export function RequireAuth({ children, contextMessage, onAuthed }: RequireAuthProps) {
  const user = useAuth((s) => s.user);
  const openDialog = useAuthDialog((s) => s.openDialog);

  const handleClick = (e: React.MouseEvent) => {
    if (user) {
      // Pass through to original onClick
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
