import React from "react";
import { Icon } from "@iconify/react";
import { Card } from "./ui/Card";
import { ui } from "../utils/icons";
import { duration } from "../utils/time";

interface RecipeCardProps {
  recipe: {
    id: string;
    title: string;
    description: string | null;
    image_url?: string | null;
    source_url?: string | null;
    cook_time?: number | null;
  };
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  return (
    <Card
      className="group flex h-full cursor-pointer flex-col"
      noPadding
      isClickable
    >
      {recipe.image_url ? (
        <div className="h-48 w-full overflow-hidden">
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="bg-bg text-text-muted flex h-48 w-full flex-col items-center justify-center">
          <span className="text-xs font-medium tracking-wider uppercase">
            Uten bilde
          </span>
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
        {recipe.cook_time && (
          <div className="text-text-muted mt-auto flex items-center gap-1.5 pt-3 text-xs font-medium">
            <Icon icon={ui.clock} className="h-3.5 w-3.5" />
            <span>{duration(recipe.cook_time)}</span>
          </div>
        )}
      </div>
    </Card>
  );
};
