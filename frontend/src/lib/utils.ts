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
