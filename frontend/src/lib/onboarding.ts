import type {
  OnboardingAnswer,
  OnboardingData,
  PersonalityType,
  SchedulePreference,
  SocialGoal,
  BudgetLevel,
  WorkType,
} from '@/types/user.types';

/** Labels for each onboarding step (drives the StepIndicator). */
export const ONBOARDING_STEP_LABELS = [
  'Welcome',
  'Basic Info',
  'Personality',
  'Interests',
  'Lifestyle',
  'Review',
  'Done',
] as const;

/** A single 1-5 rated values question; the rating doubles as the match weight. */
export interface ValueQuestion {
  key: string;
  label: string;
  prompt: string;
}

/** Values questions submitted as `values_*` answers (weight = user rating). */
export const VALUE_QUESTIONS: ValueQuestion[] = [
  {
    key: 'values_adventure',
    label: 'Adventure',
    prompt: 'I love spontaneous plans and trying new things.',
  },
  {
    key: 'values_structure',
    label: 'Structure',
    prompt: 'I thrive on routine and planning ahead.',
  },
  {
    key: 'values_homebody',
    label: 'Homebody',
    prompt: 'I prefer a quiet night in over a big night out.',
  },
];

/** Curated interest tags submitted as `interest_<slug>` answers. */
export interface InterestOption {
  label: string;
  slug: string;
}

export const INTEREST_OPTIONS: InterestOption[] = [
  { label: 'Hiking', slug: 'hiking' },
  { label: 'Cooking', slug: 'cooking' },
  { label: 'Gaming', slug: 'gaming' },
  { label: 'Photography', slug: 'photography' },
  { label: 'Yoga & Fitness', slug: 'yoga_fitness' },
  { label: 'Board Games', slug: 'board_games' },
  { label: 'Live Music', slug: 'live_music' },
  { label: 'Art & Museums', slug: 'art_museums' },
  { label: 'Running', slug: 'running' },
  { label: 'Books & Reading', slug: 'books' },
  { label: 'Travel', slug: 'travel' },
  { label: 'Coffee & Cafés', slug: 'coffee' },
  { label: 'Dancing', slug: 'dancing' },
  { label: 'Volunteering', slug: 'volunteering' },
  { label: 'Cinema', slug: 'cinema' },
  { label: 'Pets & Animals', slug: 'pets' },
  { label: 'Tech & Startups', slug: 'tech' },
  { label: 'Foodie', slug: 'foodie' },
];

/** Personality options with copy for the StepCards. */
export const PERSONALITY_OPTIONS: { value: PersonalityType; label: string; description: string }[] = [
  { value: 'INTROVERT', label: 'Introvert', description: 'I recharge with quiet time and small groups.' },
  { value: 'AMBIVERT', label: 'Ambivert', description: 'I enjoy both social buzz and quiet corners.' },
  { value: 'EXTROVERT', label: 'Extrovert', description: 'I get energy from people and new experiences.' },
];

/** Work-type options for the StepCards and profile selects. */
export const WORK_TYPE_OPTIONS: { value: WorkType; label: string; description?: string }[] = [
  { value: 'FULL_TIME', label: 'Full-time', description: 'Classic 9-to-5 rhythm' },
  { value: 'PART_TIME', label: 'Part-time', description: 'Flexible, fewer hours' },
  { value: 'STUDENT', label: 'Student', description: 'Campus life and deadlines' },
  { value: 'FREELANCE', label: 'Freelance', description: 'Self-directed schedule' },
  { value: 'RETIRED', label: 'Retired', description: 'Days are yours' },
  { value: 'UNEMPLOYED', label: 'Searching', description: 'Open to new routines' },
];

/** Schedule preference options for the Select dropdown. */
export const SCHEDULE_OPTIONS: { value: SchedulePreference; label: string }[] = [
  { value: 'EARLY_BIRD', label: 'Early bird — up with the sun' },
  { value: 'MORNING', label: 'Morning person' },
  { value: 'FLEXIBLE', label: 'Flexible — it depends' },
  { value: 'EVENING', label: 'Evening person' },
  { value: 'NIGHT_OWL', label: 'Night owl — late hours' },
];

/** Social goal options for the Select dropdown. */
export const SOCIAL_GOAL_OPTIONS: { value: SocialGoal; label: string }[] = [
  { value: 'FRIENDSHIP', label: 'Make genuine friends' },
  { value: 'NETWORKING', label: 'Grow my professional network' },
  { value: 'MENTORSHIP', label: 'Learn from locals' },
  { value: 'HOUSING_MATE', label: 'Find compatible housemates' },
  { value: 'COMMUNITY', label: 'Feel part of a community' },
];

/** Budget level options for the Select dropdown. */
export const BUDGET_OPTIONS: { value: BudgetLevel; label: string }[] = [
  { value: 'LOW', label: 'Budget-conscious' },
  { value: 'MEDIUM', label: 'Comfortable middle' },
  { value: 'HIGH', label: 'High spend' },
];

/** Default (empty) draft — used to seed the wizard and localStorage drafts. */
export const ONBOARDING_DATA_DEFAULTS: OnboardingData = {
  fullName: '',
  city: '',
  neighborhood: '',
  yearsInCity: 0,
  occupation: '',
  personalityType: null,
  values: Object.fromEntries(VALUE_QUESTIONS.map((q) => [q.key, 3])) as Record<string, number>,
  interests: [],
  workType: null,
  schedulePreference: null,
  socialGoal: null,
  budgetLevel: null,
};

/**
 * Resolves a human-readable label for an enum value from an option list.
 *
 * @param options - option list (value -> label)
 * @param value - the raw enum value, or null/undefined
 * @returns the label, or "—" when not found
 */
export function enumLabel(
  options: { value: string; label: string }[],
  value: string | null | undefined
): string {
  return options.find((option) => option.value === value)?.label ?? '—';
}

/**
 * Normalizes free text into a URL/key-safe slug (used for interest answer keys).
 *
 * @param value - raw label, e.g. "Art & Museums"
 * @returns a slug, e.g. "art_museums"
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Builds the `answers` payload for `POST /api/users/onboarding` from the wizard
 * draft: `values_*` answers carry the user's 1-5 rating as the weight, and each
 * selected interest becomes an `interest_<slug>` answer.
 *
 * @param data - the wizard draft
 * @returns answers ready to submit
 */
export function buildOnboardingAnswers(data: OnboardingData): OnboardingAnswer[] {
  const values: OnboardingAnswer[] = VALUE_QUESTIONS.map((q) => ({
    questionKey: q.key,
    answerValue: String(data.values[q.key] ?? 3),
    weight: data.values[q.key] ?? 3,
  }));

  const interests: OnboardingAnswer[] = data.interests.map((label) => ({
    questionKey: `interest_${slugify(label)}`,
    answerValue: label,
    weight: 2,
  }));

  return [...values, ...interests];
}
