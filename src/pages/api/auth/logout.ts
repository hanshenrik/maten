import type { APIRoute } from "astro";
import { createServerClient } from "@supabase/ssr";

export const POST: APIRoute = async ({ cookies, redirect, request }) => {
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
            .map((c: string) => {
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

  // Clear household caching cookies
  const allCookies = cookies.getAll();
  allCookies.forEach((c) => {
    if (c.name.startsWith("maten_")) {
      cookies.delete(c.name, { path: "/" });
    }
  });

  await supabase.auth.signOut();
  return redirect("/login");
};

export const GET: APIRoute = async ({ cookies, redirect, request }) => {
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
            .map((c: string) => {
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

  // Clear household caching cookies
  const allCookies = cookies.getAll();
  allCookies.forEach((c) => {
    if (c.name.startsWith("maten_")) {
      cookies.delete(c.name, { path: "/" });
    }
  });

  await supabase.auth.signOut();
  return redirect("/login");
};
