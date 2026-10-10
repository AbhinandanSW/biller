"use client";

import { Archive, ArchiveRestore } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { setProductStatus } from "@/api/products/actions";
import { Button, toast } from "@/app/components/ui";

export function ProductArchiveButton({
  productId,
  name,
  archived,
}: {
  productId: string;
  name: string;
  archived: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="secondary"
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          const { error } = await setProductStatus(productId, archived ? "ACTIVE" : "ARCHIVED");
          if (error) {
            toast.error("Couldn't update the product", error);
            return;
          }
          toast.success(archived ? "Product restored" : "Product archived", name);
          router.push("/products");
        })
      }
    >
      {archived ? <ArchiveRestore aria-hidden /> : <Archive aria-hidden />}
      {archived ? "Restore" : "Archive"}
    </Button>
  );
}
