"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAVIGATION } from "@/constants/navigation";
import { cn } from "@/utils/cn";
import { isActivePath } from "@/utils/routes";

/** `collapsed` shows icons only (labels stay available to screen readers and as tooltips). */
export function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="flex flex-col gap-5">
      {NAVIGATION.map((group, index) => (
        <div key={group.label ?? index} className="flex flex-col gap-0.5">
          {group.label && !collapsed && (
            <p className="px-2 pb-1 text-caption font-medium text-muted-foreground">
              {group.label}
            </p>
          )}
          {group.items.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex h-8 items-center gap-2.5 rounded-md text-label transition-colors [&_svg]:size-4 [&_svg]:shrink-0",
                  "focus-visible:outline-2 focus-visible:outline-ring",
                  collapsed ? "justify-center px-0" : "px-2",
                  active
                    ? "bg-primary-subtle text-primary"
                    : "text-foreground hover:bg-surface-muted",
                )}
              >
                <Icon aria-hidden />
                <span className={cn(collapsed && "sr-only")}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
