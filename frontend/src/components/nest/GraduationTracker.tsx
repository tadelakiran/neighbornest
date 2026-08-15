import { CalendarCheck, Handshake, Heart, Home, Sparkles, Trophy } from 'lucide-react';
import { Timeline, type TimelineStep } from '@/components/ui/Timeline';
import { weekOf } from '@/lib/nest';
import type { NestResponse } from '@/types/nest.types';

interface GraduationTrackerProps {
  nest: NestResponse;
  /** Whether the Nest has at least one meeting (scheduled or past). */
  hasMeetings: boolean;
}

/**
 * Derives the 6-step graduation timeline from the Nest's week and status.
 * Steps before the current one are completed, the current one pulses, and
 * everything after stays muted.
 *
 * @param nest - the nest
 * @param hasMeetings - whether any meeting exists yet
 * @returns timeline steps
 */
function buildSteps(nest: NestResponse, hasMeetings: boolean): TimelineStep[] {
  const week = weekOf(nest.startDate);
  const graduated = nest.status === 'GRADUATED';
  const vibe = nest.status === 'VIBE_CHECK';
  const active = nest.status === 'ACTIVE';

  const step = (title: string, description: string, completed: boolean, current: boolean, icon: TimelineStep['icon']): TimelineStep => ({
    id: title,
    title,
    description,
    status: completed ? 'completed' : current ? 'current' : 'upcoming',
    icon,
  });

  return [
    step('Formed', 'Your Nest came together', true, false, Handshake),
    step('First Meet', 'Get together in person', hasMeetings || graduated, !hasMeetings && week === 1 && active, CalendarCheck),
    step('Settling In', 'Building rhythms together', week >= 3 || graduated, week === 2 && active, Home),
    step('Vibe Check', 'Week 3 check-in', graduated || (week > 3 && !vibe), vibe || (week === 3 && active), Heart),
    step('Deepening', 'Going beyond the surface', graduated || week >= 6, week >= 4 && week < 6 && active && !vibe, Sparkles),
    step('Graduated', 'A Nest well lived', graduated, week >= 6 && active && !graduated, Trophy),
  ];
}

/**
 * Vertical 6-step graduation timeline with an SVG-style progressive line draw
 * (implemented via scaleY on each connector) and glowing completed steps.
 */
export function GraduationTracker({ nest, hasMeetings }: GraduationTrackerProps) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-deep)]/60 p-6 backdrop-blur-xl">
      <h2 className="mb-5 flex items-center gap-2 font-display text-lg font-bold text-primary">
        <Trophy className="h-5 w-5 text-[var(--royal-300)]" aria-hidden="true" />
        Your Nest Journey
      </h2>
      <Timeline steps={buildSteps(nest, hasMeetings)} />
    </section>
  );
}
