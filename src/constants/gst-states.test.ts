import { describe, expect, it } from "vitest";

import { GST_STATES, isValidGstinFormat, stateCodeFromGstin } from "./gst-states";

describe("GSTIN helpers", () => {
  it("validates the GSTIN format", () => {
    expect(isValidGstinFormat("03AAACA1234A1Z5")).toBe(true);
    expect(isValidGstinFormat(" 03aaaca1234a1z5 ")).toBe(true);
    expect(isValidGstinFormat("03AAACA1234A1X5")).toBe(false);
    expect(isValidGstinFormat("3AAACA1234A1Z5")).toBe(false);
  });

  it("extracts the state code", () => {
    expect(stateCodeFromGstin("03AAACA1234A1Z5")).toBe("03");
    expect(stateCodeFromGstin("invalid")).toBeNull();
  });

  it("has unique state codes", () => {
    const codes = GST_STATES.map((s) => s.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
