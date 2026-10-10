const moneyFormatters = new Map<string, Intl.NumberFormat>();

/** ₹1,24,500.00 — Indian digit grouping for INR. */
export function formatMoney(value: number | string | null | undefined, currency = "INR"): string {
  if (value === null || value === undefined || value === "") return "—";
  let formatter = moneyFormatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    moneyFormatters.set(currency, formatter);
  }
  return formatter.format(Number(value));
}

/** "18%", "12.5%". */
export function formatPercent(value: number | string): string {
  return `${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}%`;
}

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

/** "28 Sept 2026". */
export function formatDate(value: string | Date): string {
  return dateFormatter.format(typeof value === "string" ? new Date(value) : value);
}

/** Numeric DB value (PostgREST returns numbers) → a 2dp string for form inputs. */
export function toMoneyInput(value: number | string | null | undefined): string {
  return value === null || value === undefined ? "" : Number(value).toFixed(2);
}

/** "Asha" from "Asha Verma", for greetings. */
export function firstName(fullName: string | null | undefined): string | undefined {
  return fullName?.trim().split(/\s+/)[0] || undefined;
}
