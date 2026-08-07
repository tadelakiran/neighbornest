import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/lib/constants';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="mesh-gradient flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="relative mx-auto mb-8 flex h-36 w-36 items-center justify-center">
          {/* Glow rings */}
          <div className="absolute inset-0 animate-float rounded-full border border-accent-400/25 bg-accent-400/[0.06] shadow-glow-sm" aria-hidden="true" />
          <div className="absolute inset-5 rounded-full border border-dashed border-accent-400/40" aria-hidden="true" />

          {/* Slowly rotating compass */}
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
            className="absolute inset-8 flex items-center justify-center rounded-full bg-accent-gradient shadow-glow"
          >
            <Compass className="h-12 w-12 text-white" aria-hidden="true" />
          </motion.span>
        </div>

        <p className="text-sm font-semibold uppercase tracking-widest text-accent-400">Error 404</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-primary">Page not found</h1>
        <p className="mt-3 text-sm leading-relaxed text-secondary">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
          Let&apos;s get you back to your Nest.
        </p>

        <Button
          variant="primary"
          className="mt-8 shadow-glow"
          leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
          onClick={() => navigate(ROUTES.DASHBOARD, { replace: true })}
        >
          Back to dashboard
        </Button>
      </div>
    </div>
  );
}
