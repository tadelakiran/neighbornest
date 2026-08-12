import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import type {
  ChatMessagePayload,
  ChatMessageResponse,
  ChatMessagesPage,
  ConversationResponse,
  MarkReadRequest,
  MarkReadResponse,
  StartConversationRequest,
  TypingEventResponse,
} from '@/types/chat.types';

/**
 * Chat-service API — REST history/conversation calls + a STOMP WebSocket
 * client for realtime messaging.
 *
 * The STOMP endpoint lives behind the API Gateway at `/ws/chat` (SockJS).
 * The chat-service's JWT channel interceptor accepts the token as a native
 * STOMP `token` CONNECT header (SockJS cannot set HTTP headers), and
 * authenticates every frame. Destinations:
 *
 *   SEND   /app/chat/nest/{nestId}/send        → /topic/nest.{nestId}.messages
 *   SEND   /app/chat/dm/{convId}/send          → /queue/user.{id}.dm
 *   SEND   /app/chat/nest/{nestId}/typing      → /topic/nest.{nestId}.typing
 *   SEND   /app/chat/dm/{convId}/typing        → /queue/user.{id}.typing
 *
 * Notes:
 *  - Broker destinations are dot-separated (e.g. /topic/nest.1.messages)
 *    because the RabbitMQ STOMP plugin rejects slashes in routing keys.
 *  - The chat-service serializes *responses* in snake_case, so every response
 *    (REST + WS frames) is mapped to the camelCase app model below — mirroring
 *    the userService mapper pattern.
 */

const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

// ---------------------------------------------------------------------------
// Response mappers (snake_case wire → camelCase app model)
// ---------------------------------------------------------------------------

interface RawMessage {
  id: number;
  sender_id: number;
  sender_name: string;
  sender_photo_url?: string;
  content: string;
  message_type: ChatMessageResponse['messageType'];
  created_at: string;
  is_read_by_me: boolean;
}

interface RawConversation {
  id: number;
  participant_id: number;
  participant_name: string;
  participant_photo_url?: string;
  last_message_content?: string;
  last_message_at?: string;
  unread_count: number;
}

interface RawTypingEvent {
  sender_id: number;
  sender_name: string;
  is_typing: boolean;
}

function mapMessage(raw: RawMessage): ChatMessageResponse {
  return {
    id: raw.id,
    senderId: raw.sender_id,
    senderName: raw.sender_name,
    senderPhotoUrl: raw.sender_photo_url,
    content: raw.content,
    messageType: raw.message_type,
    createdAt: raw.created_at,
    isReadByMe: raw.is_read_by_me,
  };
}

function mapConversation(raw: RawConversation): ConversationResponse {
  return {
    id: raw.id,
    participantId: raw.participant_id,
    participantName: raw.participant_name,
    participantPhotoUrl: raw.participant_photo_url,
    lastMessageContent: raw.last_message_content,
    lastMessageAt: raw.last_message_at,
    unreadCount: raw.unread_count,
  };
}

function mapTyping(raw: RawTypingEvent): TypingEventResponse {
  return {
    senderId: raw.sender_id,
    senderName: raw.sender_name,
    typing: raw.is_typing,
  };
}

// ---------------------------------------------------------------------------
// REST — history, conversations, read receipts
// ---------------------------------------------------------------------------

/** GET /api/chat/dm/conversations — my direct-message conversations. */
export async function getConversations(): Promise<ConversationResponse[]> {
  const { data } = await api.get<RawConversation[]>('/api/chat/dm/conversations');
  return data.map(mapConversation);
}

/** GET /api/chat/dm/{id}/messages — direct-message history (newest first). */
export async function getDirectMessages(
  conversationId: number,
  page = 0,
  size = 50
): Promise<ChatMessagesPage> {
  const { data } = await api.get<{ content: RawMessage[] } & Omit<ChatMessagesPage, 'content'>>(
    `/api/chat/dm/${conversationId}/messages`,
    { params: { page, size } }
  );
  return { ...data, content: data.content.map(mapMessage) };
}

/** GET /api/chat/nests/{nestId}/messages — Nest group history (newest first). */
export async function getNestMessages(
  nestId: number,
  page = 0,
  size = 50
): Promise<ChatMessagesPage> {
  const { data } = await api.get<{ content: RawMessage[] } & Omit<ChatMessagesPage, 'content'>>(
    `/api/chat/nests/${nestId}/messages`,
    { params: { page, size } }
  );
  return { ...data, content: data.content.map(mapMessage) };
}

/** POST /api/chat/dm/start — find-or-create a DM conversation. */
export async function startConversation(participantId: number): Promise<ConversationResponse> {
  const { data } = await api.post<RawConversation>(
    '/api/chat/dm/start',
    { participantId } satisfies StartConversationRequest
  );
  return mapConversation(data);
}

/** POST /api/chat/messages/read — mark a batch of messages as read. */
export async function markMessagesRead(messageIds: number[]): Promise<MarkReadResponse> {
  const { data } = await api.post<{ marked_count: number }>(
    '/api/chat/messages/read',
    { messageIds } satisfies MarkReadRequest
  );
  return { markedCount: data.marked_count };
}

// ---------------------------------------------------------------------------
// WebSocket — realtime send/subscribe
// ---------------------------------------------------------------------------

let stompClient: Client | null = null;
let connectPromise: Promise<void> | null = null;

/** Parses a STOMP frame body into a typed object. */
function parseFrame<T>(frame: IMessage): T {
  return JSON.parse(frame.body) as T;
}

/**
 * Ensures a single STOMP connection to the chat-service (idempotent).
 * Reuses an in-flight connect; reconnect happens automatically with the
 * client's backoff, and `beforeConnect` re-reads the token so refreshes
 * never break the socket.
 */
export async function connectChat(): Promise<void> {
  if (stompClient?.connected) return;
  if (connectPromise) return connectPromise;

  const client = new Client({
    webSocketFactory: () => new SockJS(`${API_URL}/ws/chat`),
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: () => undefined,
  });

  client.beforeConnect = () => {
    client.connectHeaders = { token: useAuthStore.getState().accessToken ?? '' };
  };

  stompClient = client;

  connectPromise = new Promise<void>((resolve, reject) => {
    client.onConnect = () => {
      connectPromise = null;
      resolve();
    };
    client.onStompError = (frame) => {
      connectPromise = null;
      reject(new Error(frame.headers.message ?? 'WebSocket connection failed'));
    };
    client.onWebSocketError = () => {
      // Reconnect is handled by the client's backoff; nothing to do here.
    };
    client.activate();
  });

  return connectPromise;
}

/** Disconnects the shared chat socket (call on logout). */
export function disconnectChat(): void {
  connectPromise = null;
  if (stompClient) {
    void stompClient.deactivate();
    stompClient = null;
  }
}

/** Whether the shared socket is currently connected. */
export function isChatConnected(): boolean {
  return stompClient?.connected ?? false;
}

/** Subscribes to a room destination; returns an unsubscribe handle. */
function subscribe(destination: string, onMessage: (frame: IMessage) => void): StompSubscription {
  if (!stompClient?.connected) {
    throw new Error('Chat socket is not connected');
  }
  return stompClient.subscribe(destination, onMessage);
}

/** SUBSCRIBE /queue/user.{profileId}.dm — incoming direct messages. */
export function subscribeToDm(
  profileId: number,
  onMessage: (message: ChatMessageResponse) => void
): StompSubscription {
  return subscribe(`/queue/user.${profileId}.dm`, (frame) =>
    onMessage(mapMessage(parseFrame<RawMessage>(frame)))
  );
}

/** SUBSCRIBE /topic/nest.{nestId}.messages — Nest group messages. */
export function subscribeToNestMessages(
  nestId: number,
  onMessage: (message: ChatMessageResponse) => void
): StompSubscription {
  return subscribe(`/topic/nest.${nestId}.messages`, (frame) =>
    onMessage(mapMessage(parseFrame<RawMessage>(frame)))
  );
}

/** SUBSCRIBE /queue/user.{profileId}.typing — DM typing indicators. */
export function subscribeToDmTyping(
  profileId: number,
  onTyping: (event: TypingEventResponse) => void
): StompSubscription {
  return subscribe(`/queue/user.${profileId}.typing`, (frame) =>
    onTyping(mapTyping(parseFrame<RawTypingEvent>(frame)))
  );
}

/** SUBSCRIBE /topic/nest.{nestId}.typing — Nest typing indicators. */
export function subscribeToNestTyping(
  nestId: number,
  onTyping: (event: TypingEventResponse) => void
): StompSubscription {
  return subscribe(`/topic/nest.${nestId}.typing`, (frame) =>
    onTyping(mapTyping(parseFrame<RawTypingEvent>(frame)))
  );
}

/** SEND /app/chat/nest/{nestId}/send — publish a Nest group message. */
export function sendNestMessage(nestId: number, content: string): void {
  const payload: ChatMessagePayload = { roomType: 'NEST_GROUP', nestId, content };
  stompClient?.publish({ destination: `/app/chat/nest/${nestId}/send`, body: JSON.stringify(payload) });
}

/** SEND /app/chat/dm/{conversationId}/send — publish a direct message. */
export function sendDmMessage(conversationId: number, content: string): void {
  const payload: ChatMessagePayload = { roomType: 'DIRECT', conversationId, content };
  stompClient?.publish({ destination: `/app/chat/dm/${conversationId}/send`, body: JSON.stringify(payload) });
}

/** SEND typing indicator to a Nest group room. */
export function sendNestTyping(nestId: number, isTyping: boolean): void {
  stompClient?.publish({
    destination: `/app/chat/nest/${nestId}/typing`,
    body: JSON.stringify({ isTyping }),
  });
}

/** SEND typing indicator to a DM conversation. */
export function sendDmTyping(conversationId: number, isTyping: boolean): void {
  stompClient?.publish({
    destination: `/app/chat/dm/${conversationId}/typing`,
    body: JSON.stringify({ isTyping }),
  });
}
