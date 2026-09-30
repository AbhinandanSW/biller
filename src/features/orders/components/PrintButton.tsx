"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui";

/** Opens the browser's print dialog, which also offers "Save as PDF". */
export function PrintButton() {
  return (
    <Button variant="ghost" onClick={() => window.print()}>
      <Printer aria-hidden />
      Print
    </Button>
  );
}
