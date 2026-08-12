/**
 * TypeScript contracts for the chat-service API.
 *
 * The chat-service serializes *responses* in snake_case (verified against the
 * DTOs in `backend/chat-service`) while *request* bodies use camelCase.
 * WebSocket frames carry the same response shapes as the REST endpoints.
 */

/** Room type for a chat message. */
export type ChatRoomType = 'NEST_GROUP' | 'DIRECT';

/** Content type of a chat message. */
export type ChatMessageType = 'TEXT' | 'SYSTEM';

/** A single chat message with sender details and read state. */
export interface ChatMessageResponse {
  id: number;
  senderId: number;
  senderName: string;
  senderPhotoUrl?: string;
  content: string;
  messageType: ChatMessageType;
  createdAt: string;
  /** Whether the current viewer has read this message. */
  isReadByMe: boolean;
}

/** Paginated message history (Spring Page serialization). */
export interface ChatMessagesPage {
  content: ChatMessageResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

/** A direct-message conversation with preview + unread count (viewer-scoped). */
export interface ConversationResponse {
  id: number;
  participantId: number;
  participantName: string;
  participantPhotoUrl?: string;
  lastMessageContent?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

/** Body for `POST /api/chat/dm/start`. */
export interface StartConversationRequest {
  participantId: number;
}

/** Body for `POST /api/chat/messages/read`. */
export interface MarkReadRequest {
  messageIds: number[];
}

/** Response for `POST /api/chat/messages/read`. */
export interface MarkReadResponse {
  markedCount: number;
}

/** STOMP payload for sending a chat message. */
export interface ChatMessagePayload {
  roomType: ChatRoomType;
  nestId?: number;
  conversationId?: number;
  content: string;
  messageType?: ChatMessageType;
}

/** STOMP payload for a typing indicator. */
export interface TypingEventPayload {
  isTyping: boolean;
}

/** Typing broadcast delivered to room subscribers. */
export interface TypingEventResponse {
  senderId: number;
  senderName: string;
  typing: boolean;
}

/** Read-receipt broadcast for a room. */
export interface ReadReceiptUpdateResponse {
  userId: number;
  messageIds: number[];
  roomType: ChatRoomType;
  nestId?: number;
  conversationId?: number;
}

/** A unified chat room shown in the Messages page sidebar. */
export interface ChatRoom {
  /** `nest-{id}` for group rooms, `dm-{id}` for direct messages. */
  id: string;
  kind: 'nest' | 'dm';
  title: string;
  subtitle: string;
  photoUrl?: string;
  unreadCount: number;
  nestId?: number;
  conversationId?: number;
  /** For DM rooms: profile id of the other participant (routes incoming DMs). */
  participantId?: number;
  /** Content of the most recent message (room-list preview). */
  lastMessageContent?: string;
  lastMessageAt?: string;
}
