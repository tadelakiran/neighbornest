import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Heart, MapPin, Sparkles, Users } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';
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
  container: { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } } },
  item: {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  },
};

interface AuthSplitLayoutProps {
  heading: string;
  subheading: string;
  children: ReactNode;
}

/**
 * Fixed-height split-screen auth shell — the page never scrolls; both panels
 * fit the viewport. Left: single aligned photo on a light sky-blue theme.
 * Right: compact centered form card.
 */
export function AuthSplitLayout({ heading, subheading, children }: AuthSplitLayoutProps) {
  return (
    <div className="relative flex h-dvh overflow-hidden bg-[var(--color-bg)]">
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute -top-40 right-[5%] h-[500px] w-[500px] rounded-full bg-accent-500/[0.07] blur-[100px]" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-[8%] left-[5%] hidden h-[400px] w-[400px] rounded-full bg-royal-400/[0.08] blur-[90px] lg:block" aria-hidden="true" />

      {/* ── Left brand panel ── */}
      <div className="relative hidden w-[52%] flex-col overflow-hidden lg:flex">
        {/* Single aligned background photo on the light theme */}
        <div className="absolute inset-0" aria-hidden="true">
          <LazyImage
            src={IMAGES.community}
            alt=""
            placeholder="blur"
            wrapperClassName="absolute inset-0"
            className="h-full w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-sky-100/85 to-accent-200/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-transparent to-white/40" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col p-10">
          <div className="flex items-center">
            <BrandLogo />
          </div>

          <motion.div
            variants={stagger.container}
            initial="hidden"
            animate="show"
            className="flex flex-1 flex-col justify-center"
          >
            <motion.div variants={stagger.item} className="max-w-lg space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-accent-500/20 bg-white/70 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-accent-600 shadow-sm backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 fill-accent-400 text-accent-500" aria-hidden="true" />
                New to the city? You&apos;re in the right place.
              </span>
              <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-[var(--text-primary)] xl:text-[3.25rem]">
                Find your people in a{' '}
                <span className="text-gradient">new city</span>
                <span className="text-accent-500">.</span>
              </h1>
              <p className="text-base leading-relaxed text-[var(--text-secondary)] lg:text-lg">
                {APP_NAME} matches newcomers into small curated groups with local Anchors — real
                friendships, zero awkward networking.
              </p>
            </motion.div>

            <motion.ul variants={stagger.container} className="mt-8 space-y-4">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <motion.li key={title} variants={stagger.item} className="flex max-w-lg items-start gap-4">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent-500/15 bg-white/80 shadow-sm backdrop-blur-md">
                    <Icon className="h-5 w-5 text-accent-500" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-[var(--text-secondary)]">{text}</p>
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
            className="flex flex-wrap gap-x-10 gap-y-3 border-t border-[var(--color-border)] pt-5"
          >
            {STATS.map((stat) => (
              <motion.div key={stat.label} variants={stagger.item} className="flex flex-col gap-0.5">
                <dd className="order-first font-display text-2xl font-bold text-accent-600">{stat.value}</dd>
                <dt className="order-last text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {stat.label}
                </dt>
              </motion.div>
            ))}
          </motion.dl>

          <p className="mt-4 text-[11px] text-[var(--text-subtle)]">
            © {new Date().getFullYear()} {APP_NAME} — small groups, big friendships.
          </p>
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
          <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-sky-100/70 to-transparent" />
          <div className="absolute inset-0 flex items-center px-6">
            <p className="font-display text-xl font-bold leading-tight text-[var(--text-primary)]">
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
            className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 p-6 shadow-[var(--shadow-lg)] backdrop-blur-2xl sm:p-8"
          >
            {/* Hairline */}
            <div className="absolute inset-x-8 top-0 h-[2px] rounded-b-full bg-accent-gradient shadow-[0_0_12px_rgba(14,165,233,0.4)]" aria-hidden="true" />

            {/* Inner glow */}
            <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-accent-400/10 blur-3xl" aria-hidden="true" />

            <div className="relative mb-6 space-y-1.5">
              <h2 className="font-display text-2xl font-bold tracking-tight text-primary">
                {heading}
              </h2>
              <p className="text-sm leading-relaxed text-muted">{subheading}</p>
            </div>

            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
