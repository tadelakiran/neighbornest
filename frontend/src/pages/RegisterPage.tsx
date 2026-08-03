import { ShieldCheck, Sparkles, Users } from 'lucide-react';
import { BrandLogo } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { APP_NAME } from '@/lib/constants';
import { IMAGES } from '@/lib/images';

/** Trust/benefit highlights shown on the brand panel. */
const HIGHLIGHTS = [
  { icon: Users, text: 'Join a community of people who moved to your city.' },
  { icon: Sparkles, text: 'Get matched with compatible personalities — not random groups.' },
  { icon: ShieldCheck, text: 'Your data stays private. No public profiles, no noise.' },
];

/**
 * Register page — split layout with a brand panel and the sign-up form.
 */
export function RegisterPage() {
  return (
    <div className="flex min-h-screen">
      {/* Brand panel (hidden on mobile) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-950 p-12 lg:flex">
        {/* Hero photography with a deep gradient overlay */}
        <img
          src={IMAGES.neighborhood}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/30" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 bg-teal-950/30" aria-hidden="true" />

        <div className="relative">
          <BrandLogo />
        </div>

        <div className="relative max-w-md space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white">
              Your next chapter starts{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                here
              </span>
              .
            </h1>
            <p className="text-lg text-slate-400">
              Create your {APP_NAME} account and get matched into a Nest within days.
            </p>
          </div>

          <ul className="space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-teal-500/30 bg-teal-500/10">
                  <Icon className="h-5 w-5 text-teal-400" aria-hidden="true" />
                </span>
                {text}
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
            <h2 className="text-2xl font-bold text-white">Create your account</h2>
            <p className="text-sm text-slate-400">Takes less than a minute. No credit card required.</p>
          </div>
          <RegisterForm />
        </Card>
      </div>
    </div>
  );
}
