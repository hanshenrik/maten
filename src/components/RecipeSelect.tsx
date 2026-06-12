import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { Icon } from "@iconify/react";
import { duration } from "../utils/time";
import { ui, app } from "../utils/icons";

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
  const selected = recipes.find((r) => r.id === value) ?? null;

  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative w-full">
        <ListboxButton className="border-border bg-bg text-text focus:ring-primary flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left outline-none focus:ring-2">
          {selected ? (
            <RecipeItem recipe={selected} />
          ) : (
            <span className="text-text-muted py-0.5">
              (Ingenting valgt ennå)
            </span>
          )}
          <Icon
            icon="hugeicons:arrow-down-01"
            className="ml-auto h-4 w-4 shrink-0 opacity-40"
          />
        </ListboxButton>

        <ListboxOptions
          anchor="bottom start"
          className="border-border bg-surface z-50 mt-1 max-h-72 w-[var(--button-width)] overflow-auto rounded-xl border shadow-lg outline-none [--anchor-gap:4px]"
        >
          <ListboxOption
            value=""
            className="text-text-muted data-[focus]:bg-surface-elevated cursor-pointer px-4 py-3 text-sm outline-none"
          >
            (Ingenting valgt ennå)
          </ListboxOption>
          {recipes.map((recipe) => (
            <ListboxOption
              key={recipe.id}
              value={recipe.id}
              className="data-[focus]:bg-surface-elevated data-[selected]:text-primary cursor-pointer px-3 py-2 outline-none"
            >
              <RecipeItem recipe={recipe} />
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}

function RecipeItem({ recipe }: { recipe: SelectableRecipe }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {recipe.image_url ? (
        <img
          src={recipe.image_url}
          alt=""
          className="h-10 w-10 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="bg-surface-elevated border-border flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border">
          <Icon icon={app.recipes} className="h-5 w-5 opacity-60" />
        </div>
      )}
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
