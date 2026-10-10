"use client";

import { Label, Switch as RadixSwitch } from "radix-ui";
import { useId } from "react";

import { cn } from "@/utils/cn";

import type { SwitchProps } from "./Switch.types";

export function Switch({ label, description, className, id, ...props }: SwitchProps) {
  const generatedId = useId();
  const switchId = id ?? generatedId;
  const descriptionId = description ? `${switchId}-description` : undefined;

  const control = (
    <RadixSwitch.Root
      id={switchId}
      aria-describedby={descriptionId}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-border-strong transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary",
        !label && className,
      )}
      {...props}
    >
      <RadixSwitch.Thumb className="block size-4 translate-x-0.5 rounded-full bg-white shadow-card transition-transform data-[state=checked]:translate-x-[18px]" />
    </RadixSwitch.Root>
  );

  if (!label) return control;

  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex flex-col gap-0.5">
        <Label.Root htmlFor={switchId} className="text-label">
          {label}
        </Label.Root>
        {description && (
          <p id={descriptionId} className="text-caption text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {control}
    </div>
  );
}
