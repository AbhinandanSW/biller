"use client";

import { Dialog as RadixDialog, VisuallyHidden } from "radix-ui";

import { cn } from "@/utils/cn";

import { DialogCloseButton, DialogOverlay } from "../Dialog";
import type { DrawerContentProps } from "./Drawer.types";

// A drawer is a dialog anchored to an edge of the screen.
export const Drawer = RadixDialog.Root;
export const DrawerTrigger = RadixDialog.Trigger;
export const DrawerClose = RadixDialog.Close;

const SIDES = {
  right: "inset-y-0 right-0 h-dvh w-full max-w-md animate-slide-in-right border-l",
  left: "inset-y-0 left-0 h-dvh w-full max-w-xs animate-slide-in-left border-r",
  bottom: "inset-x-0 bottom-0 max-h-[85dvh] animate-slide-in-bottom rounded-t-lg border-t",
} as const;

export function DrawerContent({
  title,
  description,
  hideTitle,
  footer,
  side = "right",
  className,
  children,
  ...props
}: DrawerContentProps) {
  const heading = <RadixDialog.Title className="text-title">{title}</RadixDialog.Title>;

  return (
    <RadixDialog.Portal>
      <DialogOverlay />
      <RadixDialog.Content
        className={cn(
          "fixed z-50 flex flex-col border-border bg-surface shadow-overlay focus:outline-none",
          SIDES[side],
          className,
        )}
        {...(description ? {} : { "aria-describedby": undefined })}
        {...props}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="flex flex-col gap-1">
            {hideTitle ? <VisuallyHidden.Root>{heading}</VisuallyHidden.Root> : heading}
            {description && (
              <RadixDialog.Description className="text-body text-muted-foreground">
                {description}
              </RadixDialog.Description>
            )}
          </div>
          <DialogCloseButton className="-mt-1 -mr-2" />
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-3 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
