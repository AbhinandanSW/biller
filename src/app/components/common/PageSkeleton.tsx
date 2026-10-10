import { Card, CardContent, Skeleton } from "@/app/components/ui";

/** Placeholder page while data loads (also the dashboard's loading.tsx). */
export function PageSkeleton() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6" aria-busy="true">
      <span className="sr-only" role="status">
        Loading
      </span>
      <Skeleton className="h-8 w-48" />
      <Card>
        <CardContent className="flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
