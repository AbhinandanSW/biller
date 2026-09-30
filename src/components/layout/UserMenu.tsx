"use client";

import { LogOut } from "lucide-react";
import { useTransition } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Spinner,
} from "@/components/ui";
import { signOut } from "@/features/auth/actions";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export function UserMenu({
  name,
  email,
  role,
}: {
  name: string | null;
  email: string;
  role: string;
}) {
  const [pending, startTransition] = useTransition();
  const display = name || email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="flex size-8 items-center justify-center rounded-full bg-primary-subtle text-caption font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {pending ? <Spinner size="sm" label="Signing out" /> : initials(display)}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        <DropdownMenuLabel className="flex flex-col">
          <span className="truncate text-label">{display}</span>
          {name && <span className="truncate text-caption text-muted-foreground">{email}</span>}
          <span className="mt-1 text-caption text-muted-foreground capitalize">{role}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="danger" onSelect={() => startTransition(() => signOut())}>
          <LogOut aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
