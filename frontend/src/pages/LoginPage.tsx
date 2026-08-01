import { Heart, MapPin, Users } from 'lucide-react';
import { BrandLogo } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { LoginForm } from '@/components/auth/LoginForm';
import { APP_NAME } from '@/lib/constants';

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
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 p-12 lg:flex">
        {/* Abstract decorative shapes */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="animate-float absolute -left-20 top-24 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
          <div className="absolute bottom-10 left-1/4 h-56 w-56 rounded-full border border-emerald-500/20" />
          <div className="absolute right-16 top-16 h-24 w-24 rounded-2xl border border-emerald-400/20 bg-emerald-400/5" />
          <div className="absolute bottom-24 right-32 h-16 w-16 rotate-45 rounded-xl bg-emerald-500/10" />
        </div>

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
