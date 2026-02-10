import { defineConfig } from "astro/config";
import react from "@astrojs/react";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  output: "static",
  integrations: [react()],
  vite: {
    define: {
      "import.meta.env.PUBLIC_SITE_URL": JSON.stringify(
        "https://hanshenrik.github.io/maten",
      ),
    },
    plugins: [tailwindcss()],
  },
});
