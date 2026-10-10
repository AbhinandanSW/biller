import { GST_STATES, GSTIN_PATTERN } from "@/constants/gst-states";

export function isValidGstinFormat(gstin: string): boolean {
  return GSTIN_PATTERN.test(gstin.trim().toUpperCase());
}

/** State code embedded in a GSTIN, or null if the GSTIN is malformed. */
export function stateCodeFromGstin(gstin: string): string | null {
  return isValidGstinFormat(gstin) ? gstin.trim().slice(0, 2) : null;
}

export function isGstStateCode(code: string | null | undefined): boolean {
  return GST_STATES.some((s) => s.code === code);
}

/** A GSTIN is registered in one state; the first two digits are its code. */
export function gstinMatchesState(
  gstin: string | null | undefined,
  stateCode: string | null | undefined,
) {
  return !gstin || !stateCode || gstin.slice(0, 2) === stateCode;
}
