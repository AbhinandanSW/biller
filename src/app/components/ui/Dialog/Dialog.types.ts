import type { Dialog as RadixDialog } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";

export interface DialogContentProps extends Omit<
  ComponentProps<typeof RadixDialog.Content>,
  "title"
> {
  /** Required for accessibility. Use hideTitle to hide it visually. */
  title: ReactNode;
  description?: ReactNode;
  hideTitle?: boolean;
  /** Buttons row at the bottom, right-aligned. */
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}
