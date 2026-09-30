/** Where signed-in users land by default. */
export const HOME_PATH = "/dashboard";
export const LOGIN_PATH = "/login";
export const ONBOARDING_PATH = "/onboarding";

/** Reachable without signing in. */
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/auth/confirm",
  "/design",
  // Customer-facing PDF links; the token in the URL is the permission.
  "/share",
];

/** Sign-in pages that signed-in users are sent away from. */
const AUTH_PAGES = ["/login", "/signup", "/forgot-password"];

function matches(pathname: string, paths: readonly string[]) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    matches(
      pathname,
      PUBLIC_PATHS.filter((p) => p !== "/"),
    )
  );
}

export function isAuthPage(pathname: string): boolean {
  return matches(pathname, AUTH_PAGES);
}

/** API routes answer with JSON errors instead of redirecting. */
export function isApiPath(pathname: string): boolean {
  return matches(pathname, ["/api"]);
}

/**
 * Returns `value` if it is a same-site path, otherwise `fallback`. Guards
 * `?next=` redirects against sending users to another site.
 */
export function safeNextPath(value: string | null | undefined, fallback = HOME_PATH): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  try {
    // Resolve against a dummy origin; anything that escapes it is rejected.
    const url = new URL(value, "http://app.invalid");
    return url.origin === "http://app.invalid"
      ? `${url.pathname}${url.search}${url.hash}`
      : fallback;
  } catch {
    return fallback;
  }
}
