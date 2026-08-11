import { useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/lib/constants';

/**
 * My Nests tab placeholder (nests land in Module 4): a friendly empty state
 * with a CTA back to the dashboard.
 */
export function MyNestsPlaceholder() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center gap-5 rounded-lg border border-dashed border-[var(--color-border-2)] bg-deep/40 px-6 py-16 text-center">
      <div className="relative">
        <span className="flex h-20 w-20 items-center justify-center rounded-full border border-accent-400/20 bg-accent-400/5 shadow-glow-sm">
          <Users className="h-9 w-9 text-accent-300/80" aria-hidden="true" />
        </span>
        <span className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-deep)]">
          <MapPin className="h-4 w-4 text-secondary" aria-hidden="true" />
        </span>
      </div>

      <div className="space-y-1.5">
        <h3 className="font-display text-lg font-semibold text-primary">You haven&apos;t joined a Nest yet.</h3>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted">
          Once we match you with compatible neighbors, your Nest, its members,
          and shared moments will show up here.
        </p>
      </div>

      <Button
        onClick={() => navigate(ROUTES.DASHBOARD)}
        rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
      >
        Find your Nest
      </Button>
    </div>
  );
}
