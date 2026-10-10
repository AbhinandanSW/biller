import { PageSkeleton } from "@/app/components/common/PageSkeleton";

/**
 * Shown inside the app shell while a page renders on the server. Having it
 * also lets Next.js prefetch the shell for links, so navigation is instant.
 */
export default function DashboardLoading() {
  return <PageSkeleton />;
}
