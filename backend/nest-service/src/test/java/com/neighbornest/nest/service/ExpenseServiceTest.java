package com.neighbornest.nest.service;

import com.neighbornest.nest.dto.request.ExpenseRequest;
import com.neighbornest.nest.dto.request.ExpenseSplitRequest;
import com.neighbornest.nest.dto.response.ExpenseResponse;
import com.neighbornest.nest.entity.Expense;
import com.neighbornest.nest.entity.ExpenseSplit;
import com.neighbornest.nest.entity.NestMember;
import com.neighbornest.nest.entity.NestMemberStatus;
import com.neighbornest.nest.entity.NestRole;
import com.neighbornest.nest.entity.SplitType;
import com.neighbornest.nest.exception.BadRequestException;
import com.neighbornest.nest.exception.ResourceNotFoundException;
import com.neighbornest.nest.repository.ExpenseRepository;
import com.neighbornest.nest.repository.ExpenseSplitRepository;
import com.neighbornest.nest.repository.NestMemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link ExpenseService}.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ExpenseService Unit Tests")
class ExpenseServiceTest {

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private ExpenseSplitRepository expenseSplitRepository;

    @Mock
    private NestMemberRepository nestMemberRepository;

    @Mock
    private NestService nestService;

    private ExpenseService expenseService;

    @BeforeEach
    void setUp() {
        expenseService = new ExpenseService(expenseRepository, expenseSplitRepository, nestMemberRepository, nestService);
    }

    @Nested
    @DisplayName("createExpense method")
    class CreateExpenseTests {

        @Test
        @DisplayName("Should create EQUAL splits across active members")
        void shouldCreateEqualSplits() {
            when(nestMemberRepository.findByNestId(1L)).thenReturn(
                    List.of(activeMember(1L, 1L), activeMember(1L, 2L)));
            when(expenseRepository.save(any(Expense.class))).thenReturn(
                    expense(10L, BigDecimal.valueOf(100.00)));

            final ExpenseResponse response = expenseService.createExpense(1L, 1L,
                    ExpenseRequest.builder()
                            .amount(BigDecimal.valueOf(100.00))
                            .description("Group dinner")
                            .splitType(SplitType.EQUAL)
                            .build());

            verify(nestService).requireMember(1L, 1L);
            verify(expenseSplitRepository).saveAll(any());
            assertThat(response.getId()).isEqualTo(10L);
            assertThat(response.getSplits()).hasSize(2);
            assertThat(response.getSplits()).allMatch(split ->
                    split.getAmountOwed().compareTo(BigDecimal.valueOf(50.00)) == 0);
        }

        @Test
        @DisplayName("Should create CUSTOM splits that sum to the total")
        void shouldCreateCustomSplits() {
            when(nestMemberRepository.findByNestId(1L)).thenReturn(
                    List.of(activeMember(1L, 1L), activeMember(1L, 2L)));
            when(expenseRepository.save(any(Expense.class))).thenReturn(
                    expense(10L, BigDecimal.valueOf(100.00)));

            final ExpenseResponse response = expenseService.createExpense(1L, 1L,
                    ExpenseRequest.builder()
                            .amount(BigDecimal.valueOf(100.00))
                            .description("Groceries")
                            .splitType(SplitType.CUSTOM)
                            .splits(List.of(
                                    ExpenseSplitRequest.builder().userId(1L).amountOwed(BigDecimal.valueOf(70.00)).build(),
                                    ExpenseSplitRequest.builder().userId(2L).amountOwed(BigDecimal.valueOf(30.00)).build()))
                            .build());

            assertThat(response.getSplits()).hasSize(2);
            assertThat(response.getSplits().get(0).getUserId()).isEqualTo(1L);
            assertThat(response.getSplits().get(0).getAmountOwed()).isEqualByComparingTo("70.00");
        }

        @Test
        @DisplayName("Should reject CUSTOM splits that do not sum to the total")
        void shouldRejectMismatchedCustomSplits() {
            when(nestMemberRepository.findByNestId(1L)).thenReturn(
                    List.of(activeMember(1L, 1L), activeMember(1L, 2L)));
            when(expenseRepository.save(any(Expense.class)))
                    .thenReturn(expense(10L, BigDecimal.valueOf(100.00)));

            assertThatThrownBy(() -> expenseService.createExpense(1L, 1L,
                    ExpenseRequest.builder()
                            .amount(BigDecimal.valueOf(100.00))
                            .description("Groceries")
                            .splitType(SplitType.CUSTOM)
                            .splits(List.of(
                                    ExpenseSplitRequest.builder().userId(1L).amountOwed(BigDecimal.valueOf(10.00)).build()))
                            .build()))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("must equal");
        }

        @Test
        @DisplayName("Should reject CUSTOM splits referencing non-members")
        void shouldRejectCustomSplitForNonMember() {
            when(nestMemberRepository.findByNestId(1L)).thenReturn(
                    List.of(activeMember(1L, 1L)));
            when(expenseRepository.save(any(Expense.class)))
                    .thenReturn(expense(10L, BigDecimal.valueOf(100.00)));

            assertThatThrownBy(() -> expenseService.createExpense(1L, 1L,
                    ExpenseRequest.builder()
                            .amount(BigDecimal.valueOf(100.00))
                            .description("Groceries")
                            .splitType(SplitType.CUSTOM)
                            .splits(List.of(
                                    ExpenseSplitRequest.builder().userId(99L).amountOwed(BigDecimal.valueOf(100.00)).build()))
                            .build()))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("active members");
        }

        @Test
        @DisplayName("Should propagate the membership check")
        void shouldEnforceMembership() {
            doThrow(new com.neighbornest.nest.exception.ForbiddenException("You are not an active member of this nest"))
                    .when(nestService).requireMember(1L, 9L);

            assertThatThrownBy(() -> expenseService.createExpense(1L, 9L,
                    ExpenseRequest.builder()
                            .amount(BigDecimal.valueOf(50.00))
                            .description("Dinner")
                            .splitType(SplitType.EQUAL)
                            .build()))
                    .isInstanceOf(com.neighbornest.nest.exception.ForbiddenException.class);

            verify(expenseRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("listExpenses method")
    class ListExpensesTests {

        @Test
        @DisplayName("Should return expenses with splits for a member")
        void shouldReturnExpenses() {
            final Expense expense = expense(10L, BigDecimal.valueOf(100.00));
            when(expenseRepository.findByNestIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(expense));
            when(expenseSplitRepository.findByExpenseId(10L)).thenReturn(List.of(split(10L, 1L, false)));

            final List<ExpenseResponse> responses = expenseService.listExpenses(1L, 7L);

            verify(nestService).requireMember(1L, 7L);
            assertThat(responses).hasSize(1);
            assertThat(responses.get(0).getSplits()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("settleSplit method")
    class SettleSplitTests {

        @Test
        @DisplayName("Should mark the user's split as settled")
        void shouldSettleSplit() {
            final Expense expense = expense(10L, BigDecimal.valueOf(100.00));
            final ExpenseSplit split = split(10L, 7L, false);
            when(expenseRepository.findById(10L)).thenReturn(Optional.of(expense));
            when(expenseSplitRepository.findByExpenseIdAndUserId(10L, 7L)).thenReturn(Optional.of(split));
            when(expenseSplitRepository.findByExpenseId(10L)).thenReturn(List.of(split));

            final ExpenseResponse response = expenseService.settleSplit(1L, 10L, 7L);

            assertThat(split.isSettled()).isTrue();
            verify(expenseSplitRepository).save(split);
            assertThat(response.getSplits().get(0).isSettled()).isTrue();
        }

        @Test
        @DisplayName("Should be idempotent for an already-settled split")
        void shouldBeIdempotent() {
            final Expense expense = expense(10L, BigDecimal.valueOf(100.00));
            final ExpenseSplit split = split(10L, 7L, true);
            when(expenseRepository.findById(10L)).thenReturn(Optional.of(expense));
            when(expenseSplitRepository.findByExpenseIdAndUserId(10L, 7L)).thenReturn(Optional.of(split));
            when(expenseSplitRepository.findByExpenseId(10L)).thenReturn(List.of(split));

            final ExpenseResponse response = expenseService.settleSplit(1L, 10L, 7L);

            verify(expenseSplitRepository, never()).save(any());
            assertThat(response.getSplits().get(0).isSettled()).isTrue();
        }

        @Test
        @DisplayName("Should throw when the expense is not in the nest")
        void shouldRejectExpenseFromAnotherNest() {
            final Expense expense = expense(10L, BigDecimal.valueOf(100.00));
            expense.setNestId(2L);
            when(expenseRepository.findById(10L)).thenReturn(Optional.of(expense));

            assertThatThrownBy(() -> expenseService.settleSplit(1L, 10L, 7L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Expense not found");
        }

        @Test
        @DisplayName("Should throw when the user has no split on the expense")
        void shouldRejectUserWithoutSplit() {
            when(expenseRepository.findById(10L)).thenReturn(Optional.of(expense(10L, BigDecimal.valueOf(100.00))));
            when(expenseSplitRepository.findByExpenseIdAndUserId(10L, 7L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> expenseService.settleSplit(1L, 10L, 7L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("No split found");
        }
    }

    private Expense expense(final Long id, final BigDecimal amount) {
        return Expense.builder()
                .id(id)
                .nestId(1L)
                .payerId(1L)
                .amount(amount)
                .description("Group dinner")
                .splitType(SplitType.EQUAL)
                .createdAt(LocalDateTime.now())
                .build();
    }

    private ExpenseSplit split(final Long expenseId, final Long userId, final boolean settled) {
        return ExpenseSplit.builder()
                .expenseId(expenseId)
                .userId(userId)
                .amountOwed(BigDecimal.valueOf(50.00))
                .settled(settled)
                .build();
    }

    private NestMember activeMember(final Long nestId, final Long userId) {
        return NestMember.builder()
                .id(userId)
                .nestId(nestId)
                .userId(userId)
                .roleInNest(NestRole.MEMBER)
                .status(NestMemberStatus.ACCEPTED)
                .build();
    }
}
