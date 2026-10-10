"use client";

import { Label } from "radix-ui";
import { createContext, useContext, useId } from "react";

import { cn } from "@/utils/cn";

import type { FieldControlProps, FieldProps } from "./Field.types";

const FieldContext = createContext<FieldControlProps | null>(null);

/**
 * Props for a control inside a <Field>: id, aria-describedby, aria-invalid and
 * required. Explicit props passed to the control win.
 */
export function useFieldControl<T extends FieldControlProps>(props: T): T {
  const field = useContext(FieldContext);
  if (!field) return props;
  return {
    ...props,
    id: props.id ?? field.id,
    "aria-describedby":
      [field["aria-describedby"], props["aria-describedby"]].filter(Boolean).join(" ") || undefined,
    "aria-invalid": props["aria-invalid"] ?? field["aria-invalid"],
    required: props.required ?? field.required,
  };
}

/** Label, hint and error for one form control, wired up for accessibility. */
export function Field({
  label,
  description,
  error,
  required,
  hideLabel,
  className,
  id,
  children,
}: FieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const descriptionId = description ? `${controlId}-description` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;

  return (
    <FieldContext.Provider
      value={{
        id: controlId,
        "aria-describedby": [descriptionId, errorId].filter(Boolean).join(" ") || undefined,
        "aria-invalid": error ? true : undefined,
        required,
      }}
    >
      <div className={cn("flex flex-col gap-1.5", className)}>
        <Label.Root
          htmlFor={controlId}
          className={cn("text-label text-foreground", hideLabel && "sr-only")}
        >
          {label}
          {required && (
            <span className="text-danger" aria-hidden>
              {" *"}
            </span>
          )}
        </Label.Root>
        {children}
        {description && !error && (
          <p id={descriptionId} className="text-caption text-muted-foreground">
            {description}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-caption text-danger">
            {error}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  );
}
