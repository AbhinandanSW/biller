import type { ReactNode } from "react";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Usually the primary action, e.g. "+ Add product". */
  action?: ReactNode;
  className?: string;
}
