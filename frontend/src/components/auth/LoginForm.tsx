import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';

/** Validation schema for the login form. */
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

/** Values produced by the login form. */
type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * Login form with client-side validation, password visibility toggle, and a
 * loading state. On success the auth hook stores the session and redirects.
 */
export function LoginForm() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    await login(values);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <Input
        id="email"
        type="email"
        label="Email"
        placeholder="you@example.com"
        autoComplete="email"
        icon={<Mail className="h-4 w-4" aria-hidden="true" />}
        error={errors.email?.message}
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
        trailing={
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            className="rounded p-1 text-slate-500 transition-colors hover:text-slate-200"
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
        leftIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
      >
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>

      <p className="text-center text-sm text-slate-400">
        Don&apos;t have an account?{' '}
        <Link
          to={ROUTES.REGISTER}
          className="font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
        >
          Register
        </Link>
      </p>
    </form>
  );
}
