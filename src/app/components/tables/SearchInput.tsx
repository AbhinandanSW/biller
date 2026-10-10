"use client";

import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Input, Spinner } from "@/app/components/ui";
import { useUrlState } from "@/app/hooks/useUrlState";

/** Search box bound to ?q=, debounced so typing doesn't hammer the server. */
export function SearchInput({
  placeholder,
  label = "Search",
}: {
  placeholder: string;
  label?: string;
}) {
  const { searchParams, set, pending } = useUrlState();
  const urlValue = searchParams.get("q") ?? "";
  const [value, setValue] = useState(urlValue);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Keep in sync when the URL changes elsewhere (e.g. "Clear filters").
  const [lastUrlValue, setLastUrlValue] = useState(urlValue);
  if (urlValue !== lastUrlValue) {
    setLastUrlValue(urlValue);
    setValue(urlValue);
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <Input
      type="search"
      aria-label={label}
      placeholder={placeholder}
      value={value}
      prefix={pending ? <Spinner size="sm" label={null} /> : <Search />}
      className="w-full sm:w-72"
      onChange={(event) => {
        const next = event.target.value;
        setValue(next);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => set({ q: next.trim() || null }), 300);
      }}
    />
  );
}
