/**
 * Seeded random demo fixtures for the Nest Hub (Module 4).
 *
 * The PRNG below is deterministic (mulberry32) so every test run sees the same
 * "random-looking" data — amounts, names and scores vary, but assertions never
 * flake. This is the frontend counterpart to `backend/scripts/seed_demo_data.py`.
 */

import type {
  ExpenseResponse,
  MeetingResponse,
  NestMemberResponse,
  NestResponse,
  VibeCheckStatusResponse,
} from '@/types/nest.types';

/** Deterministic 32-bit PRNG (mulberry32). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST_NAMES = ['Priya', 'Marcus', 'Aisha', 'Diego', 'Hana', 'Liam', 'Sofia', 'Kenji'];
const LAST_NAMES = ['Sharma', 'Lee', 'Patel', 'Ruiz', 'Tanaka', 'O’Brien', 'Costa', 'Nguyen'];
const CITIES = ['San Francisco', 'Austin', 'Toronto', 'Berlin', 'Singapore'];
const VENUES = ['Brew & Bloom Café', 'Lakeside Park', 'The Trivia Den', 'Ramen Street', 'Harbor Boardwalk'];

/** Picks a random element from an array using the PRNG. */
function pick<T>(rand: () => number, items: T[]): T {
  return items[Math.floor(rand() * items.length)];
}

/** Builds `count` nest members, the first always being the ANCHOR. */
export function buildDemoMembers(seed = 42, count = 4): NestMemberResponse[] {
  const rand = mulberry32(seed);
  const members: NestMemberResponse[] = [];
  for (let i = 0; i < count; i++) {
    members.push({
      userId: i + 1,
      fullName: `${pick(rand, FIRST_NAMES)} ${pick(rand, LAST_NAMES)}`,
      roleInNest: i === 0 ? 'ANCHOR' : 'MEMBER',
      status: 'ACCEPTED',
      joinedAt: '2026-07-01T09:00:00',
      graduated: false,
    });
  }
  return members;
}

/** A full Nest fixture (ACTIVE, mid-journey). */
export function buildDemoNest(seed = 42): NestResponse {
  return {
    id: 101,
    name: 'The Mission Crew',
    city: pick(mulberry32(seed + 1), CITIES),
    status: 'ACTIVE',
    startDate: '2026-07-20',
    endDate: '2026-08-31',
    members: buildDemoMembers(seed),
    createdAt: '2026-07-20T08:00:00',
  };
}

/** Meetings: one upcoming, one past-completed, one cancelled. */
export function buildDemoMeetings(seed = 42): MeetingResponse[] {
  const rand = mulberry32(seed + 2);
  const base = new Date();
  const iso = (d: Date) => d.toISOString();
  return [
    {
      id: 501,
      scheduledAt: iso(new Date(base.getTime() + 86_400_000)), // tomorrow
      venueName: pick(rand, VENUES),
      venueAddress: `${100 + Math.floor(rand() * 800)} ${pick(rand, ['Maple', 'Elm', 'Oak'])} Street`,
      activityType: pick(rand, ['Coffee', 'Board Games', 'Trivia']),
      description: 'Casual first hangout — bring a friend if you like!',
      status: 'SCHEDULED',
    },
    {
      id: 500,
      scheduledAt: iso(new Date(base.getTime() - 3 * 86_400_000)), // 3 days ago
      venueName: 'Riverside Picnic Spot',
      venueAddress: 'Riverside Drive',
      activityType: 'Walk',
      description: 'Sunset walk along the river.',
      status: 'COMPLETED',
    },
    {
      id: 499,
      scheduledAt: iso(new Date(base.getTime() - 10 * 86_400_000)),
      venueName: 'The Trivia Den',
      activityType: 'Trivia',
      status: 'CANCELLED',
    },
  ];
}

/**
 * Expenses with mixed settle states and a clear money trail. Matches the
 * ExpenseTracker test expectations:
 *  - 601: payer 1, everyone still unsettled (users 2 and 3 both owe $10)
 *  - 600: payer 2, user 1 owes $12 (unsettled) while payer 2's own share is
 *    settled — you never owe yourself.
 */
export function buildDemoExpenses(seed = 42): ExpenseResponse[] {
  const rand = mulberry32(seed + 3);
  void rand;
  return [
    {
      id: 601,
      payerId: 1,
      amount: 40,
      description: 'Group dinner — Ramen Street',
      splitType: 'EQUAL',
      splits: [
        { userId: 1, amountOwed: 10, settled: false },
        { userId: 2, amountOwed: 10, settled: false },
        { userId: 3, amountOwed: 10, settled: false },
        { userId: 4, amountOwed: 10, settled: false },
      ],
      createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    },
    {
      id: 600,
      payerId: 2,
      amount: 24,
      description: 'Board game night snacks',
      splitType: 'CUSTOM',
      splits: [
        { userId: 1, amountOwed: 12, settled: false },
        { userId: 2, amountOwed: 12, settled: true },
      ],
      createdAt: new Date(Date.now() - 9 * 86_400_000).toISOString(),
    },
  ];
}

/** Vibe-check status: 3 of 4 submitted. */
export function buildDemoVibeStatus(seed = 42): VibeCheckStatusResponse {
  const rand = mulberry32(seed + 4);
  const score = () => 5 + Math.floor(rand() * 5);
  return {
    averageConnection: 8.25,
    averageComfort: 7.5,
    overallAverage: 7.88,
    submissionCount: 3,
    submissions: [
      { userId: 1, connectionScore: 9, comfortScore: 8, feedback: 'Love this group — already feel at home.', submittedAt: '2026-08-06T10:00:00' },
      { userId: 2, connectionScore: 8, comfortScore: 7, feedback: undefined, submittedAt: '2026-08-06T12:30:00' },
      { userId: 3, connectionScore: score(), comfortScore: score(), feedback: 'The hikes are my favourite part.', submittedAt: '2026-08-07T09:15:00' },
    ],
  };
}
