import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { SpotlightWrapper } from '@/components/ui/SpotlightWrapper';
import { cardRise } from '@/lib/motion';
import { cn } from '@/lib/utils';

export type BentoSize = '1x1' | '2x1' | '1x2' | '2x2';

interface BentoCardProps {
  children: ReactNode;
  size?: BentoSize;
  className?: string;
}

const SIZE_CLASSES: Record<BentoSize, string> = {
  '1x1': 'md:col-span-1 md:row-span-1',
  '2x1': 'md:col-span-2 md:row-span-1',
  '1x2': 'md:col-span-1 md:row-span-2',
  '2x2': 'md:col-span-2 md:row-span-2',
};

/**
 * A single bento cell. Wraps content in a cursor-tracking spotlight layer,
 * glassmorphism surface, and a hover-lift. Use the `size` prop to control
 * how many grid cells the card occupies on md+ screens.
 */
export function BentoCard({ children, size = '1x1', className }: BentoCardProps) {
  return (
    <motion.div
      variants={cardRise}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className={cn(SIZE_CLASSES[size], 'min-h-0', className)}
    >
      <SpotlightWrapper className="h-full">
        <div
          className={cn(
            'relative flex h-full flex-col overflow-hidden rounded-2xl p-5',
            'border border-white/[0.08] bg-card-gradient backdrop-blur-xl',
            'shadow-card transition-shadow duration-300 hover:shadow-card-hover',
            'group/bento'
          )}
        >
          {/* Top hairline accent */}
          <div
            className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-accent-400/50 to-transparent"
            aria-hidden="true"
          />
          <div className="relative z-10 flex h-full flex-col">{children}</div>
        </div>
      </SpotlightWrapper>
    </motion.div>
  );
}
