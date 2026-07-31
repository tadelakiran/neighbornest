package com.neighbornest.nest.repository;

import com.neighbornest.nest.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA repository for {@link Expense} entities.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    /**
     * Returns all expenses for a nest, ordered by creation time descending.
     *
     * @param nestId the nest ID
     * @return the list of expenses
     */
    List<Expense> findByNestIdOrderByCreatedAtDesc(Long nestId);
}
