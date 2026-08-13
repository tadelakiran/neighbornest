import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
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
    <form onSubmit={onSubmit} className="relative space-y-5" noValidate>
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
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

      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Input
          id="password"
          type={showPassword ? 'text' : 'password'}
          label="Password"
          placeholder="••••••••"
          autoComplete="current-password"
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
                  <motion.div
                    key="eyeoff"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <EyeOff className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="eye"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Eye className="h-4 w-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          }
          {...register('password')}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          className="h-12 rounded-xl shadow-glow"
          rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center text-sm text-muted"
      >
        Don&apos;t have an account?{' '}
        <Link
          to={ROUTES.REGISTER}
          className="group relative inline-block font-semibold text-accent-400 transition-colors hover:text-accent-300"
        >
          Register
          <span
            aria-hidden="true"
            className="absolute -bottom-0.5 left-0 h-px w-0 bg-accent-gradient transition-all duration-300 group-hover:w-full"
          />
        </Link>
      </motion.p>
    </form>
  );
}

export default LoginForm;