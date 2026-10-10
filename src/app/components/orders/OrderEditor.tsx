"use client";

import { Plus, Trash2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { saveOrder } from "@/api/orders/actions";
import { Alert, Badge, Button, buttonClassName, Combobox, toast } from "@/app/components/ui";
import { useOrganization } from "@/app/hooks/useOrganization";
import type { Customer } from "@/types/customer";
import type { Order, OrderCharge, OrderItem } from "@/types/order";
import type { ProductOption } from "@/types/product";
import { formatAddress, stateName } from "@/utils/address";
import { amountInWords } from "@/utils/amount-in-words";
import { cn } from "@/utils/cn";
import { formatMoney, formatPercent } from "@/utils/format";
import { calculateDraft } from "@/utils/orders/draft";

import { ItemNameInput, type ItemSuggestion } from "./ItemNameInput";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const newItem = (taxRate: number): OrderItem => ({
  id: crypto.randomUUID(),
  productId: null,
  name: "",
  hsnCode: "",
  quantity: "1",
  unit: "pcs",
  rate: "",
  discountPercent: "",
  taxRate: String(taxRate),
});

const newCharge = (label = "Shipping"): OrderCharge => ({
  id: crypto.randomUUID(),
  label,
  amount: "",
  taxRate: "18",
});

// Editable grid columns. Enter moves down a column; Tab moves across.
type Column = "name" | "hsnCode" | "quantity" | "unit" | "rate" | "discountPercent" | "taxRate";

const COLUMN_LABELS: Record<Column, string> = {
  name: "Item",
  hsnCode: "HSN",
  quantity: "Quantity",
  unit: "Unit",
  rate: "Rate",
  discountPercent: "Discount %",
  taxRate: "GST %",
};

/** Borderless input that reads like text on the bill until hovered or focused. */
const billInput =
  "h-8 w-full min-w-0 rounded-sm border border-transparent bg-transparent px-1.5 text-body text-foreground placeholder:text-muted-foreground/70 transition-colors hover:border-border focus:border-ring focus:bg-surface focus:outline-none aria-invalid:border-danger";

const WIDE_QUERY = "(min-width: 768px)";

/** Tablet and up get the bill grid; phones get stacked item cards. */
function useIsWide() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(WIDE_QUERY);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(WIDE_QUERY).matches,
    () => true,
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </p>
  );
}

function TotalRow({
  label,
  value,
  muted,
}: {
  label: ReactNode;
  value: ReactNode;
  muted?: boolean;
}) {
  return (
    <div
      className={cn("flex items-baseline justify-between gap-4", muted && "text-muted-foreground")}
    >
      <dt>{label}</dt>
      <dd className="tabular">{value}</dd>
    </div>
  );
}

/** Catalogue products first, then names typed on earlier orders that aren't products. */
function itemSuggestions(products: ProductOption[], knownItems: OrderItem[]): ItemSuggestion[] {
  const fromProducts = products.map((p) => ({
    key: `product:${p.id}`,
    productId: p.id,
    name: p.name,
    code: p.code,
    hsnCode: p.hsnCode ?? "",
    unit: p.unit,
    rate: p.price,
    taxRate: p.taxRate,
    imageUrl: p.imageUrl,
  }));
  const productNames = new Set(products.map((p) => p.name.trim().toLowerCase()));
  const fromHistory = knownItems
    .filter((i) => !productNames.has(i.name.trim().toLowerCase()))
    .map((i) => ({
      key: `recent:${i.id}`,
      productId: null,
      name: i.name,
      code: null,
      hsnCode: i.hsnCode,
      unit: i.unit,
      rate: i.rate,
      taxRate: i.taxRate,
      imageUrl: null,
    }));
  return [...fromProducts, ...fromHistory];
}

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

/**
 * Order entry laid out like the printed bill: seller at the top, "Bill to",
 * items table, then totals. Totals update as you type; the server
 * recalculates them before saving.
 */
export function OrderEditor({
  existing,
  customers,
  knownItems,
  products,
  preselectedCustomerId,
}: {
  existing?: Order;
  customers: Customer[];
  knownItems: OrderItem[];
  products: ProductOption[];
  preselectedCustomerId?: string | null;
}) {
  const org = useOrganization();
  const router = useRouter();
  const wide = useIsWide();

  const [customerId, setCustomerId] = useState<string | null>(
    preselectedCustomerId ?? existing?.customerId ?? null,
  );
  const [date, setDate] = useState(existing?.date ?? new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<OrderItem[]>(
    existing?.items.length ? existing.items : [newItem(org.defaultTaxRate)],
  );
  const [orderDiscount, setOrderDiscount] = useState<Order["orderDiscount"]>(
    existing?.orderDiscount ?? { type: "PERCENTAGE", value: "" },
  );
  const [charges, setCharges] = useState<OrderCharge[]>(
    existing?.charges.length ? existing.charges : [newCharge()],
  );
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [showErrors, setShowErrors] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [savingKind, setSavingKind] = useState<"draft" | "confirm" | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const customer = customers.find((c) => c.id === customerId) ?? null;
  const placeOfSupply = customer?.billing.stateCode ?? org.stateCode ?? "";

  // React Compiler memoizes this; it only reruns when its inputs change.
  const calculation = calculateDraft(
    { items, orderDiscount, charges, pricesIncludeTax: org.pricesIncludeTax },
    {
      sellerStateCode: org.stateCode ?? placeOfSupply,
      placeOfSupplyStateCode: placeOfSupply,
      gstEnabled: org.gstEnabled,
      rounding: org.rounding,
    },
  );
  const totals = calculation.totals;
  const lineById = new Map(totals?.lines.map((l) => [l.productId, l]));
  const intra = totals ? totals.supplyType === "INTRA_STATE" : org.stateCode === placeOfSupply;

  const suggestions = itemSuggestions(products, knownItems);
  // First match wins, so a product beats an older typed item with the same name.
  const suggestionByName = new Map<string, ItemSuggestion>();
  for (const s of suggestions) {
    const key = s.name.trim().toLowerCase();
    if (!suggestionByName.has(key)) suggestionByName.set(key, s);
  }

  // --- item editing ---------------------------------------------------------

  /** Fills a row from a product or an earlier item; quantity and discount stay as typed. */
  const fillFrom = (item: OrderItem, s: ItemSuggestion): OrderItem => ({
    ...item,
    productId: s.productId,
    name: s.name,
    hsnCode: s.hsnCode,
    unit: s.unit,
    rate: s.rate,
    taxRate: s.taxRate,
  });

  const updateItem = (id: string, column: Column, value: string) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        if (column !== "name") return { ...item, [column]: value };
        // Typing an exact known name into an empty row fills in its details.
        const known = suggestionByName.get(value.trim().toLowerCase());
        if (known && !item.rate.trim()) return fillFrom(item, known);
        // A renamed row is no longer the product it was picked from.
        const stillProduct = item.productId && known?.productId === item.productId;
        return { ...item, name: value, productId: stillProduct ? item.productId : null };
      }),
    );
  };

  const pickItem = (id: string, suggestion: ItemSuggestion) =>
    setItems((current) =>
      current.map((item) => (item.id === id ? fillFrom(item, suggestion) : item)),
    );

  // Cell to focus once the grid re-renders (e.g. a row that was just added).
  const pendingFocus = useRef<{ row: number; column: Column } | null>(null);
  const cellSelector = (row: number, column: Column) => `[data-row="${row}"][data-col="${column}"]`;
  useEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    gridRef.current
      ?.querySelector<HTMLInputElement>(cellSelector(target.row, target.column))
      ?.focus();
  }, [items]);

  const addItem = () => {
    pendingFocus.current = { row: items.length, column: "name" };
    setItems((current) => [...current, newItem(org.defaultTaxRate)]);
  };

  const removeItem = (id: string) =>
    setItems((current) =>
      current.length === 1 ? [newItem(org.defaultTaxRate)] : current.filter((i) => i.id !== id),
    );

  const onCellKeyDown = (event: KeyboardEvent<HTMLInputElement>, row: number, column: Column) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (row === items.length - 1) addItem();
    else gridRef.current?.querySelector<HTMLInputElement>(cellSelector(row + 1, column))?.focus();
  };

  const updateCharge = (id: string, patch: Partial<OrderCharge>) =>
    setCharges((current) => current.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const removeCharge = (id: string) => setCharges((cs) => cs.filter((c) => c.id !== id));

  // --- saving ---------------------------------------------------------------

  const save = (confirm: boolean) => {
    if (saving) return;
    setShowErrors(true);
    setSaveError(null);
    if (!customerId) {
      setSaveError("Choose who this bill is for");
      return;
    }
    if (Object.keys(calculation.itemErrors).length || calculation.error || !totals) {
      setSaveError(
        calculation.error ?? (totals ? "Fix the highlighted items" : "Add at least one item"),
      );
      return;
    }
    setSavingKind(confirm ? "confirm" : "draft");
    startSaving(async () => {
      const result = await saveOrder(
        { customerId, date, items, orderDiscount, charges, notes },
        { id: existing?.id, confirm },
      );
      if ("error" in result) {
        setSaveError(result.error);
        setSavingKind(null);
        return;
      }
      toast.success(confirm ? "Order confirmed" : "Draft saved", result.number);
      router.push(`/orders/${result.id}`);
    });
  };

  // Ctrl/⌘ + S saves a draft, Ctrl/⌘ + Enter confirms.
  const onShortcut = useEffectEvent((event: globalThis.KeyboardEvent) => {
    if (!(event.metaKey || event.ctrlKey)) return;
    if (event.key === "s") {
      event.preventDefault();
      save(false);
    } else if (event.key === "Enter") {
      event.preventDefault();
      save(true);
    }
  });
  useEffect(() => {
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);

  // --- cells ----------------------------------------------------------------

  const cell = (
    item: OrderItem,
    row: number,
    column: Column,
    props: ComponentProps<"input"> = {},
  ) => (
    <input
      aria-label={`${COLUMN_LABELS[column]}, row ${row + 1}`}
      data-row={row}
      data-col={column}
      value={item[column]}
      onChange={(e) => updateItem(item.id, column, e.target.value)}
      onKeyDown={(e) => onCellKeyDown(e, row, column)}
      aria-invalid={showErrors && calculation.itemErrors[item.id] ? true : undefined}
      {...props}
      className={cn(billInput, props.className)}
    />
  );
  const nameCell = (item: OrderItem, row: number, className?: string) => (
    <ItemNameInput
      aria-label={`${COLUMN_LABELS.name}, row ${row + 1}`}
      data-row={row}
      data-col="name"
      placeholder="Type an item or pick a product"
      value={item.name}
      onValueChange={(name) => updateItem(item.id, "name", name)}
      onPick={(suggestion) => pickItem(item.id, suggestion)}
      suggestions={suggestions}
      onKeyDown={(e) => onCellKeyDown(e, row, "name")}
      aria-invalid={showErrors && calculation.itemErrors[item.id] ? true : undefined}
      className={cn(billInput, className)}
    />
  );
  const numeric = { inputMode: "decimal" as const, className: "text-right tabular" };
  const amountOf = (item: OrderItem) => {
    const line = lineById.get(item.id);
    return line ? formatMoney(Number(line.grossAmount) - Number(line.lineDiscount)) : "—";
  };
  const itemError = (item: OrderItem) =>
    showErrors && calculation.itemErrors[item.id] ? (
      <p className="px-1.5 pt-0.5 text-caption text-danger">{calculation.itemErrors[item.id]}</p>
    ) : null;
  const deleteButton = (label: string, onClick: () => void) => (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="rounded-sm p-1.5 text-muted-foreground opacity-60 hover:bg-surface-muted hover:text-danger hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-ring"
    >
      <Trash2 className="size-4" aria-hidden />
    </button>
  );
  const chargeInputs = (charge: OrderCharge, className = "") => ({
    label: (
      <input
        aria-label="Charge name"
        value={charge.label}
        placeholder="Charge (e.g. Packing)"
        onChange={(e) => updateCharge(charge.id, { label: e.target.value })}
        className={cn(billInput, className)}
      />
    ),
    taxRate: (
      <input
        aria-label={`${charge.label || "Charge"} GST %`}
        value={charge.taxRate}
        placeholder="No GST"
        inputMode="decimal"
        onChange={(e) => updateCharge(charge.id, { taxRate: e.target.value })}
        className={cn(billInput, "tabular text-right", className)}
      />
    ),
    amount: (
      <input
        aria-label={`${charge.label || "Charge"} amount`}
        value={charge.amount}
        placeholder="0.00"
        inputMode="decimal"
        onChange={(e) => updateCharge(charge.id, { amount: e.target.value })}
        className={cn(billInput, "tabular text-right font-medium", className)}
      />
    ),
  });

  const returnTo = existing ? `/orders/${existing.id}/edit` : "/orders/new";
  const discountActive = totals && Number(totals.orderDiscountTotal) > 0;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      {/* Toolbar */}
      <div className="sticky top-14 z-20 -mx-4 -mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 print:hidden">
        <div className="flex min-w-0 flex-col">
          <Link
            href={existing ? `/orders/${existing.id}` : "/orders"}
            className="text-caption text-muted-foreground hover:text-foreground"
          >
            ← {existing ? existing.number : "Orders"}
          </Link>
          <h1 className="text-title">{existing ? `Edit ${existing.number}` : "New order"}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-caption text-muted-foreground lg:inline">
            Ctrl/⌘ + S draft · Ctrl/⌘ + Enter confirm
          </span>
          <Button
            variant="secondary"
            onClick={() => save(false)}
            loading={saving && savingKind === "draft"}
            disabled={saving}
          >
            Save draft
          </Button>
          <Button
            onClick={() => save(true)}
            loading={saving && savingKind === "confirm"}
            disabled={saving}
          >
            Save & confirm
          </Button>
        </div>
      </div>

      {saveError && <Alert variant="danger">{saveError}</Alert>}
      {!org.stateCode && (
        <Alert variant="warning" title="Your business state is not set">
          Tax is worked out as CGST + SGST until you add your state.
        </Alert>
      )}

      {/* The bill */}
      <article className="rounded-lg border border-border bg-surface p-4 shadow-card sm:p-8">
        <header className="flex flex-col justify-between gap-6 border-b border-border pb-6 sm:flex-row">
          <div className="flex flex-col gap-1">
            <p className="text-heading">{org.legalName ?? org.name}</p>
            {org.address && <p className="text-muted-foreground">{org.address}</p>}
            {org.stateCode && (
              <p className="text-muted-foreground">
                State: {stateName(org.stateCode)} ({org.stateCode})
              </p>
            )}
            {org.gstin && (
              <p>
                GSTIN: <span className="font-mono">{org.gstin}</span>
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <p className="text-title tracking-wide">ORDER</p>
            <p className="flex items-center gap-2">
              <span className="text-muted-foreground">Order no:</span>
              <span className="font-mono">{existing?.number ?? "Assigned on save"}</span>
            </p>
            <label className="flex items-center gap-2">
              <span className="text-muted-foreground">Date:</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={cn(billInput, "w-40 border-border")}
              />
            </label>
          </div>
        </header>

        <section className="grid gap-6 border-b border-border py-6 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <SectionLabel>Bill to</SectionLabel>
            <Combobox
              aria-label="Customer"
              aria-invalid={showErrors && !customerId ? true : undefined}
              options={customers.map((c) => ({
                value: c.id,
                label: c.name,
                description: [c.billing.city, stateName(c.billing.stateCode), c.gstin]
                  .filter(Boolean)
                  .join(" · "),
              }))}
              value={customerId}
              onValueChange={setCustomerId}
              placeholder="Choose a customer"
              searchPlaceholder="Search customers"
              emptyText="No customers found"
              className="max-w-sm"
              footer={
                <Link
                  href={`/customers/new?returnTo=${encodeURIComponent(returnTo)}`}
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-label text-primary hover:bg-surface-muted"
                >
                  <UserPlus className="size-4" aria-hidden />
                  Add a new customer
                </Link>
              }
            />
            {customer ? (
              <div className="flex flex-col gap-0.5 text-muted-foreground">
                <p>{formatAddress(customer.billing)}</p>
                <p className="text-foreground">
                  GSTIN:{" "}
                  {customer.gstin ? (
                    <span className="font-mono">{customer.gstin}</span>
                  ) : (
                    "Unregistered"
                  )}
                </p>
                {customer.phone && <p>{customer.phone}</p>}
              </div>
            ) : (
              showErrors && <p className="text-caption text-danger">Choose who this bill is for</p>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:items-end sm:text-right">
            <SectionLabel>Place of supply</SectionLabel>
            {placeOfSupply ? (
              <>
                <p>
                  {stateName(placeOfSupply)} ({placeOfSupply})
                </p>
                <Badge variant={intra ? "primary" : "warning"}>
                  {org.gstEnabled
                    ? intra
                      ? "Intra-state · CGST + SGST"
                      : "Inter-state · IGST"
                    : "GST off"}
                </Badge>
              </>
            ) : (
              <p className="text-muted-foreground">Set by the customer&apos;s billing state</p>
            )}
            <p className="text-caption text-muted-foreground">
              {org.pricesIncludeTax ? "Rates include GST" : "Rates exclude GST"}
            </p>
          </div>
        </section>

        {/* Items */}
        <div ref={gridRef} className="py-6">
          {wide ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[46rem] border-collapse">
                <thead>
                  <tr className="border-y border-border bg-surface-muted text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                    <th className="w-8 px-2 py-2 font-semibold">#</th>
                    <th className="px-2 py-2 font-semibold">Item</th>
                    <th className="w-20 px-2 py-2 font-semibold">HSN</th>
                    <th className="w-20 px-2 py-2 text-right font-semibold">Qty</th>
                    <th className="w-16 px-2 py-2 font-semibold">Unit</th>
                    <th className="w-24 px-2 py-2 text-right font-semibold">Rate</th>
                    <th className="w-16 px-2 py-2 text-right font-semibold">Disc %</th>
                    <th className="w-16 px-2 py-2 text-right font-semibold">GST %</th>
                    <th className="w-28 px-2 py-2 text-right font-semibold">Amount</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, row) => (
                    <tr key={item.id} className="border-b border-border align-top">
                      <td className="tabular px-2 py-2 text-muted-foreground">{row + 1}</td>
                      <td className="px-0.5 py-1">
                        {nameCell(item, row)}
                        {itemError(item)}
                      </td>
                      <td className="px-0.5 py-1">
                        {cell(item, row, "hsnCode", {
                          inputMode: "numeric",
                          className: "font-mono",
                        })}
                      </td>
                      <td className="px-0.5 py-1">{cell(item, row, "quantity", numeric)}</td>
                      <td className="px-0.5 py-1">{cell(item, row, "unit")}</td>
                      <td className="px-0.5 py-1">
                        {cell(item, row, "rate", { ...numeric, placeholder: "0.00" })}
                      </td>
                      <td className="px-0.5 py-1">
                        {cell(item, row, "discountPercent", { ...numeric, placeholder: "0" })}
                      </td>
                      <td className="px-0.5 py-1">{cell(item, row, "taxRate", numeric)}</td>
                      <td className="tabular px-2 py-2 text-right font-medium">{amountOf(item)}</td>
                      <td className="py-1 pr-1">
                        {deleteButton(`Remove row ${row + 1}`, () => removeItem(item.id))}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-b border-border">
                    <td />
                    <td colSpan={9} className="py-1.5">
                      <button
                        type="button"
                        onClick={addItem}
                        className="flex items-center gap-1.5 rounded-sm px-1.5 py-1 text-label text-primary hover:bg-primary-subtle"
                      >
                        <Plus className="size-4" aria-hidden />
                        Add item
                        <span className="text-caption font-normal text-muted-foreground">
                          (or press Enter in the last row)
                        </span>
                      </button>
                    </td>
                  </tr>
                  {charges.map((charge) => {
                    const inputs = chargeInputs(charge);
                    return (
                      <tr key={charge.id} className="border-b border-border">
                        <td />
                        <td className="px-0.5 py-1" colSpan={6}>
                          {inputs.label}
                        </td>
                        <td className="px-0.5 py-1">{inputs.taxRate}</td>
                        <td className="px-0.5 py-1">{inputs.amount}</td>
                        <td className="py-1 pr-1">
                          {deleteButton(`Remove ${charge.label || "charge"}`, () =>
                            removeCharge(charge.id),
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            // Phones: one card per item.
            <div className="flex flex-col divide-y divide-border border-y border-border">
              {items.map((item, row) => (
                <div key={item.id} className="flex flex-col gap-2 py-3">
                  <div className="flex items-center gap-2">
                    <span className="tabular w-5 text-caption text-muted-foreground">
                      {row + 1}
                    </span>
                    <div className="flex-1">{nameCell(item, row, "border-border")}</div>
                    {deleteButton(`Remove row ${row + 1}`, () => removeItem(item.id))}
                  </div>
                  {itemError(item)}
                  <div className="grid grid-cols-3 gap-2 pl-7">
                    {(
                      [
                        ["Qty", "quantity", "text-right tabular"],
                        ["Unit", "unit", ""],
                        ["Rate ₹", "rate", "text-right tabular"],
                        ["Disc %", "discountPercent", "text-right tabular"],
                        ["GST %", "taxRate", "text-right tabular"],
                        ["HSN", "hsnCode", "font-mono"],
                      ] as const
                    ).map(([label, column, className]) => (
                      <label
                        key={column}
                        className="flex flex-col gap-0.5 text-caption text-muted-foreground"
                      >
                        {label}
                        {cell(item, row, column, {
                          inputMode: column === "unit" ? undefined : "decimal",
                          className: cn("border-border", className),
                        })}
                      </label>
                    ))}
                  </div>
                  <div className="flex justify-between pl-7">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="tabular font-medium">{amountOf(item)}</span>
                  </div>
                </div>
              ))}
              <div className="py-2">
                <Button variant="ghost" size="sm" onClick={addItem}>
                  <Plus aria-hidden />
                  Add item
                </Button>
              </div>
              {charges.map((charge) => {
                const inputs = chargeInputs(charge, "border-border");
                return (
                  <div
                    key={charge.id}
                    className="grid grid-cols-[1fr_5rem_6rem_auto] items-center gap-2 py-2"
                  >
                    {inputs.label}
                    {inputs.taxRate}
                    {inputs.amount}
                    {deleteButton(`Remove ${charge.label || "charge"}`, () =>
                      removeCharge(charge.id),
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <button
            type="button"
            onClick={() => setCharges((cs) => [...cs, newCharge("")])}
            className="mt-2 flex items-center gap-1.5 rounded-sm px-1.5 py-1 text-caption text-muted-foreground hover:bg-surface-muted hover:text-foreground"
          >
            <Plus className="size-3.5" aria-hidden />
            Add a charge (shipping, packing…)
          </button>
        </div>

        {/* Totals */}
        <section className="grid gap-8 border-t border-border pt-6 sm:grid-cols-[1fr_20rem]">
          <div className="flex flex-col gap-5">
            <div>
              <SectionLabel>Amount in words</SectionLabel>
              <p className="font-medium">{totals ? amountInWords(totals.grandTotal) : "—"}</p>
            </div>
            {totals && totals.taxSummary.length > 0 && (
              <table className="w-full max-w-md border-collapse text-caption">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-1 font-medium">GST rate</th>
                    <th className="py-1 text-right font-medium">Taxable</th>
                    {intra ? (
                      <>
                        <th className="py-1 text-right font-medium">CGST</th>
                        <th className="py-1 text-right font-medium">SGST</th>
                      </>
                    ) : (
                      <th className="py-1 text-right font-medium">IGST</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {totals.taxSummary.map((row) => (
                    <tr key={row.taxRate} className="border-b border-border">
                      <td className="py-1">{formatPercent(row.taxRate)}</td>
                      <td className="tabular py-1 text-right">{formatMoney(row.taxableAmount)}</td>
                      {intra ? (
                        <>
                          <td className="tabular py-1 text-right">{formatMoney(row.cgst)}</td>
                          <td className="tabular py-1 text-right">{formatMoney(row.sgst)}</td>
                        </>
                      ) : (
                        <td className="tabular py-1 text-right">{formatMoney(row.igst)}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <label className="flex flex-col gap-1">
              <SectionLabel>Notes</SectionLabel>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Delivery instructions, terms… (printed on the bill)"
                className="w-full rounded-md border border-border bg-transparent px-2 py-1.5 text-body placeholder:text-muted-foreground/70 focus:border-ring focus:outline-none"
              />
            </label>
          </div>

          <dl className="flex flex-col gap-2">
            {calculation.error && <Alert variant="danger">{calculation.error}</Alert>}
            <TotalRow
              label={org.pricesIncludeTax ? "Subtotal (incl. GST)" : "Subtotal"}
              value={formatMoney(totals?.subtotal ?? 0)}
            />
            {totals && Number(totals.lineDiscountTotal) > 0 && (
              <TotalRow
                label="Item discounts"
                value={`− ${formatMoney(totals.lineDiscountTotal)}`}
                muted
              />
            )}
            <div className="flex items-center justify-between gap-2 text-muted-foreground">
              <dt className="flex items-center gap-1.5">
                Discount
                <span className="inline-flex overflow-hidden rounded-sm border border-border text-caption">
                  {(["PERCENTAGE", "FIXED"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={orderDiscount.type === type}
                      aria-label={
                        type === "PERCENTAGE" ? "Discount in percent" : "Discount in rupees"
                      }
                      onClick={() => setOrderDiscount((d) => ({ ...d, type }))}
                      className={cn(
                        "px-1.5 py-0.5",
                        orderDiscount.type === type
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-surface-muted",
                      )}
                    >
                      {type === "PERCENTAGE" ? "%" : "₹"}
                    </button>
                  ))}
                </span>
              </dt>
              <dd className="flex items-center gap-1">
                <input
                  aria-label={`Order discount ${orderDiscount.type === "PERCENTAGE" ? "percent" : "amount"}`}
                  value={orderDiscount.value}
                  onChange={(e) => setOrderDiscount((d) => ({ ...d, value: e.target.value }))}
                  inputMode="decimal"
                  placeholder="0"
                  className={cn(billInput, "tabular w-16 border-border text-right")}
                />
                <span className="tabular w-24 text-right">
                  {discountActive ? `− ${formatMoney(totals.orderDiscountTotal)}` : "—"}
                </span>
              </dd>
            </div>
            {totals && Number(totals.chargeTotal) > 0 && (
              <TotalRow label="Charges" value={formatMoney(totals.chargeTotal)} muted />
            )}
            <TotalRow label="Taxable amount" value={formatMoney(totals?.taxableAmount ?? 0)} />
            {intra ? (
              <>
                <TotalRow label="CGST" value={formatMoney(totals?.cgstTotal ?? 0)} muted />
                <TotalRow label="SGST" value={formatMoney(totals?.sgstTotal ?? 0)} muted />
              </>
            ) : (
              <TotalRow label="IGST" value={formatMoney(totals?.igstTotal ?? 0)} muted />
            )}
            {totals && Number(totals.roundingAdjustment) !== 0 && (
              <TotalRow
                label="Round off"
                value={`${Number(totals.roundingAdjustment) > 0 ? "+" : "−"} ${formatMoney(
                  Math.abs(Number(totals.roundingAdjustment)),
                )}`}
                muted
              />
            )}
            <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3 text-heading">
              <dt>Grand total</dt>
              <dd className="tabular">{formatMoney(totals?.grandTotal ?? 0)}</dd>
            </div>
          </dl>
        </section>

        <footer className="mt-8 flex justify-end border-t border-border pt-6 text-muted-foreground">
          <div className="flex flex-col items-end gap-8">
            <p>For {org.legalName ?? org.name}</p>
            <p className="border-t border-border pt-1 text-caption">Authorised signatory</p>
          </div>
        </footer>
      </article>

      <div className="flex justify-end gap-2 pb-4">
        <Link
          href={existing ? `/orders/${existing.id}` : "/orders"}
          className={buttonClassName({ variant: "ghost" })}
        >
          Cancel
        </Link>
        <Button variant="secondary" onClick={() => save(false)} disabled={saving}>
          Save draft
        </Button>
        <Button onClick={() => save(true)} disabled={saving}>
          Save & confirm
        </Button>
      </div>
    </div>
  );
}
