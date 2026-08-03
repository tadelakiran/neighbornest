import { Badge } from '@/components/ui/Badge';
import { IMAGES } from '@/lib/images';

/** Upcoming modules previewed with optimized photography. */
const FEATURES = [
  {
    title: 'Marketplace',
    description: 'Buy, sell, and swap with neighbors you trust.',
    image: IMAGES.marketplace,
  },
  {
    title: 'Events',
    description: 'City meetups, dinners, and neighborhood hangouts.',
    image: IMAGES.events,
  },
  {
    title: 'Lost & Found',
    description: 'Find your keys — and the person who found them.',
    image: IMAGES.lostFound,
  },
  {
    title: 'Local Services',
    description: 'Vetted local pros recommended by your Nest.',
    image: IMAGES.services,
  },
];

/**
 * Feature gallery — the roadmap for Modules 4-5 presented as a polished photo
 * grid. Images are lazily loaded and CDN-optimized (auto=format&q=60).
 */
export function FeatureGallery() {
  return (
    <section aria-label="Coming soon features">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Explore NeighborNest</h3>
        <Badge variant="info">Coming soon</Badge>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {FEATURES.map(({ title, description, image }) => (
          <article
            key={title}
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/60"
          >
            <img
              src={image}
              alt={title}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <h4 className="text-sm font-bold text-white">{title}</h4>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">{description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
