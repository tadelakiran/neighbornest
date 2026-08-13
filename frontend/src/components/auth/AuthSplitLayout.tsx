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
  container: { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } } },
  item: {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  },
};

const floatAnimation = {
  y: [0, -8, 0],
  transition: { repeat: Infinity, duration: 5, ease: 'easeInOut' },
};

interface AuthSplitLayoutProps {
  heading: string;
  subheading: string;
  children: ReactNode;
}

export function AuthSplitLayout({ heading, subheading, children }: AuthSplitLayoutProps) {
  return (
    <div className="relative flex min-h-screen overflow-hidden">
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute -top-40 right-[5%] h-[500px] w-[500px] rounded-full bg-accent-500/[0.07] blur-[100px] lg:left-auto" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-[8%] left-[5%] hidden h-[400px] w-[400px] rounded-full bg-gold-400/[0.05] blur-[90px] lg:block" aria-hidden="true" />

      {/* ── Left brand panel ── */}
      <div className="relative hidden w-[55%] flex-col overflow-hidden lg:flex">
        {/* Background */}
        <div className="absolute inset-0">
          <LazyImage
            src={IMAGES.community}
            alt="Neighbors spending time together in a warm community"
            placeholder="blur"
            wrapperClassName="absolute inset-0"
            className="object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-accent-950/95 via-accent-900/85 to-accent-700/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-accent-950/80 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-gold-500/12 via-transparent to-transparent" />
        </div>

        {/* Floating collage */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="absolute right-10 top-24 z-20 hidden w-40 overflow-hidden rounded-2xl border border-white/15 shadow-2xl backdrop-blur-sm xl:block"
        >
          <motion.div animate={floatAnimation} className="h-full w-full">
            <LazyImage src={IMAGES.coffee} alt="Coffee shop meetup" aspectRatio="4/3" placeholder="blur" className="h-full w-full object-cover" />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="absolute bottom-44 left-8 z-20 hidden w-44 overflow-hidden rounded-2xl border border-white/15 shadow-2xl backdrop-blur-sm xl:block"
        >
          <motion.div animate={{ ...floatAnimation, transition: { ...floatAnimation.transition, delay: 1.5 } }} className="h-full w-full">
            <LazyImage src={IMAGES.park} alt="Group of friends outdoors" aspectRatio="4/3" placeholder="blur" className="h-full w-full object-cover" />
          </motion.div>
        </motion.div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-10">
          <BrandLogo />
        </div>

        {/* Content */}
        <motion.div
          variants={stagger.container}
          initial="hidden"
          animate="show"
          className="relative z-10 flex flex-1 flex-col justify-center px-10"
        >
          <motion.div variants={stagger.item} className="max-w-lg space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-gold-200 shadow-[0_0_20px_rgba(251,191,36,0.1)]">
              <Sparkles className="h-3.5 w-3.5 fill-gold-300 text-gold-300" aria-hidden="true" />
              New to the city? You're in the right place.
            </span>
            <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-white xl:text-[3.25rem]">
              Find your people in a{' '}
              <span className="bg-gradient-to-r from-accent-300 via-accent-200 to-white bg-clip-text text-transparent">
                new city
              </span>
              <span className="text-gold-400">.</span>
            </h1>
            <p className="text-base leading-relaxed text-accent-100/80 lg:text-lg">
              {APP_NAME} matches newcomers into small curated groups with local Anchors — real
              friendships, zero awkward networking.
            </p>
          </motion.div>

          <motion.ul variants={stagger.container} className="mt-10 space-y-5">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <motion.li key={title} variants={stagger.item} className="flex max-w-lg items-start gap-4">
                <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.08] shadow-lg backdrop-blur-md">
                  <Icon className="h-5 w-5 text-accent-200" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-accent-100/70">{text}</p>
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
          className="relative z-10 flex flex-wrap gap-x-12 gap-y-4 px-10 pb-8"
        >
          {STATS.map((stat) => (
            <motion.div key={stat.label} variants={stagger.item} className="flex flex-col gap-1">
              <dd className="order-first font-display text-3xl font-bold text-gradient-gold">{stat.value}</dd>
              <dt className="order-last text-[10px] font-bold uppercase tracking-[0.2em] text-accent-100/50">
                {stat.label}
              </dt>
            </motion.div>
          ))}
        </motion.dl>

        <p className="relative z-10 px-10 pb-8 text-[11px] text-accent-100/30">
          © {new Date().getFullYear()} {APP_NAME} — small groups, big friendships.
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="relative flex w-full flex-col items-center justify-center px-4 py-12 sm:px-8 lg:w-[45%]">
        {/* Mobile banner */}
        <div className="relative mb-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/[0.08] shadow-2xl lg:hidden">
          <LazyImage
            src={IMAGES.community}
            alt="Neighbors spending time together"
            aspectRatio="16/7"
            placeholder="blur"
            loading="eager"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-accent-950/85 via-accent-900/50 to-transparent" />
          <div className="absolute inset-0 flex items-center px-6">
            <p className="font-display text-xl font-bold leading-tight text-white">
              Find your people in a <span className="text-gradient">new city</span>.
            </p>
          </div>
        </div>

        {/* Theme toggle */}
        <div className="absolute right-5 top-5 z-20">
          <DarkModeToggle variant="icon" />
        </div>

        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <BrandLogo />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-surface/80 p-8 shadow-2xl backdrop-blur-2xl"
          >
            {/* Hairline */}
            <div className="absolute inset-x-8 top-0 h-[2px] rounded-b-full bg-accent-gradient shadow-[0_0_12px_rgba(14,165,233,0.4)]" aria-hidden="true" />
            
            {/* Inner glow */}
            <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-accent-400/10 blur-3xl" aria-hidden="true" />

            <div className="relative mb-8 space-y-2">
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