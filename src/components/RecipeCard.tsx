import React from "react";

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
      className="cursor-pointer overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <div className="p-4">
        <h3 className="text-primary mb-2 text-lg font-semibold">
          {recipe.title}
        </h3>
        <div className="text-secondary flex items-center justify-between text-sm">
          {/* Optional: Add metadata like 'Created by' later */}
        </div>
      </div>
    </div>
  );
};
