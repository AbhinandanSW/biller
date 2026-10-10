"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/app/components/ui";
import { useTheme } from "@/app/hooks/useTheme";

/** Switches between light and dark mode; the choice is remembered on this device. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  const label = `Switch to ${next} mode`;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next)}
      aria-label={label}
      title={label}
      className={className}
    >
      {/* The server can't know the theme, so show the moon until mounted. */}
      {theme === "dark" ? <Sun aria-hidden /> : <Moon aria-hidden />}
    </Button>
  );
}
