import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { LazyImage } from '@/components/ui/LazyImage';
import { APP_NAME } from '@/lib/constants';
import { IMAGES } from '@/lib/images';

const STATS = [
  { value: '5–8', label: 'people per Nest' },
  { value: '1–2', label: 'local Anchors' },
  { value: '6 wk', label: 'guided journeys' },
];

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } } },
  item: {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  },
};

interface AuthSplitLayoutProps {
  heading: string;
  subheading?: string;
  children: ReactNode;
}

/**
 * Fixed-height split-screen auth shell — the page never scrolls; both panels
 * fit the viewport. Left panel reads top-to-bottom: logo, headline block,
 * then the bright community photo with the stats band pinned at the bottom.
 * The text sits in a soft gradient safe-zone so it never covers the faces.
 */
export function AuthSplitLayout({ heading, subheading, children }: AuthSplitLayoutProps) {
  return (
    <div className="relative flex h-dvh overflow-hidden bg-[var(--color-bg)]">
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute -top-40 right-[5%] h-[500px] w-[500px] rounded-full bg-accent-500/[0.07] blur-[100px]" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-[8%] left-[5%] hidden h-[400px] w-[400px] rounded-full bg-royal-400/[0.08] blur-[90px] lg:block" aria-hidden="true" />

      {/* ── Left brand panel ── */}
      <div className="relative hidden w-[52%] flex-col overflow-hidden lg:flex">
        {/* Photo — bright & clean: light veil + gradient safe-zones for the
            headline (top) and stats (bottom). The middle stays fully visible. */}
        <div className="absolute inset-0" aria-hidden="true">
          <LazyImage
            src={IMAGES.community}
            alt=""
            placeholder="blur"
            wrapperClassName="absolute inset-0"
            className="h-full w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-white/55 via-white/20 to-sky-100/10" />
          <div className="absolute inset-x-0 top-0 h-[46%] bg-gradient-to-b from-white/95 via-white/45 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-white/90 via-white/35 to-transparent" />
        </div>

        {/* Content — top-to-bottom order */}
        <div className="relative z-10 flex h-full flex-col">
          {/* 1 · Logo */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center px-10 pt-10"
          >
            <BrandLogo />
          </motion.div>

          {/* 2 · Headline block — top-left, clear gap after the logo */}
          <motion.div
            variants={stagger.container}
            initial="hidden"
            animate="show"
            className="px-10 pt-9"
          >
            <motion.div variants={stagger.item} className="max-w-lg space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-accent-500/20 bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-accent-600 shadow-sm backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 fill-accent-400 text-accent-500" aria-hidden="true" />
                New to the city? You&apos;re in the right place.
              </span>
              <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-primary xl:text-[3.25rem]">
                Find your people in a{' '}
                <span className="text-gradient">new city</span>
                <span className="text-accent-500">.</span>
              </h1>
            </motion.div>
          </motion.div>

          {/* 3 · Photo breathes here — flex spacer keeps it fully visible */}
          <div className="flex-1" aria-hidden="true" />

          {/* 4 · Stats band — pinned bottom, always visible */}
          <motion.div
            variants={stagger.container}
            initial="hidden"
            animate="show"
            className="px-10 pb-8"
          >
            <motion.dl
              variants={stagger.item}
              className="flex items-center justify-between gap-6 rounded-2xl border border-white/60 bg-white/80 px-7 py-4 shadow-[var(--shadow-lg)] backdrop-blur-xl"
            >
              {STATS.map((stat) => (
                <div key={stat.label} className="flex flex-col gap-0.5">
                  <dd className="order-first font-display text-2xl font-bold text-accent-600">{stat.value}</dd>
                  <dt className="order-last text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
                    {stat.label}
                  </dt>
                </div>
              ))}
            </motion.dl>
            <p className="mt-3 text-center text-[11px] text-subtle">
              © {new Date().getFullYear()} {APP_NAME} — small groups, big friendships.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Right form panel — fixed height, centered, no page scroll ── */}
      <div className="relative flex h-full w-full flex-col items-center justify-center overflow-y-auto px-4 py-8 sm:px-8 lg:w-[48%]">
        {/* Mobile banner */}
        <div className="relative mb-8 w-full max-w-md overflow-hidden rounded-3xl border border-[var(--color-border)] shadow-[var(--shadow-lg)] lg:hidden">
          <LazyImage
            src={IMAGES.community}
            alt="Neighbors spending time together"
            aspectRatio="16/7"
            placeholder="blur"
            loading="eager"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/75 via-white/25 to-transparent" />
          <div className="absolute inset-0 flex items-center px-6">
            <p className="max-w-[75%] font-display text-xl font-bold leading-tight text-primary">
              Find your people in a <span className="text-gradient">new city</span>.
            </p>
          </div>
        </div>

        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <BrandLogo />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            {/* Gentle continuous float (soft amplitude so inputs stay usable) */}
            <div className="animate-float-soft relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 p-6 shadow-[var(--shadow-lg)] backdrop-blur-2xl sm:p-8">
            {/* Hairline */}
            <div className="absolute inset-x-8 top-0 h-[2px] rounded-b-full bg-accent-gradient shadow-[0_0_12px_rgba(14,165,233,0.4)]" aria-hidden="true" />

            {/* Inner glow */}
            <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-accent-400/10 blur-3xl" aria-hidden="true" />

            <div className="relative mb-6 space-y-1.5">
              <h2 className="font-display text-2xl font-bold tracking-tight text-primary">
                {heading}
              </h2>
              {subheading && (
                <p className="text-sm leading-relaxed text-muted">{subheading}</p>
              )}
            </div>

            {children}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
