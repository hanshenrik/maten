import type { MealPlanWithMeals, RecipeSummary } from "../types";
import { formatISODate } from "./date";

/** One line on a day card: a recipe, a note, or both. */
export interface MealEntry {
  recipeId: string | null;
  notes?: string | null;
  recipe?: RecipeSummary | null;
}

export interface DayMeals {
  date: string;
  meals: MealEntry[];
}

/** Groups a plan's meals by date, oldest first, for display. */
export function groupMealsByDate(
  meals: MealPlanWithMeals["planned_meals"] | null | undefined,
): DayMeals[] {
  const byDate = new Map<string, MealEntry[]>();
  for (const meal of meals ?? []) {
    const entries = byDate.get(meal.date) ?? [];
    entries.push({
      recipeId: meal.recipe_id,
      notes: meal.notes,
      recipe: meal.recipes ?? null,
    });
    byDate.set(meal.date, entries);
  }
  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, meals]) => ({ date, meals }));
}

/** Every date from `start` to `end` inclusive, as ISO date strings. */
export function datesBetween(start: string, end: string): string[] {
  const dates: string[] = [];
  const last = new Date(end);
  for (let d = new Date(start); d <= last; d.setDate(d.getDate() + 1)) {
    dates.push(formatISODate(d));
  }
  return dates;
}

/** Next week, Monday to Sunday: the default range for a new plan. */
export function nextWeekRange(): { start: string; end: string } {
  const monday = new Date();
  monday.setDate(monday.getDate() + ((1 + 7 - monday.getDay()) % 7 || 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: formatISODate(monday), end: formatISODate(sunday) };
}

/** The title shown for a plan without one of its own. */
export const planTitle = (plan: { title: string | null }) =>
  plan.title || "Meny";
