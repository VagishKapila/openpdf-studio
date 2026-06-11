import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { ComponentPropsWithoutRef } from 'react';

/** Drop-in replacement for `<Input type="password">` with a show/hide toggle. */
type PasswordInputProps = Omit<ComponentPropsWithoutRef<typeof Input>, 'type'>;

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? 'text' : 'password'}
        className={['auth-input pr-10', className].filter(Boolean).join(' ')}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={visible ? 'Hide password' : 'Show password'}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors focus:outline-none"
      >
        {visible ? (
          <EyeOff size={15} strokeWidth={1.7} />
        ) : (
          <Eye size={15} strokeWidth={1.7} />
        )}
      </button>
    </div>
  );
}
