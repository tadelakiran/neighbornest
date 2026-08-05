import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
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
    <div className="relative overflow-hidden rounded-[34px] border border-white/60 bg-slate-950/90 p-3 shadow-[0_30px_120px_-45px_rgba(15,23,42,0.85)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(244,114,182,0.18),_transparent_33%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.18),_transparent_25%)]" />

      <div className="relative grid gap-3 lg:grid-cols-[1fr_1.05fr]">
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-8 text-white">
          <div className="absolute -left-16 -top-16 h-44 w-44 rounded-full bg-fuchsia-400/20 blur-3xl" />
          <div className="absolute -bottom-18 -right-12 h-52 w-52 rounded-full bg-cyan-400/20 blur-3xl" />

          <div className="relative z-10 flex h-full flex-col justify-between gap-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]">
                <Sparkles className="h-3.5 w-3.5" />
                Welcome back
              </div>

              <div className="space-y-3">
                <h2 className="text-3xl font-semibold leading-tight">Continue where you left off.</h2>
                <p className="max-w-sm text-sm text-slate-300">
                  Re-enter your learning dashboard with a smooth, secure sign-in experience.
                </p>
              </div>
            </div>

            <div className="space-y-3 rounded-[22px] border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/15">
                  <ShieldCheck className="h-5 w-5 text-cyan-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Protected access</p>
                  <p className="text-xs text-slate-300">Your private workspace stays secure.</p>
                </div>
              </div>

              <div className="grid gap-2 text-xs text-slate-200 sm:grid-cols-2">
                <div className="rounded-xl bg-white/5 px-3 py-2">Fast access</div>
                <div className="rounded-xl bg-white/5 px-3 py-2">Progress synced</div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] bg-white/96 p-5 sm:p-7">
          <div className="mb-6 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-600">Welcome back</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px]">
              Sign in to your account
            </h1>
            <p className="text-sm text-slate-500">
              Access your dashboard, lessons, and progress with a smooth sign-in experience.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
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

            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="••••••••"
              autoComplete="current-password"
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

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              className="h-12 rounded-2xl bg-gradient-to-r from-accent-500 to-accent-600 text-sm font-semibold shadow-lg shadow-accent-500/25 transition-all hover:-translate-y-0.5 hover:shadow-accent-500/35"
              rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>

            <p className="text-center text-sm text-slate-500">
              Don&apos;t have an account?{' '}
              <Link
                to={ROUTES.REGISTER}
                className="group relative font-semibold text-accent-600 transition-colors hover:text-accent-700"
              >
                Register
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