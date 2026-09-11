import type { APIRoute } from "astro";
import { apiError, json } from "../../../../lib/api";
import { fetchRecipeWithIngredients } from "../../../../lib/queries";

/** Copies a recipe into the caller's household as a new, private recipe. */
export const POST: APIRoute = async ({ params, locals }) => {
  const recipeId = params.id;
  const userId = locals.user?.id;
  const householdId = locals.householdId;

  if (!recipeId || !userId || !householdId) {
    return apiError("Mangler data", 400);
  }

  const original = await fetchRecipeWithIngredients(locals.supabase, recipeId);
  if (!original) {
    return apiError("Fant ikke oppskriften", 404);
  }

  const { data: copy, error: insertError } = await locals.supabase
    .from("recipes")
    .insert({
      title: `${original.title} (kopi)`,
      description: original.description,
      instructions: original.instructions,
      image_url: original.image_url,
      source_url: original.source_url,
      cook_time: original.cook_time,
      servings: original.servings,
      user_id: userId,
      household_id: householdId,
      is_public: false,
      author_name: null,
    })
    .select("id")
    .single();

  if (insertError || !copy) {
    console.error("Error cloning recipe:", insertError);
    return apiError("Klarte ikke å kopiere oppskriften", 500);
  }

  if (original.ingredients.length > 0) {
    const { error: ingredientsError } = await locals.supabase
      .from("ingredients")
      .insert(
        original.ingredients.map((ing) => ({
          recipe_id: copy.id,
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          is_basic: ing.is_basic,
          optional: ing.optional,
        })),
      );

    if (ingredientsError) {
      // The recipe exists, so still report success; the user can add them
      console.error("Error copying ingredients:", ingredientsError);
    }
  }

  return json({ success: true, id: copy.id }, 201);
};
