"use client";

import { Slot } from "radix-ui";

import { Spinner } from "../Spinner";
import { buttonClassName } from "./button-styles";
import type { ButtonProps } from "./Button.types";

export function Button({
  variant,
  size,
  loading = false,
  asChild = false,
  disabled,
  className,
  children,
  type,
  ...props
}: ButtonProps) {
  const classes = buttonClassName({ variant, size, className });

  if (asChild) {
    return (
      <Slot.Root className={classes} aria-disabled={disabled || undefined} {...props}>
        {children}
      </Slot.Root>
    );
  }

  return (
    <button
      type={type ?? "button"}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner size="sm" label={null} />}
      {children}
    </button>
  );
}
