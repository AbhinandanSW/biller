import type { ComponentProps, ReactNode } from "react";

export type CardProps = ComponentProps<"section">;

export interface CardHeaderProps extends Omit<ComponentProps<"div">, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  /** Buttons or links aligned to the right of the title. */
  actions?: ReactNode;
}
