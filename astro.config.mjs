import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";
import icon from "astro-icon";

const site = "https://maten.hanshenrik.com";

export default defineConfig({
  output: "server",
  adapter: vercel(),
  integrations: [react(), icon()],
  prefetch: true,
  site,

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
    plugins: [tailwindcss()],
  },
});
