import { create } from 'zustand';
import type { Toast, ToastType } from '@/types/auth.types';
import { TOAST_DURATION_MS } from '@/lib/constants';

/** Unique id counter for toast entries. */
let toastIdCounter = 0;

interface ToastState {
  /** Currently visible toasts, newest last. */
  toasts: Toast[];
  /** Adds a toast and schedules its auto-dismissal. */
  addToast: (message: string, type?: ToastType) => void;
  /** Removes a toast by id. */
  removeToast: (id: string) => void;
}

/**
 * Global toast notification store.
 * `addToast` auto-dismisses each toast after {@link TOAST_DURATION_MS}.
 * Prefer the `useToast` hook over using this store directly.
 */
export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (message, type = 'info') => {
    const id = `toast-${Date.now()}-${toastIdCounter++}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    window.setTimeout(() => get().removeToast(id), TOAST_DURATION_MS);
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));
