package com.neighbornest.chatservice.repository;

import com.neighbornest.chatservice.entity.Message;
import com.neighbornest.chatservice.enums.RoomType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

/**
 * Spring Data JPA repository for {@link Message}.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
public interface MessageRepository extends JpaRepository<Message, Long> {

    /**
     * Returns a page of group messages for a Nest, newest first (pageable
     * sort is applied by the caller).
     *
     * @param roomType the room type ({@code NEST_GROUP})
     * @param nestId   the nest id
     * @param pageable the paging and sorting specification
     * @return the requested page of messages
     */
    Page<Message> findByRoomTypeAndNestId(RoomType roomType, Long nestId, Pageable pageable);

    /**
     * Returns a page of direct messages for a conversation.
     *
     * @param roomType       the room type ({@code DIRECT})
     * @param conversationId the conversation id
     * @param pageable       the paging and sorting specification
     * @return the requested page of messages
     */
    Page<Message> findByRoomTypeAndConversationId(RoomType roomType, Long conversationId, Pageable pageable);

    /**
     * Returns the single latest message of a conversation, or an empty list.
     *
     * @param roomType       the room type ({@code DIRECT})
     * @param conversationId the conversation id
     * @param pageable       must request a single element (page size 1)
     * @return the latest message if any
     */
    @Query("""
            select m from Message m
            where m.roomType = :roomType and m.conversationId = :conversationId
            order by m.createdAt desc, m.id desc
            """)
    List<Message> findLatestByConversation(@Param("roomType") RoomType roomType,
                                           @Param("conversationId") Long conversationId,
                                           Pageable pageable);

    /**
     * Returns all messages whose ids are in the given collection.
     *
     * @param ids the message ids
     * @return the matching messages
     */
    List<Message> findByIdIn(Collection<Long> ids);

    /**
     * Counts unread group messages for a user in a Nest, i.e. messages with no
     * read receipt for that user.
     *
     * @param roomType the room type ({@code NEST_GROUP})
     * @param nestId   the nest id
     * @param userId   the viewer's profile id
     * @return the number of unread messages
     */
    @Query("""
            select count(m) from Message m
            where m.roomType = :roomType and m.nestId = :nestId
              and not exists (
                  select r from ReadReceipt r where r.message.id = m.id and r.userId = :userId
              )
            """)
    long countUnreadNestMessages(@Param("roomType") RoomType roomType,
                                 @Param("nestId") Long nestId,
                                 @Param("userId") Long userId);

    /**
     * Counts unread direct messages for a user in a conversation, i.e. messages
     * with no read receipt for that user.
     *
     * @param roomType       the room type ({@code DIRECT})
     * @param conversationId the conversation id
     * @param userId         the viewer's profile id
     * @return the number of unread messages
     */
    @Query("""
            select count(m) from Message m
            where m.roomType = :roomType and m.conversationId = :conversationId
              and not exists (
                  select r from ReadReceipt r where r.message.id = m.id and r.userId = :userId
              )
            """)
    long countUnreadDirectMessages(@Param("roomType") RoomType roomType,
                                   @Param("conversationId") Long conversationId,
                                   @Param("userId") Long userId);
}
