package com.neighbornest.chatservice.service;

import com.neighbornest.chatservice.entity.Message;
import com.neighbornest.chatservice.entity.ReadReceipt;
import com.neighbornest.chatservice.exception.BadRequestException;
import com.neighbornest.chatservice.repository.MessageRepository;
import com.neighbornest.chatservice.repository.ReadReceiptRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service managing read receipts.
 * <p>
 * Read receipts are idempotent: a second mark-as-read for the same message and
 * user is a no-op thanks to the {@code (message, user)} unique constraint, so
 * the returned count reflects only newly created receipts.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReadReceiptService {

    private final ReadReceiptRepository readReceiptRepository;
    private final MessageRepository messageRepository;

    /**
     * Marks the given messages as read by the user, skipping messages that are
     * already read, and reports the rooms involved so the caller can broadcast
     * read-status updates.
     *
     * @param userId     the reader's profile id
     * @param messageIds the message ids to mark as read
     * @return the number of newly created receipts and the affected rooms
     * @throws BadRequestException if {@code messageIds} is null or empty
     */
    @Transactional
    public MarkReadResult markRead(final Long userId, final List<Long> messageIds) {
        if (messageIds == null || messageIds.isEmpty()) {
            throw new BadRequestException("messageIds must not be empty");
        }

        final List<Message> messages = messageRepository.findByIdIn(messageIds);
        if (messages.isEmpty()) {
            return new MarkReadResult(0, List.of());
        }

        final Set<Long> alreadyRead = readReceiptRepository.findByMessageIdInAndUserId(messageIds, userId).stream()
                .map(receipt -> receipt.getMessage().getId())
                .collect(Collectors.toSet());

        final List<ReadReceipt> newReceipts = messages.stream()
                .filter(message -> !alreadyRead.contains(message.getId()))
                .map(message -> ReadReceipt.builder().message(message).userId(userId).build())
                .toList();

        if (!newReceipts.isEmpty()) {
            readReceiptRepository.saveAll(newReceipts);
            log.info("Marked {} messages as read for profile {}", newReceipts.size(), userId);
        }

        // Group the affected message ids per room so broadcasters can scope
        // read-status updates to exactly the messages each room cares about.
        final Map<RoomRef, List<Long>> byRoom = messages.stream().collect(Collectors.groupingBy(
                message -> new RoomRef(message.getRoomType(), message.getNestId(), message.getConversationId()),
                Collectors.mapping(Message::getId, Collectors.toList())));

        final List<RoomRead> rooms = byRoom.entrySet().stream()
                .map(entry -> new RoomRead(entry.getKey(), entry.getValue()))
                .toList();

        return new MarkReadResult(newReceipts.size(), rooms);
    }
}
