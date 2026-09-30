import { cn } from "@/lib/utils/cn";

import type { SpinnerProps } from "./Spinner.types";

const SIZES = { sm: "size-3.5", md: "size-4", lg: "size-6" } as const;

export function Spinner({ size = "md", label = "Loading", className, ...props }: SpinnerProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      role={label ? "status" : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
      className={cn("animate-spin", SIZES[size], className)}
      {...props}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
