import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { Reorder, useDragControls } from "motion/react";
import { supabase } from "../lib/supabase";
import type { RecipeWithIngredients } from "../types";
import { cn } from "../utils/cn";
import { combineEmojiAndName, splitEmojiFromName } from "../utils/emoji";
import { errorMessage } from "../utils/errors";
import { ui } from "../utils/icons";
import { EmojiSelect } from "./forms/EmojiSelect";
import { inputClassName } from "./forms/Field";
import { FileInput } from "./forms/FileInput";
import { Input } from "./forms/Input";
import { RichTextEditor } from "./forms/RichTextEditor";
import { Toggle } from "./forms/Toggle";
import { UnitSelect } from "./forms/UnitSelect";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { BasicTag, OptionalTag } from "./ui/Tag";

/** An ingredient as it's being edited: strings, and an emoji of its own */
interface IngredientDraft {
  key: string;
  emoji: string;
  name: string;
  amount: string;
  unit: string;
  is_basic: boolean;
  optional: boolean;
}

const IngredientRow = ({
  ingredient,
  onChange,
  onRemove,
}: {
  ingredient: IngredientDraft;
  onChange: (change: Partial<IngredientDraft>) => void;
  onRemove: () => void;
}) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={ingredient}
      dragListener={false}
      dragControls={dragControls}
      className="bg-bg border-border relative flex items-start gap-3 rounded-xl border p-4"
    >
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="text-text-muted/30 hover:text-text flex cursor-grab touch-none items-center pt-2.5 transition-colors active:cursor-grabbing"
        title="Dra for å flytte"
      >
        <Icon icon={ui.dragHandle} className="h-6 w-6" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <EmojiSelect
            value={ingredient.emoji}
            onChange={(emoji) => onChange({ emoji })}
          />
          <input
            type="text"
            required
            aria-label="Ingrediens"
            placeholder="Hva trenger vi?"
            value={ingredient.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className={cn(inputClassName, "bg-bg w-full")}
          />
        </div>
        <div className="flex flex-col gap-2 md:flex-row">
          <div className="flex gap-2">
            <input
              type="number"
              step="any"
              min="0"
              aria-label="Mengde"
              placeholder="Hvor mye?"
              value={ingredient.amount}
              onChange={(e) => onChange({ amount: e.target.value })}
              className={cn(inputClassName, "bg-bg w-24")}
            />
            <UnitSelect
              value={ingredient.unit}
              onChange={(unit) => onChange({ unit })}
              className="bg-bg w-24"
            />
          </div>
          <div className="flex w-full justify-between md:justify-end md:gap-5">
            <label className="text-text-muted flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={ingredient.optional}
                onChange={(e) => onChange({ optional: e.target.checked })}
                className="accent-primary rounded"
              />
              Valgfri <OptionalTag />
            </label>
            <label className="text-text-muted flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={ingredient.is_basic}
                onChange={(e) => onChange({ is_basic: e.target.checked })}
                className="accent-primary rounded"
              />
              Basis <BasicTag />
            </label>
          </div>
        </div>
      </div>
      <Button
        variant="danger"
        onClick={onRemove}
        className="text-text-muted"
        title="Fjern ingrediens"
      >
        <Icon icon={ui.delete} className="h-5 w-5" />
      </Button>
    </Reorder.Item>
  );
};

interface RecipeFormProps {
  initialData?: RecipeWithIngredients | null;
  userId: string;
  householdId: string;
  /** Shown on the recipe when it's shared in the library */
  authorName: string;
}

const toDraft = (
  ingredient: RecipeWithIngredients["ingredients"][number],
): IngredientDraft => {
  const { emoji, name } = splitEmojiFromName(ingredient.name);
  return {
    key: ingredient.id,
    emoji,
    name,
    amount: ingredient.amount?.toString() ?? "",
    unit: ingredient.unit ?? "",
    is_basic: !!ingredient.is_basic,
    optional: !!ingredient.optional,
  };
};

const parseOptionalInt = (value: string) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
};

export const RecipeForm = ({
  initialData,
  userId,
  householdId,
  authorName,
}: RecipeFormProps) => {
  const isEditing = !!initialData;

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [instructions, setInstructions] = useState(
    initialData?.instructions ?? "",
  );
  const [sourceUrl, setSourceUrl] = useState(initialData?.source_url ?? "");
  const [cookTime, setCookTime] = useState(
    initialData?.cook_time?.toString() ?? "",
  );
  const [servings, setServings] = useState(
    initialData?.servings?.toString() ?? "",
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isPublic, setIsPublic] = useState(initialData?.is_public ?? false);
  const [saveCount, setSaveCount] = useState(0);
  const [saving, setSaving] = useState(false);

  // Keys for new rows count up from a ref, so the server and client render
  // the same keys and React doesn't complain on hydration.
  const nextKey = useRef(1);
  const newDraft = (): IngredientDraft => ({
    key: `new-${nextKey.current++}`,
    emoji: "",
    name: "",
    amount: "",
    unit: "",
    is_basic: false,
    optional: false,
  });

  const [ingredients, setIngredients] = useState<IngredientDraft[]>(() =>
    initialData?.ingredients?.length
      ? initialData.ingredients.map(toDraft)
      : [
          {
            key: "new-0",
            emoji: "",
            name: "",
            amount: "",
            unit: "",
            is_basic: false,
            optional: false,
          },
        ],
  );

  // A shared recipe others have saved can't be made private again
  useEffect(() => {
    if (!initialData?.is_public) return;
    supabase
      .from("saved_recipes")
      .select("*", { count: "exact", head: true })
      .eq("recipe_id", initialData.id)
      .then(({ count, error }) => {
        if (!error && count != null) setSaveCount(count);
      });
  }, [initialData]);

  const changeIngredient = (key: string, change: Partial<IngredientDraft>) =>
    setIngredients((current) =>
      current.map((ing) => (ing.key === key ? { ...ing, ...change } : ing)),
    );

  const removeIngredient = (key: string) =>
    setIngredients((current) => current.filter((ing) => ing.key !== key));

  const addIngredient = () =>
    setIngredients((current) => [...current, newDraft()]);

  const uploadImage = async (file: File) => {
    const extension = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${Date.now()}.${extension}`;
    const { error } = await supabase.storage
      .from("recipe-images")
      .upload(path, file);
    if (error) throw error;
    return supabase.storage.from("recipe-images").getPublicUrl(path).data
      .publicUrl;
  };

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const imageUrl = imageFile
        ? await uploadImage(imageFile)
        : (initialData?.image_url ?? null);

      const recipeData = {
        title: title.trim(),
        description,
        instructions,
        image_url: imageUrl,
        source_url: sourceUrl.trim() || null,
        cook_time: parseOptionalInt(cookTime),
        servings: parseOptionalInt(servings),
        is_public: isPublic,
        author_name: isPublic ? initialData?.author_name || authorName : null,
      };

      let recipeId = initialData?.id;

      if (initialData) {
        const { error } = await supabase
          .from("recipes")
          .update(recipeData)
          .eq("id", initialData.id);
        if (error) throw error;

        // Ingredients are replaced wholesale, which also keeps their order
        const { error: deleteError } = await supabase
          .from("ingredients")
          .delete()
          .eq("recipe_id", initialData.id);
        if (deleteError) throw deleteError;
      } else {
        const { data, error } = await supabase
          .from("recipes")
          .insert({ ...recipeData, user_id: userId, household_id: householdId })
          .select("id")
          .single();
        if (error) throw error;
        recipeId = data.id;
      }

      const rows = ingredients
        .filter((ing) => ing.name.trim())
        .map((ing) => ({
          recipe_id: recipeId,
          name: combineEmojiAndName(ing.emoji, ing.name),
          amount: ing.amount ? parseFloat(ing.amount) : null,
          unit: ing.unit,
          is_basic: ing.is_basic,
          optional: ing.optional,
        }));

      if (rows.length > 0) {
        const { error } = await supabase.from("ingredients").insert(rows);
        if (error) throw error;
      }

      window.location.href = isEditing ? `/recipes/${recipeId}` : "/recipes";
    } catch (err) {
      console.error("Feil ved lagring av oppskrift:", err);
      alert(
        `Huff da, det skjedde en feil da vi prøvde å lagre oppskriften: ${errorMessage(err)}`,
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData) return;
    if (!confirm("Er du helt sikker på at du vil slette denne godbiten?"))
      return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", initialData.id);
      if (error) throw error;

      window.location.href = "/recipes";
    } catch (err) {
      console.error("Feil ved sletting av oppskrift:", err);
      alert(
        `Vi klarte dessverre ikke å slette oppskriften: ${errorMessage(err)}`,
      );
    } finally {
      setSaving(false);
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

        <div className="border-border bg-surface/50 flex items-start justify-between gap-4 rounded-xl border p-4">
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

        <RichTextEditor
          label="Hva gjør denne retten god?"
          value={description}
          onChange={setDescription}
          placeholder="En kort og fristende forklaring..."
        />

        <RichTextEditor
          label="Hvordan lager vi den?"
          value={instructions}
          onChange={setInstructions}
          placeholder="Steg for steg fremgangsmåte..."
        />

        <FileInput
          label="Et fristende bilde"
          accept="image/*"
          previewUrl={initialData?.image_url ?? undefined}
          selectedFile={imageFile}
          onChange={setImageFile}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Hvor fant du den? (URL)"
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://"
          />
          <Input
            label="Hvor lang tid tar det? (minutter)"
            type="number"
            min="0"
            value={cookTime}
            onChange={(e) => setCookTime(e.target.value)}
            placeholder="f.eks. 30"
          />
          <Input
            label="Antall porsjoner"
            type="number"
            min="1"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            placeholder="f.eks. 4"
          />
        </div>
      </Card>

      <Card className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Ingredienser</h2>
          <Button variant="secondary" size="sm" onClick={addIngredient}>
            + Legg til ingrediens
          </Button>
        </div>

        <Reorder.Group
          axis="y"
          values={ingredients}
          onReorder={setIngredients}
          className="space-y-4"
        >
          {ingredients.map((ingredient) => (
            <IngredientRow
              key={ingredient.key}
              ingredient={ingredient}
              onChange={(change) => changeIngredient(ingredient.key, change)}
              onRemove={() => removeIngredient(ingredient.key)}
            />
          ))}
        </Reorder.Group>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={saving} size="lg" className="flex-1">
          {saving ? "Lagrer..." : "Lagre"}
        </Button>
        <Button
          as="a"
          href={isEditing ? `/recipes/${initialData.id}` : "/recipes"}
          variant="secondary"
          size="lg"
          className="px-8"
        >
          Avbryt
        </Button>
        {isEditing && (
          <Button
            variant="danger"
            size="lg"
            onClick={handleDelete}
            disabled={saving}
            title="Slett oppskrift"
          >
            <Icon icon={ui.delete} className="h-6 w-6" />
            <span className="sr-only">Slett oppskrift</span>
          </Button>
        )}
      </div>
    </form>
  );
};
