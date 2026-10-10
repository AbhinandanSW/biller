"use client";

import { DropdownMenu as RadixDropdownMenu } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/utils/cn";

import type { DropdownMenuContentProps, DropdownMenuItemProps } from "./DropdownMenu.types";

export const DropdownMenu = RadixDropdownMenu.Root;
export const DropdownMenuTrigger = RadixDropdownMenu.Trigger;

export function DropdownMenuContent({
  className,
  sideOffset = 4,
  align = "end",
  ...props
}: DropdownMenuContentProps) {
  return (
    <RadixDropdownMenu.Portal>
      <RadixDropdownMenu.Content
        sideOffset={sideOffset}
        align={align}
        className={cn(
          "z-50 min-w-48 animate-fade-in rounded-md border border-border bg-surface p-1 shadow-overlay",
          className,
        )}
        {...props}
      />
    </RadixDropdownMenu.Portal>
  );
}

export function DropdownMenuItem({
  variant = "default",
  className,
  ...props
}: DropdownMenuItemProps) {
  return (
    <RadixDropdownMenu.Item
      className={cn(
        "flex h-8 cursor-default items-center gap-2 rounded-sm px-2 text-body outline-none select-none",
        "data-disabled:opacity-50 data-highlighted:bg-surface-muted [&_svg]:size-4 [&_svg]:text-muted-foreground",
        variant === "danger" && "text-danger [&_svg]:text-danger",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuLabel({
  className,
  ...props
}: ComponentProps<typeof RadixDropdownMenu.Label>) {
  return <RadixDropdownMenu.Label className={cn("px-2 py-1.5", className)} {...props} />;
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof RadixDropdownMenu.Separator>) {
  return (
    <RadixDropdownMenu.Separator className={cn("my-1 h-px bg-border", className)} {...props} />
  );
}
