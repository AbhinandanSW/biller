import type { OrderCalculation } from "@/lib/calculations";
import { cn } from "@/lib/utils/cn";
import { formatMoney } from "@/lib/utils/format";

function Row({
  label,
  value,
  muted,
  strong,
}: {
  label: string;
  value: string;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4",
        muted && "text-muted-foreground",
        strong && "border-t border-border pt-3 text-title",
      )}
    >
      <dt>{label}</dt>
      <dd className="tabular">{value}</dd>
    </div>
  );
}

/** Subtotal → discount → charges → taxable → GST → round off → grand total. */
export function TotalsSummary({ totals }: { totals: OrderCalculation }) {
  const discount = Number(totals.discountTotal);
  const charges = Number(totals.chargeTotal);
  const rounding = Number(totals.roundingAdjustment);
  const intra = totals.supplyType === "INTRA_STATE";

  return (
    <dl className="flex flex-col gap-2 text-body">
      <Row
        label={totals.pricesIncludeTax ? "Subtotal (incl. GST)" : "Subtotal"}
        value={formatMoney(totals.subtotal)}
      />
      {discount > 0 && <Row label="Discount" value={`− ${formatMoney(discount)}`} muted />}
      {charges > 0 && <Row label="Charges" value={formatMoney(charges)} muted />}
      <Row label="Taxable amount" value={formatMoney(totals.taxableAmount)} />
      {intra ? (
        <>
          <Row label="CGST" value={formatMoney(totals.cgstTotal)} muted />
          <Row label="SGST" value={formatMoney(totals.sgstTotal)} muted />
        </>
      ) : (
        <Row label="IGST" value={formatMoney(totals.igstTotal)} muted />
      )}
      {rounding !== 0 && (
        <Row
          label="Round off"
          value={`${rounding > 0 ? "+" : "−"} ${formatMoney(Math.abs(rounding))}`}
          muted
        />
      )}
      <Row label="Grand total" value={formatMoney(totals.grandTotal)} strong />
    </dl>
  );
}
