"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/app/components/ui";
import { PRODUCT_IMAGE_MAX_BYTES, PRODUCT_IMAGE_MAX_DIMENSION } from "@/constants/products";

import { ProductThumb } from "./ProductThumb";

/** Scales a picture down to fit PRODUCT_IMAGE_MAX_DIMENSION and re-encodes it as WebP. */
async function shrinkImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, PRODUCT_IMAGE_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.85),
  );
  if (!blob) throw new Error("encode failed");
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
}

export type ImageChange = { kind: "keep" } | { kind: "remove" } | { kind: "replace"; file: File };

/** Product picture: shows the current one, lets the user pick a new one or remove it. */
export function ImagePicker({
  currentUrl,
  onChange,
  error,
}: {
  currentUrl: string | null;
  onChange: (change: ImageChange) => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Free the object URL made for a picked file.
  useEffect(
    () => () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  async function onFile(file: File | undefined) {
    if (!file) return;
    setProblem(null);
    setBusy(true);
    try {
      const small = await shrinkImage(file);
      if (small.size > PRODUCT_IMAGE_MAX_BYTES) throw new Error("too large");
      setPreview(URL.createObjectURL(small));
      onChange({ kind: "replace", file: small });
    } catch {
      setProblem("Couldn't read that image. Use a JPG, PNG or WebP picture.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const message = problem ?? error;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-4">
        <ProductThumb src={preview} size="lg" />
        <div className="flex flex-col items-start gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-label="Product image"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={busy}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus aria-hidden />
            {preview ? "Change image" : "Add image"}
          </Button>
          {preview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setPreview(null);
                onChange({ kind: "remove" });
              }}
            >
              <Trash2 aria-hidden />
              Remove
            </Button>
          )}
        </div>
      </div>
      <p className={message ? "text-caption text-danger" : "text-caption text-muted-foreground"}>
        {message ?? "Optional. Shown when picking items on an order."}
      </p>
    </div>
  );
}
