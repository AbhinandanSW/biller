import type { TestDb } from "./harness";

export type User = { id: string; email: string };
export type Organization = { id: string; name: string };
export type TeamRole = "admin" | "manager" | "sales" | "viewer";

let counter = 0;

export async function newUser(db: TestDb, options?: { confirmed?: boolean; fullName?: string }) {
  counter += 1;
  return db.createUser(`user${counter}-${Date.now()}@example.com`, options);
}

export async function createOrganization(db: TestDb, owner: User, name = "ABC Distributors") {
  const [org] = await db.query<Organization>(
    owner,
    "select * from public.create_organization($1)",
    [name],
  );
  return org;
}

/** Adds `user` to `org` with `role` via the real invite → accept flow. */
export async function addMember(
  db: TestDb,
  org: Organization,
  inviter: User,
  user: User,
  role: TeamRole,
) {
  const [invitation] = await db.query<{ id: string }>(
    inviter,
    "select * from public.invite_member($1, $2, $3)",
    [org.id, user.email, role],
  );
  await db.query(user, "select * from public.accept_invitation($1)", [invitation.id]);
}

/** An organization with an owner and one member of each other role. */
export async function createTeam(db: TestDb) {
  const owner = await newUser(db);
  const org = await createOrganization(db, owner);
  const members = {} as Record<TeamRole, User>;
  for (const role of ["admin", "manager", "sales", "viewer"] as const) {
    members[role] = await newUser(db);
    await addMember(db, org, owner, members[role], role);
  }
  return { org, owner, ...members };
}

export async function expectDbError(promise: Promise<unknown>, code: string) {
  const { expect } = await import("vitest");
  await expect(promise).rejects.toMatchObject({ code });
}
