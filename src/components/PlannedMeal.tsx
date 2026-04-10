import React from "react";
import { formatLongDay, formatMonthDay } from "../utils/date";
import { Icon } from "@iconify/react";

interface PlannedMealComponentProps {
  day: {
    day_of_week: string; // This will now be the date string
    recipeId: string;
    notes?: string;
  };
  recipes: Record<string, { title: string; image_url?: string }>;
}

export const PlannedMealComponent: React.FC<PlannedMealComponentProps> = ({
  day,
  recipes,
}) => {
  return (
    <div className="border-border bg-surface text-text rounded-lg border p-4">
      <h3 className="mb-3 text-lg font-semibold">
        {formatLongDay(day.day_of_week)}
      </h3>
      <p className="text-text-muted mb-4 text-sm">
        {formatMonthDay(day.day_of_week)}
      </p>

      {day.recipeId && recipes[day.recipeId]?.image_url && (
        <div className="mb-4 h-32 w-full overflow-hidden rounded-xl">
          <img
            src={recipes[day.recipeId].image_url}
            alt={recipes[day.recipeId].title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="space-y-3">
        {day.recipeId && recipes[day.recipeId] ? (
          <div className="bg-bg flex flex-col gap-1 rounded p-2">
            <a
              href={`/recipes/${day.recipeId}`}
              className="text-text hover:text-primary font-medium transition-colors hover:underline"
            >
              {recipes[day.recipeId].title}
            </a>
            {day.notes && (
              <span className="text-text-muted text-xs">{day.notes}</span>
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
    </div>
  );
};
