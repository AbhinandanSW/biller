/** Where signed-in users land by default. */
export const HOME_PATH = "/dashboard";
export const LOGIN_PATH = "/login";
export const ONBOARDING_PATH = "/onboarding";
export const RESET_PASSWORD_PATH = "/reset-password";
export const AUTH_CONFIRM_PATH = "/auth/confirm";

/** Reachable without signing in. */
export const PUBLIC_PATHS = [
  "/",
  LOGIN_PATH,
  "/signup",
  "/forgot-password",
  AUTH_CONFIRM_PATH,
  "/design",
  // Customer-facing PDF links; the token in the URL is the permission.
  "/share",
] as const;

/** Sign-in pages that signed-in users are sent away from. */
export const AUTH_PAGES = [LOGIN_PATH, "/signup", "/forgot-password"] as const;

/** API routes answer with JSON errors instead of redirecting. */
export const API_PATH_PREFIX = "/api";
