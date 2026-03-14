import React from "react";
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
  const dateObj = new Date(day.day_of_week);
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="text-primary mb-3 text-lg font-semibold uppercase">
        {dateObj.toLocaleDateString("no-NO", { weekday: "long" })}
      </h3>
      <p className="text-secondary mb-4 text-sm">
        {dateObj.toLocaleDateString()}
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
          <div className="flex items-center justify-between rounded bg-gray-50 p-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium capitalize">Middag</span>
              <a
                href={`/recipes/${day.recipeId}`}
                className="text-secondary font-medium transition-colors hover:text-blue-600 hover:underline"
              >
                {recipes[day.recipeId].title}
              </a>
            </div>
            {day.notes && (
              <span className="text-xs text-gray-500">({day.notes})</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded bg-gray-50 p-2">
            <Icon
              icon="hugeicons:circle-off-01"
              className="h-4 w-4 text-gray-400"
            />
            <span className="text-sm text-gray-400">Ingen middag planlagt</span>
          </div>
        )}
      </div>
    </div>
  );
};
