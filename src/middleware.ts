import { defineMiddleware } from "astro:middleware";
import { createServerClient } from "@supabase/ssr";

export const onRequest = defineMiddleware(
  async ({ locals, request, cookies, redirect }, next) => {
    const supabase = createServerClient(
      import.meta.env.SUPABASE_URL,
      import.meta.env.SUPABASE_PUBLISHABLE_KEY,
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
