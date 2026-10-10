import type { Checkbox as RadixCheckbox } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";

export interface CheckboxProps extends ComponentProps<typeof RadixCheckbox.Root> {
  /** Inline label shown to the right. Omit when the checkbox sits inside a Field or table. */
  label?: ReactNode;
}
