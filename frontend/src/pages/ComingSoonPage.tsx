import { Hammer } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface ComingSoonPageProps {
  title: string;
  description: string;
}

/**
 * Generic placeholder page for routes whose module is not built yet
 * (My Nest, Messages). Keeps navigation functional while features land.
 */
export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <div className="mx-auto flex max-w-2xl items-center justify-center py-16">
      <Card className="w-full p-10 text-center">
        <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
          <Hammer className="h-8 w-8 text-emerald-400" aria-hidden="true" />
        </span>
        <Badge variant="info" className="mb-3">
          Coming soon
        </Badge>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">{description}</p>
      </Card>
    </div>
  );
}
