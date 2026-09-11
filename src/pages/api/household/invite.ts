import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { apiError, json } from "../../../lib/api";
import { env } from "../../../lib/env";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Invites someone to the caller's household. The membership row is created
 * right away (RLS makes sure the caller belongs to the household); an e-mail
 * is only sent to people who don't have an account yet, since existing users
 * see the invitation in the app.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  let body: { email?: unknown; householdId?: unknown };
  try {
    body = await request.json();
  } catch {
    return apiError("Ugyldig forespørsel", 400);
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const householdId =
    typeof body.householdId === "string" ? body.householdId : "";

  if (!email || !householdId) {
    return apiError("Mangler e-post eller husstand", 400);
  }
  if (!EMAIL_PATTERN.test(email)) {
    return apiError("Det ser ikke ut som en gyldig e-postadresse", 400);
  }
  if (householdId !== locals.householdId) {
    return apiError("Du kan bare invitere til din egen husstand", 403);
  }

  const { error: insertError } = await locals.supabase
    .from("household_members")
    .insert({ household_id: householdId, email, role: "member" });

  if (insertError) {
    if (insertError.code === "23505") {
      return apiError("Denne personen er allerede med i gjengen!", 409);
    }
    console.error("Error creating invitation:", insertError);
    return apiError("Vi klarte ikke å lagre invitasjonen", 500);
  }

  const serviceRoleKey = env.supabaseServiceRoleKey;
  if (!serviceRoleKey) {
    return json(
      { success: true, emailSent: false, reason: "no_service_key" },
      201,
    );
  }

  const adminClient = createClient(env.supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Inviting an existing user fails with a specific error, which is exactly
  // the signal we need; no need to scan the user list first.
  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    email,
    { redirectTo: new URL("/auth/callback", env.siteUrl).toString() },
  );

  if (!inviteError) {
    return json({ success: true, emailSent: true }, 201);
  }

  const alreadyRegistered =
    inviteError.code === "email_exists" ||
    inviteError.status === 422 ||
    /already.*registered/i.test(inviteError.message);

  if (alreadyRegistered) {
    return json(
      { success: true, emailSent: false, reason: "existing_user" },
      201,
    );
  }

  // The membership row exists, so the invitation still works in the app
  console.error("Failed to send invite email:", inviteError);
  return json({ success: true, emailSent: false, reason: "email_failed" }, 201);
};
