import React from "react";
import { formatLongDay, formatMonthDay } from "../utils/date";
import { duration } from "../utils/time";
import { Card } from "./ui/Card";
import { ui, app } from "../utils/icons";
import { Icon } from "@iconify/react";

interface MealEntry {
  recipeId: string;
  notes?: string;
  recipe?: { title: string; image_url?: string; cook_time?: number | null };
}

interface PlannedMealComponentProps {
  date: string;
  meals: MealEntry[];
  isToday?: boolean;
}

export const PlannedMealComponent: React.FC<PlannedMealComponentProps> = ({
  date,
  meals,
  isToday,
}) => {
  const hasAnyRecipe = meals.some((m) => m.recipeId && m.recipe);

  return (
    <Card
      className={`group flex h-full flex-col ${isToday ? "ring-primary ring-2" : ""}`}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold capitalize">
            {formatLongDay(date)}
          </h3>
          <p className="text-text-muted text-sm">{formatMonthDay(date)}</p>
        </div>
        {isToday && (
          <span className="bg-primary/10 text-primary shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold">
            I dag
          </span>
        )}
      </div>

      <div className="space-y-2">
        {hasAnyRecipe ? (
          meals.map((meal, i) =>
            meal.recipeId && meal.recipe ? (
              <a key={i} href={`/recipes/${meal.recipeId}`} className="block">
                <div className="bg-bg hover:bg-bg/80 flex items-center gap-3 rounded-lg p-2 transition-colors">
                  {meal.recipe.image_url ? (
                    <img
                      src={meal.recipe.image_url}
                      alt={meal.recipe.title}
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="bg-surface-elevated border-border flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border">
                      <Icon icon={app.recipes} className="h-6 w-6 opacity-60" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-text truncate text-sm font-medium">
                      {meal.recipe.title}
                    </div>
                    {meal.notes && (
                      <span className="text-text-muted text-xs">
                        {meal.notes}
                      </span>
                    )}
                    {meal.recipe.cook_time && (
                      <div className="text-text-muted flex items-center gap-1 text-[10px] tracking-wider opacity-70">
                        <Icon icon={ui.clock} className="h-3 w-3" />
                        <span>{duration(meal.recipe.cook_time)}</span>
                      </div>
                    )}
                  </div>
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
