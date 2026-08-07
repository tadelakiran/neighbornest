package com.neighbornest.chatservice.repository;

import com.neighbornest.chatservice.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for {@link Conversation}.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    /**
     * Finds the unique conversation between two participants (ids are stored
     * normalized, smaller first).
     *
     * @param participant1Id the smaller profile id
     * @param participant2Id the larger profile id
     * @return the conversation if it exists
     */
    Optional<Conversation> findByParticipant1IdAndParticipant2Id(Long participant1Id, Long participant2Id);

    /**
     * Returns all conversations the given user participates in, newest first.
     *
     * @param userId the user's profile id
     * @return the list of conversations
     */
    @Query("""
            select c from Conversation c
            where c.participant1Id = :userId or c.participant2Id = :userId
            order by c.createdAt desc, c.id desc
            """)
    List<Conversation> findAllByParticipant(@Param("userId") Long userId);
}
