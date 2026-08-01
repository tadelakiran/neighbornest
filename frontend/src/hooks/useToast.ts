import { useCallback } from 'react';
import { useToastStore } from '@/stores/toastStore';
import type { ToastType } from '@/types/auth.types';

/**
 * Hook exposing a small, stable toast API backed by the global toast store.
 *
 * @returns `{ toast, success, error, info }` — all memoized and safe to use in deps arrays
 */
export function useToast() {
  const addToast = useToastStore((state) => state.addToast);

  /** Show a toast with an explicit type. */
  const toast = useCallback(
    (message: string, type: ToastType = 'info') => addToast(message, type),
    [addToast]
  );

  /** Show a success toast. */
  const success = useCallback((message: string) => addToast(message, 'success'), [addToast]);

  /** Show an error toast. */
  const error = useCallback((message: string) => addToast(message, 'error'), [addToast]);

  /** Show an informational toast. */
  const info = useCallback((message: string) => addToast(message, 'info'), [addToast]);

  return { toast, success, error, info };
}
