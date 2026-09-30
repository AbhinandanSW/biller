import { describe, expect, it } from "vitest";

import {
  CreateOrganizationSchema,
  InviteMemberSchema,
  UpdateOrganizationSchema,
} from "./organization";

describe("CreateOrganizationSchema", () => {
  it("normalises input", () => {
    expect(
      CreateOrganizationSchema.parse({
        name: "  ABC Distributors ",
        legalName: "  ",
        gstin: " 03aaaca1234a1z5",
        stateCode: "03",
      }),
    ).toEqual({
      name: "ABC Distributors",
      legalName: null,
      gstin: "03AAACA1234A1Z5",
      stateCode: "03",
    });
  });

  it("rejects a blank name, bad GSTIN and unknown state", () => {
    const result = CreateOrganizationSchema.safeParse({ name: " ", gstin: "123", stateCode: "99" });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.path[0]).sort()).toEqual([
      "gstin",
      "name",
      "stateCode",
    ]);
  });

  it("rejects a GSTIN from a different state", () => {
    const result = CreateOrganizationSchema.safeParse({
      name: "X",
      gstin: "03AAACA1234A1Z5",
      stateCode: "06",
    });
    expect(result.error?.issues[0]).toMatchObject({ path: ["gstin"] });
  });
});

describe("UpdateOrganizationSchema", () => {
  it("allows partial updates and validates settings", () => {
    expect(UpdateOrganizationSchema.parse({ invoicePrefix: "inv-26" })).toEqual({
      invoicePrefix: "INV-26",
    });
    expect(UpdateOrganizationSchema.safeParse({ pincode: "012345" }).success).toBe(false);
    expect(UpdateOrganizationSchema.safeParse({ defaultTaxRate: 101 }).success).toBe(false);
    expect(UpdateOrganizationSchema.safeParse({ roundingMode: "UP" }).success).toBe(false);
  });
});

describe("InviteMemberSchema", () => {
  it("does not allow inviting owners", () => {
    expect(InviteMemberSchema.safeParse({ email: "a@b.co", role: "owner" }).success).toBe(false);
    expect(InviteMemberSchema.parse({ email: " A@B.co ", role: "sales" })).toEqual({
      email: "a@b.co",
      role: "sales",
    });
  });
});
