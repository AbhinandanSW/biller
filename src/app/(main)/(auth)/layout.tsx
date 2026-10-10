import Link from "next/link";

import { Logo } from "@/app/components/layout/Logo";
import { ThemeToggle } from "@/app/components/layout/ThemeToggle";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="relative flex flex-1 flex-col items-center bg-[radial-gradient(56rem_28rem_at_50%_-8rem,var(--primary-subtle),transparent)] px-4 py-10 sm:py-16">
      <ThemeToggle className="absolute top-3 right-3" />
      <Link href="/" className="mb-8 rounded-md focus-visible:outline-2 focus-visible:outline-ring">
        <Logo />
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
