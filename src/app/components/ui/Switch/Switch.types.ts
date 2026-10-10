import type { Switch as RadixSwitch } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";

export interface SwitchProps extends ComponentProps<typeof RadixSwitch.Root> {
  label?: ReactNode;
  description?: ReactNode;
}
