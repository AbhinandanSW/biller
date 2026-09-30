import type { ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

import type { CardHeaderProps, CardProps } from "./Card.types";

export function Card({ className, ...props }: CardProps) {
  return (
    <section
      className={cn("rounded-lg border border-border bg-surface shadow-card", className)}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  actions,
  className,
  children,
  ...props
}: CardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 pt-5", className)} {...props}>
      <div className="flex min-w-0 flex-col gap-1">
        {title && <h2 className="text-title">{title}</h2>}
        {description && <p className="text-body text-muted-foreground">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("px-5 py-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 border-t border-border px-5 py-3",
        className,
      )}
      {...props}
    />
  );
}
