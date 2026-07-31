package com.neighbornest.nest.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * JPA entity representing a single member's share of an expense.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Entity
@Table(name = "expense_splits", indexes = {
        @Index(name = "idx_split_expense", columnList = "expense_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseSplit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "expense_id", nullable = false)
    private Long expenseId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "amount_owed", nullable = false, precision = 12, scale = 2)
    private BigDecimal amountOwed;

    @Column(nullable = false)
    @Builder.Default
    private boolean settled = false;
}
