import type { ComponentProps } from "react";

export interface SpinnerProps extends ComponentProps<"svg"> {
  size?: "sm" | "md" | "lg";
  /** Announced to screen readers. Pass null when a parent already announces loading. */
  label?: string | null;
}
