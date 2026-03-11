import React, { useState } from "react";
import { supabase } from "../lib/supabase";

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
  is_basic: boolean;
}

interface RecipeFormProps {
  initialData?: any;
  onSuccess?: (id: string) => void;
}

export const RecipeForm: React.FC<RecipeFormProps> = ({
  initialData,
  onSuccess,
}) => {
  const isEditing = !!initialData?.id;
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [instructions, setInstructions] = useState(
    initialData?.instructions || "",
  );
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialData?.ingredients || [
      { name: "", amount: "", unit: "", is_basic: false },
    ],
  );
  const [loading, setLoading] = useState(false);

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { name: "", amount: "", unit: "", is_basic: false },
    ]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (
    index: number,
    field: keyof Ingredient,
    value: any,
  ) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setIngredients(newIngredients);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const recipeData = { title, description, instructions };
      let recipeId = initialData?.id;

      if (isEditing) {
        // Update recipe
        const { error } = await supabase
          .from("recipes")
          .update(recipeData)
          .eq("id", recipeId);
        if (error) throw error;

        // Update ingredients: delete and re-insert
        await supabase.from("ingredients").delete().eq("recipe_id", recipeId);
      } else {
        // Create recipe
        const { data, error } = await supabase
          .from("recipes")
          .insert({
            ...recipeData,
            user_id: (await supabase.auth.getUser()).data.user?.id,
          })
          .select()
          .single();
        if (error) throw error;
        recipeId = data.id;
      }

      // Insert ingredients
      if (ingredients.length > 0) {
        const ingredientsToInsert = ingredients
          .filter((ing) => ing.name.trim())
          .map((ing) => ({
            ...ing,
            recipe_id: recipeId,
            amount: ing.amount ? parseFloat(ing.amount) : null,
          }));

        if (ingredientsToInsert.length > 0) {
          const { error } = await supabase
            .from("ingredients")
            .insert(ingredientsToInsert);
          if (error) throw error;
        }
      }

      if (onSuccess) {
        onSuccess(recipeId);
      } else {
        window.location.href = isEditing ? `/recipes/${recipeId}` : "/recipes";
      }
    } catch (err: any) {
      console.error("Error saving recipe:", err);
      alert("Error saving recipe: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-12">
      <div className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">
          General Information
        </h2>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Recipe Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Classic Margherita Pizza"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="A short summary of the dish..."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Instructions
          </label>
          <textarea
            required
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
            rows={6}
            placeholder="Step by step instructions..."
          />
        </div>
      </div>

      <div className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Ingredients</h2>
          <button
            type="button"
            onClick={addIngredient}
            className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100"
          >
            + Add Ingredient
          </button>
        </div>

        <div className="space-y-4">
          {ingredients.map((ing, index) => (
            <div
              key={index}
              className="group relative flex items-start gap-3 rounded-xl bg-gray-50 p-4"
            >
              <div className="flex-1">
                <input
                  type="text"
                  required
                  placeholder="Ingredient name"
                  value={ing.name}
                  onChange={(e) =>
                    handleIngredientChange(index, "name", e.target.value)
                  }
                  className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="any"
                    placeholder="Amt"
                    value={ing.amount}
                    onChange={(e) =>
                      handleIngredientChange(index, "amount", e.target.value)
                    }
                    className="w-20 rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Unit"
                    value={ing.unit}
                    onChange={(e) =>
                      handleIngredientChange(index, "unit", e.target.value)
                    }
                    className="w-24 rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={ing.is_basic}
                      onChange={(e) =>
                        handleIngredientChange(
                          index,
                          "is_basic",
                          e.target.checked,
                        )
                      }
                      className="rounded text-blue-600"
                    />
                    Basics
                  </label>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                className="p-1 text-red-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-600"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 transform rounded-2xl bg-green-600 px-6 py-4 font-bold text-white shadow-lg shadow-green-100 transition-all hover:bg-green-700 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Recipe"}
        </button>
        <a
          href="/recipes"
          className="flex items-center rounded-2xl bg-gray-100 px-8 py-4 font-bold text-gray-700 transition-all hover:bg-gray-200"
        >
          Cancel
        </a>
      </div>
    </form>
  );
};
