import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Eye, EyeOff, Lock, Mail, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { PASSWORD_REGEX, ROUTES } from '@/lib/constants';

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(PASSWORD_REGEX, 'Must include uppercase, lowercase, digit, and special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const STRENGTH_CHECKS = [
  (v: string) => /[a-z]/.test(v),
  (v: string) => /[A-Z]/.test(v),
  (v: string) => /\d/.test(v),
  (v: string) => /[^A-Za-z0-9]/.test(v),
  (v: string) => v.length >= 8,
];

export function RegisterForm() {
  const { register: registerAction } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  const password = watch('password');
  const strength = useMemo(() => STRENGTH_CHECKS.filter((c) => c(password)).length, [password]);

  const onSubmit = handleSubmit(async (values) => {
    await registerAction({
      fullName: values.fullName,
      email: values.email,
      password: values.password,
    });
  });

  const strengthLabel = strength <= 2 ? 'Weak' : strength <= 4 ? 'Good' : 'Strong';
  const strengthTextColor =
    strength <= 2 ? 'text-rose-500' : strength <= 4 ? 'text-amber-500' : 'text-emerald-600';
  const strengthColor =
    strength <= 2 ? 'bg-rose-400' : strength <= 4 ? 'bg-amber-400' : 'bg-emerald-500';

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Input
        id="fullName"
        type="text"
        label="Full name"
        placeholder="Jane Doe"
        autoComplete="name"
        icon={<UserIcon className="h-4 w-4" aria-hidden="true" />}
        error={errors.fullName?.message}
        className="h-12 rounded-2xl border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--text-primary)] shadow-sm transition-all duration-200 focus-within:border-accent-400 focus-within:ring-4 focus-within:ring-accent-400/20"
        {...register('fullName')}
      />

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

      <div className="space-y-2.5">
        <Input
          id="password"
          type={showPassword ? 'text' : 'password'}
          label="Password"
          placeholder="Create a strong password"
          autoComplete="new-password"
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

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
          <div className="mb-2 flex items-center justify-between text-[11px] font-medium">
            <span className="text-muted">Password strength</span>
            <span className={cn('uppercase tracking-[0.18em]', strengthTextColor)}>
              {strengthLabel}
            </span>
          </div>

          <div className="flex gap-1.5" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-all duration-300',
                  i < strength ? strengthColor : 'bg-white/10'
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <Input
        id="confirmPassword"
        type={showPassword ? 'text' : 'password'}
        label="Confirm password"
        placeholder="Repeat your password"
        autoComplete="new-password"
        icon={<Lock className="h-4 w-4" aria-hidden="true" />}
        error={errors.confirmPassword?.message}
        className="h-12 rounded-2xl border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--text-primary)] shadow-sm transition-all duration-200 focus-within:border-accent-400 focus-within:ring-4 focus-within:ring-accent-400/20"
        {...register('confirmPassword')}
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
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </Button>

      <p className="text-center text-sm text-[var(--text-muted)]">
        Already have an account?{' '}
        <Link
          to={ROUTES.LOGIN}
          className="group relative font-semibold text-accent-400 transition-colors hover:text-accent-300"
        >
          Sign in
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
export default RegisterForm;