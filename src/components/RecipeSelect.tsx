import { Icon } from "@iconify/react";
import { duration } from "../utils/time";
import { ui, app } from "../utils/icons";
import { SearchableSelect } from "./ui/SearchableSelect";

export interface SelectableRecipe {
  id: string;
  title: string;
  cook_time?: number | null;
  image_url?: string | null;
}

interface RecipeSelectProps {
  recipes: SelectableRecipe[];
  value: string;
  onChange: (value: string) => void;
}

export function RecipeSelect({ recipes, value, onChange }: RecipeSelectProps) {
  return (
    <SearchableSelect
      items={recipes}
      value={value}
      onChange={onChange}
      getKey={(recipe) => recipe.id}
      getLabel={(recipe) => recipe.title}
      renderItem={(recipe) => <RecipeItem recipe={recipe} />}
      renderLeading={(recipe) => <RecipeThumbnail recipe={recipe} size="sm" />}
      ariaLabel="Oppskrift"
      placeholder="Søk etter oppskrift …"
      emptyLabel="(Ingenting valgt ennå)"
      noResultsLabel="Fant ingen oppskrifter"
    />
  );
}

function RecipeThumbnail({
  recipe,
  size,
}: {
  recipe: SelectableRecipe;
  size: "sm" | "md";
}) {
  const box = `${size === "sm" ? "h-8 w-8" : "h-10 w-10"} shrink-0 rounded-lg`;

  if (recipe.image_url) {
    return (
      <img src={recipe.image_url} alt="" className={`${box} object-cover`} />
    );
  }

  return (
    <div
      className={`${box} bg-surface-elevated border-border flex items-center justify-center border`}
    >
      <Icon icon={app.recipes} className="h-5 w-5 opacity-60" />
    </div>
  );
}

function RecipeItem({ recipe }: { recipe: SelectableRecipe }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <RecipeThumbnail recipe={recipe} size="md" />
      <div className="min-w-0 flex-1">
        <div className="text-text truncate text-sm font-medium">
          {recipe.title}
        </div>
        {recipe.cook_time ? (
          <div className="text-text-muted flex items-center gap-1 text-xs">
            <Icon icon={ui.clock} className="h-3 w-3" />
            {duration(recipe.cook_time)}
          </div>
        ) : null}
      </div>
    </div>
  );
}
