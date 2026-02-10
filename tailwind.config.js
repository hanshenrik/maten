/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        // Nordic-inspired color palette
        primary: "#2D3748",
        secondary: "#4A5568",
        accent: "#4299E1",
        light: "#F7FAFC",
        dark: "#1A202C",
        success: "#48BB78",
        warning: "#ED8936",
        danger: "#F56565",
      },
    },
  },
  plugins: [],
};
