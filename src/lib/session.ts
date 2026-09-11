import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface Session {
  user: User;
  householdId: string;
  supabase: SupabaseClient;
}

/**
 * The signed-in user and their household, for pages behind the login wall.
 *
 * The middleware redirects to /login without a user and to /settings without
 * a household, so on any other page both are guaranteed. This just tells
 * TypeScript so, and fails loudly if a route ever slips past the middleware.
 */
export function requireSession(locals: App.Locals): Session {
  const { user, householdId, supabase } = locals;
  if (!user) {
    throw new Error("requireSession called without a signed-in user");
  }
  if (!householdId) {
    throw new Error("requireSession called without a household");
  }
  return { user, householdId, supabase };
}

/** What we call the user when a name is needed and none is set. */
export function displayNameFor(user: User): string {
  return (
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "En kokk"
  );
}
