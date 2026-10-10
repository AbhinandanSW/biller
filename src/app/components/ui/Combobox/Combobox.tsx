"use client";

import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Popover } from "radix-ui";
import { useId, useMemo, useState, type KeyboardEvent } from "react";

import { cn } from "@/utils/cn";

import { useFieldControl } from "../Field";
import { controlClassName } from "../Field/control-styles";
import type { ComboboxProps } from "./Combobox.types";

/** Searchable single select. Type to filter, arrows to move, Enter to pick. */
export function Combobox(props: ComboboxProps) {
  const {
    options,
    value,
    onValueChange,
    placeholder = "Select…",
    searchPlaceholder = "Search…",
    emptyText = "No matches",
    footer,
    className,
    disabled,
    ...triggerProps
  } = useFieldControl(props);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();

  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => `${o.label} ${o.description ?? ""}`.toLowerCase().includes(q));
  }, [options, query]);

  const choose = (next: string) => {
    onValueChange(next);
    setOpen(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = filtered[active];
      if (option) choose(option.value);
    }
  };

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setQuery("");
          setActive(
            Math.max(
              0,
              options.findIndex((o) => o.value === value),
            ),
          );
        }
      }}
    >
      <Popover.Trigger
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        className={cn(
          controlClassName,
          "flex h-9 items-center justify-between gap-2 px-3 text-left",
          !selected && "text-muted-foreground",
          className,
        )}
        {...triggerProps}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-50 w-(--radix-popover-trigger-width) min-w-64 animate-fade-in overflow-hidden rounded-md border border-border bg-surface shadow-overlay"
        >
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 text-muted-foreground" aria-hidden />
            <input
              autoFocus
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={filtered[active] ? `${listId}-${active}` : undefined}
              aria-label={searchPlaceholder}
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              className="h-10 w-full bg-transparent text-body outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ul id={listId} role="listbox" className="max-h-64 overflow-y-auto p-1">
            {filtered.length === 0 && (
              <li className="px-2 py-6 text-center text-body text-muted-foreground">{emptyText}</li>
            )}
            {filtered.map((option, index) => (
              <li
                key={option.value}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={option.value === value}
                onMouseMove={() => setActive(index)}
                onClick={() => choose(option.value)}
                className={cn(
                  "flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5",
                  index === active && "bg-surface-muted",
                )}
              >
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-body">{option.label}</span>
                  {option.description && (
                    <span className="truncate text-caption text-muted-foreground">
                      {option.description}
                    </span>
                  )}
                </div>
                {option.value === value && <Check className="size-4 text-primary" aria-hidden />}
              </li>
            ))}
          </ul>
          {footer && <div className="border-t border-border p-1">{footer}</div>}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
