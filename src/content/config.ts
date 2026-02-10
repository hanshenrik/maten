import { defineCollection, z } from "astro:content";

// Extract the actual schemas for type inference
const recipeSchema = z.object({
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
  instructions: z.array(z.string()).optional(),
  servings: z.number().optional(),
  prepTime: z.number().optional(),
  cookTime: z.number().optional(),
  categories: z.array(z.string()).optional(),
  image: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

const planSchema = z.object({
  week: z.number(),
  year: z.number(),
  days: z.array(
    z.object({
      day: z.string(),
      date: z.date(),
      recipeId: z.string(),
      notes: z.string().optional(),
    }),
  ),
});

const shoppingListSchema = z.object({
  id: z.string(),
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      amount: z.number(),
      unit: z.string(),
      category: z.string(),
      completed: z.boolean(),
      notes: z.string().optional(),
    }),
  ),
  createdAt: z.date(),
  updatedAt: z.date(),
  completed: z.boolean(),
});

// Recipe collection schema
const recipes = defineCollection({
  type: "content",
  schema: recipeSchema,
});

const plans = defineCollection({
  type: "content",
  schema: planSchema,
});

// Shopping List collection schema (for future use if needed)
// Note: Shopping lists are currently managed in-memory via the data store
const shoppingLists = defineCollection({
  type: "data",
  schema: shoppingListSchema,
});

export const collections = {
  recipes,
  plans,
  shoppingLists,
};

// Export TypeScript types derived from Zod schemas for use in components
export type Recipe = z.infer<typeof recipeSchema>;
export type RecipeIngredient = Recipe["ingredients"][number];

export type Plan = z.infer<typeof planSchema>;
export type PlanDay = Plan["days"][number];

export type ShoppingList = z.infer<typeof shoppingListSchema>;
export type ShoppingListItem = ShoppingList["items"][number];

// Types for content collection items (what getCollection returns)
export interface ContentRecipe {
  id: string;
  data: Recipe;
}

export interface ContentPlan {
  id: string;
  data: Plan;
}

export interface ContentShoppingList {
  id: string;
  data: ShoppingList;
}
