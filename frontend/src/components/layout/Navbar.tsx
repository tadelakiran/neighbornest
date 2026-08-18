import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, LogOut, Menu, Search, X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { Button } from '@/components/ui/Button';
import { NotificationPanel } from '@/components/layout/NotificationPanel';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { APP_NAME, ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface NavbarProps {
  /** When provided (authenticated shell), the hamburger opens the sidebar drawer instead of an inline menu. */
  onMenuClick?: () => void;
  /** Hide the centered nav links — used in the authenticated shell where the sidebar owns navigation. */
  hideNavLinks?: boolean;
  className?: string;
}

/** Landing-page sections the public navbar links to (scroll-spy tracked). */
const PUBLIC_SECTIONS = [
  { label: 'How it works', id: 'how-it-works' },
  { label: 'Features', id: 'features' },
  { label: 'Get started', id: 'get-started' },
] as const;

interface AppLink {
  label: string;
  to: string;
  end?: boolean;
}

/** Primary app destinations for signed-in users (desktop center links). */
const APP_LINKS: AppLink[] = [
  { label: 'Dashboard', to: ROUTES.DASHBOARD, end: true },
  { label: 'Discover', to: ROUTES.DISCOVER },
  { label: 'Proposals', to: ROUTES.PROPOSALS },
  { label: 'Messages', to: ROUTES.MESSAGES },
];

/** Shared link chrome — hover color shift plus an animated underline. */
const LINK_BASE =
  'group relative flex items-center px-3 py-2 text-sm font-semibold transition-colors duration-200';
const LINK_ACTIVE = 'text-[var(--accent-500)]';
const LINK_IDLE = 'text-[var(--text-muted)] hover:text-[var(--text-primary)]';
const UNDERLINE =
  'absolute inset-x-3 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full bg-accent-gradient transition-transform duration-300 ease-out group-hover:scale-x-100';

interface MobileItem {
  label: string;
  to?: string;
  id?: string;
  end?: boolean;
}

/**
 * Sticky top navigation used by both the public site and the authenticated app
 * shell.
 *
 * - Stays transparent at the top of the page and gains a border + shadow +
 *   stronger blur once the user scrolls, so content sliding underneath stays
 *   readable.
 * - Signed-out visitors get centered landing-section links (with a scroll-spy
 *   active state) and Sign in / Get started actions.
 * - Signed-in users get app links (or none, when `hideNavLinks` — the sidebar
 *   owns navigation), a search shortcut, notifications, and their profile chip.
 * - On mobile the links collapse into a slide-in panel driven by the hamburger.
 */
export function Navbar({ onMenuClick, hideNavLinks = false, className = '' }: NavbarProps) {
  const navigate = useNavigate();
  const { pathname, hash } = useLocation();
  const { logout } = useAuth();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const firstName = user?.fullName?.split(' ')[0] ?? 'Member';
  const onLanding = pathname === ROUTES.LANDING;
  const showLinks = !hideNavLinks;
  const usesInlineMobileMenu = !onMenuClick;
  const showMobileMenuButton = showLinks || onMenuClick !== undefined;

  // Elevation + border once the page scrolls — keeps the sticky nav readable
  // over any content passing underneath.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the inline mobile menu whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Arriving on the landing page with a #section hash (e.g. from the footer)
  // scrolls that section into view once the page has rendered.
  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [hash]);

  // Scroll-spy: highlight the landing section currently in view.
  useEffect(() => {
    if (!onLanding) {
      setActiveSection(null);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { rootMargin: '-35% 0px -55% 0px' }
    );
    PUBLIC_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [onLanding]);

  // Lock body scroll and close on Escape while the mobile menu is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const goToSection = (id: string) => {
    setMobileOpen(false);
    if (onLanding) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate(`${ROUTES.LANDING}#${id}`);
    }
  };

  const mobileItems: MobileItem[] = isAuthenticated
    ? APP_LINKS
    : PUBLIC_SECTIONS.map(({ label, id }) => ({ label, id }));

  return (
    <header
      className={cn(
        // Fixed (not sticky): the layout roots have overflow-x-hidden, which
        // turns sticky into a non-sticking relative position — the nav would
        // scroll away with the page instead of staying on top.
        'fixed inset-x-0 top-0 z-40 w-full transition-all duration-300',
        scrolled
          ? 'border-b border-[var(--color-border)] bg-[var(--color-bg)]/85 shadow-[var(--shadow-sm)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[var(--color-bg)]/75'
          : 'border-b border-transparent bg-[var(--color-bg)]/55 backdrop-blur-xl',
        className
      )}
    >
      {/* Subtle top glow line */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-400/30 to-transparent"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 md:px-8">
        {/* Brand */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {showMobileMenuButton && (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onMenuClick ?? (() => setMobileOpen(true))}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-400)]/30 hover:text-[var(--text-primary)] lg:hidden"
              aria-label={onMenuClick ? 'Open navigation menu' : 'Open menu'}
              aria-expanded={usesInlineMobileMenu ? mobileOpen : undefined}
              aria-controls={usesInlineMobileMenu ? 'navbar-mobile-menu' : undefined}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LANDING)}
            className="flex items-center gap-2.5"
            aria-label={`${APP_NAME} home`}
          >
            <BrandLogo />
          </motion.button>
        </div>

        {/* Centered nav links — desktop only */}
        {showLinks && (
          <nav
            aria-label="Primary"
            className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 lg:flex"
          >
            {isAuthenticated
              ? APP_LINKS.map(({ label, to, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) => cn(LINK_BASE, isActive ? LINK_ACTIVE : LINK_IDLE)}
                  >
                    {({ isActive }) => (
                      <>
                        {label}
                        <span
                          className={cn(
                            UNDERLINE,
                            isActive ? 'scale-x-100 opacity-100' : 'opacity-0 group-hover:opacity-100'
                          )}
                          aria-hidden="true"
                        />
                      </>
                    )}
                  </NavLink>
                ))
              : PUBLIC_SECTIONS.map(({ label, id }) => {
                  const isActive = onLanding && activeSection === id;
                  return (
                    <a
                      key={id}
                      href={`#${id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        goToSection(id);
                      }}
                      className={cn(LINK_BASE, 'cursor-pointer', isActive ? LINK_ACTIVE : LINK_IDLE)}
                    >
                      {label}
                      <span
                        className={cn(
                          UNDERLINE,
                          isActive ? 'scale-x-100 opacity-100' : 'opacity-0 group-hover:opacity-100'
                        )}
                        aria-hidden="true"
                      />
                      {isActive && (
                        <span
                          className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--accent-400)] shadow-[0_0_6px_rgba(14,165,233,0.7)]"
                          aria-hidden="true"
                        />
                      )}
                    </a>
                  );
                })}
          </nav>
        )}

        {/* Actions */}
        <div className="flex flex-1 items-center justify-end gap-2.5">
          {isAuthenticated ? (
            <>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate(ROUTES.DISCOVER)}
                className="hidden h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--accent-400)]/30 hover:text-[var(--accent-400)] sm:flex"
                aria-label="Search members and nests"
                title="Search"
              >
                <Search className="h-[18px] w-[18px]" aria-hidden="true" />
              </motion.button>

              <NotificationPanel />

              {user ? (
                <div className="flex items-center gap-2 pl-1">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(ROUTES.PROFILE)}
                    className="flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] py-1 pl-1 pr-3 transition-all duration-200 hover:border-[var(--accent-400)]/25 hover:shadow-[var(--shadow-card-hover)]"
                    aria-label={`Open profile of ${user.fullName}`}
                  >
                    <Avatar name={user.fullName} src={user.profilePhotoUrl} size="sm" />
                    <span className="hidden text-left md:block">
                      <span className="block text-xs font-semibold leading-tight text-primary">
                        {firstName}
                      </span>
                      <span className="block text-[10px] capitalize leading-tight text-muted">
                        {user.role?.toLowerCase() ?? 'member'}
                      </span>
                    </span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => void logout()}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--error)]/30 hover:bg-[var(--error)]/10 hover:text-[var(--error)]"
                    aria-label="Log out"
                    title="Log out"
                  >
                    <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
                  </motion.button>
                </div>
              ) : (
                <span className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
                  Guest
                </span>
              )}
            </>
          ) : (
            <div className="hidden items-center gap-2 lg:flex">
              <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.LOGIN)}>
                Sign in
              </Button>
              <Button
                size="sm"
                rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
                onClick={() => navigate(ROUTES.REGISTER)}
              >
                Get started
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile slide-in menu (public mode — the app shell uses the sidebar instead) */}
      <AnimatePresence>
        {mobileOpen && usesInlineMobileMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-void/60 backdrop-blur-sm lg:hidden"
              aria-hidden="true"
            />

            <motion.div
              id="navbar-mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-50 flex w-[min(20rem,85vw)] flex-col border-l border-[var(--color-border)] bg-[var(--color-deep)]/95 backdrop-blur-2xl lg:hidden"
            >
              <div className="flex items-center justify-between px-5 pb-2 pt-5">
                <BrandLogo />
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setMobileOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </motion.button>
              </div>

              <nav
                aria-label="Mobile navigation"
                className="flex-1 space-y-1 overflow-y-auto px-4 py-4 no-scrollbar"
              >
                {mobileItems.map((item) =>
                  item.to ? (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors duration-200',
                          isActive
                            ? 'bg-accent-gradient text-white shadow-glow-sm'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--color-raised)] hover:text-[var(--text-primary)]'
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                  ) : (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => item.id && goToSection(item.id)}
                      className="flex w-full items-center rounded-xl px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)] transition-colors duration-200 hover:bg-[var(--color-raised)] hover:text-[var(--text-primary)]"
                    >
                      {item.label}
                    </button>
                  )
                )}
              </nav>

              <div className="space-y-2.5 border-t border-[var(--color-border)] p-5">
                {isAuthenticated ? (
                  <>
                    <Button
                      fullWidth
                      variant="secondary"
                      onClick={() => {
                        setMobileOpen(false);
                        navigate(ROUTES.PROFILE);
                      }}
                    >
                      My profile
                    </Button>
                    <Button fullWidth variant="danger" onClick={() => void logout()}>
                      Log out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button fullWidth variant="secondary" onClick={() => navigate(ROUTES.LOGIN)}>
                      Sign in
                    </Button>
                    <Button
                      fullWidth
                      rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
                      onClick={() => navigate(ROUTES.REGISTER)}
                    >
                      Get started
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
