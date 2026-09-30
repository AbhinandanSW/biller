import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buttonClassName } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

/** "Showing 26–50 of 132" with previous/next links that keep other URL params. */
export function Pagination({
  page,
  pageSize,
  total,
  searchParams,
  pathname,
}: {
  page: number;
  pageSize: number;
  total: number;
  searchParams: Record<string, string | string[] | undefined>;
  pathname: string;
}) {
  if (total === 0) return null;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const href = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (typeof value === "string" && key !== "page") params.set(key, value);
    }
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const link = (target: number, label: string, icon: React.ReactNode, disabled: boolean) =>
    disabled ? (
      <span
        aria-disabled="true"
        className={cn(buttonClassName({ variant: "secondary", size: "sm" }), "opacity-50")}
      >
        {icon}
        <span className="sr-only sm:not-sr-only">{label}</span>
      </span>
    ) : (
      <Link href={href(target)} className={buttonClassName({ variant: "secondary", size: "sm" })}>
        {icon}
        <span className="sr-only sm:not-sr-only">{label}</span>
      </Link>
    );

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 px-1 py-3">
      <p className="tabular text-caption text-muted-foreground">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        {link(page - 1, "Previous", <ChevronLeft aria-hidden />, page <= 1)}
        {link(page + 1, "Next", <ChevronRight aria-hidden />, page >= pageCount)}
      </div>
    </nav>
  );
}

/** Parses ?page= safely. */
export function parsePage(value: string | string[] | undefined): number {
  const page = Number(typeof value === "string" ? value : 1);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
