import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { HOME_PATH, LOGIN_PATH } from "@/constants/routes";
import type { Database } from "@/types/database";
import { getPublicEnv, isSupabaseConfigured } from "@/utils/env";
import { isApiPath, isAuthPage, isPublicPath } from "@/utils/routes";

/**
 * Refreshes the Supabase session on every request and does optimistic route
 * protection. This is a UX shortcut, not the security boundary — pages call
 * requireUser()/requireOrganization() and the database enforces RLS.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) return response;

  const env = getPublicEnv();
  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  // Validates the JWT and refreshes it when needed. Must run before any
  // redirect decision so refreshed cookies aren't lost.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;

  if (!signedIn && !isPublicPath(pathname) && !isApiPath(pathname)) {
    const url = new URL(LOGIN_PATH, request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return redirectWithCookies(url, response);
  }

  if (signedIn && isAuthPage(pathname)) {
    return redirectWithCookies(new URL(HOME_PATH, request.url), response);
  }

  return response;
}

/** Redirect that keeps any session cookies Supabase just refreshed. */
function redirectWithCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
