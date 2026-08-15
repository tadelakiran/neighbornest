import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  PencilLine,
  RefreshCw,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OtpInput } from '@/components/auth/OtpInput';
import { AuthStepIndicator } from '@/components/auth/AuthStepIndicator';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { useAuth } from '@/hooks/useAuth';
import { useCountdown } from '@/hooks/useCountdown';
import { useToast } from '@/hooks/useToast';
import { authService } from '@/services/authService';
import { cn, getErrorMessage, maskEmail } from '@/lib/utils';
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

type Step = 'details' | 'verify';

/**
 * Multi-step registration with email verification:
 * 1. Account details (name, email, password) — submitting emails a 6-digit
 *    code to prove the address is valid.
 * 2. Verification — the code is redeemed as part of `register`, so the
 *    account is only ever created with a confirmed email.
 *
 * The shared email service (notification-service) generates, throttles, and
 * delivers the code; this form only orchestrates the flow and its UX.
 */
export function RegisterForm() {
  const { register: registerAction } = useAuth();
  const toast = useToast();

  const [step, setStep] = useState<Step>('details');
  const [draft, setDraft] = useState<RegisterFormValues | null>(null);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { secondsLeft: resendIn, reset: resetResend } = useCountdown();
  const { secondsLeft: expiryIn, reset: resetExpiry } = useCountdown();

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

  /** Step 1 → 2: validate the form, then ask the email service for a code. */
  const onRequestCode = handleSubmit(async (values) => {
    try {
      const response = await authService.sendOtp({
        email: values.email,
        purpose: 'EMAIL_VERIFICATION',
      });
      setDraft(values);
      setOtp('');
      setOtpError(null);
      resetResend(response.resend_after_seconds || 60);
      resetExpiry(response.expires_in_seconds || 600);
      setStep('verify');
    } catch (error) {
      toast.error(getErrorMessage(error, "We couldn't send your verification code. Please try again."));
    }
  });

  /** Step 2: register with the code — the backend verifies it before creating the account. */
  const onVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    if (otp.length !== 6) {
      setOtpError('Enter the 6-digit code from your email.');
      return;
    }
    setIsSubmittingOtp(true);
    setOtpError(null);
    const result = await registerAction({ ...draft, otp });
    if (!result.success) {
      setOtpError(result.error ?? 'That code isn’t right. Please try again.');
    }
    setIsSubmittingOtp(false);
  };

  /** Resend a fresh code (respects the server-side cooldown). */
  const onResend = async () => {
    if (!draft || resendIn > 0) return;
    try {
      const response = await authService.sendOtp({
        email: draft.email,
        purpose: 'EMAIL_VERIFICATION',
      });
      setOtp('');
      setOtpError(null);
      resetResend(response.resend_after_seconds || 60);
      resetExpiry(response.expires_in_seconds || 600);
      toast.success('A new code is on its way.');
    } catch (error) {
      toast.error(getErrorMessage(error, "We couldn't send a new code right now. Please try again."));
    }
  };

  const formatClock = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div>
      <AuthStepIndicator steps={['Account details', 'Verify email']} current={step === 'details' ? 0 : 1} />

      <AnimatePresence mode="wait" initial={false}>
        {step === 'details' ? (
          <motion.form
            key="details"
            onSubmit={onRequestCode}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
            noValidate
          >
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}>
              <Input
                id="fullName"
                type="text"
                label="Full name"
                placeholder="Jane Doe"
                autoComplete="name"
                icon={<UserIcon className="h-4 w-4 text-muted" aria-hidden="true" />}
                error={errors.fullName?.message}
                className="h-11 rounded-xl border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--text-primary)] shadow-sm transition-all duration-200 focus-within:border-[var(--accent-400)]/50 focus-within:shadow-[0_0_0_3px_rgba(14,165,233,0.12)]"
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
                className="h-11 rounded-xl border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--text-primary)] shadow-sm transition-all duration-200 focus-within:border-[var(--accent-400)]/50 focus-within:shadow-[0_0_0_3px_rgba(14,165,233,0.12)]"
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
                className="h-11 rounded-xl border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--text-primary)] shadow-sm transition-all duration-200 focus-within:border-[var(--accent-400)]/50 focus-within:shadow-[0_0_0_3px_rgba(14,165,233,0.12)]"
                trailing={
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.85 }}
                    onClick={() => setShowPassword((v) => !v)}
                    className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--color-raised)] hover:text-[var(--text-primary)]"
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

              <PasswordStrengthMeter password={password} />
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
                className="h-11 rounded-xl border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--text-primary)] shadow-sm transition-all duration-200 focus-within:border-[var(--accent-400)]/50 focus-within:shadow-[0_0_0_3px_rgba(14,165,233,0.12)]"
                {...register('confirmPassword')}
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth              isLoading={isSubmitting}
              className="h-11 rounded-xl shadow-glow"
              rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
              >
                {isSubmitting ? 'Sending code…' : 'Continue'}
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
                <ShieldCheck className="h-3.5 w-3.5 text-accent-400" aria-hidden="true" />
                We'll email you a 6-digit code to confirm your address.
              </p>
            </motion.div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-center text-sm text-muted">
              Already have an account?{' '}
              <Link to={ROUTES.LOGIN} className="group relative inline-block font-semibold text-accent-400 transition-colors hover:text-accent-300">
                Sign in
                <span aria-hidden="true" className="absolute -bottom-0.5 left-0 h-px w-0 bg-accent-gradient transition-all duration-300 group-hover:w-full" />
              </Link>
            </motion.p>
          </motion.form>
        ) : (
          <motion.form
            key="verify"
            onSubmit={onVerify}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
            noValidate
          >
            {/* Heading */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-accent-400/30 bg-accent-400/10 shadow-glow-sm">
                <Mail className="h-6 w-6 text-accent-400" aria-hidden="true" />
              </div>
              <h3 className="font-display text-xl font-bold text-primary">Check your inbox</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">
                We sent a 6-digit code to <span className="font-semibold text-accent-400">{draft ? maskEmail(draft.email) : 'your email'}</span>.
                Enter it below to verify your address.
              </p>
            </div>

            <OtpInput
              value={otp}
              onChange={setOtp}
              onComplete={(code) => setOtp(code)}
              error={otpError ?? undefined}
              disabled={isSubmittingOtp}
            />

            {/* Resend + change email */}
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={onResend}
                disabled={resendIn > 0}
                className="inline-flex items-center gap-1.5 font-semibold text-accent-400 transition-colors hover:text-accent-300 disabled:cursor-not-allowed disabled:text-muted"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', resendIn > 0 && 'opacity-50')} aria-hidden="true" />
                {resendIn > 0 ? `Resend in ${formatClock(resendIn)}` : 'Resend code'}
              </button>
              <button
                type="button"
                onClick={() => setStep('details')}
                className="inline-flex items-center gap-1.5 font-semibold text-muted transition-colors hover:text-primary"
              >
                <PencilLine className="h-3.5 w-3.5" aria-hidden="true" />
                Use a different email
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmittingOtp}
              disabled={otp.length !== 6}
              className="h-11 rounded-xl shadow-glow"
              rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            >
              {isSubmittingOtp ? 'Creating account…' : 'Verify & create account'}
            </Button>

            <p className="text-center text-xs text-muted">
              Code expires in <span className="font-semibold text-muted">{formatClock(expiryIn)}</span>. Check spam if you don't see it.
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

export default RegisterForm;
