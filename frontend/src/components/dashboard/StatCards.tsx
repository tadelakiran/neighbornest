import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { 
  UserCheck, 
  Sparkles, 
  ShieldCheck, 
  Compass, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Award
} from 'lucide-react';

export interface UserProfile {
  id?: string;
  fullName?: string;
  role?: string;
  city?: string;
  bio?: string;
  onboardingAnswers?: Array<{ questionId: string; answer: string }>;
  interests?: string[];
  createdAt?: string;
}

export interface StatCardsProps {
  profile: UserProfile;
  className?: string;
}

export function computeReadiness(profile: UserProfile): { score: number; hints: string[] } {
  let score = 20; // Base score
  const hints: string[] = [];

  if (profile.fullName && profile.fullName.trim().length > 1) {
    score += 15;
  } else {
    hints.push("Add your full name");
  }

  if (profile.city && profile.city.trim().length > 1) {
    score += 20;
  } else {
    hints.push("Set your current neighborhood or city");
  }

  if (profile.bio && profile.bio.trim().length > 10) {
    score += 15;
  } else {
    hints.push("Write a short intro bio");
  }

  const interestsCount = (profile.interests?.length ?? 0) + 
    (profile.onboardingAnswers?.filter(a => a.questionId.startsWith('interest_')).length ?? 0);
  
  if (interestsCount >= 3) {
    score += 30;
  } else if (interestsCount > 0) {
    score += 15;
    hints.push(`Add ${3 - interestsCount} more interests for higher matching`);
  } else {
    hints.push("Tag your key interests");
  }

  const finalScore = Math.min(score, 100);
  return { score: finalScore, hints };
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 25 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

export const StatCards: React.FC<StatCardsProps> = ({ profile, className = "" }) => {
  const { score, hints } = computeReadiness(profile);
  const roleDisplay = profile.role === 'ANCHOR' ? 'Community Anchor' : profile.role === 'ADMIN' ? 'Administrator' : 'Explorer Member';
  const roleIcon = profile.role === 'ANCHOR' ? <ShieldCheck className="w-5 h-5 text-indigo-400" /> : <Compass className="w-5 h-5 text-purple-400" />;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 ${className}`}
    >
      {/* Card 1: Readiness Score */}
      <motion.div variants={cardVariants} whileHover={{ y: -6, transition: { duration: 0.2 } }}>
        <Card className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-white/80 via-white/40 dark:from-slate-900/80 dark:via-slate-900/40 backdrop-blur-xl border border-white/40 dark:border-slate-700/60 shadow-xl group">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-500/30 transition-all duration-500" />
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800/50 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Nest Readiness
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2 my-2">
            <span className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              {score}%
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center">
              {score >= 80 ? 'Optimized' : 'In Progress'}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full"
            />
          </div>

          <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
            {hints.length > 0 ? hints[0] : 'Profile fully completed and verified!'}
          </p>
        </Card>
      </motion.div>

      {/* Card 2: Role & Status */}
      <motion.div variants={cardVariants} whileHover={{ y: -6, transition: { duration: 0.2 } }}>
        <Card className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-white/80 via-white/40 dark:from-slate-900/80 dark:via-slate-900/40 backdrop-blur-xl border border-white/40 dark:border-slate-700/60 shadow-xl group">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-2xl group-hover:bg-purple-500/30 transition-all duration-500" />
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-800/50 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> Membership Tier
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-300">
              {roleIcon}
            </div>
          </div>

          <div className="my-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate">
              {roleDisplay}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {profile.role === 'ANCHOR' ? 'Trusted community host & guide' : 'Active participant in local circles'}
            </p>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/50">
              <CheckCircle2 className="w-3 h-3" /> Active Status
            </span>
          </div>
        </Card>
      </motion.div>

      {/* Card 3: Location / Neighborhood */}
      <motion.div variants={cardVariants} whileHover={{ y: -6, transition: { duration: 0.2 } }}>
        <Card className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-white/80 via-white/40 dark:from-slate-900/80 dark:via-slate-900/40 backdrop-blur-xl border border-white/40 dark:border-slate-700/60 shadow-xl group">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-pink-500/10 dark:bg-pink-500/20 rounded-full blur-2xl group-hover:bg-pink-500/30 transition-all duration-500" />
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/60 px-2.5 py-1 rounded-full border border-pink-200 dark:border-pink-800/50 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Base Location
            </span>
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-300">
              <MapPin className="w-5 h-5" />
            </div>
          </div>

          <div className="my-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate">
              {profile.city || 'Location not set'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {profile.city ? 'Primary local community hub' : 'Update your profile to connect locally'}
            </p>
          </div>

          <div className="mt-4 flex items-center gap-2">
            {profile.city ? (
              <span className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                Verified Region
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200/60">
                <AlertCircle className="w-3 h-3" /> Action Required
              </span>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Card 4: Interests & Verification */}
      <motion.div variants={cardVariants} whileHover={{ y: -6, transition: { duration: 0.2 } }}>
        <Card className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-white/80 via-white/40 dark:from-slate-900/80 dark:via-slate-900/40 backdrop-blur-xl border border-white/40 dark:border-slate-700/60 shadow-xl group">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/30 transition-all duration-500" />
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800/50 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" /> Identity & Trust
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="my-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {profile.fullName ? 'Profile Verified' : 'Standard Account'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {profile.interests?.length ? `${profile.interests.length} interests tagged` : 'No interests added yet'}
            </p>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200/60">
              Secure Connection
            </span>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};