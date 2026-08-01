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

/** Validation schema — password must match the backend strength rule. */
const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name must be under 100 characters'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        PASSWORD_REGEX,
        'Must include an uppercase letter, lowercase letter, digit, and special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/** Values produced by the register form. */
type RegisterFormValues = z.infer<typeof registerSchema>;

/** Rule checks used for the strength meter (also mirrors backend validation). */
const STRENGTH_CHECKS = [
  (value: string) => /[a-z]/.test(value),
  (value: string) => /[A-Z]/.test(value),
  (value: string) => /\d/.test(value),
  (value: string) => /[^A-Za-z0-9]/.test(value),
  (value: string) => value.length >= 8,
];

/**
 * Registration form with strong-password validation, a live strength meter,
 * and a confirm-password match check. Redirects to login on success.
 */
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
  const strength = useMemo(
    () => STRENGTH_CHECKS.filter((check) => check(password)).length,
    [password]
  );

  const onSubmit = handleSubmit(async (values) => {
    await registerAction({ fullName: values.fullName, email: values.email, password: values.password });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <Input
        id="fullName"
        type="text"
        label="Full name"
        placeholder="Jane Doe"
        autoComplete="name"
        icon={<UserIcon className="h-4 w-4" aria-hidden="true" />}
        error={errors.fullName?.message}
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
        {...register('email')}
      />

      <div className="space-y-2">
        <Input
          id="password"
          type={showPassword ? 'text' : 'password'}
          label="Password"
          placeholder="Create a strong password"
          autoComplete="new-password"
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

        {/* Password strength meter */}
        <div className="flex gap-1" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, index) => (
            <span
              key={index}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors duration-300',
                index < strength
                  ? strength <= 2
                    ? 'bg-rose-500'
                    : strength <= 4
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  : 'bg-slate-700'
              )}
            />
          ))}
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
        {...register('confirmPassword')}
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isSubmitting}
        leftIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
      >
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </Button>

      <p className="text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link
          to={ROUTES.LOGIN}
          className="font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
