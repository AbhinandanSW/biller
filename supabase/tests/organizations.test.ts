import { beforeAll, describe, expect, it } from "vitest";

import { PERMISSIONS, ROLE_PERMISSIONS, ROLES } from "@/lib/auth/permissions";

import { createTestDb, type Actor, type TestDb } from "./harness";

type User = { id: string; email: string };
type Organization = { id: string; name: string; state_code: string | null };

let db: TestDb;
let counter = 0;

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

async function newUser(options?: { confirmed?: boolean; fullName?: string }): Promise<User> {
  counter += 1;
  return db.createUser(`user${counter}@example.com`, options);
}

async function createOrganization(owner: User, name = "ABC Distributors"): Promise<Organization> {
  const [org] = await db.query<Organization>(
    owner,
    "select * from public.create_organization($1)",
    [name],
  );
  return org;
}

/** Adds `user` to `org` with `role` via the real invite → accept flow. */
async function addMember(org: Organization, inviter: User, user: User, role: string) {
  const [invitation] = await db.query<{ id: string }>(
    inviter,
    "select * from public.invite_member($1, $2, $3)",
    [org.id, user.email, role],
  );
  await db.query(user, "select * from public.accept_invitation($1)", [invitation.id]);
}

async function expectError(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toMatchObject({ code });
}

/** Sets up an organization with one member of each role. */
async function team() {
  const owner = await newUser();
  const org = await createOrganization(owner);
  const members = {} as Record<"admin" | "manager" | "sales" | "viewer", User>;
  for (const role of ["admin", "manager", "sales", "viewer"] as const) {
    members[role] = await newUser();
    await addMember(org, owner, members[role], role);
  }
  return { org, owner, ...members };
}

describe("profiles", () => {
  it("are created on signup", async () => {
    const user = await newUser({ fullName: " Abhinandan " });
    const [profile] = await db.query(user, "select * from public.profiles where id = $1", [
      user.id,
    ]);
    expect(profile).toMatchObject({ email: user.email, full_name: "Abhinandan" });
  });

  it("are visible to fellow members only", async () => {
    const { org, owner, sales } = await team();
    const outsider = await newUser();

    const visible = await db.query<{ id: string }>(owner, "select id from public.profiles");
    expect(visible.map((p) => p.id).sort()).toEqual(
      expect.arrayContaining([owner.id, sales.id].sort()),
    );
    expect(visible.map((p) => p.id)).not.toContain(outsider.id);
    expect(org).toBeDefined();
  });

  it("can only be edited by their owner, and only safe columns", async () => {
    const { owner, sales } = await team();

    await db.query(sales, "update public.profiles set full_name = 'Hacked' where id = $1", [
      owner.id,
    ]);
    const [profile] = await db.query(owner, "select full_name from public.profiles where id = $1", [
      owner.id,
    ]);
    expect(profile.full_name).toBeNull();

    await expectError(
      db.query(owner, "update public.profiles set email = 'x@y.z' where id = $1", [owner.id]),
      "42501",
    );
  });
});

describe("create_organization", () => {
  it("makes the caller the owner and derives the state from the GSTIN", async () => {
    const user = await newUser();
    const [org] = await db.query<Organization>(
      user,
      "select * from public.create_organization($1, $2, $3)",
      ["ABC Distributors", "ABC Distributors Pvt Ltd", "03aaaca1234a1z5"],
    );

    expect(org).toMatchObject({
      name: "ABC Distributors",
      gstin: "03AAACA1234A1Z5",
      state_code: "03",
    });
    const [member] = await db.query(user, "select role from public.organization_members");
    expect(member.role).toBe("owner");
  });

  it("requires a signed-in user", async () => {
    await expectError(db.query("anon", "select public.create_organization('X')"), "42501");
  });

  it("validates the business profile", async () => {
    const user = await newUser();
    await expectError(db.query(user, "select public.create_organization('  ')"), "23514");
    await expectError(
      db.query(user, "select public.create_organization('X', null, 'NOTAGSTIN')"),
      "23514",
    );
    // GSTIN registered in Punjab (03) but state set to Haryana (06).
    await expectError(
      db.query(user, "select public.create_organization('X', null, '03AAACA1234A1Z5', '06')"),
      "23514",
    );
  });
});

describe("tenant isolation", () => {
  it("members only see their own organizations and members", async () => {
    const a = await newUser();
    const b = await newUser();
    const orgA = await createOrganization(a, "Org A");
    const orgB = await createOrganization(b, "Org B");

    const seenByA = await db.query<Organization>(a, "select * from public.organizations");
    expect(seenByA.map((o) => o.id)).toEqual([orgA.id]);

    const membersSeenByA = await db.query<{ organization_id: string }>(
      a,
      "select organization_id from public.organization_members",
    );
    expect(membersSeenByA.every((m) => m.organization_id === orgA.id)).toBe(true);

    // Direct lookups of another tenant's rows return nothing.
    expect(
      await db.query(a, "select * from public.organizations where id = $1", [orgB.id]),
    ).toEqual([]);
  });

  it("cannot update another organization", async () => {
    const a = await newUser();
    const b = await newUser();
    await createOrganization(a);
    const orgB = await createOrganization(b, "Org B");

    await db.query(a, "update public.organizations set name = 'Pwned' where id = $1", [orgB.id]);
    const { rows } = await db.pg.query<Organization>(
      "select name from public.organizations where id = $1",
      [orgB.id],
    );
    expect(rows[0].name).toBe("Org B");
  });

  it("anonymous users see nothing", async () => {
    const owner = await newUser();
    await createOrganization(owner);
    for (const table of ["organizations", "organization_members", "profiles", "audit_logs"]) {
      await expectError(db.query("anon", `select * from public.${table}`), "42501");
    }
  });

  it("blocks direct writes to membership tables", async () => {
    const owner = await newUser();
    const org = await createOrganization(owner);
    const outsider = await newUser();

    await expectError(
      db.query(
        outsider,
        "insert into public.organization_members (organization_id, user_id, role) values ($1, $2, 'owner')",
        [org.id, outsider.id],
      ),
      "42501",
    );
    await expectError(
      db.query(owner, "update public.organization_members set role = 'viewer'"),
      "42501",
    );
    await expectError(
      db.query(owner, "insert into public.organizations (name) values ('X')"),
      "42501",
    );
    await expectError(db.query(owner, "delete from public.organizations"), "42501");
  });
});

describe("organization settings", () => {
  it("can be updated by owners and admins but not by other roles", async () => {
    const { org, owner, admin, manager, sales, viewer } = await team();

    for (const [user, allowed] of [
      [owner, true],
      [admin, true],
      [manager, false],
      [sales, false],
      [viewer, false],
    ] as const) {
      const rows = await db.query(
        user,
        "update public.organizations set phone = $2 where id = $1 returning id",
        [org.id, user.id.slice(0, 8)],
      );
      expect(rows.length, `${user.email} allowed=${allowed}`).toBe(allowed ? 1 : 0);
    }
  });

  it("protects id and created_by", async () => {
    const owner = await newUser();
    const org = await createOrganization(owner);
    await expectError(
      db.query(owner, "update public.organizations set created_by = null where id = $1", [org.id]),
      "42501",
    );
  });
});

describe("invitations", () => {
  it("can only be created by member managers", async () => {
    const { org, manager, sales } = await team();
    const invitee = await newUser();
    for (const user of [manager, sales]) {
      await expectError(
        db.query(user, "select public.invite_member($1, $2, 'viewer')", [org.id, invitee.email]),
        "42501",
      );
    }
  });

  it("cannot grant ownership", async () => {
    const owner = await newUser();
    const org = await createOrganization(owner);
    await expectError(
      db.query(owner, "select public.invite_member($1, 'x@example.com', 'owner')", [org.id]),
      "22023",
    );
  });

  it("can only be accepted by the invited, confirmed email", async () => {
    const owner = await newUser();
    const org = await createOrganization(owner);
    const invitee = await newUser();
    const stranger = await newUser();
    const [invitation] = await db.query<{ id: string }>(
      owner,
      "select * from public.invite_member($1, $2, 'sales')",
      [org.id, invitee.email.toUpperCase()],
    );

    await expectError(
      db.query(stranger, "select public.accept_invitation($1)", [invitation.id]),
      "P0002",
    );

    const [member] = await db.query(invitee, "select * from public.accept_invitation($1)", [
      invitation.id,
    ]);
    expect(member).toMatchObject({ organization_id: org.id, role: "sales" });

    await expectError(
      db.query(invitee, "select public.accept_invitation($1)", [invitation.id]),
      "22023",
    );
  });

  it("rejects unconfirmed emails, expired and revoked invitations", async () => {
    const owner = await newUser();
    const org = await createOrganization(owner);
    const unconfirmed = await newUser({ confirmed: false });
    const [first] = await db.query<{ id: string }>(
      owner,
      "select * from public.invite_member($1, $2, 'sales')",
      [org.id, unconfirmed.email],
    );
    await expectError(
      db.query(unconfirmed, "select public.accept_invitation($1)", [first.id]),
      "P0002",
    );

    const invitee = await newUser();
    const [expired] = await db.query<{ id: string }>(
      owner,
      "select * from public.invite_member($1, $2, 'sales')",
      [org.id, invitee.email],
    );
    await db.pg.query(
      "update public.organization_invitations set expires_at = now() - interval '1 minute' where id = $1",
      [expired.id],
    );
    await expectError(
      db.query(invitee, "select public.accept_invitation($1)", [expired.id]),
      "22023",
    );

    const [revoked] = await db.query<{ id: string }>(
      owner,
      "select * from public.invite_member($1, $2, 'sales')",
      [org.id, invitee.email],
    );
    await db.query(owner, "select public.revoke_invitation($1)", [revoked.id]);
    await expectError(
      db.query(invitee, "select public.accept_invitation($1)", [revoked.id]),
      "22023",
    );
  });

  it("are visible to managers of the organization and to the invitee only", async () => {
    const { org, owner, sales } = await team();
    const invitee = await newUser();
    await db.query(owner, "select public.invite_member($1, $2, 'viewer')", [org.id, invitee.email]);

    const count = async (user: Actor) =>
      (
        await db.query(user, "select id from public.organization_invitations where email = $1", [
          invitee.email,
        ])
      ).length;
    expect(await count(owner)).toBe(1);
    expect(await count(invitee)).toBe(1);
    expect(await count(sales)).toBe(0);
  });

  it("rejects inviting an existing member", async () => {
    const { org, owner, sales } = await team();
    await expectError(
      db.query(owner, "select public.invite_member($1, $2, 'viewer')", [org.id, sales.email]),
      "23505",
    );
  });
});

describe("member management", () => {
  it("only owners can grant or remove ownership", async () => {
    const { org, owner, admin, sales } = await team();

    await expectError(
      db.query(admin, "select public.update_member_role($1, $2, 'owner')", [org.id, sales.id]),
      "42501",
    );
    await expectError(
      db.query(admin, "select public.update_member_role($1, $2, 'viewer')", [org.id, owner.id]),
      "42501",
    );
    await expectError(
      db.query(admin, "select public.remove_member($1, $2)", [org.id, owner.id]),
      "42501",
    );

    const [promoted] = await db.query(
      owner,
      "select * from public.update_member_role($1, $2, 'owner')",
      [org.id, admin.id],
    );
    expect(promoted.role).toBe("owner");
  });

  it("admins can manage non-owners", async () => {
    const { org, admin, sales, viewer } = await team();
    const [updated] = await db.query(
      admin,
      "select * from public.update_member_role($1, $2, 'manager')",
      [org.id, sales.id],
    );
    expect(updated.role).toBe("manager");

    await db.query(admin, "select public.remove_member($1, $2)", [org.id, viewer.id]);
    expect(await db.query(viewer, "select * from public.organizations")).toEqual([]);
  });

  it("the last owner can neither be demoted nor leave", async () => {
    const owner = await newUser();
    const org = await createOrganization(owner);

    await expectError(
      db.query(owner, "select public.update_member_role($1, $2, 'admin')", [org.id, owner.id]),
      "22023",
    );
    await expectError(
      db.query(owner, "select public.remove_member($1, $2)", [org.id, owner.id]),
      "22023",
    );

    const coOwner = await newUser();
    await addMember(org, owner, coOwner, "admin");
    await db.query(owner, "select public.update_member_role($1, $2, 'owner')", [
      org.id,
      coOwner.id,
    ]);
    await db.query(owner, "select public.remove_member($1, $2)", [org.id, owner.id]);
    expect(await db.query(owner, "select * from public.organizations")).toEqual([]);
  });

  it("any member can leave, but not remove others without permission", async () => {
    const { org, sales, viewer } = await team();
    await expectError(
      db.query(sales, "select public.remove_member($1, $2)", [org.id, viewer.id]),
      "42501",
    );
    await db.query(sales, "select public.remove_member($1, $2)", [org.id, sales.id]);
    expect(await db.query(sales, "select * from public.organizations")).toEqual([]);
  });

  it("outsiders get FORBIDDEN rather than learning whether an organization exists", async () => {
    const owner = await newUser();
    const org = await createOrganization(owner);
    const outsider = await newUser();
    await expectError(
      db.query(outsider, "select public.update_member_role($1, $2, 'viewer')", [org.id, owner.id]),
      "42501",
    );
  });
});

describe("permissions", () => {
  it("my_permissions reflects the caller's role", async () => {
    const { org, sales } = await team();
    const rows = await db.query<{ my_permissions: string }>(
      sales,
      "select * from public.my_permissions($1)",
      [org.id],
    );
    expect(rows.map((r) => r.my_permissions)).toEqual([...ROLE_PERMISSIONS.sales].sort());

    const outsider = await newUser();
    expect(await db.query(outsider, "select * from public.my_permissions($1)", [org.id])).toEqual(
      [],
    );
  });

  it("the database and src/lib/auth/permissions.ts agree", async () => {
    const { rows } = await db.pg.query<{ role: string; permission: string }>(
      "select role::text, permission from public.role_permissions",
    );
    for (const role of ROLES) {
      expect(
        rows
          .filter((r) => r.role === role)
          .map((r) => r.permission)
          .sort(),
        role,
      ).toEqual([...ROLE_PERMISSIONS[role]].sort());
    }
    expect(new Set(rows.map((r) => r.permission))).toEqual(new Set(PERMISSIONS));
  });
});

describe("audit log", () => {
  it("records changes with only the changed columns", async () => {
    const owner = await newUser();
    const org = await createOrganization(owner);
    await db.query(owner, "update public.organizations set name = 'ABC Traders' where id = $1", [
      org.id,
    ]);

    const logs = await db.query<{
      action: string;
      entity_type: string;
      user_id: string;
      old_data: unknown;
      new_data: unknown;
    }>(
      owner,
      "select * from public.audit_logs where organization_id = $1 order by created_at, action",
      [org.id],
    );
    expect(logs.map((l) => [l.entity_type, l.action])).toEqual(
      expect.arrayContaining([
        ["organizations", "CREATE"],
        ["organization_members", "CREATE"],
        ["organizations", "UPDATE"],
      ]),
    );
    const update = logs.find((l) => l.action === "UPDATE");
    expect(update).toMatchObject({
      user_id: owner.id,
      old_data: { name: "ABC Distributors" },
      new_data: { name: "ABC Traders" },
    });
  });

  it("is readable by owners and admins only, and is append-only", async () => {
    const { org, owner, admin, manager } = await team();
    const count = async (user: User) =>
      (
        await db.query(user, "select id from public.audit_logs where organization_id = $1", [
          org.id,
        ])
      ).length;

    expect(await count(owner)).toBeGreaterThan(0);
    expect(await count(admin)).toBeGreaterThan(0);
    expect(await count(manager)).toBe(0);

    await expectError(db.query(owner, "delete from public.audit_logs"), "42501");
    await expectError(db.query(owner, "update public.audit_logs set action = 'DELETE'"), "42501");
    await expectError(
      db.query(
        owner,
        "insert into public.audit_logs (organization_id, entity_type, entity_id, action) values ($1, 'x', $1, 'CREATE')",
        [org.id],
      ),
      "42501",
    );
  });
});

describe("storage", () => {
  const path = (orgId: string, area: string) => `organizations/${orgId}/${area}/file.png`;
  const upload = (user: User, name: string) =>
    db.query(
      user,
      "insert into storage.objects (bucket_id, name) values ('organization-files', $1) returning id",
      [name],
    );

  it("lets permitted members upload to their own organization's areas", async () => {
    const { org, owner, manager, sales } = await team();

    await upload(owner, path(org.id, "branding"));
    await upload(manager, path(org.id, "products"));
    await expectError(upload(manager, path(org.id, "branding")), "42501");
    await expectError(upload(sales, path(org.id, "products")), "42501");
    // Generated documents are service-role only.
    await expectError(upload(owner, path(org.id, "invoices")), "42501");
    await expectError(upload(owner, "not-an-org-path/file.png"), "42501");
  });

  it("keeps files private to the organization", async () => {
    const { org, owner, viewer } = await team();
    const outsider = await newUser();
    const name = path(org.id, "products").replace("file", "private");
    await upload(owner, name);

    const read = (user: Actor) =>
      db.query(user, "select id from storage.objects where name = $1", [name]);
    expect(await read(viewer)).toHaveLength(1);
    expect(await read(outsider)).toHaveLength(0);

    const outsiderOrg = await createOrganization(outsider, "Other");
    await expectError(upload(outsider, path(org.id, "products")), "42501");
    expect(outsiderOrg).toBeDefined();
  });
});
