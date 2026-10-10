"use client";

import { Tabs as RadixTabs } from "radix-ui";

import { cn } from "@/utils/cn";

import type { TabsContentProps, TabsListProps, TabsTriggerProps } from "./Tabs.types";

export const Tabs = RadixTabs.Root;

export function TabsList({ className, ...props }: TabsListProps) {
  return (
    <RadixTabs.List
      className={cn("flex gap-4 overflow-x-auto shadow-[inset_0_-1px_0_var(--border)]", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: TabsTriggerProps) {
  return (
    <RadixTabs.Trigger
      className={cn(
        "h-10 shrink-0 border-b-2 border-transparent px-0.5 text-label whitespace-nowrap text-muted-foreground transition-colors",
        "hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring",
        "data-[state=active]:border-primary data-[state=active]:text-foreground",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: TabsContentProps) {
  return <RadixTabs.Content className={cn("pt-4 focus:outline-none", className)} {...props} />;
}
