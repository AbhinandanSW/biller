import type { ReactNode } from "react";

import { Card, CardContent } from "@/app/components/ui";

/** Title, form and footer link for the sign-in style pages. */
export function AuthCard({
  title,
  description,
  footer,
  children,
}: {
  title: string;
  description?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-heading">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      <Card>
        <CardContent className="p-6">{children}</CardContent>
      </Card>
      {footer && <p className="text-center text-body text-muted-foreground">{footer}</p>}
    </div>
  );
}
