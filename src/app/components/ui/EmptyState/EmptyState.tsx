import { cn } from "@/utils/cn";

import type { EmptyStateProps } from "./EmptyState.types";

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      {icon && (
        <div className="flex size-10 items-center justify-center rounded-full bg-surface-muted text-muted-foreground [&_svg]:size-5">
          {icon}
        </div>
      )}
      <div className="flex max-w-sm flex-col gap-1">
        <h3 className="text-title">{title}</h3>
        {description && <p className="text-body text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
