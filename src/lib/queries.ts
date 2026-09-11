import type { SupabaseClient } from "@supabase/supabase-js";
import type { WizardRecipe } from "../components/MealPlanningWizard";
import type { MealPlanWithMeals, RecipeWithIngredients } from "../types";

/** Loaders shared by more than one page. Errors are logged, not thrown. */

export async function fetchRecipeWithIngredients(
  supabase: SupabaseClient,
  id: string,
): Promise<RecipeWithIngredients | null> {
  const { data, error } = await supabase
    .from("recipes")
    .select("*, ingredients (*)")
    .eq("id", id)
    // Required ingredients first, pantry staples last
    .order("optional", { referencedTable: "ingredients", ascending: true })
    .order("is_basic", { referencedTable: "ingredients", ascending: true })
    .maybeSingle();

  if (error) console.error("Error fetching recipe:", error);
  return (data as RecipeWithIngredients | null) ?? null;
}

export async function fetchMealPlan(
  supabase: SupabaseClient,
  id: string,
): Promise<MealPlanWithMeals | null> {
  const { data, error } = await supabase
    .from("meal_plans")
    .select("*, planned_meals (*, recipes (id, title, image_url, cook_time))")
    .eq("id", id)
    .maybeSingle();

  if (error) console.error("Error fetching meal plan:", error);
  return (data as MealPlanWithMeals | null) ?? null;
}

/** Every recipe the user can plan with, plus what's needed for a shopping list */
export async function fetchWizardRecipes(
  supabase: SupabaseClient,
): Promise<WizardRecipe[]> {
  const { data, error } = await supabase
    .from("recipes")
    .select(
      "id, title, cook_time, image_url, ingredients (name, amount, unit, is_basic)",
    )
    .order("title");

  if (error) console.error("Error fetching recipes:", error);
  return (data as WizardRecipe[] | null) ?? [];
}
