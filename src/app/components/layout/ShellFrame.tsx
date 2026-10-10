"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect, useEffectEvent, useState, type ReactNode } from "react";

import { Button } from "@/app/components/ui";
import { ONE_YEAR_IN_SECONDS, SIDEBAR_COOKIE } from "@/constants/cookies";
import { cn } from "@/utils/cn";

import { SidebarNav } from "./SidebarNav";

/**
 * Header + collapsible sidebar + content. The collapsed state lives in a
 * cookie so the server renders the right width (no flash on load).
 * Ctrl/⌘ + B toggles it.
 */
export function ShellFrame({
  initialCollapsed,
  headerStart,
  headerEnd,
  children,
}: {
  initialCollapsed: boolean;
  headerStart: ReactNode;
  headerEnd: ReactNode;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "1" : "0"}; path=/; max-age=${ONE_YEAR_IN_SECONDS}; samesite=lax`;
  };

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
      event.preventDefault();
      toggle();
    }
  });
  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface px-3 sm:px-4 print:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          title={`${collapsed ? "Expand" : "Collapse"} sidebar (Ctrl/⌘ + B)`}
          className="hidden lg:inline-flex"
        >
          {collapsed ? <PanelLeftOpen aria-hidden /> : <PanelLeftClose aria-hidden />}
        </Button>
        {headerStart}
        <div className="ml-auto">{headerEnd}</div>
      </header>

      <div className="flex flex-1">
        <aside
          className={cn(
            "sticky top-14 hidden h-[calc(100dvh-3.5rem)] shrink-0 overflow-y-auto border-r border-border bg-surface transition-[width] duration-200 lg:block print:hidden",
            collapsed ? "w-14 p-2" : "w-60 p-3",
          )}
        >
          <SidebarNav collapsed={collapsed} />
        </aside>
        <main className="min-w-0 flex-1 px-4 pt-6 pb-24 sm:px-6 lg:px-8 lg:pb-10 print:p-0">
          {children}
        </main>
      </div>
    </>
  );
}
