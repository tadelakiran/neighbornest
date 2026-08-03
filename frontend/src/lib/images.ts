/**
 * Curated royalty-free photography (Unsplash CDN, auto-format + resize + q=60
 * for fast loading). Use these instead of placeholder gradients anywhere a
 * hero, feature card, or empty state calls for an image.
 *
 * Keep them few and small: every image is fetched lazily by the browser and
 * never blocks the initial render.
 */

/** Appends Unsplash's optimization params to a photo id. */
function unsplash(photoId: string, width = 1200): string {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${width}&q=60`;
}

export const IMAGES = {
  /** City skyline / neighborhood at dusk — login panel. */
  city: unsplash('1477959858617-67f85cf4f1df', 1400),
  /** Quiet residential street at dusk — register panel. */
  neighborhood: unsplash('1449824913935-59a10b8d2000', 1400),
  /** Warm community/friends moment. */
  community: unsplash('1529156069898-49953e39b3ac', 1200),
  /** Friends collaborating — used on the dashboard welcome strip. */
  friends: unsplash('1543269865-cbf427effbad', 1200),
  /** Modern family home. */
  home: unsplash('1568605114967-8130f3a36994', 1200),
  /** Cozy apartment interior. */
  apartment: unsplash('1522708323590-d24dbb6b0267', 1200),
  /** House exterior with warm light. */
  homeExterior: unsplash('1580587771525-78b9dba3b914', 1200),
  /** Celebration / event sparklers. */
  events: unsplash('1492684223066-81342ee5ff30', 1200),
  /** Festive gathering balloons. */
  gathering: unsplash('1511578314322-379afb476865', 1200),
  /** Market stalls — marketplace feature card. */
  marketplace: unsplash('1472851294608-062f824d29cc', 1200),
  /** Keys — lost & found feature card. */
  lostFound: unsplash('1586769852836-bc069f19e1b6', 1200),
  /** Handshake — local services feature card. */
  services: unsplash('1600880292203-757bb62b4baf', 1200),
  /** Security camera — safety feature card. */
  security: unsplash('1563013544-824ae1b704d3', 1200),
  /** Kitchen — home-cooked moments. */
  cooking: unsplash('1556910103-1c02745aae4d', 1200),
} as const;
