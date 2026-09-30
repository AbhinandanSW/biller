import type { ComponentProps } from "react";
import type { DropdownMenu as RadixDropdownMenu } from "radix-ui";

export type DropdownMenuContentProps = ComponentProps<typeof RadixDropdownMenu.Content>;

export interface DropdownMenuItemProps extends ComponentProps<typeof RadixDropdownMenu.Item> {
  variant?: "default" | "danger";
}
