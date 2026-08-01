import { ShieldCheck, Sparkles, Users } from 'lucide-react';
import { BrandLogo } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { APP_NAME } from '@/lib/constants';

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
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-teal-950 via-slate-900 to-slate-950 p-12 lg:flex">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -right-16 top-20 h-80 w-80 rounded-full bg-teal-500/15 blur-3xl" />
          <div className="absolute bottom-1/4 -left-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute left-16 top-1/2 h-20 w-20 rotate-12 rounded-2xl border border-teal-400/20 bg-teal-400/5" />
          <div className="absolute bottom-16 right-24 h-14 w-14 rounded-full border border-emerald-400/25" />
        </div>

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
