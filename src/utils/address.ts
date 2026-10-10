import { GST_STATES } from "@/constants/gst-states";
import type { Address } from "@/types/customer";

export function stateName(code: string | null | undefined): string {
  return GST_STATES.find((s) => s.code === code)?.name ?? "—";
}

export function formatAddress(address: Address): string {
  return [
    address.line1,
    address.line2,
    [address.city, address.pincode].filter(Boolean).join(" "),
    stateName(address.stateCode),
  ]
    .filter(Boolean)
    .join(", ");
}
