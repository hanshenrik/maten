import React from "react";
import type { Recipe } from "../content/config";

interface RecipeCardProps {
  recipe: Recipe;
  onClick?: () => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick }) => {
  return (
    <div
      className="cursor-pointer overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <div className="p-4">
        <h3 className="text-primary mb-2 text-lg font-semibold">
          {recipe.title}
        </h3>
        <p className="text-secondary mb-3 line-clamp-2 text-sm">
          {recipe.description}
        </p>

        {recipe.categories && recipe.categories.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {recipe.categories.map((category) => (
              <span
                key={category}
                className="text-secondary rounded-full bg-gray-100 px-2 py-1 text-xs"
              >
                {category}
              </span>
            ))}
          </div>
        )}

        <div className="text-secondary flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {recipe.servings && (
              <span className="flex items-center">
                <svg
                  className="mr-1 h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fillRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {recipe.servings} servings
              </span>
            )}
            {recipe.prepTime && recipe.cookTime && (
              <span className="flex items-center">
                <svg
                  className="mr-1 h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                {recipe.prepTime + recipe.cookTime} min
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
