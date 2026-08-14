import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { StompSubscription } from '@stomp/stompjs';
import { motion } from 'framer-motion';
import { ChevronDown, MessageSquare, Plus, SendHorizonal, Users } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { cn, formatMessageTime, getErrorMessage } from '@/lib/utils';
import {
  connectChat,
  disconnectChat,
  getConversations,
  getDirectMessages,
  getNestMessages,
  isChatConnected,
  markMessagesRead,
  sendDmMessage,
  sendDmTyping,
  sendNestMessage,
  sendNestTyping,
  startConversation,
  subscribeToDm,
  subscribeToDmTyping,
  subscribeToNestMessages,
  subscribeToNestTyping,
} from '@/services/chatService';
import { getMyNests } from '@/services/nestService';
import type { ChatMessageResponse, ChatRoom, ConversationResponse } from '@/types/chat.types';

/** How often (ms) the user may publish a typing indicator. */
const TYPING_THROTTLE_MS = 1500;

/**
 * Messages — realtime chat with Nest group rooms and direct messages.
 * Left: room list (Nests + DMs) with unread badges. Right: the conversation
 * window with typing indicators and live WebSocket delivery.
 */
export function MessagesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const myId = user?.id;

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState<Record<number, string>>({});
  const [showNewDm, setShowNewDm] = useState(false);
  const [startingDm, setStartingDm] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);

  const roomListRef = useRef<ChatRoom[]>([]);
  roomListRef.current = rooms;
  const activeRoomRef = useRef<string | null>(null);
  activeRoomRef.current = activeRoomId;
  const myIdRef = useRef<number | undefined>(myId);
  myIdRef.current = myId;
  const lastTypingSent = useRef(0);

  const activeRoom = useMemo(
    () => rooms.find((r) => r.id === activeRoomId) ?? null,
    [rooms, activeRoomId]
  );

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    stickToBottomRef.current = nearBottom;
    setShowJumpToLatest(!nearBottom);
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    stickToBottomRef.current = true;
    setShowJumpToLatest(false);
  }, []);

  useEffect(() => {
    if (historyLoading) return;
    if (stickToBottomRef.current) {
      const el = scrollContainerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [messages, activeRoomId, historyLoading]);

  const patchRoom = useCallback((roomId: string, patch: Partial<ChatRoom>) => {
    setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, ...patch } : r)));
  }, []);

  const handleIncoming = useCallback(
    (message: ChatMessageResponse, room: ChatRoom | undefined) => {
      if (!room) return;
      if (activeRoomRef.current === room.id) {
        setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
        void markMessagesRead([message.id]).catch(() => undefined);
      } else {
        patchRoom(room.id, {
          unreadCount: (roomListRef.current.find((r) => r.id === room.id)?.unreadCount ?? 0) + 1,
          lastMessageContent: message.content,
          lastMessageAt: message.createdAt,
        });
        setRooms((prev) => sortRooms(prev));
      }
    },
    [patchRoom]
  );

  const handleTyping = useCallback((senderId: number, senderName: string, typing: boolean) => {
    if (senderId === myIdRef.current) return;
    setTypingUsers((prev) => {
      const next = { ...prev };
      if (typing) {
        next[senderId] = senderName;
      } else {
        delete next[senderId];
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!myId) return;
    let dmSub: StompSubscription | undefined;
    let dmTypingSub: StompSubscription | undefined;
    let cancelled = false;

    void connectChat()
      .then(() => {
        if (cancelled) return;
        dmSub = subscribeToDm(myId, (message) => {
          const room =
            message.senderId === myIdRef.current
              ? roomListRef.current.find((r) => r.id === activeRoomRef.current && r.kind === 'dm')
              : roomListRef.current.find((r) => r.kind === 'dm' && r.participantId === message.senderId);
          handleIncoming(message, room);
        });
        dmTypingSub = subscribeToDmTyping(myId, (event) =>
          handleTyping(event.senderId, event.senderName, event.typing)
        );
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      dmSub?.unsubscribe();
      dmTypingSub?.unsubscribe();
      disconnectChat();
    };
  }, [myId, handleIncoming, handleTyping]);

  useEffect(() => {
    if (!myId) return;
    let cancelled = false;

    (async () => {
      try {
        const [nestsResult, convsResult] = await Promise.allSettled([getMyNests(), getConversations()]);
        if (cancelled) return;
        const nests = nestsResult.status === 'fulfilled' ? nestsResult.value : [];
        const convs = convsResult.status === 'fulfilled' ? convsResult.value : [];
        const list: ChatRoom[] = [
          ...nests
            .filter((n) => n.status === 'ACTIVE' || n.status === 'VIBE_CHECK')
            .map((n) => ({
              id: `nest-${n.id}`,
              kind: 'nest' as const,
              title: n.name,
              subtitle: n.city,
              unreadCount: 0,
              nestId: n.id,
            })),
          ...convs.map((c) => dmRoom(c)),
        ];
        setRooms(sortRooms(list));

        const param = searchParams.get('conversation');
        const target =
          (param ? list.find((r) => r.conversationId === Number(param)) : undefined) ??
          list[0] ??
          null;
        setActiveRoomId(target?.id ?? null);
      } catch {
        if (!cancelled) setRooms([]);
      } finally {
        if (!cancelled) setRoomsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [myId, searchParams]);

  useEffect(() => {
    const room = roomListRef.current.find((r) => r.id === activeRoomId);
    if (!room) {
      setMessages([]);
      setTypingUsers({});
      return;
    }

    let cancelled = false;
    const subs: StompSubscription[] = [];
    stickToBottomRef.current = true;
    setShowJumpToLatest(false);
    setHistoryLoading(true);

    (async () => {
      try {
        const page =
          room.kind === 'dm'
            ? await getDirectMessages(room.conversationId!)
            : await getNestMessages(room.nestId!);
        if (cancelled) return;
        setMessages([...page.content].reverse());

        const unreadIds = page.content.filter((m) => !m.isReadByMe).map((m) => m.id);
        if (unreadIds.length > 0) {
          void markMessagesRead(unreadIds)
            .then(() => patchRoom(room.id, { unreadCount: 0 }))
            .catch(() => undefined);
        }
      } catch (error) {
        if (!cancelled) {
          setMessages([]);
          toast.error(getErrorMessage(error, 'Could not load messages.'));
        }
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }

      await connectChat().catch(() => undefined);
      if (cancelled) return;
      if (room.kind === 'nest' && room.nestId) {
        subs.push(
          subscribeToNestMessages(room.nestId, (message) => handleIncoming(message, room)),
          subscribeToNestTyping(room.nestId, (event) =>
            handleTyping(event.senderId, event.senderName, event.typing)
          )
        );
      }
    })();

    return () => {
      cancelled = true;
      subs.forEach((s) => s.unsubscribe());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomId, myId]);

  const publishTyping = useCallback(
    (value: boolean) => {
      const now = Date.now();
      if (value && now - lastTypingSent.current < TYPING_THROTTLE_MS) return;
      lastTypingSent.current = now;
      if (activeRoom?.kind === 'dm' && activeRoom.conversationId) {
        sendDmTyping(activeRoom.conversationId, value);
      } else if (activeRoom?.kind === 'nest' && activeRoom.nestId) {
        sendNestTyping(activeRoom.nestId, value);
      }
    },
    [activeRoom]
  );

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || !activeRoom || historyLoading) return;
    if (!isChatConnected()) {
      toast.error('Chat is reconnecting — try again in a moment.');
      return;
    }
    setInput('');
    publishTyping(false);
    if (activeRoom.kind === 'dm' && activeRoom.conversationId) {
      sendDmMessage(activeRoom.conversationId, text);
    } else if (activeRoom.kind === 'nest' && activeRoom.nestId) {
      sendNestMessage(activeRoom.nestId, text);
    }
  }, [input, activeRoom, historyLoading, publishTyping, toast]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStartDm = async (participantId: number, participantName: string) => {
    setStartingDm(true);
    try {
      const conv = await startConversation(participantId);
      setShowNewDm(false);
      setRooms((prev) => {
        const room = dmRoom(conv);
        const exists = prev.some((r) => r.id === room.id);
        return sortRooms(exists ? prev : [room, ...prev]);
      });
      setActiveRoomId(`dm-${conv.id}`);
      toast.success(`Chatting with ${participantName}`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not start the conversation.'));
    } finally {
      setStartingDm(false);
    }
  };

  const openDmFromMember = useCallback(
    async (participantId: number, participantName: string) => {
      await handleStartDm(participantId, participantName);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] min-h-[480px] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-deep)]/60 backdrop-blur-xl">
      {/* Room list */}
      <aside
        className={cn(
          'flex w-full flex-col border-r border-[var(--color-border)] bg-[var(--color-deep)]/40 sm:w-72 md:w-80',
          activeRoomId ? 'hidden sm:flex' : 'flex'
        )}
      >
        <div className="flex items-center justify-between px-4 py-3.5">
          <h2 className="flex items-center gap-2 font-['Space_Grotesk'] text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">
            <MessageSquare className="h-4 w-4 text-[var(--accent-400)]" aria-hidden="true" />
            Messages
          </h2>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 rounded-lg p-0"
            onClick={() => setShowNewDm(true)}
            aria-label="New message"
            title="New message"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-2">
          {roomsLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)
          ) : rooms.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-400)]/10">
                <Users className="h-6 w-6 text-[var(--accent-300)]" aria-hidden="true" />
              </span>
              <p className="text-sm font-medium text-[var(--text-primary)]">No conversations yet</p>
              <p className="text-xs text-[var(--text-muted)]">Message a Nest member to get started.</p>
            </div>
          ) : (
            rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setActiveRoomId(room.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                  room.id === activeRoomId
                    ? 'bg-[var(--accent-400)]/10 ring-1 ring-[var(--accent-400)]/25'
                    : 'hover:bg-[var(--color-raised)]'
                )}
              >
                <Avatar name={room.title} size="md" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
                      {room.title}
                    </span>
                    {room.lastMessageAt && (
                      <span className="shrink-0 text-[10px] text-[var(--text-muted)]">
                        {formatMessageTime(room.lastMessageAt)}
                      </span>
                    )}
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-[var(--text-muted)]">
                      {room.lastMessageContent ??
                        (room.kind === 'nest' ? 'Group chat' : room.subtitle)}
                    </span>
                    {room.unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-400)] px-1.5 text-[10px] font-bold text-white">
                        {room.unreadCount}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Chat window */}
      <section className={cn('flex min-w-0 flex-1 flex-col', activeRoomId ? 'flex' : 'hidden sm:flex')}>
        {activeRoom ? (
          <>
            {/* Header */}
            <header className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3">
              <button
                className="text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] sm:hidden"
                onClick={() => setActiveRoomId(null)}
                aria-label="Back to conversations"
              >
                ←
              </button>
              <Avatar name={activeRoom.title} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                  {activeRoom.title}
                </p>
                <p className="truncate text-[11px] capitalize text-[var(--text-muted)]">
                  {activeRoom.kind === 'nest'
                    ? `${activeRoom.subtitle} · Nest group`
                    : activeRoom.subtitle}
                </p>
              </div>
              {Object.keys(typingUsers).length > 0 && (
                <span className="animate-pulse text-[11px] font-medium text-[var(--accent-300)]">
                  {Object.values(typingUsers)[0]} is typing…
                </span>
              )}
            </header>

            {/* Messages */}
            <div className="relative flex-1 overflow-hidden">
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="h-full space-y-3 overflow-y-auto px-4 py-4"
              >
                {historyLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton
                        key={i}
                        className={cn('h-10 rounded-2xl', i % 2 ? 'ml-auto w-2/3' : 'w-2/3')}
                      />
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-400)]/10">
                      <MessageSquare className="h-7 w-7 text-[var(--accent-300)]" aria-hidden="true" />
                    </span>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Say hello 👋</p>
                    <p className="max-w-xs text-xs text-[var(--text-muted)]">
                      This is the start of your {activeRoom.kind === 'nest' ? 'Nest group' : 'conversation'}.
                    </p>
                  </div>
                ) : (
                  messages.map((message, i) => {
                    const mine = message.senderId === myId;
                    const showName = !mine && activeRoom.kind === 'nest';
                    const prev = messages[i - 1];
                    const grouped = !mine && !!prev && prev.senderId === message.senderId;
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn('flex items-end gap-2', mine && 'flex-row-reverse')}
                      >
                        {!mine && !grouped && (
                          <Avatar name={message.senderName} size="sm" className="mb-5 shrink-0" />
                        )}
                        <div className={cn('max-w-[75%]', !mine && !grouped && 'ml-1')}>
                          {showName && (
                            <p className="mb-0.5 px-1 text-[10px] font-semibold text-[var(--accent-300)]">
                              {message.senderName}
                            </p>
                          )}
                          <div
                            className={cn(
                              'whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-[var(--shadow-sm)]',
                              mine
                                ? 'rounded-br-md bg-[var(--grad-primary)] text-white'
                                : 'rounded-bl-md border border-[var(--text-primary)]/[0.06] bg-[var(--color-surface)] text-[var(--text-primary)]'
                            )}
                          >
                            {message.content}
                          </div>
                          <p className={cn('mt-0.5 px-1 text-[9px] text-[var(--text-muted)]', mine && 'text-right')}>
                            {formatMessageTime(message.createdAt)}
                            {mine && (message.isReadByMe ? ' · read' : ' · sent')}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Jump-to-latest */}
              {showJumpToLatest && !historyLoading && messages.length > 0 && (
                <button
                  onClick={() => scrollToBottom('smooth')}
                  className="absolute bottom-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--text-secondary)] shadow-[var(--shadow-lg)] transition-colors hover:text-[var(--text-primary)]"
                  aria-label="Scroll to latest message"
                  title="Scroll to latest"
                >
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Composer */}
            <footer className="border-t border-[var(--color-border)] p-3">
              <div className="flex items-end gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-2 focus-within:border-[var(--accent-400)]/40">
                <textarea
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    publishTyping(true);
                  }}
                  onBlur={() => publishTyping(false)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder={`Message ${activeRoom.title}…`}
                  className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="h-10 w-10 shrink-0 rounded-xl p-0"
                  aria-label="Send message"
                >
                  <SendHorizonal className="h-4 w-4" />
                </Button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--grad-primary)] shadow-[0_0_24px_rgba(14,165,233,0.3)]">
              <MessageSquare className="h-8 w-8 text-white" aria-hidden="true" />
            </span>
            <h2 className="font-['Space_Grotesk'] text-xl font-bold text-[var(--text-primary)]">
              Select a conversation
            </h2>
            <p className="max-w-sm text-sm text-[var(--text-secondary)]">
              Pick a Nest to chat with your group, or start a direct message with any member.
            </p>
            <Button variant="primary" className="mt-2" onClick={() => setShowNewDm(true)}>
              New message
            </Button>
          </div>
        )}
      </section>

      {/* Start-DM modal */}
      <NewDmModal
        open={showNewDm}
        onClose={() => setShowNewDm(false)}
        onPick={openDmFromMember}
        busy={startingDm}
        myId={myId ?? 0}
      />
    </div>
  );
}

/** Sorts rooms newest-first by last message time (unread first). */
function sortRooms(rooms: ChatRoom[]): ChatRoom[] {
  return [...rooms].sort((a, b) => {
    if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
    const ta = a.lastMessageAt ? Date.parse(a.lastMessageAt) : 0;
    const tb = b.lastMessageAt ? Date.parse(b.lastMessageAt) : 0;
    return tb - ta;
  });
}

/** Converts a backend conversation DTO into a unified room model. */
function dmRoom(c: ConversationResponse): ChatRoom {
  return {
    id: `dm-${c.id}`,
    kind: 'dm',
    title: c.participantName,
    subtitle: 'Direct message',
    photoUrl: c.participantPhotoUrl,
    unreadCount: c.unreadCount,
    participantId: c.participantId,
    conversationId: c.id,
    lastMessageContent: c.lastMessageContent,
    lastMessageAt: c.lastMessageAt,
  };
}

/**
 * New-message modal — lists Nest members (from the current user's Nests)
 * to start a direct-message conversation with.
 */
function NewDmModal({
  open,
  onClose,
  onPick,
  busy,
  myId,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (userId: number, fullName: string) => Promise<void>;
  busy: boolean;
  myId: number;
}) {
  const [members, setMembers] = useState<Array<{ userId: number; fullName: string; roleInNest: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    getMyNests()
      .then((nests) => {
        if (cancelled) return;
        const map = new Map<number, { userId: number; fullName: string; roleInNest: string }>();
        nests.forEach((n) =>
          n.members
            .filter((m) => m.status === 'ACCEPTED' && m.userId !== myId)
            .forEach((m) => map.set(m.userId, { userId: m.userId, fullName: m.fullName, roleInNest: m.roleInNest }))
        );
        setMembers([...map.values()]);
      })
      .catch(() => setMembers([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, myId]);

  return (
    <Modal open={open} onClose={onClose} title="New message" maxWidth="max-w-md">
      <div className="space-y-1">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--text-muted)]">
            You're not in any Nests yet — join a Nest to message your members.
          </p>
        ) : (
          members.map((m) => (
            <button
              key={m.userId}
              onClick={() => void onPick(m.userId, m.fullName)}
              disabled={busy}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--color-raised)] disabled:opacity-60"
            >
              <Avatar name={m.fullName} size="md" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">
                  {m.fullName}
                </span>
                <span className="block text-[11px] capitalize text-[var(--text-muted)]">
                  {m.roleInNest.toLowerCase()}
                </span>
              </span>
              <MessageSquare className="h-4 w-4 text-[var(--accent-400)]" aria-hidden="true" />
            </button>
          ))
        )}
      </div>
    </Modal>
  );
}