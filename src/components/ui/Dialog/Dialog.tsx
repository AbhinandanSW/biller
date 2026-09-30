"use client";

import { X } from "lucide-react";
import { Dialog as RadixDialog, VisuallyHidden } from "radix-ui";

import { cn } from "@/lib/utils/cn";

import { buttonClassName } from "../Button";
import type { DialogContentProps } from "./Dialog.types";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;

const SIZES = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" } as const;

export function DialogOverlay() {
  return <RadixDialog.Overlay className="fixed inset-0 z-50 animate-fade-in bg-overlay" />;
}

export function DialogCloseButton({ className }: { className?: string }) {
  return (
    <RadixDialog.Close
      aria-label="Close"
      className={buttonClassName({
        variant: "ghost",
        size: "icon",
        className: cn("size-8", className),
      })}
    >
      <X aria-hidden />
    </RadixDialog.Close>
  );
}

export function DialogContent({
  title,
  description,
  hideTitle,
  footer,
  size = "md",
  className,
  children,
  ...props
}: DialogContentProps) {
  const heading = <RadixDialog.Title className="text-title">{title}</RadixDialog.Title>;

  return (
    <RadixDialog.Portal>
      <DialogOverlay />
      <RadixDialog.Content
        className={cn(
          "fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col",
          "animate-scale-in rounded-lg border border-border bg-surface shadow-overlay focus:outline-none",
          SIZES[size],
          className,
        )}
        // Without a description Radix warns unless this is explicitly undefined.
        {...(description ? {} : { "aria-describedby": undefined })}
        {...props}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
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
        {children && <div className="overflow-y-auto px-5 pb-5">{children}</div>}
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-3 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
