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

    const CACHE_VERSION = "v1";
    const HOUSEHOLD_ID_COOKIE = `maten_h_id_${CACHE_VERSION}`;
    const PENDING_INVITES_COOKIE = `maten_p_inv_${CACHE_VERSION}`;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    locals.user = user;
    locals.supabase = supabase;

    if (user) {
      const cachedHId = cookies.get(HOUSEHOLD_ID_COOKIE)?.value;
      const cachedPInv = cookies.get(PENDING_INVITES_COOKIE)?.value;

      let householdId = cachedHId;
      let pendingCount = cachedPInv ? parseInt(cachedPInv, 10) : undefined;

      // If any of the essential info is missing from cache, fetch it
      if (householdId === undefined || pendingCount === undefined) {
        const [inviteRes, memberRes] = await Promise.all([
          supabase
            .from("household_members")
            .select("*", { count: "exact", head: true })
            .eq("email", user.email)
            .is("user_id", null),
          supabase
            .from("household_members")
            .select("household_id")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1),
        ]);

        if (inviteRes.error) {
          console.error("Error counting invitations:", inviteRes.error);
        } else {
          pendingCount = inviteRes.count || 0;
        }

        if (memberRes.error) {
          console.error(
            "Error fetching household membership:",
            memberRes.error,
          );
        }

        let member = memberRes.data?.[0];

        // Create a default household if nothing exists
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
              console.error(
                "Error creating household membership:",
                memberError,
              );
            } else {
              member = { household_id: newH.id };
            }
          }
        }

        householdId = member?.household_id;

        // Set cookies for next time
        if (householdId) {
          cookies.set(HOUSEHOLD_ID_COOKIE, householdId, {
            path: "/",
            maxAge: 60 * 60 * 24 * 30, // 30 days
            httpOnly: false, // Accessible to client-side JS for easier clearing
            secure: true,
            sameSite: "lax",
          });
        }
        if (pendingCount !== undefined) {
          cookies.set(PENDING_INVITES_COOKIE, pendingCount.toString(), {
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
            httpOnly: false,
            secure: true,
            sameSite: "lax",
          });
        }
      }

      locals.pendingInvitesCount = pendingCount || 0;
      locals.householdId = householdId;
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
