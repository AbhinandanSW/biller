import type { AriaAttributes, ReactNode } from "react";

export interface FieldProps {
  label: ReactNode;
  /** Hint shown under the control. */
  description?: ReactNode;
  /** Error message. Marks the control invalid and is announced to screen readers. */
  error?: ReactNode;
  required?: boolean;
  /** Visually hide the label (it is still read by screen readers). */
  hideLabel?: boolean;
  className?: string;
  /** Explicit id for the control. Generated when omitted. */
  id?: string;
  children: ReactNode;
}

/** What a control needs to wire itself to its Field. */
export interface FieldControlProps {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: AriaAttributes["aria-invalid"];
  required?: boolean;
}
