import Link from "next/link";
import type { ReactNode } from "react";

import { BottomNav } from "./BottomNav";
import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";
import { ShellFrame } from "./ShellFrame";
import { UserMenu } from "./UserMenu";

interface AppShellProps {
  organizationName: string;
  user: { fullName: string | null; email: string };
  role: string;
  sidebarCollapsed: boolean;
  children: ReactNode;
}

/** Top bar + collapsible sidebar on desktop; top bar + bottom navigation on phones (spec §64). */
export function AppShell({
  organizationName,
  user,
  role,
  sidebarCollapsed,
  children,
}: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <ShellFrame
        initialCollapsed={sidebarCollapsed}
        headerStart={
          <>
            <MobileNav organizationName={organizationName} />
            <Link
              href="/dashboard"
              className="rounded-md focus-visible:outline-2 focus-visible:outline-ring"
            >
              <Logo />
            </Link>
            <span className="hidden h-5 w-px bg-border sm:block" aria-hidden />
            <span className="hidden truncate text-label text-muted-foreground sm:block">
              {organizationName}
            </span>
          </>
        }
        headerEnd={<UserMenu name={user.fullName} email={user.email} role={role} />}
      >
        {children}
      </ShellFrame>
      <BottomNav />
    </div>
  );
}
