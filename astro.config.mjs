import { defineConfig } from "astro/config";
import react from "@astrojs/react";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  output: "static",
  integrations: [react()],

  // Content collections configuration
  content: {
    collections: {
      recipes: {
        type: "content",
        schema: ({ z }) =>
          z.object({
            title: z.string(),
            description: z.string(),
            ingredients: z.array(
              z.object({
                name: z.string(),
                amount: z.number(),
                unit: z.string(),
                notes: z.string().optional(),
              }),
            ),
            instructions: z.array(z.string()),
            servings: z.number(),
            prepTime: z.number(),
            cookTime: z.number(),
            categories: z.array(z.string()),
            image: z.string().optional(),
            createdAt: z.date().optional(),
            updatedAt: z.date().optional(),
          }),
      },
      mealPlans: {
        type: "content",
        schema: ({ z }) =>
          z.object({
            week: z.number(),
            year: z.number(),
            days: z.array(
              z.object({
                day: z.string(),
                date: z.date(),
                meals: z.array(
                  z.object({
                    type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
                    recipeId: z.string().optional(),
                    customMeal: z.string().optional(),
                    notes: z.string().optional(),
                  }),
                ),
              }),
            ),
          }),
      },
    },
  },

  site: "https://mat.hanshenrik.com",

  vite: {
    define: {
      "import.meta.env.PUBLIC_SITE_URL": JSON.stringify(
        "https://mat.hanshenrik.com",
      ),
    },
    plugins: [tailwindcss()],
  },
});
