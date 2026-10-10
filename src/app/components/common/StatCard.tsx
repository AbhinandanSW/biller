import type { ReactNode } from "react";

import { Card } from "@/app/components/ui";
import { cn } from "@/utils/cn";

export type StatTone = "primary" | "accent" | "success" | "warning" | "danger" | "neutral";

const TONES: Record<StatTone, string> = {
  primary: "bg-primary-subtle text-primary",
  accent: "bg-accent-subtle text-accent",
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  danger: "bg-danger-subtle text-danger",
  neutral: "bg-surface-muted text-muted-foreground",
};

/** A headline number with a label, an optional hint and a tinted icon tile. */
export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: StatTone;
}) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-label text-muted-foreground">{label}</span>
        {icon && (
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg [&_svg]:size-[1.125rem]",
              TONES[tone],
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="tabular text-heading">{value}</span>
        {hint && <span className="text-caption text-muted-foreground">{hint}</span>}
      </div>
    </Card>
  );
}
