import { cn } from "@/lib/utils/cn";

import type { SkeletonProps } from "./Skeleton.types";

/** Placeholder block shown while content loads. Size it with className. */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-surface-muted", className)}
      {...props}
    />
  );
}
