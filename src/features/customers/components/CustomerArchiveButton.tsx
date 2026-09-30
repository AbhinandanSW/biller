"use client";

import { Archive, ArchiveRestore } from "lucide-react";
import { useTransition } from "react";

import { Button, toast } from "@/components/ui";

import { setCustomerStatus } from "../actions";

export function CustomerArchiveButton({
  customerId,
  name,
  archived,
}: {
  customerId: string;
  name: string;
  archived: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="secondary"
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          const { error } = await setCustomerStatus(customerId, archived ? "ACTIVE" : "ARCHIVED");
          if (error) toast.error("Couldn't update the customer", error);
          else toast.success(archived ? "Customer restored" : "Customer archived", name);
        })
      }
    >
      {archived ? <ArchiveRestore aria-hidden /> : <Archive aria-hidden />}
      {archived ? "Restore" : "Archive"}
    </Button>
  );
}
