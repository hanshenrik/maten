import { jwtVerify, createRemoteJWKSet } from "jose";
import type { User } from "@supabase/supabase-js";

// Cached module-level JWKS — jose re-fetches automatically when keys rotate.
// One network call per cold start, not per request.
const JWKS = createRemoteJWKSet(
  new URL(
    `${import.meta.env.PUBLIC_SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
  ),
);

// Reads the Supabase session cookie(s) directly and verifies the JWT using
// Supabase's public JWKS — no call to supabase.auth.getUser() needed.
export async function getUserFromCookies(
  cookieHeader: string,
  supabaseUrl: string,
): Promise<User | null> {
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  const key = `sb-${projectRef}-auth-token`;

  const cookieMap = new Map<string, string>();
  for (const part of cookieHeader.split("; ")) {
    const eqIdx = part.indexOf("=");
    if (eqIdx < 0) continue;
    cookieMap.set(part.slice(0, eqIdx), part.slice(eqIdx + 1));
  }

  // Combine chunks (key, key.0, key.1, …)
  let sessionStr = cookieMap.get(key) ?? null;
  if (!sessionStr) {
    const chunks: string[] = [];
    for (let i = 0; ; i++) {
      const chunk = cookieMap.get(`${key}.${i}`);
      if (!chunk) break;
      chunks.push(chunk);
    }
    if (chunks.length) sessionStr = chunks.join("");
  }
  if (!sessionStr) return null;

  // @supabase/ssr optionally encodes values with a "base64-" prefix
  const BASE64_PREFIX = "base64-";
  if (sessionStr.startsWith(BASE64_PREFIX)) {
    sessionStr = Buffer.from(
      sessionStr.slice(BASE64_PREFIX.length),
      "base64url",
    ).toString("utf-8");
  }

  let accessToken: string | undefined;
  try {
    accessToken = JSON.parse(sessionStr)?.access_token;
  } catch {
    return null;
  }
  if (!accessToken) return null;

  try {
    const { payload } = await jwtVerify(accessToken, JWKS);
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
    // Token expired or invalid signature
    return null;
  }
}
