import type { AriaAttributes, ReactNode } from "react";

export interface ComboboxOption {
  value: string;
  label: string;
  /** Second line, e.g. city or GSTIN. Also searched. */
  description?: string;
}

export interface ComboboxProps {
  options: readonly ComboboxOption[];
  value: string | null;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  /** Extra content under the list, e.g. an "Add new" link. */
  footer?: ReactNode;
  id?: string;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: AriaAttributes["aria-invalid"];
}
