"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import {
  Alert,
  Button,
  buttonClassName,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Field,
  Input,
  Select,
  Textarea,
  toast,
} from "@/components/ui";
import { GST_STATES } from "@/constants/gst-states";
import { fieldErrors } from "@/lib/forms";

import { saveCustomer } from "../actions";
import { CustomerFormSchema, type CustomerFormField } from "../schema";
import type { Customer } from "../types";

const STATE_OPTIONS = GST_STATES.map((s) => ({ value: s.code, label: `${s.name} (${s.code})` }));

type Values = Partial<Record<CustomerFormField, string>>;

const TEXT_FIELDS = [
  "name",
  "code",
  "contactPerson",
  "phone",
  "email",
  "gstin",
  "billingLine1",
  "billingLine2",
  "billingCity",
  "billingStateCode",
  "billingPincode",
  "shippingLine1",
  "shippingLine2",
  "shippingCity",
  "shippingStateCode",
  "shippingPincode",
  "notes",
] as const satisfies readonly CustomerFormField[];

function initialValues(customer?: Customer, defaultStateCode?: string | null): Values {
  if (!customer) return { billingStateCode: defaultStateCode ?? "" };
  return {
    name: customer.name,
    code: customer.code ?? "",
    contactPerson: customer.contactPerson ?? "",
    phone: customer.phone ?? "",
    email: customer.email ?? "",
    gstin: customer.gstin ?? "",
    billingLine1: customer.billing.line1,
    billingLine2: customer.billing.line2,
    billingCity: customer.billing.city,
    billingStateCode: customer.billing.stateCode,
    billingPincode: customer.billing.pincode,
    shippingLine1: customer.shipping?.line1 ?? "",
    shippingLine2: customer.shipping?.line2 ?? "",
    shippingCity: customer.shipping?.city ?? "",
    shippingStateCode: customer.shipping?.stateCode ?? "",
    shippingPincode: customer.shipping?.pincode ?? "",
    notes: customer.notes ?? "",
  };
}

export function CustomerForm({
  customer,
  defaultStateCode,
  /** Where to go after saving; defaults to the customer page. */
  returnTo,
}: {
  customer?: Customer;
  defaultStateCode?: string | null;
  returnTo?: string;
}) {
  const router = useRouter();
  const [values] = useState(() => initialValues(customer, defaultStateCode));
  const [sameAsBilling, setSameAsBilling] = useState(customer?.shippingSameAsBilling ?? true);
  const [errors, setErrors] = useState<Partial<Record<CustomerFormField, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Hidden sections (e.g. shipping when "same as billing") aren't submitted,
    // so every text field defaults to "".
    const data = new FormData(event.currentTarget);
    const text = Object.fromEntries(
      TEXT_FIELDS.map((field) => [field, String(data.get(field) ?? "")]),
    );
    const parsed = CustomerFormSchema.safeParse({ ...text, shippingSameAsBilling: sameAsBilling });
    if (!parsed.success) {
      setErrors(fieldErrors<CustomerFormField>(parsed.error));
      setFormError("Please fix the highlighted fields.");
      return;
    }

    setErrors({});
    setFormError(null);
    const values = { ...text, shippingSameAsBilling: sameAsBilling };
    startSaving(async () => {
      const result = await saveCustomer(customer?.id ?? null, values);
      if ("error" in result) {
        if (result.field) setErrors({ [result.field]: result.error });
        setFormError(result.error);
        return;
      }
      toast.success(customer ? "Customer updated" : "Customer added", result.name);
      const target = returnTo
        ? `${returnTo}${returnTo.includes("?") ? "&" : "?"}customer=${result.id}`
        : `/customers/${result.id}`;
      router.push(target);
    });
  }

  const e = errors;
  const cancelHref = returnTo ?? (customer ? `/customers/${customer.id}` : "/customers");

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      {formError && <Alert variant="danger">{formError}</Alert>}

      <Card>
        <CardHeader title="Customer" />
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field label="Customer / business name" required error={e.name} className="sm:col-span-2">
            <Input name="name" defaultValue={values.name} autoFocus={!customer} />
          </Field>
          <Field label="Contact person" error={e.contactPerson}>
            <Input name="contactPerson" defaultValue={values.contactPerson} autoComplete="name" />
          </Field>
          <Field label="Customer code" description="Optional, e.g. CUS-007" error={e.code}>
            <Input name="code" defaultValue={values.code} className="font-mono" />
          </Field>
          <Field label="Phone" error={e.phone}>
            <Input name="phone" type="tel" defaultValue={values.phone} autoComplete="tel" />
          </Field>
          <Field label="Email" description="Invoices are sent here" error={e.email}>
            <Input name="email" type="email" defaultValue={values.email} autoComplete="email" />
          </Field>
          <Field
            label="GSTIN"
            description="Leave empty for unregistered customers"
            error={e.gstin}
            className="sm:col-span-2"
          >
            <Input
              name="gstin"
              defaultValue={values.gstin}
              maxLength={15}
              autoCapitalize="characters"
              className="font-mono uppercase sm:max-w-xs"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Billing address"
          description="The state here is the place of supply: same state as you → CGST + SGST, otherwise IGST."
        />
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field label="Address" required error={e.billingLine1} className="sm:col-span-2">
            <Input
              name="billingLine1"
              defaultValue={values.billingLine1}
              autoComplete="address-line1"
            />
          </Field>
          <Field label="Address line 2" error={e.billingLine2} className="sm:col-span-2">
            <Input
              name="billingLine2"
              defaultValue={values.billingLine2}
              autoComplete="address-line2"
            />
          </Field>
          <Field label="City" required error={e.billingCity}>
            <Input
              name="billingCity"
              defaultValue={values.billingCity}
              autoComplete="address-level2"
            />
          </Field>
          <Field label="Pincode" error={e.billingPincode}>
            <Input
              name="billingPincode"
              defaultValue={values.billingPincode}
              inputMode="numeric"
              maxLength={6}
              autoComplete="postal-code"
            />
          </Field>
          <Field label="State" required error={e.billingStateCode} className="sm:col-span-2">
            <Select
              name="billingStateCode"
              options={STATE_OPTIONS}
              placeholder="Select state"
              defaultValue={values.billingStateCode || undefined}
              className="sm:max-w-xs"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Shipping address" />
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Checkbox
            label="Same as billing address"
            checked={sameAsBilling}
            onCheckedChange={(checked) => setSameAsBilling(checked === true)}
            className="sm:col-span-2"
          />
          {!sameAsBilling && (
            <>
              <Field label="Address" required error={e.shippingLine1} className="sm:col-span-2">
                <Input name="shippingLine1" defaultValue={values.shippingLine1} />
              </Field>
              <Field label="Address line 2" error={e.shippingLine2} className="sm:col-span-2">
                <Input name="shippingLine2" defaultValue={values.shippingLine2} />
              </Field>
              <Field label="City" required error={e.shippingCity}>
                <Input name="shippingCity" defaultValue={values.shippingCity} />
              </Field>
              <Field label="Pincode" error={e.shippingPincode}>
                <Input
                  name="shippingPincode"
                  defaultValue={values.shippingPincode}
                  inputMode="numeric"
                  maxLength={6}
                />
              </Field>
              <Field label="State" required error={e.shippingStateCode} className="sm:col-span-2">
                <Select
                  name="shippingStateCode"
                  options={STATE_OPTIONS}
                  placeholder="Select state"
                  defaultValue={values.shippingStateCode || undefined}
                  className="sm:max-w-xs"
                />
              </Field>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Notes" />
        <CardContent>
          <Field label="Internal notes" hideLabel error={e.notes}>
            <Textarea
              name="notes"
              defaultValue={values.notes}
              placeholder="Payment terms, delivery instructions…"
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link href={cancelHref} className={buttonClassName({ variant: "secondary" })}>
          Cancel
        </Link>
        <Button type="submit" loading={saving}>
          {customer ? "Save changes" : "Add customer"}
        </Button>
      </div>
    </form>
  );
}
