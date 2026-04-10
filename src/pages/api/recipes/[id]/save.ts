import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ params, locals }) => {
  const recipeId = params.id;
  const householdId = locals.householdId;

  if (!recipeId || !householdId) {
    return new Response(JSON.stringify({ error: "Mangler data" }), {
      status: 400,
    });
  }

  const { error } = await locals.supabase.from("saved_recipes").insert({
    household_id: householdId,
    recipe_id: recipeId,
  });

  if (error) {
    // Unique constraint violation means it's already saved
    if (error.code === "23505") {
      return new Response(JSON.stringify({ message: "Allerede lagret" }), {
        status: 200,
      });
    }
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ success: true }), { status: 201 });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const recipeId = params.id;
  const householdId = locals.householdId;

  if (!recipeId || !householdId) {
    return new Response(JSON.stringify({ error: "Mangler data" }), {
      status: 400,
    });
  }

  const { error } = await locals.supabase
    .from("saved_recipes")
    .delete()
    .eq("household_id", householdId)
    .eq("recipe_id", recipeId);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
