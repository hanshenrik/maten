import type { APIRoute } from "astro";
import { apiError, json } from "../../../../lib/api";

/** Adds a shared recipe to the caller's household's recipe book. */
export const POST: APIRoute = async ({ params, locals }) => {
  const recipeId = params.id;
  const householdId = locals.householdId;

  if (!recipeId || !householdId) {
    return apiError("Mangler data", 400);
  }

  const { error } = await locals.supabase
    .from("saved_recipes")
    .insert({ household_id: householdId, recipe_id: recipeId });

  if (error) {
    // Unique constraint violation means it's already saved
    if (error.code === "23505") {
      return json({ message: "Allerede lagret" }, 200);
    }
    console.error("Error saving recipe:", error);
    return apiError("Klarte ikke å lagre oppskriften", 500);
  }

  return json({ success: true }, 201);
};

/** Removes a shared recipe from the caller's household's recipe book. */
export const DELETE: APIRoute = async ({ params, locals }) => {
  const recipeId = params.id;
  const householdId = locals.householdId;

  if (!recipeId || !householdId) {
    return apiError("Mangler data", 400);
  }

  const { error } = await locals.supabase
    .from("saved_recipes")
    .delete()
    .eq("household_id", householdId)
    .eq("recipe_id", recipeId);

  if (error) {
    console.error("Error removing saved recipe:", error);
    return apiError("Klarte ikke å fjerne oppskriften", 500);
  }

  return json({ success: true }, 200);
};
