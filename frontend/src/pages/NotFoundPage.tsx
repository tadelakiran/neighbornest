import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/lib/constants';

/**
 * 404 page — clean, centered illustration with a route back to the dashboard.
 */
export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md text-center">
        <div className="relative mx-auto mb-8 flex h-32 w-32 items-center justify-center">
          <div className="absolute inset-0 animate-float rounded-full border border-emerald-500/20 bg-emerald-500/5" />
          <div className="absolute inset-4 rounded-full border border-dashed border-emerald-500/30" />
          <Compass className="relative h-14 w-14 text-emerald-400" aria-hidden="true" />
        </div>

        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Error 404</p>
        <h1 className="mt-2 text-3xl font-extrabold text-white">Page not found</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved. Let&apos;s get you
          back to your Nest.
        </p>

        <Button
          variant="primary"
          className="mt-8"
          leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
          onClick={() => navigate(ROUTES.DASHBOARD, { replace: true })}
        >
          Back to dashboard
        </Button>
      </div>
    </div>
  );
}
