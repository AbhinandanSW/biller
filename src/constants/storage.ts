/** Private bucket for organization files (see supabase/migrations/*_storage.sql). */
export const ORGANIZATION_FILES_BUCKET = "organization-files";

/** How long signed image links stay valid. Pages re-sign on every render. */
export const SIGNED_URL_TTL_SECONDS = 60 * 60;
