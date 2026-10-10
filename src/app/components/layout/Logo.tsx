import { ReceiptIndianRupee } from "lucide-react";

import { cn } from "@/utils/cn";

/** Placeholder brand mark until the product has a name and logo. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-title", className)}>
      <span className="relative flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-card">
        <ReceiptIndianRupee className="size-[1.125rem]" aria-hidden />
        <span
          className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-surface bg-accent"
          aria-hidden
        />
      </span>
      <span>
        Invoice<span className="text-primary">SaaS</span>
      </span>
    </span>
  );
}
