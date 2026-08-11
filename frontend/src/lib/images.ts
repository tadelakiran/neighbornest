/**
 * Curated royalty-free photography (Unsplash CDN, auto-format + resize + q=70
 * for crisp loading). Use these anywhere a hero, feature card, or empty state
 * calls for an image — they give the app a premium, human feel.
 *
 * Every image is fetched lazily by the browser (via LazyImage) and never
 * blocks the initial render. Only images that are actually referenced belong
 * here — unused entries were removed to keep the bundle lean.
 */

/** Appends Unsplash's optimization params to a photo id. */
function unsplash(photoId: string, width = 1200): string {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${width}&q=70`;
}

export const IMAGES = {
  /** Warm community/friends moment — login & register brand panels. */
  community: unsplash('1529156069898-49953e39b3ac', 1600),
  /** City skyline at dusk — dashboard "Find Your Nest" card backdrop. */
  city: unsplash('1477959858617-67f85cf4f1df', 1200),
  /** Coffee-shop meetup — Discover empty state (people getting to know each other). */
  coffee: unsplash('1543269865-cbf427effbad', 1200),
  /** Friends laughing together on a couch — "your people" energy. */
  friends: unsplash('1517486808906-6ca8b3f04846', 1200),
  /** Group of friends outdoors — Nests empty state. */
  park: unsplash('1528605248644-14dd04022da1', 1200),
  /** Dinner/event with people — Proposals empty state. */
  dinner: unsplash('1529333166437-7750a6dd5a70', 1200),
  /** Friends walking the city — general community motion. */
  walking: unsplash('1477281765962-ef34e8bb0967', 1200),
  /** Cozy apartment interior — "home" feeling (Anchor application banner). */
  home: unsplash('1522708323590-d24dbb6b0267', 1200),
} as const;
