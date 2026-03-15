import { defineMiddleware } from "astro:middleware";
import { createServerClient } from "@supabase/ssr";

export const onRequest = defineMiddleware(
  async ({ locals, request, cookies, redirect }, next) => {
    const supabase = createServerClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll() {
            const cookieHeader = request.headers.get("Cookie") ?? "";
            return cookieHeader
              .split("; ")
              .filter(Boolean)
              .map((c) => {
                const [name, ...value] = c.split("=");
                return { name, value: value.join("=") };
              });
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookies.set(name, value, {
                ...options,
                maxAge: 60 * 60 * 24 * 30, // 30 days
              });
            });
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    locals.user = user;
    locals.supabase = supabase;

    if (user) {
      // 1. Count pending invitations
      let pendingCount = 0;
      const { count: inviteCount, error: inviteError } = await supabase
        .from("household_members")
        .select("*", { count: "exact", head: true })
        .eq("email", user.email)
        .is("user_id", null);

      if (inviteError) {
        console.error("Error counting invitations:", inviteError);
      } else {
        pendingCount = inviteCount || 0;
      }
      locals.pendingInvitesCount = pendingCount;

      // 2. Fetch the latest active membership
      let { data: members, error: fetchError } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error("Error fetching household membership:", fetchError);
      }

      let member = members?.[0];

      // 3. Create a default household if nothing exists
      if (!member) {
        const { data: newH, error: createHError } = await supabase
          .from("households")
          .insert({ name: `${user.email}'s Household` })
          .select()
          .single();

        if (createHError) {
          console.error("Error creating household:", createHError);
        }

        if (newH) {
          const { error: memberError } = await supabase
            .from("household_members")
            .insert({
              household_id: newH.id,
              user_id: user.id,
              email: user.email!,
              role: "owner",
            });

          if (memberError) {
            console.error("Error creating household membership:", memberError);
          } else {
            member = { household_id: newH.id };
          }
        }
      }

      locals.householdId = member?.household_id;
    }

    const url = new URL(request.url);
    if (!user && url.pathname !== "/login" && url.pathname !== "/signup") {
      return redirect("/login");
    }

    if (user && url.pathname === "/login") {
      return redirect("/");
    }

    return next();
  },
);
