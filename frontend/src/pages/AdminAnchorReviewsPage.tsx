import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BadgeCheck, 
  ClipboardCheck, 
  Inbox, 
  MapPin, 
  ShieldCheck, 
  XCircle,
  Clock,
  MessageSquare
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/useToast';
import { cn, formatDate, getErrorMessage } from '@/lib/utils';
import { userService } from '@/services/userService';
import { ROUTES } from '@/lib/constants';
import type { AnchorApplication, AnchorReviewDecision } from '@/types/user.types';

type StatusFilter = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';

const FILTERS: Array<{ value: StatusFilter; label: string; icon: React.ElementType }> = [
  { value: 'PENDING', label: 'Pending', icon: Clock },
  { value: 'APPROVED', label: 'Approved', icon: BadgeCheck },
  { value: 'REJECTED', label: 'Rejected', icon: XCircle },
  { value: 'ALL', label: 'All', icon: ShieldCheck },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }
  }),
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
};

export function AdminAnchorReviewsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const role = useAuthStore((state) => state.user?.role);

  const [filter, setFilter] = useState<StatusFilter>('PENDING');
  const [applications, setApplications] = useState<AnchorApplication[] | null>(null);
  const [reviewTarget, setReviewTarget] = useState<AnchorApplication | null>(null);
  const [reviewDecision, setReviewDecision] = useState<AnchorReviewDecision>('APPROVE');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (role && role !== 'ADMIN') navigate(ROUTES.DASHBOARD, { replace: true });
  }, [role, navigate]);

  const load = useCallback(() => {
    userService
      .listAnchorApplications(filter === 'ALL' ? undefined : filter)
      .then(setApplications)
      .catch(() => setApplications([]));
  }, [filter]);

  useEffect(() => {
    setApplications(null);
    load();
  }, [load]);

  const handleReview = async () => {
    if (!reviewTarget) return;
    setSubmitting(true);
    try {
      const updated = await userService.reviewAnchorApplication(
        reviewTarget.id,
        reviewDecision,
        note.trim() || undefined
      );
      toast.success(
        reviewDecision === 'APPROVE'
          ? `${updated.fullName ?? 'Applicant'} is now an Anchor!`
          : 'Application rejected.'
      );
      setReviewTarget(null);
      setNote('');
      load();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not review the application.'));
    } finally {
      setSubmitting(false);
    }
  };

  const openReview = (application: AnchorApplication, decision: AnchorReviewDecision) => {
    setReviewTarget(application);
    setReviewDecision(decision);
    setNote('');
  };

  const pendingCount = filter === 'PENDING' && applications ? applications.length : undefined;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-400/10 shadow-glow-sm">
              <ShieldCheck className="h-5 w-5 text-accent-400" />
            </span>
            <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl">
              Anchor Reviews
            </h1>
          </div>
          <p className="max-w-lg text-sm leading-relaxed text-[var(--text-secondary)]">
            Review newcomer applications. Approving upgrades their role to Anchor automatically — 
            they can then be assigned to Nests on Discover.
          </p>
        </div>
        
        {pendingCount !== undefined && pendingCount > 0 && (
          <motion.span 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-2 rounded-full bg-accent-400/10 px-4 py-2 text-sm font-semibold text-accent-400 shadow-glow-sm ring-1 ring-accent-400/20"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent-400" />
            {pendingCount} pending
          </motion.span>
        )}
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              'group relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300',
              filter === value
                ? 'text-accent-300'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            )}
          >
            {filter === value && (
              <motion.div
                layoutId="activeFilter"
                className="absolute inset-0 rounded-xl bg-accent-400/10 ring-1 ring-accent-400/25"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <Icon className="relative z-10 h-4 w-4" />
            <span className="relative z-10">{label}</span>
          </button>
        ))}
      </div>

      {/* List */}
      <AnimatePresence mode="wait">
        {applications === null ? (
          <motion.div 
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-48 rounded-lg" />
                    <Skeleton className="h-4 w-32 rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        ) : applications.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="flex flex-col items-center gap-4 border-dashed border-[var(--border-hover)] bg-[var(--surface)]/50 p-16 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-400/5 ring-1 ring-accent-400/10">
                <Inbox className="h-8 w-8 text-[var(--text-muted)]" />
              </span>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-[var(--text-primary)]">Nothing here yet</p>
                <p className="max-w-sm text-sm text-[var(--text-muted)]">
                  No {filter === 'ALL' ? '' : `${filter.toLowerCase()} `}anchor applications right now. 
                  New submissions will appear here automatically.
                </p>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-3"
          >
            {applications.map((application, i) => (
              <ApplicationCard
                key={application.id}
                application={application}
                index={i}
                onApprove={() => openReview(application, 'APPROVE')}
                onReject={() => openReview(application, 'REJECT')}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <Modal
        open={reviewTarget !== null}
        onClose={() => !submitting && setReviewTarget(null)}
        title={reviewDecision === 'APPROVE' ? 'Approve Application' : 'Reject Application'}
        maxWidth="max-w-lg"
      >
        <AnimatePresence>
          {reviewTarget && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Applicant Preview */}
              <div className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-4 backdrop-blur-sm">
                <Avatar 
                  name={reviewTarget.fullName ?? `User ${reviewTarget.userProfileId}`} 
                  size="lg" 
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-[var(--text-primary)]">
                    {reviewTarget.fullName ?? `User #${reviewTarget.userProfileId}`}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {reviewTarget.yearsInCity} yrs in city
                    </span>
                    <span>·</span>
                    <span>{formatDate(reviewTarget.appliedAt)}</span>
                  </div>
                </div>
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl',
                  reviewDecision === 'APPROVE' ? 'bg-sky-500/10 text-sky-400' : 'bg-royal-500/10 text-royal-400'
                )}>
                  {reviewDecision === 'APPROVE' ? (
                    <BadgeCheck className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                </div>
              </div>

              {/* Note Input */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                  <MessageSquare className="h-4 w-4 text-[var(--text-muted)]" />
                  Review note <span className="text-[var(--text-muted)]">(optional)</span>
                </label>
                <Textarea
                  placeholder={reviewDecision === 'APPROVE' 
                    ? "e.g. Strong local knowledge and great communication skills" 
                    : "e.g. Not enough experience in the area yet"}
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={submitting}
                  className="resize-none rounded-xl border-[var(--border)] bg-[var(--surface-2)]/50 focus:border-accent-400/50 focus:ring-accent-400/20"
                />
              </div>

              {/* Info Box */}
              <div className={cn(
                'rounded-xl border p-4 text-xs leading-relaxed',
                reviewDecision === 'APPROVE' 
                  ? 'border-sky-500/20 bg-sky-500/5 text-sky-300/80'
                  : 'border-royal-500/20 bg-royal-500/5 text-royal-300/80'
              )}>
                {reviewDecision === 'APPROVE'
                  ? 'This action will immediately upgrade the applicant to the ANCHOR role and grant them access to Nest management features.'
                  : 'The applicant will remain a NEWCOMER and can re-apply after 30 days. They will be notified of your decision.'}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  variant="ghost" 
                  onClick={() => setReviewTarget(null)} 
                  disabled={submitting}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  isLoading={submitting}
                  onClick={() => void handleReview()}
                  className={cn(
                    'rounded-xl px-6',
                    reviewDecision === 'APPROVE' 
                      ? 'bg-sky-500/90 text-white hover:bg-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.2)]'
                      : 'bg-royal-600/90 text-white hover:bg-royal-600 shadow-[0_0_20px_rgba(37,99,235,0.2)]'
                  )}
                >
                  {submitting ? 'Saving…' : reviewDecision === 'APPROVE' ? 'Approve & Promote' : 'Reject Application'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>
    </div>
  );
}

function ApplicationCard({
  application,
  index,
  onApprove,
  onReject,
}: {
  application: AnchorApplication;
  index: number;
  onApprove: () => void;
  onReject: () => void;
}) {
  const pending = application.status === 'PENDING';

  return (
    <motion.div
      variants={cardVariants}
      custom={index}
      layout
      className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] transition-all duration-300 hover:border-[var(--border-hover)] hover:shadow-lg hover:shadow-black/20"
    >
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {/* Header Row */}
          <div className="flex flex-wrap items-center gap-3">
            <Avatar 
              name={application.fullName ?? `User ${application.userProfileId}`} 
              size="md" 
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                  {application.fullName ?? `User #${application.userProfileId}`}
                </p>
                <StatusBadge status={application.status} />
              </div>
              <p className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <MapPin className="h-3 w-3" />
                {application.yearsInCity} years in the city
                <span className="text-[var(--border-hover)]">·</span>
                applied {formatDate(application.appliedAt)}
              </p>
            </div>
          </div>

          {/* Experience */}
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            {application.experience}
          </p>

          {/* Meta Tags */}
          <div className="flex flex-wrap gap-2">
            {application.neighborhoodsKnown && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--surface-2)] px-3 py-1.5 text-xs text-[var(--text-secondary)] ring-1 ring-[var(--border)]">
                <span className="font-medium text-[var(--text-primary)]">Neighborhoods:</span>
                {application.neighborhoodsKnown}
              </span>
            )}
            {application.languagesSpoken && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--surface-2)] px-3 py-1.5 text-xs text-[var(--text-secondary)] ring-1 ring-[var(--border)]">
                <span className="font-medium text-[var(--text-primary)]">Languages:</span>
                {application.languagesSpoken}
              </span>
            )}
            {application.availability && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--surface-2)] px-3 py-1.5 text-xs text-[var(--text-secondary)] ring-1 ring-[var(--border)]">
                <span className="font-medium text-[var(--text-primary)]">Availability:</span>
                {application.availability}
              </span>
            )}
          </div>

          {/* Review Note */}
          {application.reviewNote && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-3">
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                <span className="font-semibold text-[var(--text-primary)]">Review note:</span>{' '}
                {application.reviewNote}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        {pending && (
          <div className="flex shrink-0 gap-2 sm:flex-col">
            <Button 
              size="sm" 
              onClick={onApprove}
              className="group/btn rounded-xl bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20 hover:bg-sky-500 hover:text-white hover:shadow-[0_0_16px_rgba(14,165,233,0.3)] transition-all duration-300"
            >
              <BadgeCheck className="mr-1.5 h-4 w-4" />
              Approve
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onReject}
              className="rounded-xl border-royal-500/20 text-royal-400 hover:bg-royal-500/10 hover:text-royal-300 transition-all duration-300"
            >
              <XCircle className="mr-1.5 h-4 w-4" />
              Reject
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: AnchorApplication['status'] }) {
  const config = {
    PENDING: {
      className: 'border-warning/30 bg-warning/10 text-warning',
      icon: <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-warning" />,
    },
    APPROVED: {
      className: 'border-sky-500/20 bg-sky-500/10 text-sky-400',
      icon: <BadgeCheck className="h-3 w-3" />,
    },
    REJECTED: {
      className: 'border-royal-500/20 bg-royal-500/10 text-royal-400',
      icon: <XCircle className="h-3 w-3" />,
    },
  };

  const { className, icon } = config[status];

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
      className
    )}>
      {icon}
      {status}
    </span>
  );
}

export const ADMIN_REVIEWS_ICON = ClipboardCheck;