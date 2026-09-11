import { jwtVerify, createRemoteJWKSet } from "jose";
import { parseCookieHeader } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { env } from "./env";

// Cached across requests. jose re-fetches automatically when keys rotate, so
// this is one network call per cold start rather than one per request.
let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

const getJwks = () =>
  (jwks ??= createRemoteJWKSet(
    new URL("/auth/v1/.well-known/jwks.json", env.supabaseUrl),
  ));

const authCookieName = () => {
  const projectRef = new URL(env.supabaseUrl).hostname.split(".")[0];
  return `sb-${projectRef}-auth-token`;
};

/**
 * The raw session cookie value, reassembled if @supabase/ssr split it into
 * chunks (`name`, `name.0`, `name.1`, …). Null when there is no session cookie.
 */
export function readSessionCookie(cookieHeader: string): string | null {
  const key = authCookieName();
  const cookies = new Map(
    parseCookieHeader(cookieHeader).map(({ name, value }) => [
      name,
      value ?? "",
    ]),
  );

  const whole = cookies.get(key);
  if (whole) return whole;

  const chunks: string[] = [];
  for (let i = 0; ; i++) {
    const chunk = cookies.get(`${key}.${i}`);
    if (!chunk) break;
    chunks.push(chunk);
  }
  return chunks.length ? chunks.join("") : null;
}

/** Decodes base64url text without Node's Buffer, so this runs on any runtime. */
function decodeBase64Url(value: string): string {
  const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Verifies the access token in the session cookie against Supabase's public
 * keys, without a round trip to Supabase. Returns null when there is no token
 * or it is expired or invalid; the caller can then fall back to a refresh.
 */
export async function getUserFromCookies(
  cookieHeader: string,
): Promise<User | null> {
  const raw = readSessionCookie(cookieHeader);
  if (!raw) return null;

  // @supabase/ssr optionally encodes values with a "base64-" prefix
  const BASE64_PREFIX = "base64-";
  const session = raw.startsWith(BASE64_PREFIX)
    ? decodeBase64Url(raw.slice(BASE64_PREFIX.length))
    : raw;

  let accessToken: string | undefined;
  try {
    accessToken = JSON.parse(session)?.access_token;
  } catch {
    return null;
  }
  if (!accessToken) return null;

  try {
    const { payload } = await jwtVerify(accessToken, getJwks());
    return {
      id: payload.sub!,
      aud: payload.aud as string,
      email: (payload.email as string) ?? undefined,
      phone: (payload.phone as string) || undefined,
      role: (payload.role as string) ?? undefined,
      app_metadata: (payload.app_metadata as Record<string, unknown>) ?? {},
      user_metadata: (payload.user_metadata as Record<string, unknown>) ?? {},
      created_at: new Date(((payload.iat ?? 0) as number) * 1000).toISOString(),
      is_anonymous: (payload.is_anonymous as boolean) ?? false,
    } as unknown as User;
  } catch {
    // Expired or bad signature
    return null;
  }
}
