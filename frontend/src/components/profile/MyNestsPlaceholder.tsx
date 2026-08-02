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
    <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-slate-700 bg-slate-800/40 px-6 py-16 text-center">
      <div className="relative">
        <span className="flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/5">
          <Users className="h-9 w-9 text-emerald-400/80" aria-hidden="true" />
        </span>
        <span className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border border-slate-600 bg-slate-800">
          <MapPin className="h-4 w-4 text-slate-300" aria-hidden="true" />
        </span>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold text-white">You haven&apos;t joined a Nest yet.</h3>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-slate-400">
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
