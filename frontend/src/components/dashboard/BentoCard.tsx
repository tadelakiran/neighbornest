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

export function BentoCard({ children, size = '1x1', className }: BentoCardProps) {
  return (
    <motion.div
      variants={cardRise}
      whileHover={{ y: -4, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
      className={cn(SIZE_CLASSES[size], 'min-h-0', className)}
    >
      <SpotlightWrapper className="h-full">
        <div
          className={cn(
            'relative flex h-full flex-col overflow-hidden rounded-2xl p-5',
            'border border-white/[0.07] bg-card-gradient backdrop-blur-xl',
            'shadow-card transition-all duration-300',
            'hover:shadow-card-hover hover:border-accent-400/20',
            'group/bento'
          )}
        >
          {/* Animated top hairline */}
          <div
            className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-accent-400/40 to-transparent opacity-60 transition-opacity duration-300 group-hover/bento:opacity-100"
            aria-hidden="true"
          />
          
          {/* Subtle inner glow on hover */}
          <div
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/bento:opacity-100"
            aria-hidden="true"
            style={{
              background:
                'radial-gradient(600px circle at 50% 0%, rgba(14,165,233,0.06), transparent 60%)',
            }}
          />
          
          <div className="relative z-10 flex h-full flex-col">{children}</div>
        </div>
      </SpotlightWrapper>
    </motion.div>
  );
}