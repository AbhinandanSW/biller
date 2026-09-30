import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils/cn";

import type { AlertProps, AlertVariant } from "./Alert.types";

const VARIANTS: Record<AlertVariant, { className: string; icon: React.ReactNode }> = {
  info: {
    className: "border-primary/20 bg-primary-subtle [&>svg]:text-primary",
    icon: <Info aria-hidden />,
  },
  success: {
    className: "border-success/20 bg-success-subtle [&>svg]:text-success",
    icon: <CircleCheck aria-hidden />,
  },
  warning: {
    className: "border-warning/20 bg-warning-subtle [&>svg]:text-warning",
    icon: <TriangleAlert aria-hidden />,
  },
  danger: {
    className: "border-danger/20 bg-danger-subtle [&>svg]:text-danger",
    icon: <CircleAlert aria-hidden />,
  },
};

/** Inline message. Danger alerts are announced immediately to screen readers. */
export function Alert({ variant = "info", title, className, children, ...props }: AlertProps) {
  const { className: variantClassName, icon } = VARIANTS[variant];
  return (
    <div
      role={variant === "danger" ? "alert" : "status"}
      className={cn(
        "flex gap-3 rounded-md border p-3 text-body [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0",
        variantClassName,
        className,
      )}
      {...props}
    >
      {icon}
      <div className="flex flex-col gap-0.5">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className="text-foreground/80">{children}</div>}
      </div>
    </div>
  );
}
