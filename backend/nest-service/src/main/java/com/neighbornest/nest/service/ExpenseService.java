package com.neighbornest.nest.service;

import com.neighbornest.nest.dto.request.ExpenseRequest;
import com.neighbornest.nest.dto.response.ExpenseResponse;
import com.neighbornest.nest.dto.response.ExpenseSplitResponse;
import com.neighbornest.nest.entity.Expense;
import com.neighbornest.nest.entity.ExpenseSplit;
import com.neighbornest.nest.entity.NestMember;
import com.neighbornest.nest.entity.NestMemberStatus;
import com.neighbornest.nest.entity.SplitType;
import com.neighbornest.nest.exception.BadRequestException;
import com.neighbornest.nest.exception.ResourceNotFoundException;
import com.neighbornest.nest.repository.ExpenseRepository;
import com.neighbornest.nest.repository.ExpenseSplitRepository;
import com.neighbornest.nest.repository.NestMemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * Service handling Nest expenses and their splits.
 * <p>
 * Supports both EQUAL splitting across active members and CUSTOM splitting
 * via explicit per-user amounts.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ExpenseSplitRepository expenseSplitRepository;
    private final NestMemberRepository nestMemberRepository;
    private final NestService nestService;

    /**
     * Creates an expense with its splits for a Nest.
     *
     * @param nestId  the nest ID
     * @param payerId the user profile ID of the payer
     * @param request the expense request
     * @return the created expense with splits
     * @throws BadRequestException if custom splits are invalid
     */
    @Transactional
    public ExpenseResponse createExpense(final Long nestId, final Long payerId, final ExpenseRequest request) {
        nestService.requireMember(nestId, payerId);

        final Expense expense = Expense.builder()
                .nestId(nestId)
                .payerId(payerId)
                .amount(request.getAmount())
                .description(request.getDescription())
                .splitType(request.getSplitType())
                .build();

        final Expense saved = expenseRepository.save(expense);

        final List<ExpenseSplit> splits = request.getSplitType() == SplitType.CUSTOM
                ? createCustomSplits(saved, request)
                : createEqualSplits(saved, nestId);

        expenseSplitRepository.saveAll(splits);
        log.info("Expense created with id: {} for nest: {}", saved.getId(), nestId);

        return toResponse(saved, splits);
    }

    /**
     * Lists all expenses for a Nest with their splits.
     *
     * @param nestId the nest ID
     * @param userId the user profile ID (must be a member)
     * @return the list of expenses
     */
    @Transactional(readOnly = true)
    public List<ExpenseResponse> listExpenses(final Long nestId, final Long userId) {
        nestService.requireMember(nestId, userId);

        return expenseRepository.findByNestIdOrderByCreatedAtDesc(nestId).stream()
                .map(expense -> toResponse(expense, expenseSplitRepository.findByExpenseId(expense.getId())))
                .toList();
    }

    /**
     * Marks the current user's split of an expense as settled ("settle up").
     * <p>
     * Only the member who owes the share can settle their own split. Settling
     * an already-settled split is idempotent — the current state is returned.
     * </p>
     *
     * @param nestId    the nest ID
     * @param expenseId the expense ID
     * @param userId    the user profile ID settling their share
     * @return the updated expense
     * @throws ResourceNotFoundException if the Nest or the expense or the user's split does not exist
     */
    @Transactional
    public ExpenseResponse settleSplit(final Long nestId, final Long expenseId, final Long userId) {
        final Expense expense = expenseRepository.findById(expenseId)
                .filter(e -> e.getNestId().equals(nestId))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Expense not found with id: " + expenseId + " in nest: " + nestId));

        final ExpenseSplit split = expenseSplitRepository.findByExpenseIdAndUserId(expenseId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No split found for user: " + userId + " on expense: " + expenseId));

        if (!split.isSettled()) {
            split.setSettled(true);
            expenseSplitRepository.save(split);
            log.info("User {} settled their split on expense: {}", userId, expenseId);
        }

        return toResponse(expense, expenseSplitRepository.findByExpenseId(expenseId));
    }

    /**
     * Builds equal splits across all active members.
     *
     * @param expense the expense entity
     * @param nestId  the nest ID
     * @return the list of splits
     */
    private List<ExpenseSplit> createEqualSplits(final Expense expense, final Long nestId) {
        final List<Long> activeMembers = nestMemberRepository.findByNestId(nestId).stream()
                .filter(member -> member.getStatus() == NestMemberStatus.ACCEPTED)
                .map(NestMember::getUserId)
                .toList();

        if (activeMembers.isEmpty()) {
            throw new BadRequestException("Nest has no active members to split the expense with");
        }

        final BigDecimal share = expense.getAmount().divide(BigDecimal.valueOf(activeMembers.size()), 2, RoundingMode.HALF_UP);

        return activeMembers.stream()
                .map(userId -> ExpenseSplit.builder()
                        .expenseId(expense.getId())
                        .userId(userId)
                        .amountOwed(share)
                        .build())
                .toList();
    }

    /**
     * Builds custom splits from the request.
     *
     * @param expense the expense entity
     * @param request the expense request
     * @return the list of splits
     * @throws BadRequestException if splits are missing or exceed the total
     */
    private List<ExpenseSplit> createCustomSplits(final Expense expense, final ExpenseRequest request) {
        if (request.getSplits() == null || request.getSplits().isEmpty()) {
            throw new BadRequestException("Custom splits are required when splitType is CUSTOM");
        }

        final List<Long> activeMembers = nestMemberRepository.findByNestId(expense.getNestId()).stream()
                .filter(member -> member.getStatus() == NestMemberStatus.ACCEPTED)
                .map(NestMember::getUserId)
                .toList();

        final boolean containsNonMember = request.getSplits().stream()
                .anyMatch(split -> !activeMembers.contains(split.getUserId()));
        if (containsNonMember) {
            throw new BadRequestException("Custom splits can only reference active members of the nest");
        }

        final BigDecimal total = request.getSplits().stream()
                .map(split -> split.getAmountOwed())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (total.compareTo(expense.getAmount()) != 0) {
            throw new BadRequestException("Custom split amounts must equal the expense total");
        }

        return request.getSplits().stream()
                .map(split -> ExpenseSplit.builder()
                        .expenseId(expense.getId())
                        .userId(split.getUserId())
                        .amountOwed(split.getAmountOwed())
                        .build())
                .toList();
    }

    /**
     * Maps an expense and its splits to a response DTO.
     *
     * @param expense the expense entity
     * @param splits  the split entities
     * @return the response DTO
     */
    private ExpenseResponse toResponse(final Expense expense, final List<ExpenseSplit> splits) {
        return ExpenseResponse.builder()
                .id(expense.getId())
                .payerId(expense.getPayerId())
                .amount(expense.getAmount())
                .description(expense.getDescription())
                .splitType(expense.getSplitType())
                .splits(splits.stream().map(this::toSplitResponse).toList())
                .createdAt(expense.getCreatedAt())
                .build();
    }

    /**
     * Maps a split entity to its response DTO.
     *
     * @param split the split entity
     * @return the response DTO
     */
    private ExpenseSplitResponse toSplitResponse(final ExpenseSplit split) {
        return ExpenseSplitResponse.builder()
                .userId(split.getUserId())
                .amountOwed(split.getAmountOwed())
                .settled(split.isSettled())
                .build();
    }
}
