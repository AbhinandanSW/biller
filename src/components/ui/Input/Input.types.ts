import type { ComponentProps, ReactNode } from "react";

export interface InputProps extends Omit<ComponentProps<"input">, "prefix"> {
  /** Content inside the field before the text, e.g. "₹" or a search icon. */
  prefix?: ReactNode;
  /** Content inside the field after the text, e.g. "%" or a unit. */
  suffix?: ReactNode;
}
