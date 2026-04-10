import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ params, locals }) => {
  const recipeId = params.id;
  const userId = locals.user?.id;
  const householdId = locals.householdId;

  if (!recipeId || !userId || !householdId) {
    return new Response(JSON.stringify({ error: "Mangler data" }), {
      status: 400,
    });
  }

  // 1. Fetch the original recipe
  const { data: original, error: fetchError } = await locals.supabase
    .from("recipes")
    .select(
      `
      *,
      ingredients (*)
    `,
    )
    .eq("id", recipeId)
    .single();

  if (fetchError || !original) {
    return new Response(JSON.stringify({ error: "Fant ikke oppskriften" }), {
      status: 404,
    });
  }

  // 2. Create a copy of the recipe
  const { data: newRecipe, error: insertError } = await locals.supabase
    .from("recipes")
    .insert({
      title: `${original.title} (kopi)`,
      description: original.description,
      instructions: original.instructions,
      image_url: original.image_url,
      source_url: original.source_url,
      cook_time: original.cook_time,
      user_id: userId,
      household_id: householdId,
      is_public: false,
      author_name: null,
    })
    .select()
    .single();

  if (insertError || !newRecipe) {
    return new Response(
      JSON.stringify({
        error: insertError?.message || "Klarte ikke å kopiere",
      }),
      { status: 500 },
    );
  }

  // 3. Copy ingredients
  if (original.ingredients && original.ingredients.length > 0) {
    const ingredientsCopy = original.ingredients.map((ing: any) => ({
      recipe_id: newRecipe.id,
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      is_basic: ing.is_basic,
    }));

    const { error: ingError } = await locals.supabase
      .from("ingredients")
      .insert(ingredientsCopy);

    if (ingError) {
      console.error("Error copying ingredients:", ingError);
      // Recipe was created, so we still return success but log the error
    }
  }

  return new Response(JSON.stringify({ success: true, id: newRecipe.id }), {
    status: 201,
  });
};
