import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Lock, Mail, User as UserIcon, Check } from 'lucide-react';
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
  { label: 'Lowercase letter',  test: (v: string) => /[a-z]/.test(v) },
  { label: 'Uppercase letter',  test: (v: string) => /[A-Z]/.test(v) },
  { label: 'Number',            test: (v: string) => /\d/.test(v) },
  { label: 'Special character', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
  { label: '8+ characters',     test: (v: string) => v.length >= 8 },
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
  const strength = useMemo(() => STRENGTH_CHECKS.filter((c) => c.test(password)).length, [password]);

  const onSubmit = handleSubmit(async (values) => {
    await registerAction({
      fullName: values.fullName,
      email: values.email,
      password: values.password,
    });
  });

  const strengthConfig = {
    weak:   { label: 'Weak',   text: 'text-rose-400',   bar: 'bg-rose-400',   glow: 'shadow-[0_0_8px_rgba(251,113,133,0.4)]' },
    good:   { label: 'Good',   text: 'text-amber-400',  bar: 'bg-amber-400',  glow: 'shadow-[0_0_8px_rgba(251,191,36,0.4)]' },
    strong: { label: 'Strong', text: 'text-emerald-400', bar: 'bg-emerald-400', glow: 'shadow-[0_0_8px_rgba(52,211,153,0.4)]' },
  };

  const currentStrength = strength <= 2 ? strengthConfig.weak : strength <= 4 ? strengthConfig.good : strengthConfig.strong;

  return (
    <form onSubmit={onSubmit} className="relative space-y-5" noValidate>
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}>
        <Input
          id="fullName"
          type="text"
          label="Full name"
          placeholder="Jane Doe"
          autoComplete="name"
          icon={<UserIcon className="h-4 w-4 text-muted" aria-hidden="true" />}
          error={errors.fullName?.message}
          className="h-12 rounded-xl border-white/[0.08] bg-surface-2 text-primary shadow-sm transition-all duration-200 focus-within:border-accent-400/50 focus-within:shadow-[0_0_0_3px_rgba(14,165,233,0.12)]"
          {...register('fullName')}
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
        <Input
          id="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          icon={<Mail className="h-4 w-4 text-muted" aria-hidden="true" />}
          error={errors.email?.message}
          className="h-12 rounded-xl border-white/[0.08] bg-surface-2 text-primary shadow-sm transition-all duration-200 focus-within:border-accent-400/50 focus-within:shadow-[0_0_0_3px_rgba(14,165,233,0.12)]"
          {...register('email')}
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="space-y-3">
        <Input
          id="password"
          type={showPassword ? 'text' : 'password'}
          label="Password"
          placeholder="Create a strong password"
          autoComplete="new-password"
          icon={<Lock className="h-4 w-4 text-muted" aria-hidden="true" />}
          error={errors.password?.message}
          className="h-12 rounded-xl border-white/[0.08] bg-surface-2 text-primary shadow-sm transition-all duration-200 focus-within:border-accent-400/50 focus-within:shadow-[0_0_0_3px_rgba(14,165,233,0.12)]"
          trailing={
            <motion.button
              type="button"
              whileTap={{ scale: 0.85 }}
              onClick={() => setShowPassword((v) => !v)}
              className="rounded-lg p-1.5 text-muted transition-colors hover:bg-white/[0.06] hover:text-primary"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <AnimatePresence mode="wait" initial={false}>
                {showPassword ? (
                  <motion.div key="eyeoff" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <EyeOff className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <motion.div key="eye" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Eye className="h-4 w-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          }
          {...register('password')}
        />

        {/* Strength meter */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3.5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Password strength</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={currentStrength.label}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className={cn('text-[11px] font-bold uppercase tracking-wider', currentStrength.text)}
              >
                {currentStrength.label}
              </motion.span>
            </AnimatePresence>
          </div>

          <div className="mb-3 flex gap-1.5" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.span
                key={i}
                initial={false}
                animate={{
                  backgroundColor: i < strength ? undefined : 'rgba(255,255,255,0.08)',
                  scale: i < strength ? [1, 1.15, 1] : 1,
                }}
                transition={{ duration: 0.3 }}
                className={cn(
                  'h-1.5 flex-1 rounded-full',
                  i < strength ? currentStrength.bar : 'bg-white/[0.08]',
                  i < strength ? currentStrength.glow : ''
                )}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {STRENGTH_CHECKS.map(({ label, test }) => {
              const passed = test(password);
              return (
                <div key={label} className="flex items-center gap-1.5">
                  <span className={cn(
                    'flex h-3.5 w-3.5 items-center justify-center rounded-full border transition-all duration-200',
                    passed ? 'border-emerald-400/40 bg-emerald-400/15' : 'border-white/10 bg-transparent'
                  )}>
                    <Check className={cn('h-2.5 w-2.5 transition-all duration-200', passed ? 'text-emerald-400 opacity-100' : 'opacity-0')} />
                  </span>
                  <span className={cn('text-[11px] transition-colors duration-200', passed ? 'text-emerald-400/80' : 'text-muted')}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
        <Input
          id="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          label="Confirm password"
          placeholder="Repeat your password"
          autoComplete="new-password"
          icon={<Lock className="h-4 w-4 text-muted" aria-hidden="true" />}
          error={errors.confirmPassword?.message}
          className="h-12 rounded-xl border-white/[0.08] bg-surface-2 text-primary shadow-sm transition-all duration-200 focus-within:border-accent-400/50 focus-within:shadow-[0_0_0_3px_rgba(14,165,233,0.12)]"
          {...register('confirmPassword')}
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          className="h-12 rounded-xl shadow-glow"
          rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
        >
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </motion.div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-center text-sm text-muted">
        Already have an account?{' '}
        <Link
          to={ROUTES.LOGIN}
          className="group relative inline-block font-semibold text-accent-400 transition-colors hover:text-accent-300"
        >
          Sign in
          <span
            aria-hidden="true"
            className="absolute -bottom-0.5 left-0 h-px w-0 bg-accent-gradient transition-all duration-300 group-hover:w-full"
          />
        </Link>
      </motion.p>
    </form>
  );
}

export default RegisterForm;