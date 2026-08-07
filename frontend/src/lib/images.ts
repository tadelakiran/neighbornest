/**
 * Curated royalty-free photography (Unsplash CDN, auto-format + resize + q=60
 * for fast loading). Use these anywhere a hero, feature card, or empty state
 * calls for an image.
 *
 * Every image is fetched lazily by the browser (via LazyImage) and never
 * blocks the initial render. Only images that are actually referenced belong
 * here — unused entries were removed to keep the bundle lean.
 */

/** Appends Unsplash's optimization params to a photo id. */
function unsplash(photoId: string, width = 1200): string {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${width}&q=60`;
}

export const IMAGES = {
  /** Warm community/friends moment — login & register brand panels. */
  community: unsplash('1529156069898-49953e39b3ac', 1400),
  /** City skyline at dusk — dashboard "Find Your Nest" card backdrop. */
  city: unsplash('1477959858617-67f85cf4f1df', 1200),
} as const;
