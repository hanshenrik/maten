import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { Icon } from "@iconify/react";
import { UnitSelect } from "./UnitSelect";

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
  is_basic: boolean;
}

interface RecipeFormProps {
  initialData?: any;
  onSuccess?: (id: string) => void;
  userId: string;
  householdId: string;
}

export const RecipeForm: React.FC<RecipeFormProps> = ({
  initialData,
  onSuccess,
  userId,
  householdId,
}) => {
  const isEditing = !!initialData?.id;
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [instructions, setInstructions] = useState(
    initialData?.instructions || "",
  );
  const [imageUrl, setImageUrl] = useState(initialData?.image_url || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
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
      let uploadedImageUrl = imageUrl;
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("recipe-images")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("recipe-images").getPublicUrl(fileName);

        uploadedImageUrl = publicUrl;
      }

      const recipeData = {
        title,
        description,
        instructions,
        image_url: uploadedImageUrl,
      };
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
            user_id: userId,
            household_id: householdId,
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
            name: ing.name,
            amount: ing.amount ? parseFloat(String(ing.amount)) : null,
            unit: ing.unit,
            is_basic: !!ing.is_basic,
            recipe_id: recipeId,
          }));

        if (ingredientsToInsert.length > 0) {
          const { error: ingredientsError } = await supabase
            .from("ingredients")
            .insert(ingredientsToInsert);
          if (ingredientsError) throw ingredientsError;
        }
      }

      if (onSuccess) {
        onSuccess(recipeId);
      } else {
        window.location.href = isEditing ? `/recipes/${recipeId}` : "/recipes";
      }
    } catch (err: any) {
      console.error("Feil ved lagring av oppskrift:", err);
      alert("Feil ved lagring av oppskrift: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    if (!confirm("Er du sikker på at du vil slette denne oppskriften?")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", initialData.id);

      if (error) throw error;

      window.location.href = "/recipes";
    } catch (err: any) {
      console.error("Feil ved sletting av oppskrift:", err);
      alert("Feil ved sletting: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-12">
      <div className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">
          Generell informasjon
        </h2>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Tittel på oppskrift
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
            placeholder="f.eks. Klassisk Margherita Pizza"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Beskrivelse
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Et kort sammendrag av retten..."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Fremgangsmåte
          </label>
          <textarea
            required
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
            rows={6}
            placeholder="Steg for steg fremgangsmåte..."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Bilde
          </label>
          {imageUrl && !imageFile && (
            <div className="relative mb-3 h-48 w-full max-w-md overflow-hidden rounded-xl border border-gray-200">
              <img
                src={imageUrl}
                alt="Recipe cover"
                className="h-full w-full object-cover"
              />
            </div>
          )}
          {imageFile && (
            <div className="mb-3 text-sm font-medium text-blue-600">
              Valgt: {imageFile.name}
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 transition-all outline-none file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 focus:border-transparent focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Ingredienser</h2>
          <button
            type="button"
            onClick={addIngredient}
            className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100"
          >
            + Legg til ingrediens
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
                  placeholder="Navn på ingrediens"
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
                    placeholder="Mengde"
                    value={ing.amount}
                    onChange={(e) =>
                      handleIngredientChange(index, "amount", e.target.value)
                    }
                    className="w-20 rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                  <UnitSelect
                    value={ing.unit}
                    onChange={(value) =>
                      handleIngredientChange(index, "unit", value)
                    }
                    className="w-24"
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
                    Basis
                  </label>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                className="p-1 text-red-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-600"
              >
                <Icon icon="hugeicons:delete-03" className="h-5 w-5" />
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
          {loading ? "Lagrer..." : "Lagre oppskrift"}
        </button>
        <a
          href="/recipes"
          className="flex items-center rounded-2xl bg-gray-100 px-8 py-4 font-bold text-gray-700 transition-all hover:bg-gray-200"
        >
          Avbryt
        </a>
        {isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="rounded-lg border border-gray-100 bg-white p-2 text-gray-600 shadow-sm transition-colors hover:text-red-600 disabled:opacity-50"
            title="Slett oppskrift"
          >
            <Icon icon="hugeicons:delete-03" className="h-6 w-6" />
          </button>
        )}
      </div>
    </form>
  );
};
