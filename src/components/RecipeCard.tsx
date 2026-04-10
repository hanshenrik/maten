import React from "react";
import { Icon } from "@iconify/react";
import { Card } from "./ui/Card";

interface RecipeCardProps {
  recipe: {
    id: string;
    title: string;
    description: string | null;
    image_url?: string | null;
    source_url?: string | null;
  };
  onClick?: () => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick }) => {
  return (
    <Card
      className="group flex h-full cursor-pointer flex-col"
      noPadding
      onClick={onClick}
      isClickable
    >
      {recipe.image_url ? (
        <div className="h-48 w-full overflow-hidden">
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          {recipe.source_url && (
            <div className="bg-surface text-primary border-border absolute top-2 right-2 rounded-full border p-1.5 opacity-90 transition-opacity hover:opacity-100">
              <Icon icon="hugeicons:link-01" className="h-4 w-4" />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-bg text-text-muted flex h-48 w-full flex-col items-center justify-center">
          <Icon
            icon="streamline-ultimate-color:stamps-image"
            className="mb-2 h-10 w-10 opacity-30"
          />
          <span className="text-xs font-medium tracking-wider uppercase">
            No Image
          </span>
          {recipe.source_url && (
            <div className="bg-surface text-primary border-border absolute top-2 right-2 rounded-full border p-1.5 opacity-90 transition-opacity hover:opacity-100">
              <Icon icon="hugeicons:link-01" className="h-4 w-4" />
            </div>
          )}
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-text mb-2 line-clamp-1 text-lg font-semibold">
          {recipe.title}
        </h3>
        {recipe.description && (
          <p className="text-text-muted line-clamp-2 text-sm">
            {recipe.description}
          </p>
        )}
      </div>
    </Card>
  );
};
