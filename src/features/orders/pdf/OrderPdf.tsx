import "server-only";

import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { amountInWords } from "@/lib/utils/amount-in-words";
import { formatDate, formatMoney, formatPercent } from "@/lib/utils/format";

import { formatAddress, stateName } from "../../customers/format";
import type { OrganizationSettings } from "../../organizations/OrganizationProvider";
import type { Order } from "../types";
import { PDF_FONT_FAMILY } from "./fonts";

export type PdfKind = "invoice" | "order";

const ink = "#15171b";
const muted = "#5f636d";
const line = "#d9dbe0";

const s = StyleSheet.create({
  page: { padding: 36, fontFamily: PDF_FONT_FAMILY, fontSize: 9, color: ink, lineHeight: 1.4 },
  row: { flexDirection: "row" },
  between: { flexDirection: "row", justifyContent: "space-between" },
  section: { borderBottomWidth: 1, borderBottomColor: line, paddingVertical: 12 },
  title: { fontSize: 15, fontWeight: 700, lineHeight: 1.25, marginBottom: 4 },
  docTitle: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1,
    textAlign: "right",
    lineHeight: 1.25,
    marginBottom: 4,
  },
  label: { fontSize: 7, fontWeight: 700, color: muted, letterSpacing: 0.6, marginBottom: 2 },
  muted: { color: muted },
  right: { textAlign: "right" },
  bold: { fontWeight: 700 },
  mono: { letterSpacing: 0.3 },
  th: {
    fontSize: 7,
    fontWeight: 700,
    color: muted,
    paddingVertical: 5,
    paddingHorizontal: 3,
    backgroundColor: "#f3f4f6",
  },
  td: { paddingVertical: 5, paddingHorizontal: 3 },
  tr: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: line },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  grand: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: ink,
    marginTop: 4,
    paddingTop: 5,
    fontSize: 11,
    fontWeight: 700,
  },
  watermark: {
    position: "absolute",
    top: 330,
    left: 90,
    fontSize: 64,
    fontWeight: 700,
    color: "#cc2f36",
    opacity: 0.15,
    transform: "rotate(-20deg)",
  },
});

// Column widths for the items table (percent of the row).
const COLS = {
  n: "4%",
  item: "26%",
  hsn: "8%",
  qty: "9%",
  rate: "10%",
  disc: "9%",
  taxable: "11%",
  gst: "10%",
  total: "13%",
} as const;

function Cell({
  width,
  children,
  align = "left",
  header,
  bold,
}: {
  width: string;
  children: React.ReactNode;
  align?: "left" | "right";
  header?: boolean;
  bold?: boolean;
}) {
  return (
    <View style={[header ? s.th : s.td, { width }]}>
      <Text style={[{ textAlign: align }, bold ? s.bold : {}]}>{children}</Text>
    </View>
  );
}

/** Tax invoice or order confirmation as a PDF (same layout as the invoice page). */
export function OrderPdf({
  order,
  org,
  kind,
}: {
  order: Order;
  org: OrganizationSettings;
  kind: PdfKind;
}) {
  const t = order.totals;
  const intra = order.supplyType === "INTRA_STATE";
  const invoice = kind === "invoice" ? order.invoice : null;
  const lines = new Map(t.lines.map((l) => [l.productId, l]));
  const watermark =
    order.status === "CANCELLED" || invoice?.status === "CANCELLED"
      ? "CANCELLED"
      : order.status === "DRAFT"
        ? "DRAFT"
        : invoice?.status === "PAID"
          ? "PAID"
          : null;
  const title = kind === "invoice" ? "TAX INVOICE" : "ORDER CONFIRMATION";
  const discount = Number(t.discountTotal);
  const rounding = Number(t.roundingAdjustment);

  return (
    <Document
      title={`${invoice?.number ?? order.number} — ${org.name}`}
      author={org.legalName ?? org.name}
      subject={title}
      creator="Invoice SaaS"
    >
      <Page size="A4" style={s.page}>
        {watermark && (
          <Text style={[s.watermark, watermark === "PAID" ? { color: "#1b7f45" } : {}]} fixed>
            {watermark}
          </Text>
        )}

        {/* Seller + document details */}
        <View style={[s.between, s.section, { paddingTop: 0 }]}>
          <View style={{ width: "58%" }}>
            <Text style={s.title}>{org.legalName ?? org.name}</Text>
            {org.address && <Text style={s.muted}>{org.address}</Text>}
            {org.stateCode && (
              <Text style={s.muted}>
                State: {stateName(org.stateCode)} ({org.stateCode})
              </Text>
            )}
            {org.gstin && <Text>GSTIN: {org.gstin}</Text>}
            {(org.phone || org.email) && (
              <Text style={s.muted}>{[org.phone, org.email].filter(Boolean).join(" · ")}</Text>
            )}
          </View>
          <View style={{ width: "40%" }}>
            <Text style={s.docTitle}>{title}</Text>
            {invoice ? (
              <>
                <Text style={s.right}>
                  Invoice no: <Text style={s.bold}>{invoice.number}</Text>
                </Text>
                <Text style={s.right}>Invoice date: {formatDate(invoice.date)}</Text>
                <Text style={s.right}>Due date: {formatDate(invoice.dueDate)}</Text>
                <Text style={[s.right, s.muted]}>Order: {order.number}</Text>
              </>
            ) : (
              <>
                <Text style={s.right}>
                  Order no: <Text style={s.bold}>{order.number}</Text>
                </Text>
                <Text style={s.right}>Order date: {formatDate(order.date)}</Text>
              </>
            )}
          </View>
        </View>

        {/* Buyer */}
        <View style={[s.between, s.section]}>
          <View style={{ width: "58%" }}>
            <Text style={s.label}>BILL TO</Text>
            <Text style={s.bold}>{order.customer.name}</Text>
            <Text style={s.muted}>{formatAddress(order.customer.billing)}</Text>
            <Text>GSTIN: {order.customer.gstin ?? "Unregistered"}</Text>
            {order.customer.phone && <Text style={s.muted}>{order.customer.phone}</Text>}
          </View>
          <View style={{ width: "40%" }}>
            <Text style={[s.label, s.right]}>PLACE OF SUPPLY</Text>
            <Text style={s.right}>
              {stateName(order.customer.billing.stateCode)} ({order.customer.billing.stateCode})
            </Text>
            <Text style={[s.right, s.muted]}>
              {intra ? "Intra-state: CGST + SGST" : "Inter-state: IGST"}
            </Text>
          </View>
        </View>

        {/* Items */}
        <View style={{ marginTop: 12 }}>
          <View style={s.row} fixed>
            <Cell width={COLS.n} header>
              #
            </Cell>
            <Cell width={COLS.item} header>
              ITEM
            </Cell>
            <Cell width={COLS.hsn} header>
              HSN
            </Cell>
            <Cell width={COLS.qty} header align="right">
              QTY
            </Cell>
            <Cell width={COLS.rate} header align="right">
              RATE
            </Cell>
            <Cell width={COLS.disc} header align="right">
              DISCOUNT
            </Cell>
            <Cell width={COLS.taxable} header align="right">
              TAXABLE
            </Cell>
            <Cell width={COLS.gst} header align="right">
              GST
            </Cell>
            <Cell width={COLS.total} header align="right">
              TOTAL
            </Cell>
          </View>
          {order.items.map((item, index) => {
            const l = lines.get(item.id);
            return (
              <View key={item.id} style={s.tr} wrap={false}>
                <Cell width={COLS.n}>{index + 1}</Cell>
                <Cell width={COLS.item} bold>
                  {item.name}
                </Cell>
                <Cell width={COLS.hsn}>{item.hsnCode || "—"}</Cell>
                <Cell width={COLS.qty} align="right">
                  {item.quantity} {item.unit}
                </Cell>
                <Cell width={COLS.rate} align="right">
                  {formatMoney(item.rate)}
                </Cell>
                <Cell width={COLS.disc} align="right">
                  {l && Number(l.discountTotal) > 0 ? formatMoney(l.discountTotal) : "—"}
                </Cell>
                <Cell width={COLS.taxable} align="right">
                  {formatMoney(l?.taxableAmount)}
                </Cell>
                <View style={[s.td, { width: COLS.gst }]}>
                  <Text style={s.right}>{formatMoney(l?.taxAmount)}</Text>
                  <Text style={[s.right, s.muted, { fontSize: 7 }]}>
                    {formatPercent(item.taxRate)}
                  </Text>
                </View>
                <Cell width={COLS.total} align="right" bold>
                  {formatMoney(l?.lineTotal)}
                </Cell>
              </View>
            );
          })}
          {t.charges.map((charge) => (
            <View key={charge.label} style={s.tr} wrap={false}>
              <Cell width={COLS.n}> </Cell>
              <Cell width="62%">{charge.label}</Cell>
              <Cell width={COLS.taxable} align="right">
                {formatMoney(charge.amount)}
              </Cell>
              <Cell width={COLS.gst} align="right">
                {charge.taxRate ? formatMoney(charge.taxAmount) : "—"}
              </Cell>
              <Cell width={COLS.total} align="right">
                {formatMoney(charge.total)}
              </Cell>
            </View>
          ))}
        </View>

        {/* Words + tax summary | totals */}
        <View style={[s.between, s.section, { borderBottomWidth: 0 }]} wrap={false}>
          <View style={{ width: "55%" }}>
            <Text style={s.label}>AMOUNT IN WORDS</Text>
            <Text style={[s.bold, { marginBottom: 8 }]}>{amountInWords(t.grandTotal)}</Text>
            {t.taxSummary.length > 0 && (
              <View>
                <View style={[s.row, { borderBottomWidth: 0.5, borderBottomColor: line }]}>
                  <Text style={[s.muted, { width: "25%" }]}>GST rate</Text>
                  <Text style={[s.muted, s.right, { width: "25%" }]}>Taxable</Text>
                  {intra ? (
                    <>
                      <Text style={[s.muted, s.right, { width: "25%" }]}>CGST</Text>
                      <Text style={[s.muted, s.right, { width: "25%" }]}>SGST</Text>
                    </>
                  ) : (
                    <Text style={[s.muted, s.right, { width: "50%" }]}>IGST</Text>
                  )}
                </View>
                {t.taxSummary.map((row) => (
                  <View key={row.taxRate} style={s.row}>
                    <Text style={{ width: "25%" }}>{formatPercent(row.taxRate)}</Text>
                    <Text style={[s.right, { width: "25%" }]}>
                      {formatMoney(row.taxableAmount)}
                    </Text>
                    {intra ? (
                      <>
                        <Text style={[s.right, { width: "25%" }]}>{formatMoney(row.cgst)}</Text>
                        <Text style={[s.right, { width: "25%" }]}>{formatMoney(row.sgst)}</Text>
                      </>
                    ) : (
                      <Text style={[s.right, { width: "50%" }]}>{formatMoney(row.igst)}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
            {order.notes ? (
              <View style={{ marginTop: 10 }}>
                <Text style={s.label}>NOTES</Text>
                <Text>{order.notes}</Text>
              </View>
            ) : null}
          </View>
          <View style={{ width: "38%" }}>
            <View style={s.totalRow}>
              <Text>{t.pricesIncludeTax ? "Subtotal (incl. GST)" : "Subtotal"}</Text>
              <Text>{formatMoney(t.subtotal)}</Text>
            </View>
            {discount > 0 && (
              <View style={s.totalRow}>
                <Text style={s.muted}>Discount</Text>
                <Text style={s.muted}>− {formatMoney(discount)}</Text>
              </View>
            )}
            {Number(t.chargeTotal) > 0 && (
              <View style={s.totalRow}>
                <Text style={s.muted}>Charges</Text>
                <Text style={s.muted}>{formatMoney(t.chargeTotal)}</Text>
              </View>
            )}
            <View style={s.totalRow}>
              <Text>Taxable amount</Text>
              <Text>{formatMoney(t.taxableAmount)}</Text>
            </View>
            {intra ? (
              <>
                <View style={s.totalRow}>
                  <Text style={s.muted}>CGST</Text>
                  <Text style={s.muted}>{formatMoney(t.cgstTotal)}</Text>
                </View>
                <View style={s.totalRow}>
                  <Text style={s.muted}>SGST</Text>
                  <Text style={s.muted}>{formatMoney(t.sgstTotal)}</Text>
                </View>
              </>
            ) : (
              <View style={s.totalRow}>
                <Text style={s.muted}>IGST</Text>
                <Text style={s.muted}>{formatMoney(t.igstTotal)}</Text>
              </View>
            )}
            {rounding !== 0 && (
              <View style={s.totalRow}>
                <Text style={s.muted}>Round off</Text>
                <Text style={s.muted}>
                  {rounding > 0 ? "+" : "−"} {formatMoney(Math.abs(rounding))}
                </Text>
              </View>
            )}
            <View style={s.grand}>
              <Text>Grand total</Text>
              <Text>{formatMoney(t.grandTotal)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={[s.between, { marginTop: 24, alignItems: "flex-end" }]} wrap={false}>
          <Text style={[s.muted, { fontSize: 7, width: "55%" }]}>
            {invoice
              ? `This is a computer-generated invoice. Payment due by ${formatDate(invoice.dueDate)}.`
              : "This is a computer-generated order confirmation, not a tax invoice."}
          </Text>
          <View style={{ alignItems: "flex-end" }}>
            <Text>For {org.legalName ?? org.name}</Text>
            <Text
              style={[
                s.muted,
                {
                  fontSize: 7,
                  marginTop: 28,
                  borderTopWidth: 0.5,
                  borderTopColor: muted,
                  paddingTop: 2,
                },
              ]}
            >
              Authorised signatory
            </Text>
          </View>
        </View>

        <Text
          style={{
            position: "absolute",
            bottom: 18,
            left: 36,
            right: 36,
            fontSize: 7,
            color: muted,
            textAlign: "center",
          }}
          render={({ pageNumber, totalPages }) =>
            totalPages > 1 ? `Page ${pageNumber} of ${totalPages}` : ""
          }
          fixed
        />
      </Page>
    </Document>
  );
}
