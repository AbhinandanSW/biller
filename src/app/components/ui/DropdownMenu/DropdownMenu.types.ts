import type { DropdownMenu as RadixDropdownMenu } from "radix-ui";
import type { ComponentProps } from "react";

export type DropdownMenuContentProps = ComponentProps<typeof RadixDropdownMenu.Content>;

export interface DropdownMenuItemProps extends ComponentProps<typeof RadixDropdownMenu.Item> {
  variant?: "default" | "danger";
}
