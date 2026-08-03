import { Heart, MapPin, Users } from 'lucide-react';
import { BrandLogo } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { LoginForm } from '@/components/auth/LoginForm';
import { APP_NAME } from '@/lib/constants';
import { IMAGES } from '@/lib/images';

/** Feature highlights shown on the brand panel. */
const FEATURES = [
  { icon: Users, title: 'Curated Nests', text: 'Join small groups of people who share your vibe.' },
  { icon: MapPin, title: 'Local Anchors', text: 'Guided by locals who know the city inside out.' },
  { icon: Heart, title: 'Real friendships', text: 'From first hello to lifelong connections.' },
];

/**
 * Login page — clean split layout:
 * brand illustration panel (desktop only) + the login form.
 */
export function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Brand panel (hidden on mobile) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-950 p-12 lg:flex">
        {/* Hero photography with a deep gradient overlay */}
        <img
          src={IMAGES.city}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/30" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 bg-emerald-950/30" aria-hidden="true" />

        <div className="relative">
          <BrandLogo />
        </div>

        <div className="relative max-w-md space-y-10">
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white">
              Find your people in a{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                new city
              </span>
              .
            </h1>
            <p className="text-lg leading-relaxed text-slate-400">
              {APP_NAME} matches newcomers into small curated groups with local Anchors — real
              friendships, zero awkward networking.
            </p>
          </div>

          <ul className="space-y-5">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                  <Icon className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold text-slate-100">{title}</p>
                  <p className="text-sm text-slate-400">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">© {new Date().getFullYear()} {APP_NAME}</p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col items-center justify-center px-4 py-12 lg:w-1/2">
        <div className="mb-8 lg:hidden">
          <BrandLogo />
        </div>

        <Card className="w-full max-w-md">
          <div className="mb-6 space-y-1.5">
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
            <p className="text-sm text-slate-400">Sign in to continue to {APP_NAME}.</p>
          </div>
          <LoginForm />
        </Card>
      </div>
    </div>
  );
}
