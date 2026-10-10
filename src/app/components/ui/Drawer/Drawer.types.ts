import type { DialogContentProps } from "../Dialog";

export interface DrawerContentProps extends Omit<DialogContentProps, "size"> {
  /** "bottom" suits mobile sheets. */
  side?: "right" | "left" | "bottom";
}
