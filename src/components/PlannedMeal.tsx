import React from "react";
interface PlannedMealComponentProps {
  day: {
    day_of_week: string; // This will now be the date string
    recipeId: string;
    notes?: string;
  };
  recipes: Record<string, { title: string }>;
}

export const PlannedMealComponent: React.FC<PlannedMealComponentProps> = ({
  day,
  recipes,
}) => {
  const dateObj = new Date(day.day_of_week);
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="text-primary mb-3 text-lg font-semibold uppercase">
        {dateObj.toLocaleDateString("en-US", { weekday: "long" })}
      </h3>
      <p className="text-secondary mb-4 text-sm">
        {dateObj.toLocaleDateString()}
      </p>

      <div className="space-y-3">
        {day.recipeId && recipes[day.recipeId] ? (
          <div className="flex items-center justify-between rounded bg-gray-50 p-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium capitalize">Middag</span>
              <span className="text-secondary text-sm">
                {recipes[day.recipeId].title}
              </span>
            </div>
            {day.notes && (
              <span className="text-xs text-gray-500">({day.notes})</span>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between rounded bg-gray-50 p-2">
            <span className="text-sm text-gray-400">Ingen middag planlagt</span>
          </div>
        )}
      </div>
    </div>
  );
};
