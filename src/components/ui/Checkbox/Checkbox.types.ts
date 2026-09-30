import type { ComponentProps, ReactNode } from "react";
import type { Checkbox as RadixCheckbox } from "radix-ui";

export interface CheckboxProps extends ComponentProps<typeof RadixCheckbox.Root> {
  /** Inline label shown to the right. Omit when the checkbox sits inside a Field or table. */
  label?: ReactNode;
}
