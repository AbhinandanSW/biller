"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BOTTOM_NAV_ITEMS } from "@/constants/navigation";
import { cn } from "@/utils/cn";
import { isActivePath } from "@/utils/routes";

/** Primary navigation on phones (spec §64). The full menu lives in the top bar drawer. */
export function BottomNav() {
  const pathname = usePathname();
  // A bar with a single destination isn't navigation; the drawer covers it.
  if (BOTTOM_NAV_ITEMS.length < 2) return null;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden print:hidden"
    >
      <ul
        className="grid"
        style={{ gridTemplateColumns: `repeat(${BOTTOM_NAV_ITEMS.length}, minmax(0, 1fr))` }}
      >
        {BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);
          const content = (
            <>
              <Icon className="size-5" aria-hidden />
              {item.shortLabel ?? item.label}
            </>
          );
          const classes = "flex h-14 flex-col items-center justify-center gap-1 text-caption";

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(classes, active ? "text-primary" : "text-muted-foreground")}
              >
                {content}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
