import { Package } from "lucide-react";
import Image from "next/image";

import { cn } from "@/utils/cn";

const SIZES = { sm: 32, md: 40, lg: 96 } as const;

/** Square product picture, or a placeholder icon when there isn't one. */
export function ProductThumb({
  src,
  size = "md",
  className,
}: {
  src: string | null | undefined;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const px = SIZES[size];
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface-muted text-muted-foreground",
        className,
      )}
      style={{ width: px, height: px }}
    >
      {src ? (
        // Signed links to a private bucket can't go through the image optimizer.
        <Image
          src={src}
          alt=""
          width={px}
          height={px}
          unoptimized
          className="size-full object-cover"
        />
      ) : (
        <Package className="size-1/2" aria-hidden />
      )}
    </span>
  );
}
