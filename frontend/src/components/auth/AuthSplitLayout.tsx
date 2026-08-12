import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Heart, MapPin, Sparkles, Users } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { LazyImage } from '@/components/ui/LazyImage';
import { APP_NAME } from '@/lib/constants';
import { IMAGES } from '@/lib/images';

const FEATURES = [
  { icon: Users,  title: 'Curated Nests',    text: 'Small groups of 5–8 who genuinely share your vibe.' },
  { icon: MapPin, title: 'Local Anchors',    text: 'Guided by 1–2 locals who know the city inside out.' },
  { icon: Heart,  title: 'Real friendships', text: 'Six-week journeys from first hello to lifelong connections.' },
];

const STATS = [
  { value: '5–8', label: 'people per Nest' },
  { value: '1–2', label: 'local Anchors' },
  { value: '6 wk', label: 'guided journeys' },
];

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } } },
  item: {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  },
};

interface AuthSplitLayoutProps {
  /** Heading shown above the form, e.g. "Welcome back". */
  heading: string;
  /** Supporting copy under the heading. */
  subheading: string;
  /** The form (or other content) rendered inside the auth card. */
  children: ReactNode;
}

/**
 * Shared split-screen shell for the login and register pages.
 *
 * Left (55%): full-bleed community photography with a navy/gold overlay, a
 * floating image collage, a feature list and the 5–8 / 1–2 / 6-week stats band
 * — the same premium treatment as the landing page hero.
 *
 * Right (45%): centered glass auth card with a gradient hairline and the
 * theme toggle. On mobile the imagery collapses into a compact banner.
 */
export function AuthSplitLayout({ heading, subheading, children }: AuthSplitLayoutProps) {
  return (
    <div className="relative flex min-h-screen">
      {/* Ambient warmth — shared by both panels */}
      <div
        className="pointer-events-none absolute -top-32 right-[8%] h-[420px] w-[420px] rounded-full bg-accent-500/[0.08] blur-3xl lg:left-auto"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-[12%] left-[8%] hidden h-[340px] w-[340px] rounded-full bg-gold-400/[0.06] blur-3xl lg:block"
        aria-hidden="true"
      />

      {/* ── Brand panel — desktop only ── */}
      <div className="relative hidden w-[55%] flex-col overflow-hidden lg:flex">
        {/* Background photo + overlays */}
        <div className="absolute inset-0">
          <LazyImage
            src={IMAGES.community}
            alt="Neighbors spending time together in a warm community"
            placeholder="blur"
            wrapperClassName="absolute inset-0"
            className="object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-accent-950/95 via-accent-900/85 to-accent-700/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-accent-950/80 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-gold-500/15 via-transparent to-transparent" />
        </div>

        {/* Floating collage cards (echoes the landing hero) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="absolute right-10 top-28 z-20 hidden w-40 overflow-hidden rounded-2xl border border-white/15 shadow-2xl xl:block"
        >
          <LazyImage
            src={IMAGES.coffee}
            alt="Coffee shop meetup"
            aspectRatio="4/3"
            placeholder="blur"
            className="h-full w-full object-cover"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.7 }}
          className="absolute bottom-40 left-8 z-20 hidden w-44 overflow-hidden rounded-2xl border border-white/15 shadow-2xl xl:block"
        >
          <LazyImage
            src={IMAGES.park}
            alt="Group of friends outdoors"
            aspectRatio="4/3"
            placeholder="blur"
            className="h-full w-full object-cover"
          />
        </motion.div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-10">
          <BrandLogo />
        </div>

        {/* Headline + features */}
        <motion.div
          variants={stagger.container}
          initial="hidden"
          animate="show"
          className="relative z-10 flex flex-1 flex-col justify-center px-10"
        >
          <motion.div variants={stagger.item} className="max-w-lg space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-400/40 bg-gold-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-200">
              <Sparkles className="h-3.5 w-3.5 fill-gold-300 text-gold-300" aria-hidden="true" />
              New to the city? You&apos;re in the right place.
            </span>
            <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-white xl:text-5xl">
              Find your people in a{' '}
              <span className="bg-gradient-to-r from-accent-300 via-accent-200 to-white bg-clip-text text-transparent">
                new city
              </span>
              <span className="text-gold-400">.</span>
            </h1>
            <p className="text-lg leading-relaxed text-accent-100/85">
              {APP_NAME} matches newcomers into small curated groups with local Anchors — real
              friendships, zero awkward networking.
            </p>
          </motion.div>

          <motion.ul variants={stagger.container} className="mt-9 space-y-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <motion.li key={title} variants={stagger.item} className="flex max-w-lg items-start gap-4">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-sm">
                  <Icon className="h-5 w-5 text-accent-200" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold text-white">{title}</p>
                  <p className="text-sm leading-relaxed text-accent-100/75">{text}</p>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>

        {/* Stats band */}
        <motion.dl
          variants={stagger.container}
          initial="hidden"
          animate="show"
          className="relative z-10 flex flex-wrap gap-x-10 gap-y-3 px-10 pb-8"
        >
          {STATS.map((stat) => (
            <motion.div key={stat.label} variants={stagger.item} className="flex flex-col">
              <dt className="order-last text-[10px] uppercase tracking-[0.18em] text-accent-100/60">
                {stat.label}
              </dt>
              <dd className="order-first font-display text-2xl font-bold text-gradient-gold">{stat.value}</dd>
            </motion.div>
          ))}
        </motion.dl>

        <p className="relative z-10 px-10 pb-6 text-xs text-accent-100/40">
          © {new Date().getFullYear()} {APP_NAME} — small groups, big friendships.
        </p>
      </div>

      {/* ── Form panel ── */}
      <div className="relative flex w-full flex-col items-center justify-center px-4 py-10 sm:px-8 lg:w-[45%]">
        {/* Mobile-only image banner */}
        <div className="relative mb-8 w-full max-w-md overflow-hidden rounded-3xl border border-white/[0.08] shadow-xl lg:hidden">
          <LazyImage
            src={IMAGES.community}
            alt="Neighbors spending time together"
            aspectRatio="16/7"
            placeholder="blur"
            loading="eager"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-accent-950/80 via-accent-900/50 to-transparent" />
          <div className="absolute inset-0 flex items-center px-5">
            <p className="font-display text-lg font-bold leading-tight text-white">
              Find your people in a <span className="text-gradient">new city</span>.
            </p>
          </div>
        </div>

        {/* Top bar: dark mode toggle */}
        <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
          <DarkModeToggle variant="icon" />
        </div>

        <div className="w-full max-w-md">
          {/* Logo: visible on mobile only */}
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <BrandLogo />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] p-8 shadow-xl theme-transition"
          >
            {/* Card hairline */}
            <div className="absolute inset-x-8 top-0 h-0.5 rounded-t-full bg-accent-gradient" aria-hidden="true" />

            <div className="mb-7 space-y-1.5">
              <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                {heading}
              </h2>
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">{subheading}</p>
            </div>

            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
