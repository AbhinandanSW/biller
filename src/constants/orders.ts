/** Filters on the orders list (`?show=`). */
export const ORDER_FILTERS = {
  all: "All orders",
  draft: "Drafts",
  to_invoice: "To invoice",
  unpaid: "Unpaid",
  paid: "Paid",
  cancelled: "Cancelled",
} as const;

export const MAX_ORDER_ITEMS = 200;
export const MAX_ORDER_CHARGES = 10;

/** Unit used when an item row leaves it blank. */
export const DEFAULT_UNIT = "pcs";

// Spec §76: rate-limit sending.
export const MAX_SENDS_PER_HOUR = 100;
export const DUPLICATE_SEND_WINDOW_SECONDS = 30;

/** How many past sends the order page lists. */
export const SEND_HISTORY_LIMIT = 20;

/** Recent order items scanned for autocomplete. */
export const KNOWN_ITEMS_LIMIT = 500;
