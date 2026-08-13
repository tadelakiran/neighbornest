import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AxiosError } from 'axios';
import type { ApiError } from '@/types/auth.types';

/**
 * Merges Tailwind class names, resolving conflicts with tailwind-merge.
 * Use this helper everywhere conditional classes are composed.
 *
 * @param inputs - class values (strings, arrays, falsy guards)
 * @returns a single merged className string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Extracts a human-friendly error message from an unknown thrown value.
 * Handles Axios errors (reading the standardized API error body), network
 * failures, and plain `Error` instances.
 *
 * @param error - the caught value (AxiosError, Error, or anything else)
 * @param fallback - message to use when nothing readable is found
 * @returns a displayable error message
 */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof AxiosError) {
    const data = (error as AxiosError<ApiError>).response?.data;
    if (data) {
      // Prefer the first field-level validation error, then the general message.
      const firstValidationError = data.validationErrors
        ? Object.values(data.validationErrors)[0]
        : undefined;
      return firstValidationError ?? data.message ?? fallback;
    }
    if (error.code === 'ERR_NETWORK') {
      return 'Cannot reach the server. Please check your connection.';
    }
    if (error.request) {
      return 'No response from the server. Please try again.';
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

/**
 * Formats an ISO date string into a short human-readable date (e.g. "Jan 2025").
 *
 * @param iso - ISO 8601 timestamp or null
 * @returns a short month-year string, or "—" when missing/invalid
 */
export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
}

/**
 * Formats a number as an Indian Rupee currency string (e.g. 12.5 -> "₹12.50").
 *
 * Uses the en-IN digit grouping (12,34,567) with a leading ₹ symbol so the
 * output is stable across browser locales. NaN/infinity become ₹0.
 *
 * @param value - the amount to format (NaN/infinity become ₹0)
 * @returns a compact currency string without cents when whole
 */
export function formatCurrency(value: number): string {
  const amount = Number.isFinite(value) ? value : 0;
  const whole = Math.abs(amount % 1) < 0.005;
  const sign = amount < 0 ? '-' : '';
  const formatted = Math.abs(amount).toLocaleString('en-IN', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${sign}₹${formatted}`;
}

/**
 * Derives up to two initials from a person's full name for avatar fallbacks.
 *
 * @param name - the person's full name (may be null/undefined)
 * @returns uppercase initials, e.g. "John Doe" -> "JD"
 */
export function getInitials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${second}`.toUpperCase() || '?';
}

/**
 * Formats an ISO timestamp for chat bubbles (e.g. "14:32" today,
 * "12 Aug" otherwise).
 *
 * @param iso - ISO 8601 timestamp
 * @returns a compact time/date string
 */
export function formatMessageTime(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/**
 * Formats a timestamp as a short relative time for notification lists
 * (e.g. "now", "5m", "2h", "3d", then a date).
 *
 * @param iso - ISO 8601 timestamp or null
 * @returns a compact relative-time string
 */
export function formatRelativeTime(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
