import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { LazyImage } from '@/components/ui/LazyImage';
import { IMAGES } from '@/lib/images';

const FEATURES = [
  { title: 'Marketplace',    description: 'Buy, sell, and swap with neighbors you trust.',   image: IMAGES.marketplace },
  { title: 'Events',         description: 'City meetups, dinners, and neighborhood hangouts.',image: IMAGES.events      },
  { title: 'Lost & Found',   description: 'Find your keys — and the person who found them.',  image: IMAGES.lostFound   },
  { title: 'Local Services', description: 'Vetted local pros recommended by your Nest.',     image: IMAGES.services    },
];

export function FeatureGallery() {
  return (
    <section aria-label="Coming soon features">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
          Explore NeighborNest
        </h3>
        <Badge variant="info">Coming soon</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {FEATURES.map(({ title, description, image }, i) => (
          <motion.article
            key={title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-card"
          >
            <LazyImage
              src={image}
              alt={title}
              aspectRatio="4/3"
              placeholder="blur"
              wrapperClassName="absolute inset-0"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-accent-950/85 via-accent-900/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <h4 className="text-sm font-bold text-white">{title}</h4>
              <p className="mt-1 text-xs leading-relaxed text-blue-100/80">{description}</p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
