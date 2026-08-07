import { motion } from 'framer-motion';
import { Heart, MapPin, Users } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { LoginForm } from '@/components/auth/LoginForm';
import { LazyImage } from '@/components/ui/LazyImage';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { APP_NAME } from '@/lib/constants';
import { IMAGES } from '@/lib/images';

const FEATURES = [
  { icon: Users,  title: 'Curated Nests',    text: 'Join small groups of people who share your vibe.'      },
  { icon: MapPin, title: 'Local Anchors',    text: 'Guided by locals who know the city inside out.'        },
  { icon: Heart,  title: 'Real friendships', text: 'From first hello to lifelong connections.'             },
];

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } } },
  item:       { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22,1,0.36,1] } } },
};

export function LoginPage() {
  return (
    <div className="flex min-h-screen">

      {/* Brand panel — left 55%, desktop only */}
      <div className="relative hidden w-[55%] flex-col justify-between overflow-hidden lg:flex">

        {/* Background photo */}
        <div className="absolute inset-0">
          <LazyImage
            src={IMAGES.community}
            alt="Neighbors spending time together in a warm community"
            aspectRatio="1/1"
            placeholder="blur"
            wrapperClassName="absolute inset-0"
            className="object-cover"
            loading="eager"
          />
          {/* Overlay: left-heavy gradient for readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-accent-900/90 via-accent-800/70 to-accent-700/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-accent-950/60 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="relative flex items-center justify-between p-10">
          <BrandLogo />
        </div>

        <motion.div
          className="relative max-w-lg space-y-10 px-10 pb-14"
          variants={stagger.container}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={stagger.item} className="space-y-4">
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-white">
              Find your people in a{' '}
              <span className="bg-gradient-to-r from-blue-200 to-blue-100 bg-clip-text text-transparent">
                new city
              </span>
              .
            </h1>
            <p className="text-lg leading-relaxed text-blue-100/90">
              {APP_NAME} matches newcomers into small curated groups with local Anchors — real
              friendships, zero awkward networking.
            </p>
          </motion.div>

          <motion.ul variants={stagger.container} className="space-y-5">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <motion.li key={title} variants={stagger.item} className="flex items-start gap-4">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/20 bg-white/10 backdrop-blur-sm">
                  <Icon className="h-5 w-5 text-blue-100" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold text-white">{title}</p>
                  <p className="text-sm text-blue-200/80">{text}</p>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>

        <p className="relative px-10 pb-6 text-xs text-blue-300/60">
          © {new Date().getFullYear()} {APP_NAME}
        </p>
      </div>

      {/* Form panel — right 45% */}
      <div className="flex w-full flex-col items-center justify-center px-4 py-12 sm:px-8 lg:w-[45%]">

        {/* Top bar: logo (mobile) + dark mode toggle */}
        <div className="absolute right-4 top-4 flex items-center gap-2">
          <DarkModeToggle variant="icon" />
        </div>

        <div className="w-full max-w-md">
          {/* Logo: visible on mobile only */}
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <BrandLogo />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-8 shadow-xl theme-transition"
          >
            {/* Card hairline */}
            <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl bg-accent-gradient opacity-100" aria-hidden="true" />

            <div className="mb-7 space-y-1.5">
              <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">Welcome back</h2>
              <p className="text-sm text-[var(--text-muted)]">Sign in to continue to {APP_NAME}.</p>
            </div>

            <LoginForm />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
