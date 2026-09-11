import type { APIRoute } from "astro";
import {
  clearAppCookies,
  createSupabaseServerClient,
} from "../../../lib/supabase-server";

const logout: APIRoute = async ({ cookies, redirect, request }) => {
  const supabase = createSupabaseServerClient({ request, cookies });

  const { error } = await supabase.auth.signOut();
  if (error) console.error("Error signing out:", error);

  // Forget the cached household too, so the next login starts clean
  clearAppCookies({ request, cookies });

  return redirect("/login");
};

export const POST = logout;
// Lets a plain link log people out as well
export const GET = logout;
