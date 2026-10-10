import { API_PATH_PREFIX, AUTH_PAGES, HOME_PATH, PUBLIC_PATHS } from "@/constants/routes";

import { getPublicEnv } from "./env";

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

export function isApiPath(pathname: string): boolean {
  return matches(pathname, [API_PATH_PREFIX]);
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

/** Absolute URL of an app path, e.g. for links in emails. */
export function appUrl(path: string): string {
  return `${getPublicEnv().NEXT_PUBLIC_APP_URL}${path}`;
}

/** Public link customers use to view an order or invoice PDF. */
export function shareUrl(shareToken: string): string {
  return appUrl(`/share/${shareToken}`);
}

/** Whether a sidebar/bottom-nav link is the current section. */
export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
