import { defineMiddleware } from "astro:middleware";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { AstroCookies } from "astro";
import { getUserFromCookies, readSessionCookie } from "./lib/auth";
import { apiError } from "./lib/api";
import {
  APP_COOKIE_PREFIX,
  COOKIE_OPTIONS,
  createSupabaseServerClient,
} from "./lib/supabase-server";

/** Pages you can see without being logged in */
const PUBLIC_PATHS = new Set(["/login", "/signup", "/auth/callback"]);

// Household membership hardly ever changes, so it's cached in cookies instead
// of being looked up on every request. Bump the version to invalidate.
const CACHE_VERSION = "v1";
const HOUSEHOLD_ID_COOKIE = `${APP_COOKIE_PREFIX}h_id_${CACHE_VERSION}`;
const PENDING_INVITES_COOKIE = `${APP_COOKIE_PREFIX}p_inv_${CACHE_VERSION}`;

export const onRequest = defineMiddleware(
  async ({ locals, request, cookies, redirect, url }, next) => {
    const supabase = createSupabaseServerClient({ request, cookies });
    const cookieHeader = request.headers.get("Cookie") ?? "";

    // Fast path: verify the access token locally, no round trip to Supabase.
    // If that fails but there is a session cookie, the token has most likely
    // expired; let Supabase refresh it (new cookies are written via setAll)
    // instead of sending someone with a perfectly good refresh token to login.
    let user = await getUserFromCookies(cookieHeader);
    if (!user && readSessionCookie(cookieHeader)) {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    }

    locals.user = user;
    locals.supabase = supabase;
    locals.householdId = undefined;
    locals.pendingInvitesCount = 0;

    const isApiRoute = url.pathname.startsWith("/api/");

    if (!user) {
      if (PUBLIC_PATHS.has(url.pathname)) return next();
      if (isApiRoute) return apiError("Du må være logget inn", 401);
      return redirect("/login");
    }

    if (url.pathname === "/login" || url.pathname === "/signup") {
      return redirect("/");
    }

    const household = await resolveHousehold(user, supabase, cookies);
    locals.householdId = household.id;
    locals.pendingInvitesCount = household.pendingInvites;

    // Without a household nothing else works. Settings explains what to do.
    if (!household.id && !isApiRoute && url.pathname !== "/settings") {
      return redirect("/settings");
    }

    return next();
  },
);

interface Household {
  id: string | undefined;
  pendingInvites: number;
}

/**
 * The user's household and how many invitations are waiting for them, from
 * the cookie cache when possible. A user without a household gets one.
 */
async function resolveHousehold(
  user: User,
  supabase: SupabaseClient,
  cookies: AstroCookies,
): Promise<Household> {
  const cachedId = cookies.get(HOUSEHOLD_ID_COOKIE)?.value;
  const cachedInvites = cookies.get(PENDING_INVITES_COOKIE)?.value;

  if (cachedId && cachedInvites !== undefined) {
    return { id: cachedId, pendingInvites: parseInt(cachedInvites, 10) || 0 };
  }

  const [inviteRes, memberRes] = await Promise.all([
    user.email
      ? supabase
          .from("household_members")
          .select("*", { count: "exact", head: true })
          .eq("email", user.email)
          .is("user_id", null)
      : Promise.resolve({ count: 0, error: null }),
    supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  if (inviteRes.error) {
    console.error("Error counting invitations:", inviteRes.error);
  }
  if (memberRes.error) {
    console.error("Error fetching household membership:", memberRes.error);
  }

  const pendingInvites = inviteRes.count ?? 0;
  let householdId: string | undefined = memberRes.data?.[0]?.household_id;

  if (!householdId && !memberRes.error) {
    householdId = await createHousehold(user, supabase);
  }

  if (householdId) {
    cookies.set(HOUSEHOLD_ID_COOKIE, householdId, COOKIE_OPTIONS);
  }
  if (!inviteRes.error) {
    cookies.set(PENDING_INVITES_COOKIE, String(pendingInvites), COOKIE_OPTIONS);
  }

  return { id: householdId, pendingInvites };
}

async function createHousehold(
  user: User,
  supabase: SupabaseClient,
): Promise<string | undefined> {
  const { data: household, error: householdError } = await supabase
    .from("households")
    .insert({ name: `${user.email}'s Household` })
    .select("id")
    .single();

  if (householdError || !household) {
    console.error("Error creating household:", householdError);
    return undefined;
  }

  const { error: memberError } = await supabase
    .from("household_members")
    .insert({
      household_id: household.id,
      user_id: user.id,
      email: user.email,
      role: "owner",
    });

  if (memberError) {
    console.error("Error creating household membership:", memberError);
    return undefined;
  }

  return household.id;
}
