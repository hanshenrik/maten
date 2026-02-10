import React from 'react';
import type { MealPlanDay } from '../types';

interface MealPlanDayProps {
  day: MealPlanDay;
  recipes: Record<string, { title: string }>;
}

export const MealPlanDay: React.FC<MealPlanDayProps> = ({ day, recipes }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <h3 className="text-lg font-semibold text-primary mb-3">{day.day}</h3>
      <p className="text-sm text-secondary mb-4">{day.date.toDateString()}</p>
      
      <div className="space-y-3">
        {day.meals.map((meal, index) => (
          <div key={index} className="flex items-center justify-between p-2 rounded bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium capitalize">{meal.type}</span>
              {meal.recipeId && recipes[meal.recipeId] ? (
                <span className="text-sm text-secondary">
                  {recipes[meal.recipeId].title}
                </span>
              ) : meal.customMeal ? (
                <span className="text-sm text-secondary italic">
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