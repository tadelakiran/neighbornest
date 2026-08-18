import { useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Github, Instagram, Linkedin, Mail, MapPin, Send, Twitter } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/stores/authStore';
import { APP_NAME, ROUTES } from '@/lib/constants';

const SOCIALS = [
  { label: 'X (Twitter)', href: 'https://x.com', icon: Twitter },
  { label: 'LinkedIn', href: 'https://www.linkedin.com', icon: Linkedin },
  { label: 'Instagram', href: 'https://www.instagram.com', icon: Instagram },
  { label: 'GitHub', href: 'https://github.com', icon: Github },
];

/** Quick destinations — signed-in users get app pages, guests get the marketing page. */
const APP_QUICK_LINKS = [
  { label: 'Dashboard', to: ROUTES.DASHBOARD },
  { label: 'Discover', to: ROUTES.DISCOVER },
  { label: 'Proposals', to: ROUTES.PROPOSALS },
  { label: 'My Nest', to: ROUTES.MY_NEST },
];

const PUBLIC_QUICK_LINKS = [
  { label: 'Home', to: ROUTES.LANDING },
  { label: 'How it works', to: `${ROUTES.LANDING}#how-it-works` },
  { label: 'Features', to: `${ROUTES.LANDING}#features` },
  { label: 'Sign in', to: ROUTES.LOGIN },
];

const RESOURCES = [
  { label: 'Help Center', href: '#' },
  { label: 'Community Guidelines', href: '#' },
  { label: 'Safety Tips', href: '#' },
  { label: 'Contact Support', href: 'mailto:support@neighbornest.com' },
];

const BOTTOM_LINKS = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
  { label: 'Sitemap', href: '#' },
];

/** Placeholder legal/resource links — prevent the default # jump for now. */
function onPlaceholderClick(e: React.MouseEvent<HTMLAnchorElement>) {
  if (e.currentTarget.getAttribute('href') === '#') {
    e.preventDefault();
  }
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
        {title}
      </h3>
      <ul className="mt-5 space-y-3">{children}</ul>
    </div>
  );
}

/**
 * Site-wide footer: brand + tagline + social icons, quick links, resources,
 * contact details with a newsletter signup, and a legal bottom bar.
 *
 * - Columns collapse to a single stack on mobile.
 * - Quick links adapt to auth state (app destinations vs. marketing page).
 * - Newsletter subscription validates the email and confirms via toast.
 */
export function Footer() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const toast = useToast();
  const [email, setEmail] = useState('');

  const quickLinks = isAuthenticated ? APP_QUICK_LINKS : PUBLIC_QUICK_LINKS;

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    toast.success(`You're on the list — welcome to ${APP_NAME} updates!`);
    setEmail('');
  };

  return (
    <footer className="relative z-10 border-t border-[var(--color-border)] bg-[var(--color-deep)]/50">
      <div className="mx-auto max-w-7xl px-6 pb-12 pt-16 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.35fr]">
          {/* Brand + tagline + social */}
          <div className="max-w-xs">
            <BrandLogo />
            <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
              {APP_NAME} matches you into small, curated groups with local Anchors —
              real friendships, zero awkward networking.
            </p>

            <div className="mt-6 flex items-center gap-2.5">
              {SOCIALS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--text-muted)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent-400)]/40 hover:bg-[var(--accent-400)]/10 hover:text-[var(--accent-500)] hover:shadow-[var(--shadow-card-hover)]"
                >
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <FooterColumn title="Quick Links">
            {quickLinks.map(({ label, to }) => (
              <li key={label}>
                <Link
                  to={to}
                  className="text-sm text-[var(--text-secondary)] transition-colors duration-200 hover:text-[var(--accent-500)]"
                >
                  {label}
                </Link>
              </li>
            ))}
          </FooterColumn>

          {/* Resources & support */}
          <FooterColumn title="Resources & Support">
            {RESOURCES.map(({ label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  onClick={onPlaceholderClick}
                  className="text-sm text-[var(--text-secondary)] transition-colors duration-200 hover:text-[var(--accent-500)]"
                >
                  {label}
                </a>
              </li>
            ))}
          </FooterColumn>

          {/* Contact + newsletter */}
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Contact
            </h3>
            <ul className="mt-5 space-y-3">
              <li>
                <a
                  href="mailto:hello@neighbornest.com"
                  className="inline-flex items-center gap-2.5 text-sm text-[var(--text-secondary)] transition-colors duration-200 hover:text-[var(--accent-500)]"
                >
                  <Mail className="h-4 w-4 text-[var(--text-muted)]" aria-hidden="true" />
                  hello@neighbornest.com
                </a>
              </li>
              <li className="inline-flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
                <MapPin className="h-4 w-4 text-[var(--text-muted)]" aria-hidden="true" />
                Community-led · city by city
              </li>
            </ul>

            <h3 className="mt-9 font-display text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Stay in the loop
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              Nest stories, product updates, and city launches — no spam.
            </p>
            <form onSubmit={handleSubscribe} className="mt-4 flex items-center gap-2">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email address for newsletter"
                autoComplete="email"
                className="h-11 rounded-xl"
              />
              <Button type="submit" className="h-11 shrink-0 px-4" rightIcon={<Send className="h-4 w-4" aria-hidden="true" />}>
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)]/70">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-[var(--text-muted)] sm:flex-row lg:px-8">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {BOTTOM_LINKS.map(({ label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  onClick={onPlaceholderClick}
                  className="transition-colors duration-200 hover:text-[var(--accent-500)]"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
