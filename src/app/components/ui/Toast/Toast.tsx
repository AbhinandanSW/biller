"use client";

import { CircleAlert, CircleCheck, X } from "lucide-react";
import { Toast as RadixToast } from "radix-ui";
import { useSyncExternalStore } from "react";

import { cn } from "@/utils/cn";

import { dismiss, getServerSnapshot, getSnapshot, subscribe } from "./toast-store";
import type { ToastVariant } from "./Toast.types";

const ICONS: Record<ToastVariant, React.ReactNode> = {
  default: null,
  success: <CircleCheck className="size-5 text-success" aria-hidden />,
  danger: <CircleAlert className="size-5 text-danger" aria-hidden />,
};

/** Renders toasts created with toast(). Mount once, in the root layout. */
export function Toaster() {
  const toasts = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <RadixToast.Provider swipeDirection="right">
      {toasts.map(({ id, title, description, variant = "default", duration = 5000 }) => (
        <RadixToast.Root
          key={id}
          duration={duration}
          // Errors are announced immediately; others wait politely.
          type={variant === "danger" ? "foreground" : "background"}
          onOpenChange={(open) => !open && dismiss(id)}
          className={cn(
            "flex w-full items-start gap-3 rounded-lg border border-border bg-surface p-4 shadow-overlay",
            "animate-slide-in-bottom sm:animate-slide-in-right",
            "data-[swipe=end]:hidden data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x)",
          )}
        >
          {ICONS[variant]}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <RadixToast.Title className="text-label">{title}</RadixToast.Title>
            {description && (
              <RadixToast.Description className="text-body text-muted-foreground">
                {description}
              </RadixToast.Description>
            )}
          </div>
          <RadixToast.Close
            aria-label="Dismiss"
            className="-m-1 rounded-sm p-1 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            <X className="size-4" aria-hidden />
          </RadixToast.Close>
        </RadixToast.Root>
      ))}
      <RadixToast.Viewport className="fixed right-0 bottom-0 z-[100] flex w-full flex-col gap-2 p-4 outline-none sm:max-w-sm print:hidden" />
    </RadixToast.Provider>
  );
}
