import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

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
  const registerUser = useAuthStore((s) => s.register);
  const status = useAuthStore((s) => s.status);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (values: SignupValues) => {
    try {
      await registerUser(values.email, values.password, values.name);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign-up failed');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="signup-name">Name</Label>
        <Input
          id="signup-name"
          placeholder="Your full name"
          autoComplete="name"
          {...register('name')}
        />
        {errors.name && <p className="text-xs text-rose-400">{errors.name.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          {...register('email')}
        />
        {errors.email && <p className="text-xs text-rose-400">{errors.email.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          {...register('password')}
        />
        {errors.password && <p className="text-xs text-rose-400">{errors.password.message}</p>}
      </div>
      <Button
        type="submit"
        disabled={isSubmitting || status === 'loading'}
        className="w-full bg-amber-400 text-black hover:bg-amber-300 disabled:opacity-60"
      >
        {isSubmitting || status === 'loading' ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}
