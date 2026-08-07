package com.neighbornest.nest.repository;

import com.neighbornest.nest.entity.ExpenseSplit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for {@link ExpenseSplit} entities.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Repository
public interface ExpenseSplitRepository extends JpaRepository<ExpenseSplit, Long> {

    /**
     * Returns all splits for an expense.
     *
     * @param expenseId the expense ID
     * @return the list of splits
     */
    List<ExpenseSplit> findByExpenseId(Long expenseId);

    /**
     * Finds a specific member's split for an expense.
     *
     * @param expenseId the expense ID
     * @param userId    the user profile ID
     * @return the split, if present
     */
    Optional<ExpenseSplit> findByExpenseIdAndUserId(Long expenseId, Long userId);
}
