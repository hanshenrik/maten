import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

export const POST: APIRoute = async ({ request, locals }) => {
  const { email, householdId } = await request.json();

  if (!email || !householdId) {
    return new Response(
      JSON.stringify({ error: "Mangler e-post eller husstand" }),
      {
        status: 400,
      },
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  // 1. Insert into household_members using the user's authenticated client
  const { error: insertError } = await locals.supabase
    .from("household_members")
    .insert({
      household_id: householdId,
      email: normalizedEmail,
      role: "member",
    });

  if (insertError) {
    if (insertError.code === "23505") {
      return new Response(
        JSON.stringify({ error: "Denne personen er allerede med i gjengen!" }),
        { status: 409 },
      );
    }
    return new Response(JSON.stringify({ error: insertError.message }), {
      status: 500,
    });
  }

  // 2. Check if user already exists — if so, no email needed
  const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    // No service role key configured — skip email, invite was still created
    return new Response(
      JSON.stringify({
        success: true,
        emailSent: false,
        reason: "no_service_key",
      }),
      { status: 201 },
    );
  }

  const adminClient = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // Check if the user already has an account
  const { data: existingUsers } = await adminClient.auth.admin.listUsers();
  const userExists = existingUsers?.users?.some(
    (u) => u.email?.toLowerCase() === normalizedEmail,
  );

  if (userExists) {
    // User already has an account — they'll see the in-app banner
    return new Response(
      JSON.stringify({
        success: true,
        emailSent: false,
        reason: "existing_user",
      }),
      { status: 201 },
    );
  }

  // 3. Send invite email to new user
  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    normalizedEmail,
    { redirectTo: import.meta.env.PUBLIC_SUPABASE_URL ? undefined : undefined },
  );

  if (inviteError) {
    // Invite email failed but the household_members row was created
    console.error("Failed to send invite email:", inviteError);
    return new Response(
      JSON.stringify({
        success: true,
        emailSent: false,
        reason: "email_failed",
      }),
      { status: 201 },
    );
  }

  return new Response(JSON.stringify({ success: true, emailSent: true }), {
    status: 201,
  });
};
