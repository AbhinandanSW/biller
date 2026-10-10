import type { ToastItem, ToastOptions } from "./Toast.types";

// Tiny external store so toast() can be called from anywhere (event
// handlers, after server actions) without a context provider.

let toasts: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const EMPTY: ToastItem[] = [];

function emit() {
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot() {
  return toasts;
}

export function getServerSnapshot() {
  return EMPTY;
}

export function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

/** Shows a toast. Requires <Toaster /> to be mounted (it is, in the root layout). */
export function toast(options: ToastOptions): number {
  const id = nextId++;
  // Keep at most 3 on screen.
  toasts = [...toasts, { ...options, id }].slice(-3);
  emit();
  return id;
}

toast.success = (title: ToastOptions["title"], description?: ToastOptions["description"]) =>
  toast({ title, description, variant: "success" });
toast.error = (title: ToastOptions["title"], description?: ToastOptions["description"]) =>
  toast({ title, description, variant: "danger" });
