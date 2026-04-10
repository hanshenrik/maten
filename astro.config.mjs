import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";
import icon from "astro-icon";

export default defineConfig({
  output: "server",
  adapter: vercel(),
  integrations: [react(), icon()],
  prefetch: true,

  site: "https://maten.hanshenrik.com",
  security: {
    checkOrigin: false,
  },

  vite: {
    define: {
      "import.meta.env.PUBLIC_SITE_URL": JSON.stringify(
        "https://maten.hanshenrik.com",
      ),
    },
    plugins: [tailwindcss()],
  },
});
