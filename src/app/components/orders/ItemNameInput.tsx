"use client";

import { Popover } from "radix-ui";
import { useId, useState, type ComponentProps, type KeyboardEvent } from "react";

import { ProductThumb } from "@/app/components/products/ProductThumb";
import { cn } from "@/utils/cn";
import { formatMoney, formatPercent } from "@/utils/format";

/** Something the item name can be filled from: a catalogue product or a recently used item. */
export interface ItemSuggestion {
  key: string;
  productId: string | null;
  name: string;
  code: string | null;
  hsnCode: string;
  unit: string;
  rate: string;
  taxRate: string;
  imageUrl: string | null;
}

const MAX_RESULTS = 8;

function matches(suggestion: ItemSuggestion, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    suggestion.name.toLowerCase().includes(q) || Boolean(suggestion.code?.toLowerCase().includes(q))
  );
}

type InputProps = Omit<ComponentProps<"input">, "value" | "onChange">;

/**
 * Item name cell: type any name, or pick a product to fill in its rate, GST,
 * unit and HSN. Arrow keys move through matches, Enter picks, Esc closes.
 * When nothing is highlighted, keys go to `onKeyDown` (e.g. Enter → next row).
 */
export function ItemNameInput({
  value,
  onValueChange,
  onPick,
  suggestions,
  onKeyDown,
  className,
  ...inputProps
}: InputProps & {
  value: string;
  onValueChange: (name: string) => void;
  onPick: (suggestion: ItemSuggestion) => void;
  suggestions: readonly ItemSuggestion[];
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();

  const results = suggestions.filter((s) => matches(s, value)).slice(0, MAX_RESULTS);
  const showList = open && results.length > 0;

  const pick = (suggestion: ItemSuggestion) => {
    onPick(suggestion);
    setOpen(false);
    setActive(-1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && results.length) {
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
      return;
    }
    if (showList && event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
      return;
    }
    if (showList && event.key === "Enter" && results[active]) {
      event.preventDefault();
      pick(results[active]);
      return;
    }
    if (showList && event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }
    onKeyDown?.(event);
  };

  return (
    <Popover.Root open={showList} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <input
          {...inputProps}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          value={value}
          onChange={(e) => {
            onValueChange(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          className={className}
        />
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          // Typing stays in the input; the list only shows matches.
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="z-50 w-(--radix-popover-trigger-width) min-w-72 animate-fade-in overflow-hidden rounded-md border border-border bg-surface shadow-overlay"
        >
          <ul
            id={listId}
            role="listbox"
            aria-label="Matching items"
            className="max-h-72 overflow-y-auto p-1"
          >
            {results.map((s, index) => (
              <li
                key={s.key}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                // Keep focus in the input so blur doesn't close the list before the click.
                onMouseDown={(e) => e.preventDefault()}
                onMouseMove={() => setActive(index)}
                onClick={() => pick(s)}
                className={cn(
                  "flex cursor-default items-center gap-2.5 rounded-sm px-2 py-1.5",
                  index === active && "bg-surface-muted",
                )}
              >
                {s.productId ? <ProductThumb src={s.imageUrl} size="sm" /> : null}
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-body">{s.name}</span>
                  <span className="truncate text-caption text-muted-foreground">
                    {[s.code, s.productId ? null : "Used before"].filter(Boolean).join(" · ") ||
                      "Product"}
                  </span>
                </div>
                <div className="flex shrink-0 flex-col items-end">
                  <span className="tabular text-body">
                    {s.rate ? formatMoney(s.rate) : "—"}
                    <span className="text-caption text-muted-foreground">/{s.unit}</span>
                  </span>
                  <span className="text-caption text-muted-foreground">
                    GST {formatPercent(s.taxRate || 0)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
