import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { Icon } from "@iconify/react";
import { UnitSelect } from "./UnitSelect";
import { EmojiSelect } from "./EmojiSelect";
import { splitEmojiFromName, combineEmojiAndName } from "../utils/emoji";
import { BasicTag } from "./BasicTag";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Input } from "./ui/Input";

interface Ingredient {
  name: string;
  emoji?: string;
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
  const [sourceUrl, setSourceUrl] = useState(initialData?.source_url || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialData?.ingredients?.map((ing: any) => {
      const { emoji, name } = splitEmojiFromName(ing.name);
      return {
        ...ing,
        emoji,
        name,
        amount: ing.amount?.toString() || "",
      };
    }) || [{ emoji: "", name: "", amount: "", unit: "", is_basic: false }],
  );
  const [loading, setLoading] = useState(false);

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { emoji: "", name: "", amount: "", unit: "", is_basic: false },
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
        source_url: sourceUrl,
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
            name: combineEmojiAndName(ing.emoji || "", ing.name),
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
      <Card className="space-y-6">
        <h2 className="text-xl font-semibold">Generell informasjon</h2>

        <Input
          label="Tittel på oppskrift"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="f.eks. Klassisk Margherita Pizza"
        />

        <div>
          <label className="text-text mb-1 block text-sm font-medium">
            Beskrivelse
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border-border bg-surface text-text focus:ring-primary w-full rounded-xl border px-4 py-3 transition-all outline-none focus:border-transparent focus:ring-2"
            rows={3}
            placeholder="Et kort sammendrag av retten..."
          />
        </div>

        <div>
          <label className="text-text mb-1 block text-sm font-medium">
            Fremgangsmåte
          </label>
          <textarea
            required
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="border-border bg-surface text-text focus:ring-primary w-full rounded-xl border px-4 py-3 transition-all outline-none focus:border-transparent focus:ring-2"
            rows={6}
            placeholder="Steg for steg fremgangsmåte..."
          />
        </div>

        <div>
          <label className="text-text mb-1 block text-sm font-medium">
            Bilde
          </label>
          {imageUrl && !imageFile && (
            <div className="border-border relative mb-3 h-48 w-full max-w-md overflow-hidden rounded-xl border">
              <img
                src={imageUrl}
                alt="Recipe cover"
                className="h-full w-full object-cover"
              />
            </div>
          )}
          {imageFile && (
            <div className="text-primary mb-3 text-sm font-medium">
              Valgt: {imageFile.name}
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="border-border bg-surface text-text focus:ring-primary file:bg-primary/10 file:text-primary hover:file:bg-primary/20 w-full rounded-xl border px-3 py-2 transition-all outline-none file:mr-4 file:rounded-full file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold focus:border-transparent focus:ring-2"
          />
        </div>

        <Input
          label="Originaloppskrift"
          type="url"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
        />
      </Card>

      <Card className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Ingredienser</h2>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addIngredient}
          >
            + Legg til ingrediens
          </Button>
        </div>

        <div className="space-y-4">
          {ingredients.map((ing, index) => (
            <div
              key={index}
              className="group bg-bg relative flex items-start gap-3 rounded-xl p-4"
            >
              <div className="flex-1">
                <div className="mb-2 flex gap-2">
                  <EmojiSelect
                    value={ing.emoji || ""}
                    onChange={(emoji) =>
                      handleIngredientChange(index, "emoji", emoji)
                    }
                  />
                  <input
                    type="text"
                    required
                    placeholder="Navn på ingrediens"
                    value={ing.name}
                    onChange={(e) =>
                      handleIngredientChange(index, "name", e.target.value)
                    }
                    className="bg-bg border-border focus:ring-primary w-full rounded-xl border px-3 py-2 focus:ring-2"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="any"
                    placeholder="Mengde"
                    value={ing.amount}
                    onChange={(e) =>
                      handleIngredientChange(index, "amount", e.target.value)
                    }
                    className="bg-bg border-border focus:ring-primary w-20 rounded-xl border px-3 py-2 focus:ring-2"
                  />
                  <UnitSelect
                    value={ing.unit}
                    onChange={(value) =>
                      handleIngredientChange(index, "unit", value)
                    }
                    className="w-24"
                  />
                  <label className="text-text-muted ml-auto flex cursor-pointer items-center gap-2 text-sm">
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
                      className="text-primary rounded"
                    />
                    Basis <BasicTag />
                  </label>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeIngredient(index)}
                className="text-text-muted opacity-0 transition-all group-hover:opacity-100 hover:text-red-500"
              >
                <Icon icon="hugeicons:delete-03" className="h-5 w-5" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading} size="lg" className="flex-1">
          {loading ? "Lagrer..." : "Lagre oppskrift"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={() => (window.location.href = "/recipes")}
          className="px-8"
        >
          Avbryt
        </Button>
        {isEditing && (
          <Button
            type="button"
            variant="danger"
            size="lg"
            onClick={handleDelete}
            disabled={loading}
            title="Slett oppskrift"
          >
            <Icon icon="hugeicons:delete-03" className="h-6 w-6" />
          </Button>
        )}
      </div>
    </form>
  );
};
