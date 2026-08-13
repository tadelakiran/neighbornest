import { motion } from 'framer-motion';
import { Hammer, Bell } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LazyImage } from '@/components/ui/LazyImage';
import { IMAGES } from '@/lib/images';

interface ComingSoonPageProps {
  title: string;
  description: string;
}

export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className="group relative w-full overflow-hidden rounded-3xl border-[var(--border)] bg-[var(--surface)] p-12 text-center shadow-2xl shadow-black/20">
          {/* Animated backdrop */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <LazyImage
              src={IMAGES.friends}
              alt=""
              placeholder="shimmer"
              wrapperClassName="absolute inset-0"
              className="h-full w-full object-cover opacity-10 transition-transform duration-1000 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--surface)]/90 via-[var(--surface)]/80 to-[var(--surface)]/95" />
            
            {/* Animated gradient orb */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1],
                x: [0, 20, 0],
                y: [0, -20, 0]
              }}
              transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
              className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent-400/20 blur-3xl"
            />
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.1, 0.15, 0.1],
                x: [0, -15, 0],
                y: [0, 15, 0]
              }}
              transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut', delay: 2 }}
              className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[var(--gold-400)]/10 blur-3xl"
            />
          </div>

          <div className="relative space-y-6">
            <motion.span
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-accent-gradient shadow-glow"
            >
              <Hammer className="h-10 w-10 text-white" />
            </motion.span>

            <div className="space-y-3">
              <Badge 
                variant="info" 
                className="inline-flex items-center gap-1.5 rounded-full border-accent-400/20 bg-accent-400/10 px-4 py-1.5 text-xs font-semibold text-accent-400"
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-400" />
                Coming soon
              </Badge>
              
              <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                {title}
              </h1>
              <p className="mx-auto max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
                {description}
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <Button
                variant="outline"
                className="rounded-xl border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
              >
                Go back
              </Button>
              <Button
                className="rounded-xl bg-accent-gradient shadow-glow"
                rightIcon={<Bell className="h-4 w-4" />}
              >
                Notify me
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}