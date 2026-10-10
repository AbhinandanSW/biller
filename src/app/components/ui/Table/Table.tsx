import type { ComponentProps } from "react";

import { cn } from "@/utils/cn";

import type { TableCellProps, TableHeadProps } from "./Table.types";

/** Semantic table that scrolls horizontally on narrow screens instead of breaking the layout. */
export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full border-collapse text-body", className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: ComponentProps<"thead">) {
  return <thead className={cn("bg-surface-muted", className)} {...props} />;
}

export function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  return <tbody className={cn("[&>tr:last-child]:border-0", className)} {...props} />;
}

export function TableFooter({ className, ...props }: ComponentProps<"tfoot">) {
  return (
    <tfoot
      className={cn("border-t border-border bg-surface-muted font-medium", className)}
      {...props}
    />
  );
}

export function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "border-b border-border transition-colors data-[state=selected]:bg-primary-subtle",
        "[tbody>&]:hover:bg-surface-muted/60",
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({ numeric, className, scope = "col", ...props }: TableHeadProps) {
  return (
    <th
      scope={scope}
      className={cn(
        "h-9 px-3 text-left align-middle text-caption font-medium whitespace-nowrap text-muted-foreground uppercase",
        numeric && "text-right",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ numeric, className, ...props }: TableCellProps) {
  return (
    <td
      className={cn(
        "h-11 px-3 align-middle",
        numeric && "tabular text-right whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}

export function TableCaption({ className, ...props }: ComponentProps<"caption">) {
  return (
    <caption className={cn("mt-3 text-caption text-muted-foreground", className)} {...props} />
  );
}
