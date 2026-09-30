import { ReceiptIndianRupee } from "lucide-react";

import { cn } from "@/lib/utils/cn";

/** Placeholder brand mark until the product has a name and logo. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-title", className)}>
      <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <ReceiptIndianRupee className="size-4" aria-hidden />
      </span>
      Invoice SaaS
    </span>
  );
}
