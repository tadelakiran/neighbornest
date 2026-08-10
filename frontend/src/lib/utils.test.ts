import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';
import { formatCurrency, getErrorMessage, getInitials } from '@/lib/utils';

describe('formatCurrency', () => {
  it('omits cents for whole amounts', () => {
    expect(formatCurrency(15)).toBe('$15');
    expect(formatCurrency(0)).toBe('$0');
  });

  it('includes cents for fractional amounts', () => {
    expect(formatCurrency(12.5)).toBe('$12.50');
    expect(formatCurrency(10.125)).toBe('$10.13');
  });

  it('handles non-finite input gracefully', () => {
    expect(formatCurrency(Number.NaN)).toBe('$0');
    expect(formatCurrency(Number.POSITIVE_INFINITY)).toBe('$0');
  });

  it('formats negative balances', () => {
    expect(formatCurrency(-45.5)).toBe('-$45.50');
  });
});

describe('getInitials', () => {
  it('derives initials from a full name', () => {
    expect(getInitials('Priya Sharma')).toBe('PS');
  });

  it('falls back for missing names', () => {
    expect(getInitials(null)).toBe('?');
    expect(getInitials('')).toBe('?');
  });
});

describe('getErrorMessage', () => {
  it('reads the API error message', () => {
    const error = new AxiosError(undefined, undefined, undefined, undefined, {
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: { message: 'Splits must equal the total' },
    } as never);
    expect(getErrorMessage(error, 'fallback')).toBe('Splits must equal the total');
  });

  it('prefers field-level validation errors', () => {
    const error = new AxiosError(undefined, undefined, undefined, undefined, {
      status: 422,
      statusText: 'Unprocessable',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: { message: 'Invalid input', validationErrors: { amount: 'Amount is required' } },
    } as never);
    expect(getErrorMessage(error, 'fallback')).toBe('Amount is required');
  });

  it('falls back for network failures', () => {
    const error = new AxiosError('Network Error', 'ERR_NETWORK');
    expect(getErrorMessage(error, 'fallback')).toBe('Cannot reach the server. Please check your connection.');
  });

  it('returns the fallback for unknown errors', () => {
    expect(getErrorMessage('nope', 'fallback')).toBe('fallback');
  });
});
