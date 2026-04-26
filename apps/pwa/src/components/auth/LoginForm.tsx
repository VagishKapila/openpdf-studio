import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/stores/auth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AnimatedSubmitButton } from './AnimatedSubmitButton';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const login = useAuth((s) => s.login);
  const status = useAuth((s) => s.status);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginValues) => {
    try {
      await login(values.email, values.password);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign-in failed');
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-3.5"
    >
      <div>
        <Label htmlFor="login-email" className="text-zinc-300/70">
          Email
        </Label>
        <Input
          id="login-email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          {...register('email')}
          className="auth-input"
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="mt-1.5 text-xs text-rose-400">{errors.email.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="login-password" className="text-zinc-300/70">
          Password
        </Label>
        <Input
          id="login-password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          {...register('password')}
          className="auth-input"
          aria-invalid={!!errors.password}
        />
        {errors.password && (
          <p className="mt-1.5 text-xs text-rose-400">{errors.password.message}</p>
        )}
      </div>

      <AnimatedSubmitButton loading={isSubmitting || status === 'loading'}>
        Sign in
      </AnimatedSubmitButton>
    </motion.form>
  );
}
