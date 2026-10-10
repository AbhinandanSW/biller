import "server-only";

import { createClient } from "@/api/supabase/server";
import { ORGANIZATION_FILES_BUCKET, SIGNED_URL_TTL_SECONDS } from "@/constants/storage";

/**
 * Signed links for files in the private organization bucket, keyed by path.
 * Runs as the signed-in user, so storage RLS decides what they may read.
 */
export async function signedUrls(paths: (string | null)[]): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  if (unique.length === 0) return new Map();

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(ORGANIZATION_FILES_BUCKET)
    .createSignedUrls(unique, SIGNED_URL_TTL_SECONDS);
  // A missing image shouldn't break the page; it just renders without one.
  if (error) {
    console.error("Couldn't sign file links", { message: error.message });
    return new Map();
  }
  return new Map(
    data.flatMap((d) => (d.path && d.signedUrl ? [[d.path, d.signedUrl] as const] : [])),
  );
}

/** Uploads a file to the organization bucket as the signed-in user. */
export async function uploadFile(path: string, file: File): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.storage
    .from(ORGANIZATION_FILES_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) {
    console.error("Upload failed", { path, message: error.message });
    return { error: "Couldn't upload the image. Please try again." };
  }
  return {};
}

/** Removes files; failures are logged, not fatal (the row no longer points at them). */
export async function removeFiles(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const supabase = await createClient();
  const { error } = await supabase.storage.from(ORGANIZATION_FILES_BUCKET).remove(paths);
  if (error) console.error("Couldn't remove files", { paths, message: error.message });
}
