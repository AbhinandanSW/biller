"use client";

import { Check, ChevronDown } from "lucide-react";
import { Select as RadixSelect } from "radix-ui";

import { cn } from "@/utils/cn";

import { useFieldControl } from "../Field";
import { controlClassName } from "../Field/control-styles";
import type { SelectProps } from "./Select.types";

export function Select(props: SelectProps) {
  const {
    options,
    placeholder = "Select…",
    name,
    value,
    defaultValue,
    onValueChange,
    disabled,
    required,
    className,
    ...triggerProps
  } = useFieldControl(props);

  return (
    <RadixSelect.Root
      name={name}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
      required={required}
    >
      <RadixSelect.Trigger
        className={cn(
          controlClassName,
          "flex h-9 items-center justify-between gap-2 px-3 text-left",
          "data-placeholder:text-muted-foreground",
          className,
        )}
        {...triggerProps}
      >
        <span className="truncate">
          <RadixSelect.Value placeholder={placeholder} />
        </span>
        <RadixSelect.Icon className="text-muted-foreground">
          <ChevronDown className="size-4" aria-hidden />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={4}
          className={cn(
            "z-50 max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width) overflow-hidden",
            "animate-fade-in rounded-md border border-border bg-surface shadow-overlay",
          )}
        >
          <RadixSelect.Viewport className="p-1">
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={cn(
                  "relative flex h-8 cursor-default items-center rounded-sm pr-8 pl-2 text-body outline-none select-none",
                  "data-disabled:opacity-50 data-highlighted:bg-surface-muted",
                )}
              >
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className="absolute right-2 text-primary">
                  <Check className="size-4" aria-hidden />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
