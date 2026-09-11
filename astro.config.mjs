import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";
import icon from "astro-icon";
import appIcons from "./plugins/app-icons.mjs";

const site = "https://maten.hanshenrik.com";

export default defineConfig({
  output: "server",
  adapter: vercel(),
  integrations: [react(), icon()],
  prefetch: true,
  site,

  image: {
    // Recipe photos live in Supabase storage, and the optimiser only touches
    // hosts it has been told to trust
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  security: {
    // Disabled since 2026-03 because the forwarded URL on Vercel didn't match
    // the Origin header and broke login. Cookies are SameSite=Lax instead,
    // which keeps cross-site POSTs from carrying the session.
    checkOrigin: false,
  },

  vite: {
    define: {
      "import.meta.env.PUBLIC_SITE_URL": JSON.stringify(site),
    },
    plugins: [tailwindcss(), appIcons()],
  },
});
