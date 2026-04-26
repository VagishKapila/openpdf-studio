import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const login = useAuthStore((s) => s.login);
  const status = useAuthStore((s) => s.status);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginValues) => {
    try {
      await login(values.email, values.password);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign-in failed');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          {...register('email')}
        />
        {errors.email && <p className="text-xs text-rose-400">{errors.email.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          {...register('password')}
        />
        {errors.password && <p className="text-xs text-rose-400">{errors.password.message}</p>}
      </div>
      <Button
        type="submit"
        disabled={isSubmitting || status === 'loading'}
        className="w-full bg-amber-400 text-black hover:bg-amber-300 disabled:opacity-60"
      >
        {isSubmitting || status === 'loading' ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
