import React, { useState } from "react";
import { BasicTag } from "./BasicTag";
import { OptionalTag } from "./OptionalTag";

interface Ingredient {
  id: string;
  name: string;
  amount: number | null;
  unit: string;
  optional: boolean;
  is_basic: boolean;
}

interface RecipeScalerProps {
  ingredients: Ingredient[];
  baseServings: number | null;
}

function formatAmount(amount: number): string {
  return parseFloat(amount.toFixed(2)).toString();
}

export const RecipeScaler: React.FC<RecipeScalerProps> = ({
  ingredients,
  baseServings,
}) => {
  const [servings, setServings] = useState(baseServings ?? 1);

  const scale = baseServings ? servings / baseServings : 1;

  return (
    <div>
      {baseServings && (
        <div className="mb-4 flex items-center gap-3">
          <span className="text-text-muted text-sm font-medium">Porsjoner</span>
          <div className="border-border flex items-center gap-1 rounded-xl border p-1">
            <button
              type="button"
              onClick={() => setServings(Math.max(1, servings - 1))}
              className="text-text hover:bg-surface-elevated flex h-7 w-7 items-center justify-center rounded-lg transition-colors text-lg leading-none"
            >
              −
            </button>
            <span className="text-text min-w-[2ch] text-center font-semibold px-1">
              {servings}
            </span>
            <button
              type="button"
              onClick={() => setServings(servings + 1)}
              className="text-text hover:bg-surface-elevated flex h-7 w-7 items-center justify-center rounded-lg transition-colors text-lg leading-none"
            >
              +
            </button>
          </div>
        </div>
      )}
      <ul className="grid w-full grid-cols-[max-content_1fr] gap-x-4 gap-y-3">
        {ingredients.map((ing) => (
          <li key={ing.id} className="group contents">
            <div className="flex w-full items-center gap-3">
              <span className="text-text flex-1 whitespace-nowrap font-medium">
                {ing.amount != null
                  ? `${formatAmount(ing.amount * scale)} ${ing.unit}`
                  : ""}
              </span>
            </div>
            <div className="flex w-full items-center">
              <span className="text-text">{ing.name}</span>
              {ing.optional && (
                <span className="ml-2 inline-flex">
                  <OptionalTag />
                </span>
              )}
              {ing.is_basic && (
                <span className="ml-2 inline-flex">
                  <BasicTag />
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
