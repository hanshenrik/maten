import React from "react";
import { formatLongDay, formatMonthDay } from "../utils/date";
import { Card } from "./ui/Card";
import { ui } from "../utils/icons";
import { Icon } from "@iconify/react";

interface PlannedMealComponentProps {
  day: {
    day_of_week: string; // This will now be the date string
    recipeId: string;
    notes?: string;
  };
  recipes: Record<
    string,
    { title: string; image_url?: string; cook_time?: number | null }
  >;
}

export const PlannedMealComponent: React.FC<PlannedMealComponentProps> = ({
  day,
  recipes,
}) => {
  return (
    <a href={`/recipes/${day.recipeId}`} className="block">
      <Card className="group flex h-full cursor-pointer flex-col" isClickable>
        <h3 className="mb-3 text-lg font-semibold capitalize">
          {formatLongDay(day.day_of_week)}
        </h3>
        <p className="text-text-muted mb-4 text-sm">
          {formatMonthDay(day.day_of_week)}
        </p>

        {day.recipeId && recipes[day.recipeId]?.image_url ? (
          <div className="mb-4 h-32 w-full overflow-hidden rounded-xl">
            <img
              src={recipes[day.recipeId].image_url}
              alt={recipes[day.recipeId].title}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="mb-4 h-32 w-full overflow-hidden rounded-xl bg-linear-to-r from-gray-200 to-gray-100" />
        )}

        <div className="space-y-3">
          {day.recipeId && recipes[day.recipeId] ? (
            <div className="bg-bg flex flex-col gap-1 rounded p-2">
              {recipes[day.recipeId].title}

              {day.notes && (
                <span className="text-text-muted text-xs">{day.notes}</span>
              )}
              {recipes[day.recipeId]?.cook_time && (
                <div className="text-text-muted flex items-center gap-1 text-[10px] tracking-wider uppercase opacity-70">
                  <Icon icon={ui.clock} className="h-3 w-3" />
                  <span>{recipes[day.recipeId].cook_time} min</span>
                </div>
              )}
            </div>
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
    </a>
  );
};
