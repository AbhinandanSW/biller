import type { ReactNode } from "react";

import { Card } from "@/app/components/ui";

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-label text-muted-foreground">{label}</span>
        {icon && <span className="text-muted-foreground [&_svg]:size-4">{icon}</span>}
      </div>
      <span className="tabular text-heading">{value}</span>
      {hint && <span className="text-caption text-muted-foreground">{hint}</span>}
    </Card>
  );
}
