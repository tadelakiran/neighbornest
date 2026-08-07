package com.neighbornest.chatservice.repository;

import com.neighbornest.chatservice.entity.ReadReceipt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

/**
 * Spring Data JPA repository for {@link ReadReceipt}.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
public interface ReadReceiptRepository extends JpaRepository<ReadReceipt, Long> {

    /**
     * Returns all receipts of the given user for the given messages.
     *
     * @param messageIds the message ids
     * @param userId     the reader's profile id
     * @return the matching receipts
     */
    List<ReadReceipt> findByMessageIdInAndUserId(Collection<Long> messageIds, Long userId);
}
