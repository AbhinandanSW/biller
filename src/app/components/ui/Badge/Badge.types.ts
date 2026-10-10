import type { ComponentProps } from "react";

export type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "danger";

export interface BadgeProps extends ComponentProps<"span"> {
  variant?: BadgeVariant;
  /** Leading status dot. */
  dot?: boolean;
}
