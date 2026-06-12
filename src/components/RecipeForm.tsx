import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { Icon } from "@iconify/react";
import { UnitSelect } from "./forms/UnitSelect";
import { EmojiSelect } from "./forms/EmojiSelect";
import { splitEmojiFromName, combineEmojiAndName } from "../utils/emoji";
import { BasicTag } from "./BasicTag";
import { OptionalTag } from "./OptionalTag";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Toggle } from "./forms/Toggle";
import { Input } from "./forms/Input";
import { Textarea } from "./forms/Textarea";
import { FileInput } from "./forms/FileInput";
import { ui } from "../utils/icons";
import { Reorder, useDragControls } from "motion/react";

interface Ingredient {
  id: string;

  name: string;
  emoji?: string;
  amount: string;
  unit: string;
  is_basic: boolean;
  optional: boolean;
}

const IngredientRow = ({
  ing,
  handleIngredientChange,
  removeIngredient,
}: {
  ing: Ingredient;
  handleIngredientChange: (
    id: string,
    field: keyof Ingredient,
    value: any,
  ) => void;
  removeIngredient: (id: string) => void;
}) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={ing}
      dragListener={false}
      dragControls={dragControls}
      className="group bg-bg border-border relative flex items-start gap-3 rounded-xl border p-4"
    >
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="text-text-muted/30 hover:text-text flex cursor-grab touch-none items-center pt-2.5 transition-colors active:cursor-grabbing"
      >
        <Icon icon="hugeicons:drag-drop" className="h-6 w-6" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <EmojiSelect
            value={ing.emoji || ""}
            onChange={(emoji) => handleIngredientChange(ing.id, "emoji", emoji)}
          />
          <input
            type="text"
            required
            placeholder="Hva trenger vi?"
            value={ing.name}
            onChange={(e) =>
              handleIngredientChange(ing.id, "name", e.target.value)
            }
            className="bg-bg border-border focus:ring-primary w-full rounded-xl border px-3 py-2 focus:ring-2"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            step="any"
            placeholder="Hvor mye?"
            value={ing.amount}
            onChange={(e) =>
              handleIngredientChange(ing.id, "amount", e.target.value)
            }
            className="bg-bg border-border focus:ring-primary w-20 rounded-xl border px-3 py-2 focus:ring-2"
          />
          <UnitSelect
            value={ing.unit}
            onChange={(value) => handleIngredientChange(ing.id, "unit", value)}
            className="w-24"
          />
          <label className="text-text-muted ml-auto flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={ing.optional}
              onChange={(e) =>
                handleIngredientChange(ing.id, "optional", e.target.checked)
              }
              className="text-primary rounded"
            />
            Valgfri <OptionalTag />
          </label>
          <label className="text-text-muted flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={ing.is_basic}
              onChange={(e) =>
                handleIngredientChange(ing.id, "is_basic", e.target.checked)
              }
              className="text-primary rounded"
            />
            Basis <BasicTag />
          </label>
        </div>
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => removeIngredient(ing.id)}
        className="text-text-muted"
      >
        <Icon icon={ui.delete} className="h-5 w-5" />
      </Button>
    </Reorder.Item>
  );
};

interface RecipeFormProps {
  initialData?: any;
  onSuccess?: (id: string) => void;
  userId: string;
  householdId: string;
  authorName?: string;
}

export const RecipeForm: React.FC<RecipeFormProps> = ({
  initialData,
  onSuccess,
  userId,
  householdId,
  authorName,
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
  const [cookTime, setCookTime] = useState<string>(
    initialData?.cook_time?.toString() || "",
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialData?.ingredients?.map((ing: any) => {
      const { emoji, name } = splitEmojiFromName(ing.name);
      return {
        ...ing,
        id: ing.id || crypto.randomUUID(),
        emoji,
        name,
        amount: ing.amount?.toString() || "",
        optional: !!ing.optional,
      };
    }) || [
      {
        id: crypto.randomUUID(),
        emoji: "",
        name: "",
        amount: "",
        unit: "",
        is_basic: false,
        optional: false,
      },
    ],
  );
  const [loading, setLoading] = useState(false);
  const [isPublic, setIsPublic] = useState(initialData?.is_public || false);
  const [saveCount, setSaveCount] = useState(0);

  React.useEffect(() => {
    if (isEditing && initialData?.is_public) {
      supabase
        .from("saved_recipes")
        .select("*", { count: "exact", head: true })
        .eq("recipe_id", initialData.id)
        .then(({ count, error }) => {
          if (!error && count !== null) {
            setSaveCount(count);
          }
        });
    }
  }, [isEditing, initialData]);

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      {
        id: crypto.randomUUID(),
        emoji: "",
        name: "",
        amount: "",
        unit: "",
        is_basic: false,
        optional: false,
      },
    ]);
  };

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter((ing) => ing.id !== id));
  };

  const handleIngredientChange = (
    id: string,
    field: keyof Ingredient,
    value: any,
  ) => {
    setIngredients(
      ingredients.map((ing) =>
        ing.id === id ? { ...ing, [field]: value } : ing,
      ),
    );
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
        cook_time: cookTime ? parseInt(cookTime) : null,
        is_public: isPublic,
        author_name: isPublic
          ? initialData?.author_name || authorName || "En matglad kokk"
          : null,
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
            optional: !!ing.optional,
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
      alert(
        "Huff da, det skjedde en feil da vi prøvde å lagre oppskriften: " +
          err.message,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    if (!confirm("Er du helt sikker på at du vil slette denne godbiten?"))
      return;

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
      alert("Vi klarte desverre ikke å slette oppskriften: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-12">
      <Card className="space-y-6">
        <h2 className="text-xl font-semibold">Litt om retten</h2>

        <Input
          label="Hva skal vi kalle den?"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="f.eks. Klassisk Margherita Pizza"
        />

        <div className="border-border bg-surface/50 items-top flex justify-between rounded-xl border p-4">
          <div>
            <h3 className="text-text font-medium">
              Del oppskriften i biblioteket
            </h3>
            <p className="text-text-muted mt-1 text-sm">
              Gjør oppskriften åpen så andre kan lagre den i sin app.
            </p>
            {saveCount > 0 && (
              <p className="text-primary mt-2 text-sm font-medium">
                Du kan ikke gjøre oppskriften privat igjen fordi{" "}
                {saveCount === 1 ? "1 person" : `${saveCount} personer`} har
                lagret den.
              </p>
            )}
          </div>
          <Toggle
            id="publicly-shared-recipe"
            checked={isPublic}
            disabled={saveCount > 0}
            onChange={setIsPublic}
          />
        </div>

        <Textarea
          id="description"
          label="Hva gjør denne retten god?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder="En kort og fristende forklaring..."
        />

        <Textarea
          id="instructions"
          label="Hvordan lager vi den?"
          required
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={5}
          placeholder="Steg for steg fremgangsmåte..."
        />

        <FileInput
          id="image"
          label="Et fristende bilde"
          accept="image/*"
          previewUrl={imageUrl}
          selectedFile={imageFile}
          onChange={setImageFile}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Hvor fant du den? (URL)"
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
          />
          <Input
            label="Hvor lang tid tar det? (minutter)"
            type="number"
            value={cookTime}
            onChange={(e) => setCookTime(e.target.value)}
            placeholder="f.eks. 30"
          />
        </div>
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
            + Legg til noe mer
          </Button>
        </div>

        <Reorder.Group
          axis="y"
          values={ingredients}
          onReorder={setIngredients}
          className="space-y-4"
        >
          {ingredients.map((ing) => (
            <IngredientRow
              key={ing.id}
              ing={ing}
              handleIngredientChange={handleIngredientChange}
              removeIngredient={removeIngredient}
            />
          ))}
        </Reorder.Group>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading} size="lg" className="flex-1">
          {loading ? "Lagrer..." : "Lagre"}
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
            <Icon icon={ui.delete} className="h-6 w-6" />
          </Button>
        )}
      </div>
    </form>
  );
};
