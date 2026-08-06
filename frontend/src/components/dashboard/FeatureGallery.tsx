import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { 
  Sparkles, 
  Compass, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Globe
} from 'lucide-react';

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  category: string;
  stats?: string;
}

export interface FeatureGalleryProps {
  features?: FeatureItem[];
  title?: string;
  subtitle?: string;
  className?: string;
}

const defaultFeatures: FeatureItem[] = [
  {
    id: '1',
    title: 'Smart Neighborhood Matching',
    description: 'Connect instantly with verified locals who share your exact passions, professional goals, and hobbies.',
    icon: <Compass className="w-6 h-6 text-indigo-500" />,
    badge: 'Popular',
    category: 'Discovery',
    stats: '98% Match Rate'
  },
  {
    id: '2',
    title: 'Community Anchor Verification',
    description: 'Trusted community leaders and verified hosts ensure a secure, welcoming, and high-quality local experience.',
    icon: <ShieldCheck className="w-6 h-6 text-purple-500" />,
    badge: 'Secure',
    category: 'Safety',
    stats: '100% Verified'
  },
  {
    id: '3',
    title: 'Instant Activity Scheduling',
    description: 'Plan meetups, coffee chats, and collaborative workshops in seconds with intelligent scheduling tools.',
    icon: <Zap className="w-6 h-6 text-pink-500" />,
    badge: 'Fast',
    category: 'Productivity',
    stats: '2x Faster'
  },
  {
    id: '4',
    title: 'Global Circle Sync',
    description: 'Expand your network across multiple neighborhoods with seamless multi-circle synchronization and updates.',
    icon: <Globe className="w-6 h-6 text-blue-500" />,
    badge: 'New',
    category: 'Expansion',
    stats: 'Global Access'
  },
];

export const FeatureGallery: React.FC<FeatureGalleryProps> = ({
  features = defaultFeatures,
  title = "Platform Capabilities",
  subtitle = "Discover the advanced tools designed to elevate your local community experience",
  className = ""
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const categories = ['All', ...Array.from(new Set(features.map(f => f.category)))];
  const filteredFeatures = selectedCategory === 'All' 
    ? features 
    : features.filter(f => f.category === selectedCategory);

  return (
    <div className={`w-full ${className}`}>
      {/* Header & Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800/50 inline-flex items-center gap-1.5 mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Feature Suite
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            {subtitle}
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Cards Grid */}
      <motion.div 
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <AnimatePresence>
          {filteredFeatures.map((feature, index) => (
            <motion.div
              layout
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, delay: index * 0.08 }}
              onHoverStart={() => setHoveredCard(feature.id)}
              onHoverEnd={() => setHoveredCard(null)}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
            >
              <Card className="h-full p-6 rounded-3xl bg-gradient-to-br from-white/90 via-white/40 dark:from-slate-900/90 dark:via-slate-900/40 backdrop-blur-xl border border-white/40 dark:border-slate-800 shadow-xl flex flex-col justify-between relative overflow-hidden group">
                {/* Glow effect on hover */}
                <div className="absolute -right-12 -bottom-12 w-36 h-36 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-500/30 transition-all duration-500 pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="p-3 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/50">
                      {feature.icon}
                    </div>
                    {feature.badge && (
                      <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-800/50">
                        {feature.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg">
                    {feature.stats}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};