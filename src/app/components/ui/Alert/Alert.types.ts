import type { ComponentProps, ReactNode } from "react";

export type AlertVariant = "info" | "success" | "warning" | "danger";

export interface AlertProps extends Omit<ComponentProps<"div">, "title"> {
  variant?: AlertVariant;
  title?: ReactNode;
}
