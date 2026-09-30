import type { ReactNode } from "react";

export type ToastVariant = "default" | "success" | "danger";

export interface ToastOptions {
  title: ReactNode;
  description?: ReactNode;
  variant?: ToastVariant;
  /** Milliseconds before auto-dismiss. Defaults to 5000. */
  duration?: number;
}

export interface ToastItem extends ToastOptions {
  id: number;
}
