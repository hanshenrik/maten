import React, { useState } from "react";
import { BasicTag, OptionalTag } from "./ui/Tag";
import type { Ingredient } from "../types";

interface RecipeScalerProps {
  ingredients: Ingredient[];
  /** The number of servings the amounts are written for */
  baseServings: number | null;
}

/** "1.3333" -> "1.33", "2.00" -> "2" */
const formatAmount = (amount: number) =>
  parseFloat(amount.toFixed(2)).toString();

/** The ingredient list, with a control to scale amounts to more or fewer servings. */
export const RecipeScaler = ({
  ingredients,
  baseServings,
}: RecipeScalerProps) => {
  const [servings, setServings] = useState(baseServings ?? 1);
  const scale = baseServings ? servings / baseServings : 1;

  const stepperClassName =
    "text-text hover:bg-surface-elevated flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-lg leading-none transition-colors";

  return (
    <div>
      {baseServings && (
        <div className="mb-4 flex items-center gap-3">
          <span className="text-text-muted text-sm font-medium">Porsjoner</span>
          <div className="border-border flex items-center gap-1 rounded-xl border p-1">
            <button
              type="button"
              aria-label="Færre porsjoner"
              onClick={() => setServings((s) => Math.max(1, s - 1))}
              className={stepperClassName}
            >
              −
            </button>
            <span
              aria-live="polite"
              className="text-text min-w-[2ch] px-1 text-center font-semibold"
            >
              {servings}
            </span>
            <button
              type="button"
              aria-label="Flere porsjoner"
              onClick={() => setServings((s) => s + 1)}
              className={stepperClassName}
            >
              +
            </button>
          </div>
        </div>
      )}
      <ul className="grid w-full grid-cols-[max-content_1fr] gap-x-4 gap-y-3">
        {ingredients.map((ing) => (
          <li key={ing.id} className="contents">
            <span className="text-text font-medium whitespace-nowrap">
              {ing.amount != null
                ? [formatAmount(ing.amount * scale), ing.unit]
                    .filter(Boolean)
                    .join(" ")
                : ""}
            </span>
            <span className="text-text flex items-center gap-2">
              {ing.name}
              {ing.optional && <OptionalTag />}
              {ing.is_basic && <BasicTag />}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
