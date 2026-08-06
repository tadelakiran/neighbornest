import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp,
  Sparkles,
  Zap
} from 'lucide-react';

export interface ReadinessChartsProps {
  data?: Array<{ label: string; value: number; color?: string }>;
  title?: string;
  subtitle?: string;
  className?: string;
}

const defaultChartData = [
  { label: 'Profile Completion', value: 85, color: 'from-indigo-500 to-indigo-600' },
  { label: 'Community Engagement', value: 72, color: 'from-purple-500 to-purple-600' },
  { label: 'Skill Verification', value: 60, color: 'from-pink-500 to-pink-600' },
  { label: 'Local Connections', value: 90, color: 'from-blue-500 to-blue-600' },
  { label: 'Activity Streak', value: 78, color: 'from-emerald-500 to-emerald-600' },
];

export const ReadinessCharts: React.FC<ReadinessChartsProps> = ({
  data = defaultChartData,
  title = "Readiness Analytics & Metrics",
  subtitle = "Real-time breakdown of your community impact and profile progression",
  className = ""
}) => {
  const [activeTab, setActiveTab] = useState<'bars' | 'distribution'>('bars');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className={`w-full ${className}`}
    >
      <Card className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-white/90 via-white/50 dark:from-slate-900/90 dark:via-slate-900/50 backdrop-blur-2xl border border-white/40 dark:border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <BarChart3 className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {title}
              </h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
            <button
              onClick={() => setActiveTab('bars')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                activeTab === 'bars'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> Bar View
            </button>
            <button
              onClick={() => setActiveTab('distribution')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                activeTab === 'distribution'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" /> Distribution
            </button>
          </div>
        </div>

        {/* Chart Content Area */}
        <div className="relative z-10">
          {activeTab === 'bars' ? (
            <div className="space-y-5">
              {data.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  onHoverStart={() => setHoveredIndex(index)}
                  onHoverEnd={() => setHoveredIndex(null)}
                  className="group"
                >
                  <div className="flex justify-between items-center mb-1.5 text-sm">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 group-hover:scale-125 transition-transform" />
                      {item.label}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-full text-xs">
                      {item.value}%
                    </span>
                  </div>

                  <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/60">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                      className={`h-full rounded-full bg-gradient-to-r ${item.color || 'from-indigo-500 to-purple-600'} shadow-lg relative`}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 py-4">
              {data.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.08 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="p-5 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 shadow-lg flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <Zap className="w-4 h-4" />
                    </span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      {item.value}%
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">
                      {item.label}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Status optimized for maximum performance.
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Summary Bar */}
        <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 relative z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Metrics update in real-time based on activity</span>
          </div>
          <div className="font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-xl border border-indigo-200 dark:border-indigo-800/50">
            Overall Health: 94.2% Optimal
          </div>
        </div>
      </Card>
    </motion.div>
  );
};