import React from "react";
import type { MealPlanDay } from "../types";

interface MealPlanDayProps {
  day: MealPlanDay;
  recipes: Record<string, { title: string }>;
}

export const MealPlanDay: React.FC<MealPlanDayProps> = ({ day, recipes }) => {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="text-primary mb-3 text-lg font-semibold">{day.day}</h3>
      <p className="text-secondary mb-4 text-sm">{day.date.toDateString()}</p>

      <div className="space-y-3">
        {day.meals.map((meal, index) => (
          <div
            key={index}
            className="flex items-center justify-between rounded bg-gray-50 p-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium capitalize">
                {meal.type}
              </span>
              {meal.recipeId && recipes[meal.recipeId] ? (
                <span className="text-secondary text-sm">
                  {recipes[meal.recipeId].title}
                </span>
              ) : meal.customMeal ? (
                <span className="text-secondary text-sm italic">
                  {meal.customMeal}
                </span>
              ) : (
                <span className="text-sm text-gray-400">Empty</span>
              )}
            </div>
            {meal.notes && (
              <span className="text-xs text-gray-500">({meal.notes})</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
