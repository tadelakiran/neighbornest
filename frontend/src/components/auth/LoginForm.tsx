import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LocationState {
  registeredEmail?: string;
}

export function LoginForm() {
  const { login } = useAuth();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const registeredEmail = (location.state as LocationState | null)?.registeredEmail ?? '';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: registeredEmail, password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    await login(values);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Input
        id="email"
        type="email"
        label="Email"
        placeholder="you@example.com"
        autoComplete="email"
        icon={<Mail className="h-4 w-4" aria-hidden="true" />}
        error={errors.email?.message}
        className="h-12 rounded-2xl border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--text-primary)] shadow-sm transition-all duration-200 focus-within:border-accent-400 focus-within:ring-4 focus-within:ring-accent-400/20"
        {...register('email')}
      />

      <Input
        id="password"
        type={showPassword ? 'text' : 'password'}
        label="Password"
        placeholder="••••••••"
        autoComplete="current-password"
        icon={<Lock className="h-4 w-4" aria-hidden="true" />}
        error={errors.password?.message}
        className="h-12 rounded-2xl border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--text-primary)] shadow-sm transition-all duration-200 focus-within:border-accent-400 focus-within:ring-4 focus-within:ring-accent-400/20"
        trailing={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="rounded-full p-1.5 text-muted transition-colors hover:bg-white/[0.06] hover:text-primary"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
        {...register('password')}
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isSubmitting}
        className="h-12 rounded-2xl shadow-glow"
        rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
      >
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>

      <p className="text-center text-sm text-[var(--text-muted)]">
        Don&apos;t have an account?{' '}
        <Link
          to={ROUTES.REGISTER}
          className="group relative font-semibold text-accent-400 transition-colors hover:text-accent-300"
        >
          Register
          <span
            aria-hidden="true"
            className="absolute -bottom-0.5 left-0 h-px w-0 bg-accent-gradient transition-all duration-300 group-hover:w-full"
          />
        </Link>
      </p>
    </form>
  );
}

// Default export added so this works with React.lazy() in the router.
export default LoginForm;