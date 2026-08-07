package com.neighbornest.chatservice.entity;

import com.neighbornest.chatservice.enums.MessageType;
import com.neighbornest.chatservice.enums.RoomType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * A single chat message persisted in the {@code chat_db} database.
 * <p>
 * Messages belong to exactly one room: either a Nest group chat
 * ({@code roomType = NEST_GROUP}, identified by {@code nestId}) or a direct
 * message conversation ({@code roomType = DIRECT}, identified by
 * {@code conversationId}). {@code senderId} and {@code nestId} reference ids
 * owned by other services (user-service and nest-service respectively), so no
 * cross-service foreign keys exist.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Entity
@Table(
        name = "messages",
        indexes = {
                @Index(name = "idx_messages_nest", columnList = "room_type, nest_id, created_at"),
                @Index(name = "idx_messages_conversation", columnList = "room_type, conversation_id, created_at")
        }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Message {

    /** Primary key, auto-generated. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Room type this message belongs to. */
    @Enumerated(EnumType.STRING)
    @Column(name = "room_type", nullable = false, length = 32)
    private RoomType roomType;

    /** Nest id for group chat messages (null for direct messages). */
    @Column(name = "nest_id")
    private Long nestId;

    /** Conversation id for direct messages (null for group messages). */
    @Column(name = "conversation_id")
    private Long conversationId;

    /** User-service profile id of the sender. */
    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    /** Plain-text message content. */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /** Content type of the message (defaults to TEXT). */
    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false, length = 32)
    @Builder.Default
    private MessageType messageType = MessageType.TEXT;

    /** Timestamp when the message was created. */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Assigns the creation timestamp before the first persist.
     */
    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
