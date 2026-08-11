import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Construction } from 'lucide-react';
import { NestHero } from '@/components/nest/NestHero';
import { MemberGallery } from '@/components/nest/MemberGallery';
import { MeetingList } from '@/components/nest/MeetingList';
import { ScheduleMeetingModal } from '@/components/nest/ScheduleMeetingModal';
import { ExpenseTracker } from '@/components/nest/ExpenseTracker';
import { AddExpenseModal } from '@/components/nest/AddExpenseModal';
import { VibeCheckCard } from '@/components/nest/VibeCheckCard';
import { VibeCheckResultsModal } from '@/components/nest/VibeCheckResultsModal';
import { NestActions } from '@/components/nest/NestActions';
import { GraduationTracker } from '@/components/nest/GraduationTracker';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/lib/constants';
import { getErrorMessage } from '@/lib/utils';
import {
  cancelMeeting, completeMeeting, disbandNest, getExpenses, getMeetings, getNestById,
  getVibeCheckStatus, graduateNest, invalidateMyNests, leaveNest, settleExpense, submitVibeCheck,
} from '@/services/nestService';
import type {
  ExpenseResponse, MeetingResponse, NestResponse, VibeCheckRequest, VibeCheckStatusResponse,
} from '@/types/nest.types';

/**
 * Nest Hub — the core product page. Hero + member gallery on top, then a bento
 * grid: meetings & expenses (2/3) beside the vibe check, actions and journey
 * tracker (1/3). Every API call degrades to a graceful empty/error state.
 */
export function NestHubPage() {
  const { nestId } = useParams<{ nestId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const currentUserId = user?.id ?? 0;

  const [nest, setNest] = useState<NestResponse | null>(null);
  const [meetings, setMeetings] = useState<MeetingResponse[]>([]);
  const [expenses, setExpenses] = useState<ExpenseResponse[]>([]);
  const [vibe, setVibe] = useState<VibeCheckStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Guards against stale responses overwriting fresh state when the user
  // navigates between nests quickly (the component itself stays mounted).
  const nestIdRef = useRef<string | null>(nestId ?? null);
  useEffect(() => {
    nestIdRef.current = nestId ?? null;
  }, [nestId]);
  const isCurrent = useCallback((id: string) => nestIdRef.current === id, []);

  const refreshVibe = useCallback(
    async (id: string) => {
      try {
        const status = await getVibeCheckStatus(id);
        if (isCurrent(id)) setVibe(status);
      } catch {
        if (isCurrent(id)) setVibe(null);
      }
    },
    [isCurrent]
  );

  const load = useCallback(
    async (id: string) => {
      setLoading(true);
      setNotFound(false);
      try {
        const n = await getNestById(id);
        if (!isCurrent(id)) return;
        setNest(n);
        void getMeetings(id)
          .then((ms) => isCurrent(id) && setMeetings(ms))
          .catch(() => isCurrent(id) && setMeetings([]));
        void getExpenses(id)
          .then((es) => isCurrent(id) && setExpenses(es))
          .catch(() => isCurrent(id) && setExpenses([]));
        if (n.status === 'VIBE_CHECK') void refreshVibe(id);
      } catch {
        if (isCurrent(id)) setNotFound(true);
      } finally {
        if (isCurrent(id)) setLoading(false);
      }
    },
    [refreshVibe, isCurrent]
  );

  useEffect(() => {
    if (nestId) void load(nestId);
  }, [nestId, load]);

  const isAnchor = nest?.members.some((m) => m.userId === currentUserId && m.roleInNest === 'ANCHOR') ?? false;
  const activeMembers = nest?.members.filter((m) => m.status === 'ACCEPTED') ?? [];

  // ── Handlers ──
  const handleScheduled = (meeting: MeetingResponse) => {
    setShowSchedule(false);
    setMeetings((prev) => [meeting, ...prev]);
  };
  const handleAddedExpense = (expense: ExpenseResponse) => {
    setShowAddExpense(false);
    setExpenses((prev) => [expense, ...prev]);
  };
  const handleSettle = useCallback(
    async (expenseId: number) => {
      if (!nestId) return;
      try {
        const updated = await settleExpense(nestId, expenseId);
        setExpenses((prev) => prev.map((e) => (e.id === expenseId ? updated : e)));
      } catch (error) {
        toast.error(getErrorMessage(error, 'Could not settle that expense.'));
      }
    },
    [nestId, toast]
  );
  const handleMeetingStatus = useCallback(
    async (meetingId: number, action: 'complete' | 'cancel') => {
      if (!nestId) return;
      try {
        const updated = action === 'complete' ? await completeMeeting(nestId, meetingId) : await cancelMeeting(nestId, meetingId);
        setMeetings((prev) => prev.map((m) => (m.id === meetingId ? updated : m)));
        toast.success(action === 'complete' ? 'Meeting marked as done!' : 'Meeting cancelled.');
      } catch (error) {
        toast.error(getErrorMessage(error, 'Could not update the meeting.'));
      }
    },
    [nestId, toast]
  );
  const handleVibeSubmit = useCallback(
    async (data: VibeCheckRequest) => {
      if (!nestId) return;
      await submitVibeCheck(nestId, data);
      await refreshVibe(nestId);
    },
    [nestId, refreshVibe]
  );
  const endNest = useCallback(
    async (action: 'graduate' | 'disband') => {
      if (!nestId) return;
      try {
        const updated = action === 'graduate' ? await graduateNest(nestId) : await disbandNest(nestId);
        setNest(updated);
        invalidateMyNests();
        toast.success(action === 'graduate' ? 'Nest graduated — congratulations! 🎉' : 'Nest disbanded.');
      } catch (error) {
        toast.error(getErrorMessage(error, 'That action could not be completed.'));
      }
    },
    [nestId, toast]
  );
  const handleLeave = useCallback(async () => {
    if (!nestId) return;
    try {
      await leaveNest(nestId);
      invalidateMyNests();
      toast.success('You left the Nest.');
      navigate(ROUTES.MY_NEST);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not leave the Nest.'));
    }
  }, [nestId, navigate, toast]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 rounded-b-3xl" />
        <div className="flex gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-24 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  // ── Not found / no nest ──
  if (notFound || !nest) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-[var(--color-border)] bg-deep/60 px-8 py-16 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
          <Construction className="h-8 w-8 text-muted" aria-hidden="true" />
        </span>
        <h1 className="mt-6 font-display text-2xl font-bold text-primary">Nest not found</h1>
        <p className="mt-2 max-w-sm text-sm text-secondary">
          This Nest may not exist, or your membership ended. Check your Nests to find active ones.
        </p>
        <Button variant="primary" className="mt-6" onClick={() => navigate(ROUTES.MY_NEST)}>
          Back to my Nests
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <NestHero nest={nest} />
      <MemberGallery members={activeMembers} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <MeetingList
            meetings={meetings}
            onSchedule={() => setShowSchedule(true)}
            onComplete={(id) => void handleMeetingStatus(id, 'complete')}
            onCancel={(id) => void handleMeetingStatus(id, 'cancel')}
          />
          <ExpenseTracker
            expenses={expenses}
            members={activeMembers}
            currentUserId={currentUserId}
            onAdd={() => setShowAddExpense(true)}
            onSettle={handleSettle}
          />
        </div>

        <div className="space-y-6">
          <VibeCheckCard
            nest={nest}
            status={vibe}
            currentUserId={currentUserId}
            isAnchor={isAnchor}
            onSubmit={handleVibeSubmit}
            onViewResults={() => setShowResults(true)}
          />
          <NestActions
            nest={nest}
            isAnchor={isAnchor}
            onLeave={() => void handleLeave()}
            onGraduate={() => void endNest('graduate')}
            onDisband={() => void endNest('disband')}
          />
          <GraduationTracker nest={nest} hasMeetings={meetings.length > 0} />
        </div>
      </div>

      <ScheduleMeetingModal
        open={showSchedule}
        onClose={() => setShowSchedule(false)}
        nestId={nest.id}
        onScheduled={handleScheduled}
      />
      <AddExpenseModal
        open={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        nestId={nest.id}
        members={activeMembers}
        onAdded={handleAddedExpense}
      />
      <VibeCheckResultsModal open={showResults} onClose={() => setShowResults(false)} status={vibe} totalMembers={activeMembers.length} />
    </div>
  );
}
