import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, Lock, Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OtpInput } from '@/components/auth/OtpInput';
import { AuthStepIndicator } from '@/components/auth/AuthStepIndicator';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { useCountdown } from '@/hooks/useCountdown';
import { useToast } from '@/hooks/useToast';
import { authService } from '@/services/authService';
import { cn, getErrorMessage, maskEmail } from '@/lib/utils';
import { PASSWORD_REGEX, ROUTES } from '@/lib/constants';

const emailSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
});

const resetSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(PASSWORD_REGEX, 'Must include uppercase, lowercase, digit, and special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type EmailValues = z.infer<typeof emailSchema>;
type ResetValues = z.infer<typeof resetSchema>;

type Step = 'email' | 'reset' | 'done';

/**
 * Password recovery flow, powered by the same email OTP service as
 * registration:
 * 1. Email — request a reset code (always succeeds, even for unknown emails).
 * 2. Reset — enter the code and choose a new password (with live strength
 *    feedback).
 * 3. Done — confirm and return to sign-in with the email prefilled.
 */
export function ForgotPasswordForm() {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { secondsLeft: resendIn, reset: resetResend } = useCountdown();

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const newPassword = resetForm.watch('newPassword');

  /** Step 1 → 2: request the reset code. */
  const onRequestCode = emailForm.handleSubmit(async (values) => {
    try {
      await authService.forgotPassword({ email: values.email });
      setEmail(values.email);
      setOtp('');
      setOtpError(null);
      resetResend(60);
      setStep('reset');
      toast.success('If an account exists, a reset code is on its way.');
    } catch (error) {
      toast.error(getErrorMessage(error, "We couldn't send the reset code. Please try again."));
    }
  });

  /** Step 2 → 3: redeem the code and set the new password. */
  const onReset = resetForm.handleSubmit(async (values) => {
    if (otp.length !== 6) {
      setOtpError('Enter the 6-digit code from your email.');
      return;
    }
    setIsSubmitting(true);
    setOtpError(null);
    try {
      await authService.resetPassword({
        email,
        otp,
        newPassword: values.newPassword,
      });
      setStep('done');
    } catch (error) {
      setOtpError(getErrorMessage(error, 'That code isn’t right. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  });

  /** Resend the code after the cooldown elapses. */
  const onResend = async () => {
    if (resendIn > 0) return;
    try {
      await authService.forgotPassword({ email });
      setOtp('');
      setOtpError(null);
      resetResend(60);
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

  const stepIndex = step === 'email' ? 0 : step === 'reset' ? 1 : 2;

  return (
    <div>
      {step !== 'done' && (
        <AuthStepIndicator steps={['Your email', 'New password']} current={stepIndex} />
      )}

      <AnimatePresence mode="wait" initial={false}>
        {step === 'email' && (
          <motion.form
            key="email"
            onSubmit={onRequestCode}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
            noValidate
          >
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-accent-400/30 bg-accent-400/10 shadow-glow-sm">
                <KeyRound className="h-6 w-6 text-accent-400" aria-hidden="true" />
              </div>
              <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted">
                Enter the email tied to your account and we'll send you a 6-digit code to reset your password.
              </p>
            </div>

            <Input
              id="resetEmail"
              type="email"
              label="Email"
              placeholder="you@example.com"
              autoComplete="email"
              icon={<Mail className="h-4 w-4 text-muted" aria-hidden="true" />}
              error={emailForm.formState.errors.email?.message}
              className="h-11 rounded-xl border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--text-primary)] shadow-sm transition-all duration-200 focus-within:border-[var(--accent-400)]/50 focus-within:shadow-[0_0_0_3px_rgba(14,165,233,0.12)]"
              {...emailForm.register('email')}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={emailForm.formState.isSubmitting}
              className="h-11 rounded-xl shadow-glow"
              rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            >
              Send reset code
            </Button>

            <p className="text-center text-sm text-muted">
              Remembered it?{' '}
              <Link to={ROUTES.LOGIN} className="group relative inline-block font-semibold text-accent-400 transition-colors hover:text-accent-300">
                Back to sign in
                <span aria-hidden="true" className="absolute -bottom-0.5 left-0 h-px w-0 bg-accent-gradient transition-all duration-300 group-hover:w-full" />
              </Link>
            </p>
          </motion.form>
        )}

        {step === 'reset' && (
          <motion.form
            key="reset"
            onSubmit={onReset}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
            noValidate
          >
            <div className="text-center">
              <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted">
                We sent a code to <span className="font-semibold text-accent-400">{maskEmail(email)}</span>. Enter it and pick a new password.
              </p>
            </div>

            <OtpInput
              value={otp}
              onChange={setOtp}
              onComplete={(code) => setOtp(code)}
              error={otpError ?? undefined}
              disabled={isSubmitting}
            />

            <div className="flex items-center justify-center text-xs">
              <button
                type="button"
                onClick={onResend}
                disabled={resendIn > 0}
                className="inline-flex items-center gap-1.5 font-semibold text-accent-400 transition-colors hover:text-accent-300 disabled:cursor-not-allowed disabled:text-muted"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', resendIn > 0 && 'opacity-50')} aria-hidden="true" />
                {resendIn > 0 ? `Resend in ${formatClock(resendIn)}` : 'Resend code'}
              </button>
            </div>

            <Input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              label="New password"
              placeholder="Create a strong password"
              autoComplete="new-password"
              icon={<Lock className="h-4 w-4 text-muted" aria-hidden="true" />}
              error={resetForm.formState.errors.newPassword?.message}
              className="h-11 rounded-xl border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--text-primary)] shadow-sm transition-all duration-200 focus-within:border-[var(--accent-400)]/50 focus-within:shadow-[0_0_0_3px_rgba(14,165,233,0.12)]"
              trailing={
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setShowPassword((v) => !v)}
                  className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--color-raised)] hover:text-[var(--text-primary)]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </motion.button>
              }
              {...resetForm.register('newPassword')}
            />

            <PasswordStrengthMeter password={newPassword} />

            <Input
              id="confirmNewPassword"
              type={showPassword ? 'text' : 'password'}
              label="Confirm new password"
              placeholder="Repeat your new password"
              autoComplete="new-password"
              icon={<Lock className="h-4 w-4 text-muted" aria-hidden="true" />}
              error={resetForm.formState.errors.confirmPassword?.message}
              className="h-11 rounded-xl border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--text-primary)] shadow-sm transition-all duration-200 focus-within:border-[var(--accent-400)]/50 focus-within:shadow-[0_0_0_3px_rgba(14,165,233,0.12)]"
              {...resetForm.register('confirmPassword')}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              disabled={otp.length !== 6}
              className="h-11 rounded-xl shadow-glow"
              rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            >
              Update password
            </Button>
          </motion.form>
        )}

        {step === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
              className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-sky-400/40 bg-sky-400/15 shadow-[0_0_24px_rgba(56,189,248,0.25)]"
            >
              <CheckCircle2 className="h-8 w-8 text-sky-400" aria-hidden="true" />
            </motion.div>
            <h3 className="font-display text-xl font-bold text-primary">Password updated</h3>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">
              Your password has been reset. Sign in with your new password to pick up where you left off.
            </p>
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              className="mt-7 h-12 rounded-xl shadow-glow"
              onClick={() => navigate(ROUTES.LOGIN, { replace: true, state: { registeredEmail: email } })}
              rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            >
              Back to sign in
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ForgotPasswordForm;
