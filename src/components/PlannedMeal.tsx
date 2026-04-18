import React from "react";
import { formatLongDay, formatMonthDay } from "../utils/date";
import { Card } from "./ui/Card";
import { ui } from "../utils/icons";
import { Icon } from "@iconify/react";

interface MealEntry {
  recipeId: string;
  notes?: string;
  recipe?: { title: string; image_url?: string; cook_time?: number | null };
}

interface PlannedMealComponentProps {
  date: string;
  meals: MealEntry[];
}

export const PlannedMealComponent: React.FC<PlannedMealComponentProps> = ({
  date,
  meals,
}) => {
  const hasAnyRecipe = meals.some((m) => m.recipeId && m.recipe);

  // Pick the first recipe image as the card hero image
  const heroImage = meals.find((m) => m.recipe?.image_url)?.recipe?.image_url;
  const heroAlt = meals.find((m) => m.recipe?.image_url)?.recipe?.title || "";

  return (
    <Card className="group flex h-full flex-col">
      <h3 className="mb-3 text-lg font-semibold capitalize">
        {formatLongDay(date)}
      </h3>
      <p className="text-text-muted mb-4 text-sm">{formatMonthDay(date)}</p>

      {heroImage ? (
        <div className="mb-4 h-32 w-full overflow-hidden rounded-xl">
          <img
            src={heroImage}
            alt={heroAlt}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="bg-bg text-text-muted mb-4 flex h-32 w-full flex-col items-center justify-center overflow-hidden rounded-xl">
          <span className="text-xs font-medium tracking-wider uppercase">
            Uten bilde
          </span>
        </div>
      )}

      <div className="space-y-2">
        {hasAnyRecipe ? (
          meals.map((meal, i) =>
            meal.recipeId && meal.recipe ? (
              <a key={i} href={`/recipes/${meal.recipeId}`} className="block">
                <div className="bg-bg hover:bg-bg/80 flex flex-col gap-1 rounded p-2 transition-colors">
                  {meal.recipe.title}

                  {meal.notes && (
                    <span className="text-text-muted text-xs">
                      {meal.notes}
                    </span>
                  )}
                  {meal.recipe.cook_time && (
                    <div className="text-text-muted flex items-center gap-1 text-[10px] tracking-wider uppercase opacity-70">
                      <Icon icon={ui.clock} className="h-3 w-3" />
                      <span>{meal.recipe.cook_time} min</span>
                    </div>
                  )}
                </div>
              </a>
            ) : meal.notes ? (
              <div key={i} className="bg-bg flex flex-col gap-1 rounded p-2">
                <span className="text-text-muted text-xs">{meal.notes}</span>
              </div>
            ) : null,
          )
        ) : (
          <div className="bg-bg flex items-center gap-2 rounded p-2">
            <Icon
              icon="hugeicons:circle-off-01"
              className="text-text-muted h-4 w-4 opacity-50"
            />
            <span className="text-text-muted text-sm">
              Ingen middag planlagt
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};
