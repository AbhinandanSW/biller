"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import { Button, Drawer, DrawerContent, DrawerTrigger } from "@/components/ui";

import { SidebarNav } from "./SidebarNav";

export function MobileNav({ organizationName }: { organizationName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu" className="lg:hidden">
          <Menu aria-hidden />
        </Button>
      </DrawerTrigger>
      <DrawerContent side="left" title={organizationName}>
        <SidebarNav onNavigate={() => setOpen(false)} />
      </DrawerContent>
    </Drawer>
  );
}
