import React from "react";
import { Icon } from "@iconify/react";
import { Card } from "./ui/Card";
import { ui } from "../utils/icons";
import { duration } from "../utils/time";
import { markdownToPlainText } from "../lib/markdown";
import type { Recipe } from "../types";

interface RecipeCardProps {
  recipe: Pick<
    Recipe,
    "id" | "title" | "description" | "image_url" | "cook_time"
  >;
}

/** Rendered on the server only, so it can afford to run the markdown parser. */
export const RecipeCard = ({ recipe }: RecipeCardProps) => {
  const description = markdownToPlainText(recipe.description);

  return (
    <Card className="group flex h-full flex-col" noPadding isClickable>
      {recipe.image_url ? (
        <div className="h-48 w-full overflow-hidden">
          <img
            src={recipe.image_url}
            alt=""
            loading="lazy"
            decoding="async"
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
        {description && (
          <p className="text-text-muted line-clamp-2 text-sm">{description}</p>
        )}
        {recipe.cook_time ? (
          <div className="text-text-muted mt-auto flex items-center gap-1.5 pt-3 text-xs font-medium">
            <Icon icon={ui.clock} className="h-3.5 w-3.5" />
            <span>{duration(recipe.cook_time)}</span>
          </div>
        ) : null}
      </div>
    </Card>
  );
};
