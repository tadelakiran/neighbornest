import { useState } from 'react';
import {
  Coffee, Dice5, Footprints, MapPin, Mountain, Puzzle, UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { DatePicker } from '@/components/ui/DatePicker';
import { TimePicker, type TimeValue } from '@/components/ui/TimePicker';
import { useToast } from '@/hooks/useToast';
import { cn, getErrorMessage } from '@/lib/utils';
import { scheduleMeeting } from '@/services/nestService';
import type { MeetingResponse } from '@/types/nest.types';

const ACTIVITIES: Array<{ id: string; icon: LucideIcon }> = [
  { id: 'Coffee', icon: Coffee },
  { id: 'Walk', icon: Footprints },
  { id: 'Trivia', icon: Puzzle },
  { id: 'Dinner', icon: UtensilsCrossed },
  { id: 'Board Games', icon: Dice5 },
  { id: 'Hiking', icon: Mountain },
];

interface ScheduleMeetingModalProps {
  open: boolean;
  onClose: () => void;
  nestId: number | string;
  onScheduled: (meeting: MeetingResponse) => void;
}

const DEFAULT_TIME: TimeValue = { hour: 6, minute: 0, period: 'PM' };

/**
 * Schedule Meeting modal — custom calendar + time pickers, venue fields,
 * activity pills and a loading submit with a success toast.
 */
export function ScheduleMeetingModal({ open, onClose, nestId, onScheduled }: ScheduleMeetingModalProps) {
  const toast = useToast();
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<TimeValue>(DEFAULT_TIME);
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [activityType, setActivityType] = useState('Coffee');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setDate(null);
    setTime(DEFAULT_TIME);
    setVenueName('');
    setVenueAddress('');
    setActivityType('Coffee');
    setDescription('');
  };

  const handleSubmit = async () => {
    if (!date || !venueName.trim()) {
      toast.error('Pick a date and give the venue a name.');
      return;
    }
    const hour24 = (time.period === 'PM' ? (time.hour % 12) + 12 : time.hour % 12) % 24;
    const scheduledAt = `${date}T${String(hour24).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}:00`;

    setSubmitting(true);
    try {
      const meeting = await scheduleMeeting(nestId, {
        scheduledAt,
        venueName: venueName.trim(),
        venueAddress: venueAddress.trim() || undefined,
        activityType,
        description: description.trim() || undefined,
      });
      toast.success('Meeting scheduled!');
      reset();
      onScheduled(meeting);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not schedule the meeting.'));
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Schedule a Meetup" maxWidth="max-w-lg">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DatePicker value={date} onChange={setDate} label="Date" />
          <TimePicker value={time} onChange={setTime} label="Time" />
        </div>

        <Input label="Venue name" icon={<MapPin className="h-4 w-4" aria-hidden="true" />} placeholder="e.g. Brew &amp; Bloom Café" value={venueName} onChange={(e) => setVenueName(e.target.value)} />
        <Input label="Venue address" placeholder="e.g. 221b Maple Street" value={venueAddress} onChange={(e) => setVenueAddress(e.target.value)} />

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Activity</p>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {ACTIVITIES.map(({ id, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActivityType(id)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all duration-200',
                  activityType === id
                    ? 'border-accent-400/50 bg-accent-500 text-white shadow-glow-sm'
                    : 'border-white/10 bg-surface text-secondary hover:border-white/25 hover:text-primary'
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {id}
              </button>
            ))}
          </div>
        </div>

        <Textarea label="Description (optional)" rows={3} placeholder="What's the plan? Any details your Nest should know…" value={description} onChange={(e) => setDescription(e.target.value)} />

        <Button fullWidth isLoading={submitting} onClick={() => void handleSubmit()} className="shadow-glow">
          {submitting ? 'Scheduling…' : 'Schedule Meetup'}
        </Button>
      </div>
    </Modal>
  );
}
