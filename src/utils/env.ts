import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

// NEXT_PUBLIC_* values are inlined at build time, so each one must be
// referenced by its full name rather than read off process.env dynamically.
function readPublicEnv() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || undefined,
  };
}

export function isSupabaseConfigured(): boolean {
  return publicEnvSchema.safeParse(readPublicEnv()).success;
}

export function getPublicEnv(): PublicEnv {
  const result = publicEnvSchema.safeParse(readPublicEnv());
  if (!result.success) {
    throw new Error(
      `Invalid public environment variables. Copy .env.example to .env.local and fill it in.\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}
