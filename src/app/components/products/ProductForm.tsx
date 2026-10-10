"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { saveProduct } from "@/api/products/actions";
import {
  Alert,
  Button,
  buttonClassName,
  Card,
  CardContent,
  CardHeader,
  Field,
  Input,
  Select,
  Textarea,
  toast,
} from "@/app/components/ui";
import { useOrganization } from "@/app/hooks/useOrganization";
import { DEFAULT_UNIT } from "@/constants/orders";
import { GST_RATES } from "@/constants/products";
import type { Product } from "@/types/product";
import { fieldErrors, formValues } from "@/utils/forms";
import {
  PRODUCT_FORM_FIELDS,
  ProductFormSchema,
  type ProductFormField,
} from "@/utils/validation/product";

import { ImagePicker, type ImageChange } from "./ImagePicker";
import { ProductArchiveButton } from "./ProductArchiveButton";

const GST_OPTIONS = GST_RATES.map((rate) => ({ value: rate, label: `${rate}%` }));

export function ProductForm({ product }: { product?: Product }) {
  const org = useOrganization();
  const router = useRouter();
  const [image, setImage] = useState<ImageChange>({ kind: "keep" });
  const [errors, setErrors] = useState<Partial<Record<ProductFormField, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const defaultTaxRate = String(org.defaultTaxRate);
  const initialTaxRate =
    product?.taxRate ??
    ((GST_RATES as readonly string[]).includes(defaultTaxRate) ? defaultTaxRate : undefined);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = ProductFormSchema.safeParse(formValues(data, PRODUCT_FORM_FIELDS));
    if (!parsed.success) {
      setErrors(fieldErrors<ProductFormField>(parsed.error));
      setFormError("Please fix the highlighted fields.");
      return;
    }
    setErrors({});
    setFormError(null);

    // The file input isn't submitted; send the resized picture instead.
    data.delete("image");
    if (image.kind === "replace") data.set("image", image.file);
    if (image.kind === "remove") data.set("removeImage", "1");

    startSaving(async () => {
      const result = await saveProduct(product?.id ?? null, data);
      if ("error" in result) {
        if (result.field) setErrors({ [result.field]: result.error });
        setFormError(result.error);
        return;
      }
      toast.success(product ? "Product updated" : "Product added", result.name);
      router.push("/products");
    });
  }

  const e = errors;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      {formError && <Alert variant="danger">{formError}</Alert>}

      <Card>
        <CardHeader title="Product" />
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <ImagePicker currentUrl={product?.imageUrl ?? null} onChange={setImage} />
          </div>
          <Field label="Product name" required error={e.name} className="sm:col-span-2">
            <Input name="name" defaultValue={product?.name} autoFocus={!product} />
          </Field>
          <Field label="Product code" description="Optional SKU, e.g. RICE-25" error={e.code}>
            <Input name="code" defaultValue={product?.code ?? ""} className="font-mono" />
          </Field>
          <Field label="HSN code" description="4 to 8 digits" error={e.hsnCode}>
            <Input
              name="hsnCode"
              defaultValue={product?.hsnCode ?? ""}
              inputMode="numeric"
              maxLength={8}
              className="font-mono"
            />
          </Field>
          <Field label="Description" error={e.description} className="sm:col-span-2">
            <Textarea
              name="description"
              defaultValue={product?.description ?? ""}
              placeholder="Size, pack, brand… (internal only)"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Price and GST"
          description={
            org.pricesIncludeTax
              ? "Your prices include GST, so enter the price the customer pays."
              : "Your prices exclude GST; it's added on the order."
          }
        />
        <CardContent className="grid gap-5 sm:grid-cols-3">
          <Field label="Selling price (₹)" required error={e.price}>
            <Input
              name="price"
              defaultValue={product?.price}
              inputMode="decimal"
              placeholder="0.00"
              className="tabular text-right"
            />
          </Field>
          <Field label="Unit" required error={e.unit}>
            <Input name="unit" defaultValue={product?.unit ?? DEFAULT_UNIT} />
          </Field>
          <Field label="GST rate" required error={e.taxRate}>
            <Select
              name="taxRate"
              options={GST_OPTIONS}
              placeholder="Select"
              defaultValue={initialTaxRate}
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {product && (
          <div className="sm:mr-auto">
            <ProductArchiveButton
              productId={product.id}
              name={product.name}
              archived={product.status === "ARCHIVED"}
            />
          </div>
        )}
        <Link href="/products" className={buttonClassName({ variant: "secondary" })}>
          Cancel
        </Link>
        <Button type="submit" loading={saving}>
          {product ? "Save changes" : "Add product"}
        </Button>
      </div>
    </form>
  );
}
