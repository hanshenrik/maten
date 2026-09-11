import type { AstroCookies } from "astro";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";
import { APP_COOKIE_PREFIX } from "../utils/cookies";

export { APP_COOKIE_PREFIX };

const THIRTY_DAYS = 60 * 60 * 24 * 30;

/**
 * Cookie settings shared by every cookie the app sets on the server, so the
 * auth cookies and our own cache cookies always agree.
 */
export const COOKIE_OPTIONS = {
  path: "/",
  maxAge: THIRTY_DAYS,
  secure: true,
  sameSite: "lax",
  httpOnly: false, // The browser Supabase client needs to read the session
} as const;

interface RequestContext {
  request: Request;
  cookies: AstroCookies;
}

/**
 * A Supabase client that acts as the signed-in user, reading the session from
 * the request cookies and writing refreshed tokens back to the response.
 */
export function createSupabaseServerClient({
  request,
  cookies,
}: RequestContext): SupabaseClient {
  return createServerClient(env.supabaseUrl, env.supabasePublishableKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("Cookie") ?? "").map(
          ({ name, value }) => ({ name, value: value ?? "" }),
        );
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          try {
            cookies.set(name, value, { ...options, ...COOKIE_OPTIONS });
          } catch {
            // A token refresh can finish after the response has been sent.
            // The browser still has the refresh token and will retry.
          }
        }
      },
    },
  });
}

/** Removes every cookie the app itself set (household cache and the like). */
export function clearAppCookies({ request, cookies }: RequestContext) {
  for (const { name } of parseCookieHeader(
    request.headers.get("Cookie") ?? "",
  )) {
    if (name.startsWith(APP_COOKIE_PREFIX)) {
      cookies.delete(name, { path: "/" });
    }
  }
}
