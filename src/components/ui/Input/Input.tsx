"use client";

import { cn } from "@/lib/utils/cn";

import { useFieldControl } from "../Field";
import { controlClassName } from "../Field/control-styles";
import type { InputProps } from "./Input.types";

export function Input({ prefix, suffix, className, type = "text", ...props }: InputProps) {
  const controlProps = useFieldControl(props);
  const input = (
    <input
      type={type}
      className={cn(
        controlClassName,
        "h-9 px-3",
        prefix != null && "pl-8",
        suffix != null && "pr-10",
        !prefix && !suffix && className,
      )}
      {...controlProps}
    />
  );

  if (prefix == null && suffix == null) return input;

  return (
    <div className={cn("relative flex items-center", className)}>
      {prefix != null && (
        <span className="pointer-events-none absolute left-3 flex text-muted-foreground [&_svg]:size-4">
          {prefix}
        </span>
      )}
      {input}
      {suffix != null && (
        <span className="pointer-events-none absolute right-3 flex text-muted-foreground [&_svg]:size-4">
          {suffix}
        </span>
      )}
    </div>
  );
}
