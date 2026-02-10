import React from "react";
import type { PlanDay } from "../content/config";

interface PlanDayComponentProps {
  day: PlanDay;
  recipes: Record<string, { title: string }>;
}

export const PlanDayComponent: React.FC<PlanDayComponentProps> = ({
  day,
  recipes,
}) => {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="text-primary mb-3 text-lg font-semibold">{day.day}</h3>
      <p className="text-secondary mb-4 text-sm">{day.date.toDateString()}</p>

      <div className="space-y-3">
        {day.recipeId && recipes[day.recipeId] ? (
          <div className="flex items-center justify-between rounded bg-gray-50 p-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium capitalize">Dinner</span>
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
            <span className="text-sm text-gray-400">No dinner planned</span>
          </div>
        )}
      </div>
    </div>
  );
};
