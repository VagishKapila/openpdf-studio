import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/stores/auth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AnimatedSubmitButton } from './AnimatedSubmitButton';
import { PasswordInput } from './PasswordInput';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type SignupValues = z.infer<typeof signupSchema>;

interface SignupFormProps {
  onSuccess?: () => void;
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const register_ = useAuth((s) => s.register);
  const status = useAuth((s) => s.status);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (values: SignupValues) => {
    try {
      await register_(values.email, values.password, values.name);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign-up failed');
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
        <Label htmlFor="signup-name" className="text-zinc-300/70">
          Name
        </Label>
        <Input
          id="signup-name"
          placeholder="Your full name"
          autoComplete="name"
          {...register('name')}
          className="auth-input"
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="mt-1.5 text-xs text-rose-400">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="signup-email" className="text-zinc-300/70">
          Email
        </Label>
        <Input
          id="signup-email"
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
        <Label htmlFor="signup-password" className="text-zinc-300/70">
          Password
        </Label>
        <PasswordInput
          id="signup-password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          {...register('password')}
          aria-invalid={!!errors.password}
        />
        {errors.password && (
          <p className="mt-1.5 text-xs text-rose-400">{errors.password.message}</p>
        )}
      </div>

      <AnimatedSubmitButton loading={isSubmitting || status === 'loading'}>
        Create account
      </AnimatedSubmitButton>
    </motion.form>
  );
}
