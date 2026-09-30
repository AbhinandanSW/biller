import type { ComponentProps } from "react";

export interface TableCellProps extends ComponentProps<"td"> {
  /** Right-aligns with tabular figures — use for money and quantities. */
  numeric?: boolean;
}

export interface TableHeadProps extends ComponentProps<"th"> {
  numeric?: boolean;
}
