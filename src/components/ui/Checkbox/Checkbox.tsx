"use client";

import { Check, Minus } from "lucide-react";
import { Checkbox as RadixCheckbox, Label } from "radix-ui";
import { useId } from "react";

import { cn } from "@/lib/utils/cn";

import type { CheckboxProps } from "./Checkbox.types";

export function Checkbox({ label, className, id, ...props }: CheckboxProps) {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;

  const checkbox = (
    <RadixCheckbox.Root
      id={checkboxId}
      className={cn(
        "peer flex size-4 shrink-0 items-center justify-center rounded-sm border border-border-strong bg-surface",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        "data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground",
        "disabled:cursor-not-allowed disabled:opacity-50",
        !label && className,
      )}
      {...props}
    >
      <RadixCheckbox.Indicator>
        {props.checked === "indeterminate" ? (
          <Minus className="size-3" strokeWidth={3} aria-hidden />
        ) : (
          <Check className="size-3" strokeWidth={3} aria-hidden />
        )}
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );

  if (!label) return checkbox;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {checkbox}
      <Label.Root htmlFor={checkboxId} className="text-body peer-disabled:opacity-50">
        {label}
      </Label.Root>
    </div>
  );
}
