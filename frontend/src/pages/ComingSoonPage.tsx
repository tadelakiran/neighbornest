import { Hammer } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface ComingSoonPageProps {
  title:       string;
  description: string;
}

export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <div className="mx-auto flex max-w-2xl items-center justify-center py-16">
      <Card className="w-full p-10 text-center">
        <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-accent-400/10 shadow-glow-sm">
          <Hammer className="h-8 w-8 text-accent-300" aria-hidden="true" />
        </span>
        <Badge variant="info" className="mb-3">Coming soon</Badge>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--text-muted)]">
          {description}
        </p>
      </Card>
    </div>
  );
}
