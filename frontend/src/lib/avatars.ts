/**
 * Deterministic "realistic" portrait avatars.
 *
 * The matching-service doesn't send profile photos for proposal members and
 * often not for matches either, so without a fallback every avatar collapses
 * to initials. To keep the dashboard human, we map a stable seed (the user id,
 * or a name when no id exists) to a curated portrait from the same Unsplash
 * CDN that `images.ts` uses. Same seed → same face, so a person never changes
 * across reloads — and a real photo always wins when one is provided.
 */

const PORTRAIT_PHOTOS = [
  '1494790108377-be9c29b29330', // woman, warm smile
  '1507003211169-0a1dd7228f2d', // man, neutral portrait
  '1500648767791-00dcc994a43e', // man, short hair
  '1438761681033-6461ffad8d80', // woman, long hair
  '1472099645785-5658abf4ff4e', // man, blazer
  '1544005313-94ddf0286df2',    // woman, friendly
  '1534528741775-53994a69daeb', // woman, portrait
  '1506794778202-cad84cf45f1d', // man, stubble
  '1531123897727-8f129e1688ce', // woman, glasses
  '1527980962730-13f73d8f09dc', // man, sunglasses
] as const;

/** Small deterministic hash so any string/number seed maps to a stable index. */
function hashSeed(seed: string | number): number {
  const str = String(seed);
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Returns a stable, realistic portrait URL for a user id (or name). Use as a
 * fallback whenever a profile photo is missing:
 *
 *   src={member.profilePhotoUrl ?? portraitFor(member.userId)}
 */
export function portraitFor(seed: string | number): string {
  const photo = PORTRAIT_PHOTOS[hashSeed(seed) % PORTRAIT_PHOTOS.length];
  return `https://images.unsplash.com/photo-${photo}?auto=format&fit=facearea&facepad=2&w=160&q=70`;
}
