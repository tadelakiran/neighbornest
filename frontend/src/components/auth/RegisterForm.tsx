import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Eye, EyeOff, Lock, Mail, Sparkles, User as UserIcon } from 'lucide-react';
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
    <div className="relative overflow-hidden rounded-[34px] border border-white/60 bg-slate-950/90 p-3 shadow-[0_30px_120px_-45px_rgba(15,23,42,0.85)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.22),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.18),_transparent_25%)]" />

      <div className="relative grid gap-3 lg:grid-cols-[1fr_1.1fr]">
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-accent-500 via-violet-500 to-sky-500 p-8 text-white">
          <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-white/25 blur-3xl" />
          <div className="absolute -bottom-16 -left-12 h-48 w-48 rounded-full bg-sky-200/20 blur-3xl" />

          <div className="relative z-10 flex h-full flex-col justify-between gap-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]">
                <Sparkles className="h-3.5 w-3.5" />
                New Member
              </div>

              <div className="space-y-3">
                <h2 className="text-3xl font-semibold leading-tight">Create your future-ready account.</h2>
                <p className="max-w-sm text-sm text-white/85">
                  Learn faster, stay organized, and unlock a polished dashboard tailored for growth.
                </p>
              </div>
            </div>

            <div className="space-y-3 rounded-[22px] border border-white/20 bg-white/10 p-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Private & secure</p>
                  <p className="text-xs text-white/75">Protected profile, encrypted confidence.</p>
                </div>
              </div>

              <div className="grid gap-2 text-xs text-white/80 sm:grid-cols-2">
                <div className="rounded-xl bg-white/10 px-3 py-2">Fast onboarding</div>
                <div className="rounded-xl bg-white/10 px-3 py-2">Smart learning paths</div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] bg-white/96 p-5 sm:p-7">
          <div className="mb-6 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-600">Create account</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px]">Join the platform</h1>
            <p className="text-sm text-slate-500">A streamlined, secure way to start your learning journey.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Input
              id="fullName"
              type="text"
              label="Full name"
              placeholder="Jane Doe"
              autoComplete="name"
              icon={<UserIcon className="h-4 w-4" aria-hidden="true" />}
              error={errors.fullName?.message}
              className="h-12 rounded-2xl border-slate-200 bg-slate-50/90 text-slate-900 shadow-sm transition-all duration-200 focus-within:border-accent-400 focus-within:ring-4 focus-within:ring-accent-100"
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
              className="h-12 rounded-2xl border-slate-200 bg-slate-50/90 text-slate-900 shadow-sm transition-all duration-200 focus-within:border-accent-400 focus-within:ring-4 focus-within:ring-accent-100"
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
                className="h-12 rounded-2xl border-slate-200 bg-slate-50/90 text-slate-900 shadow-sm transition-all duration-200 focus-within:border-accent-400 focus-within:ring-4 focus-within:ring-accent-100"
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                {...register('password')}
              />

              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                <div className="mb-2 flex items-center justify-between text-[11px] font-medium">
                  <span className="text-slate-500">Password strength</span>
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
                        i < strength ? strengthColor : 'bg-slate-200'
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
              className="h-12 rounded-2xl border-slate-200 bg-slate-50/90 text-slate-900 shadow-sm transition-all duration-200 focus-within:border-accent-400 focus-within:ring-4 focus-within:ring-accent-100"
              {...register('confirmPassword')}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              className="h-12 rounded-2xl bg-gradient-to-r from-accent-500 to-accent-600 text-sm font-semibold shadow-lg shadow-accent-500/25 transition-all hover:-translate-y-0.5 hover:shadow-accent-500/35"
              rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            >
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </Button>

            <p className="text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link
                to={ROUTES.LOGIN}
                className="group relative font-semibold text-accent-600 transition-colors hover:text-accent-700"
              >
                Sign in
                <span
                  aria-hidden="true"
                  className="absolute -bottom-0.5 left-0 h-px w-0 bg-accent-gradient transition-all duration-300 group-hover:w-full"
                />
              </Link>
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}