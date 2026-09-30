"use client";

import { Select, type SelectOption } from "@/components/ui";

import { useUrlState } from "./url-state";

/** A Select bound to one URL parameter. `defaultValue` is omitted from the URL. */
export function FilterSelect({
  param,
  label,
  options,
  defaultValue,
  className,
}: {
  param: string;
  label: string;
  options: readonly SelectOption[];
  defaultValue: string;
  className?: string;
}) {
  const { searchParams, set } = useUrlState();
  const value = searchParams.get(param) ?? defaultValue;

  return (
    <Select
      aria-label={label}
      options={options}
      value={value}
      onValueChange={(next) => set({ [param]: next === defaultValue ? null : next })}
      className={className ?? "w-full sm:w-44"}
    />
  );
}
