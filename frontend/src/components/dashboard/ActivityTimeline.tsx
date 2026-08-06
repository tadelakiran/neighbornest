import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { 

  MapPin,
  Activity
} from 'lucide-react';

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  category: 'profile' | 'community' | 'event' | 'system';
  status?: 'completed' | 'in_progress' | 'pending';
  location?: string;
}

export interface ActivityTimelineProps {
  events?: TimelineEvent[];
  title?: string;
  subtitle?: string;
  className?: string;
}

const defaultEvents: TimelineEvent[] = [
  {
    id: '1',
    title: 'Community Anchor Status Verified',
    description: 'Your profile has been fully reviewed and endorsed by regional moderators.',
    timestamp: '2 hours ago',
    category: 'profile',
    status: 'completed',
    location: 'Downtown District'
  },
  {
    id: '2',
    title: 'Neighborhood Meetup Scheduled',
    description: 'Hosted the weekly founders coffee chat with 14 active local members.',
    timestamp: 'Yesterday at 4:30 PM',
    category: 'event',
    status: 'completed',
    location: 'Central Innovation Hub'
  },
  {
    id: '3',
    title: 'Interests & Skills Updated',
    description: 'Added 5 new tags including AI Development, Urban Farming, and UI Design.',
    timestamp: '3 days ago',
    category: 'profile',
    status: 'completed'
  },
  {
    id: '4',
    title: 'System Security Check',
    description: 'Two-factor authentication and session security successfully verified.',
    timestamp: '5 days ago',
    category: 'system',
    status: 'completed'
  },
];

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  events = defaultEvents,
  title = "Activity & Milestone Timeline",
  subtitle = "Track your historical journey, achievements, and community contributions",
  className = ""
}) => {
  const [filter, setFilter] = useState<string>('all');

  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(e => e.category === filter);

  return (
    <Card className={`p-6 md:p-8 rounded-3xl bg-gradient-to-br from-white/90 via-white/50 dark:from-slate-900/90 dark:via-slate-900/50 backdrop-blur-2xl border border-white/40 dark:border-slate-800 shadow-2xl relative overflow-hidden ${className}`}>
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Activity className="w-5 h-5" />
            </span>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {title}
            </h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
          {['all', 'profile', 'event', 'system'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all duration-300 ${
                filter === cat
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline List */}
      <div className="relative pl-6 md:pl-8 space-y-8 before:absolute before:left-2.5 md:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-purple-500 before:to-slate-200 dark:before:to-slate-800 relative z-10">
        <AnimatePresence>
          {filteredEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="relative group"
            >
              {/* Timeline Dot */}
              <div className="absolute -left-6 md:-left-8 top-1.5 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-500 flex items-center justify-center shadow-lg group-hover:scale-125 transition-transform">
                <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
              </div>

              {/* Event Content Card */}
              <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:border-indigo-500/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {event.title}
                  </h3>
                  <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800/50 self-start sm:self-auto">
                    {event.timestamp}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                  {event.description}
                </p>

                {event.location && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-pink-500" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Card>
  );
}