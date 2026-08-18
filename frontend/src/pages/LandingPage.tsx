import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Compass, Heart, MapPin, Sparkles, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LazyImage } from '@/components/ui/LazyImage';
import { useAuthStore } from '@/stores/authStore';
import { cardRise, staggerContainer } from '@/lib/motion';
import { IMAGES } from '@/lib/images';
import { APP_NAME, ROUTES } from '@/lib/constants';

const STATS = [
  { value: '5–8', label: 'people per Nest' },
  { value: '1–2', label: 'local Anchors' },
  { value: '6 wk', label: 'guided journeys' },
];

const STEPS = [
  {
    icon: Sparkles,
    image: IMAGES.coffee,
    title: 'Tell us your vibe',
    text: 'A two-minute onboarding captures your values, lifestyle and interests.',
  },
  {
    icon: Compass,
    image: IMAGES.walking,
    title: 'Get matched',
    text: 'Our engine scores compatibility and places you with like-minded neighbors.',
  },
  {
    icon: Heart,
    image: IMAGES.park,
    title: 'Meet your Nest',
    text: 'A small curated group with a local Anchor — real friendships, zero awkward networking.',
  },
];

const FEATURES = [
  {
    image: IMAGES.friends,
    title: 'Small groups, real bonds',
    text: 'Nests stay between 5 and 8 people so every voice matters and no one gets lost in a crowd.',
  },
  {
    image: IMAGES.dinner,
    title: 'Guided by local Anchors',
    text: 'Experienced locals host meetups, share the city’s hidden gems, and help you settle in.',
  },
  {
    image: IMAGES.community,
    title: 'A journey, not a feed',
    text: 'Six-week journeys with planned hangouts, shared moments, and a graduation to celebrate.',
  },
];

/**
 * Public marketing landing page — showcases the product with premium
 * photography and funnels visitors to the auth pages (or the dashboard when
 * already signed in). The navbar and footer come from PublicLayout; the
 * section ids below are the targets for the navbar's scroll-spy links.
 */
export function LandingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const primaryAction = () => navigate(isAuthenticated ? ROUTES.DASHBOARD : ROUTES.REGISTER);
  const secondaryAction = () => navigate(isAuthenticated ? ROUTES.PROFILE : ROUTES.LOGIN);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient warmth */}
      <div
        className="pointer-events-none absolute -top-40 left-1/4 h-[480px] w-[640px] rounded-full bg-[var(--accent-500)]/[0.08] blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-[8%] top-[30%] h-[420px] w-[420px] rounded-full bg-[var(--royal-400)]/[0.08] blur-3xl"
        aria-hidden="true"
      />

      {/* ── Hero ── */}
      <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-6 pb-16 pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-14 lg:px-8 lg:pt-12">
        <motion.div variants={staggerContainer} initial="hidden" animate="show">
          <motion.span
            variants={cardRise}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--royal-500)]/30 bg-[var(--royal-500)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--royal-300)]"
          >
            <Star
              className="h-3.5 w-3.5 fill-[var(--royal-400)] text-[var(--royal-400)]"
              aria-hidden="true"
            />
            New to the city? You&apos;re in the right place.
          </motion.span>

          <motion.h1
            variants={cardRise}
            className="mt-5 font-['Space_Grotesk'] text-4xl font-bold leading-[1.08] tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-6xl"
          >
            Find your people in a <span className="text-gradient">new city</span>
            <span className="text-[var(--royal-400)]">.</span>
          </motion.h1>

          <motion.p
            variants={cardRise}
            className="mt-5 max-w-lg text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg"
          >
            {APP_NAME} matches you into small curated groups with local Anchors —
            real friendships, zero awkward networking.
          </motion.p>

          <motion.div variants={cardRise} className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              className="shadow-[0_0_24px_rgba(14,165,233,0.25)]"
              rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
              onClick={primaryAction}
            >
              {isAuthenticated ? 'Open your dashboard' : 'Start for free'}
            </Button>
            <Button variant="secondary" size="lg" onClick={secondaryAction}>
              {isAuthenticated ? 'View profile' : 'I already have an account'}
            </Button>
          </motion.div>

          <motion.dl variants={cardRise} className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <dt className="order-last text-xs uppercase tracking-widest text-[var(--text-muted)]">
                  {stat.label}
                </dt>
                <dd className="order-first font-['Space_Grotesk'] text-2xl font-bold text-gradient">
                  {stat.value}
                </dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        {/* Hero images — compact, clean, fully above the fold */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-sm xl:max-w-md"
        >
          {/* Main photo */}
          <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--text-primary)]/[0.08] shadow-[var(--shadow-xl)]">
            <LazyImage
              src={IMAGES.community}
              alt="Friends spending time together"
              aspectRatio="4/3"
              placeholder="blur"
              className="h-full w-full object-cover"
              loading="eager"
            />
          </div>

          {/* Two accent photos — side by side, below, fully separated */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="overflow-hidden rounded-2xl border border-[var(--text-primary)]/[0.08] shadow-[var(--shadow-md)]">
              <LazyImage
                src={IMAGES.coffee}
                alt="Coffee shop meetup"
                aspectRatio="4/3"
                placeholder="blur"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="overflow-hidden rounded-2xl border border-[var(--text-primary)]/[0.08] shadow-[var(--shadow-md)]">
              <LazyImage
                src={IMAGES.park}
                alt="Group of friends outdoors"
                aspectRatio="4/3"
                placeholder="blur"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {/* Info badge — separate compact strip below */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-3 flex items-center gap-2.5 rounded-2xl border border-[var(--text-primary)]/[0.08] bg-[var(--color-deep)]/85 px-3.5 py-2.5 shadow-[var(--shadow-md)] backdrop-blur-xl"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-gradient shadow-glow-sm">
              <MapPin className="h-4 w-4 text-white" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold text-[var(--text-primary)]">Your Nest is waiting</p>
              <p className="text-[10px] text-[var(--text-muted)]">Matched · Anchored · Welcomed</p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── How it works ── */}
      <section
        id="how-it-works"
        className="relative z-10 mx-auto max-w-7xl scroll-mt-20 px-6 py-16 lg:px-8"
      >
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="text-center"
        >
          <motion.p
            variants={cardRise}
            className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--royal-400)]"
          >
            How it works
          </motion.p>
          <motion.h2
            variants={cardRise}
            className="mt-3 font-['Space_Grotesk'] text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl"
          >
            From newcomer to neighbor in three steps
          </motion.h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-12 grid gap-6 md:grid-cols-3"
        >
          {STEPS.map(({ icon: Icon, image, title, text }, index) => (
            <motion.article
              key={title}
              variants={cardRise}
              className="group relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]"
            >
              {/* Photo as its own banner — separate from the text below */}
              <div className="relative h-40 overflow-hidden">
                <LazyImage
                  src={image}
                  alt=""
                  placeholder="shimmer"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)]/60 to-transparent" />
              </div>
              <div className="p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--grad-primary)] shadow-glow-sm">
                  <Icon className="h-5 w-5 text-white" aria-hidden="true" />
                </span>
                <p className="mt-5 font-['Space_Grotesk'] text-xs font-bold uppercase tracking-widest text-[var(--royal-400)]">
                  Step {index + 1}
                </p>
                <h3 className="mt-1 font-['Space_Grotesk'] text-lg font-bold text-[var(--text-primary)]">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{text}</p>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl scroll-mt-20 px-6 py-16 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid items-center gap-10 lg:grid-cols-2"
        >
          <motion.div variants={cardRise} className="relative order-2 space-y-6 lg:order-1">
            {FEATURES.map(({ image, title, text }, index) => (
              <motion.div
                key={title}
                variants={cardRise}
                className="group flex items-start gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-deep)]/50 p-4 backdrop-blur-xl transition-all duration-300 hover:border-[var(--royal-500)]/30 hover:bg-[var(--color-deep)]/80"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                  <LazyImage
                    src={image}
                    alt={title}
                    aspectRatio="1/1"
                    placeholder="blur"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div>
                  <h3 className="font-['Space_Grotesk'] text-base font-bold text-[var(--text-primary)]">
                    {title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">{text}</p>
                </div>
                <span className="ml-auto font-['Space_Grotesk'] text-3xl font-bold text-[var(--text-primary)]/5">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={cardRise} className="relative order-1 lg:order-2">
            <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--text-primary)]/[0.08] shadow-[var(--shadow-xl)]">
              <LazyImage
                src={IMAGES.dinner}
                alt="A Nest gathering over dinner"
                aspectRatio="16/9"
                placeholder="blur"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 left-6 flex items-center gap-2 rounded-2xl border border-[var(--text-primary)]/[0.08] bg-[var(--color-deep)]/90 px-4 py-3 shadow-[var(--shadow-lg)] backdrop-blur-xl">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--grad-primary)] shadow-glow-sm">
                <Users className="h-4 w-4 text-white" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">A Nest night out</p>
                <p className="text-[10px] text-[var(--text-muted)]">Planned by your Anchor</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── CTA band ── */}
      <section id="get-started" className="relative z-10 mx-auto max-w-7xl scroll-mt-20 px-6 py-16 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]"
        >
          {/* City photo as its own side panel — separate from the text */}
          <div className="grid items-stretch md:grid-cols-2">
            <div className="relative min-h-48 overflow-hidden">
              <LazyImage
                src={IMAGES.city}
                alt="A lively city neighborhood at golden hour"
                placeholder="shimmer"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)]/40 via-transparent to-transparent md:bg-gradient-to-r" />
            </div>

            <div className="flex flex-col items-center justify-center p-10 text-center md:p-14">
              <h2 className="max-w-2xl font-['Space_Grotesk'] text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl">
                Ready to find your <span className="text-gradient">people</span>?
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
                Join {APP_NAME} today — answer a few questions and we&apos;ll introduce you to neighbors
                who share your vibe.
              </p>
              <Button
                size="lg"
                className="mt-8 shadow-[0_0_24px_rgba(14,165,233,0.25)]"
                rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
                onClick={primaryAction}
              >
                {isAuthenticated ? 'Go to your dashboard' : 'Create your free account'}
              </Button>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
