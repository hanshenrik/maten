/**
 * Shared shapes for the rows we read from Supabase. The client is untyped, so
 * these are what the pages and components agree on.
 */

export interface Recipe {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  image_url: string | null;
  source_url: string | null;
  cook_time: number | null;
  servings: number | null;
  is_public: boolean;
  author_name: string | null;
  household_id: string;
  user_id: string;
  created_at: string;
}

export interface Ingredient {
  id: string;
  recipe_id: string;
  name: string;
  amount: number | null;
  unit: string;
  is_basic: boolean;
  optional: boolean;
}

export type RecipeWithIngredients = Recipe & { ingredients: Ingredient[] };

/** The bit of a recipe a meal plan needs to show */
export type RecipeSummary = Pick<
  Recipe,
  "id" | "title" | "image_url" | "cook_time"
>;

export interface MealPlan {
  id: string;
  title: string | null;
  start_date: string;
  end_date: string;
  household_id: string;
  user_id: string;
  created_at: string;
}

export interface PlannedMeal {
  id: string;
  meal_plan_id: string;
  date: string;
  recipe_id: string | null;
  notes: string | null;
}

export type MealPlanWithMeals = MealPlan & {
  planned_meals: (PlannedMeal & { recipes?: RecipeSummary | null })[];
};

export interface ShoppingItem {
  id: string;
  household_id: string;
  user_id: string;
  name: string;
  amount: number | null;
  unit: string;
  completed: boolean;
  notes?: string | null;
  created_at: string;
}

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string | null;
  email: string;
  role: "owner" | "member";
  created_at: string;
  avatar_url: string | null;
  display_name: string | null;
}

export type Theme = "light" | "dark" | "auto";
