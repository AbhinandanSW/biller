import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { PGlite, type Transaction } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";

/**
 * Minimal stand-in for the parts of Supabase the migrations depend on: the
 * API roles, auth.users / auth.uid() / auth.jwt(), the storage tables, and
 * Supabase's default grants (which give anon/authenticated everything on
 * public — so these tests also prove the migrations lock that down).
 */
const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;

  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

  create schema extensions;
  grant usage on schema extensions to anon, authenticated, service_role;

  create schema auth;
  grant usage on schema auth to anon, authenticated, service_role;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    email_confirmed_at timestamptz,
    raw_user_meta_data jsonb not null default '{}'
  );
  create function auth.jwt() returns jsonb language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
  $$;
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(auth.jwt() ->> 'sub', '')::uuid
  $$;

  create schema storage;
  grant usage on schema storage to anon, authenticated, service_role;
  create table storage.buckets (id text primary key, name text not null, public boolean default false);
  create table storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets (id),
    name text not null
  );
  alter table storage.objects enable row level security;
  grant all on storage.objects to anon, authenticated, service_role;
`;

const MIGRATIONS_DIR = join(import.meta.dirname, "..", "migrations");

export type Actor = { id: string; email: string } | "anon";

export interface TestDb {
  pg: PGlite;
  /** Creates an auth user (the profile trigger runs as on Supabase). */
  createUser(
    email: string,
    options?: { confirmed?: boolean; fullName?: string },
  ): Promise<{
    id: string;
    email: string;
  }>;
  /** Runs `fn` inside a transaction as the given API role and user. Rolled back on error. */
  as<T>(actor: Actor, fn: (tx: Transaction) => Promise<T>): Promise<T>;
  /** Shorthand for a single query as `actor`. */
  query<T = Record<string, unknown>>(actor: Actor, sql: string, params?: unknown[]): Promise<T[]>;
}

export async function createTestDb(): Promise<TestDb> {
  const pg = new PGlite({ extensions: { pg_trgm } });
  await pg.exec(SUPABASE_STUB);

  const migrations = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();
  for (const file of migrations) {
    try {
      await pg.exec(readFileSync(join(MIGRATIONS_DIR, file), "utf8"));
    } catch (error) {
      throw new Error(`Migration ${file} failed: ${(error as Error).message}`);
    }
  }

  const as: TestDb["as"] = (actor, fn) =>
    pg.transaction(async (tx) => {
      if (actor === "anon") {
        await tx.exec("set local role anon");
      } else {
        await tx.query("select set_config('request.jwt.claims', $1, true)", [
          JSON.stringify({ sub: actor.id, email: actor.email, role: "authenticated" }),
        ]);
        await tx.exec("set local role authenticated");
      }
      return fn(tx);
    });

  return {
    pg,
    async createUser(email, { confirmed = true, fullName } = {}) {
      const { rows } = await pg.query<{ id: string }>(
        `insert into auth.users (email, email_confirmed_at, raw_user_meta_data)
         values ($1, case when $2 then now() end, $3) returning id`,
        [email, confirmed, JSON.stringify(fullName ? { full_name: fullName } : {})],
      );
      return { id: rows[0].id, email };
    },
    as,
    async query(actor, sql, params = []) {
      return as(actor, async (tx) => (await tx.query(sql, params)).rows as never);
    },
  };
}
