import React from "react";
import { Icon } from "@iconify/react";

interface RecipeCardProps {
  recipe: {
    id: string;
    title: string;
    description: string | null;
    image_url?: string | null;
  };
  onClick?: () => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick }) => {
  return (
    <div
      className="flex h-full cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      {recipe.image_url ? (
        <div className="h-48 w-full overflow-hidden">
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="h-full w-full object-cover transition-transform hover:scale-105"
          />
        </div>
      ) : (
        <div className="flex h-48 w-full flex-col items-center justify-center bg-gray-50 text-gray-300">
          <Icon
            icon="streamline-ultimate-color:stamps-image"
            className="mb-2 h-10 w-10 text-gray-300"
          />
          <span className="text-xs font-medium tracking-wider uppercase">
            No Image
          </span>
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-primary mb-2 line-clamp-1 text-lg font-semibold">
          {recipe.title}
        </h3>
        {recipe.description && (
          <p className="line-clamp-2 text-sm text-gray-600">
            {recipe.description}
          </p>
        )}
      </div>
    </div>
  );
};
