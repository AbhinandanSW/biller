"use client";

import { cn } from "@/lib/utils/cn";

import { useFieldControl } from "../Field";
import { controlClassName } from "../Field/control-styles";
import type { TextareaProps } from "./Textarea.types";

export function Textarea({ className, rows = 3, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={cn(controlClassName, "min-h-20 px-3 py-2", className)}
      {...useFieldControl(props)}
    />
  );
}
