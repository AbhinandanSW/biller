import Link from "next/link";

import { Logo } from "@/app/components/layout/Logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10 sm:py-16">
      <Link href="/" className="mb-8 rounded-md focus-visible:outline-2 focus-visible:outline-ring">
        <Logo />
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
