import React, { useEffect, useRef, useState } from "react";
import { Icon } from "./ui/Icon";
import { supabase } from "../lib/supabase";
import type { MealPlanWithMeals, RecipeSummary } from "../types";
import { formatDateRange, formatMonthDay, formatShortDay } from "../utils/date";
import { errorMessage } from "../utils/errors";
import { ui } from "../utils/icons";
import { datesBetween, nextWeekRange } from "../utils/mealPlans";
import {
  formatItemAmount,
  mergeShoppingItems,
  planShoppingListAdditions,
  type MergeableItem,
} from "../utils/shoppingList";
import { CheckboxButton } from "./forms/CheckboxButton";
import { Input } from "./forms/Input";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { RecipeSelect } from "./RecipeSelect";

/** A recipe with what the wizard needs to build a shopping list from it */
export type WizardRecipe = RecipeSummary & {
  ingredients: {
    name: string;
    amount: number | null;
    unit: string;
    is_basic: boolean;
  }[];
};

interface Slot {
  recipe_id: string;
  notes: string;
}

interface DayPlan {
  date: string;
  slots: Slot[];
}

type DraftItem = MergeableItem & { checked: boolean };

const emptySlot = (): Slot => ({ recipe_id: "", notes: "" });

/** Groups a plan's meals into one entry per date, oldest first */
function groupIntoDays(meals: MealPlanWithMeals["planned_meals"]): DayPlan[] {
  const byDate = new Map<string, Slot[]>();
  for (const meal of meals) {
    const slots = byDate.get(meal.date) ?? [];
    slots.push({ recipe_id: meal.recipe_id ?? "", notes: meal.notes ?? "" });
    byDate.set(meal.date, slots);
  }
  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, slots]) => ({ date, slots }));
}

const MAX_DAYS = 60;

interface MealPlanningWizardProps {
  userId: string;
  householdId: string;
  recipes: WizardRecipe[];
  /** The plan being edited */
  initialData?: MealPlanWithMeals | null;
  /** A plan to copy meals from, matched day by day */
  sourcePlan?: MealPlanWithMeals | null;
}

export const MealPlanningWizard = ({
  userId,
  householdId,
  recipes,
  initialData,
  sourcePlan,
}: MealPlanningWizardProps) => {
  const isEditing = !!initialData;

  const [step, setStep] = useState<1 | 2 | 3>(isEditing ? 2 : 1);
  const [planTitle, setPlanTitle] = useState(
    initialData?.title ??
      (sourcePlan ? `${sourcePlan.title || "Meny"} (kopi)` : ""),
  );
  const [startDate, setStartDate] = useState(initialData?.start_date ?? "");
  const [endDate, setEndDate] = useState(initialData?.end_date ?? "");
  const [dateError, setDateError] = useState<string | null>(null);
  const [dayPlans, setDayPlans] = useState<DayPlan[]>(() =>
    initialData ? groupIntoDays(initialData.planned_meals) : [],
  );
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [saving, setSaving] = useState(false);

  // New plans default to next week. Done on the client so the dates come
  // out in the user's time zone, not the server's.
  useEffect(() => {
    if (isEditing) return;
    const { start, end } = nextWeekRange();
    setStartDate(start);
    setEndDate(end);
  }, [isEditing]);

  // Scroll to the top when moving between steps, so we don't land mid-page
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const handleDateSelection = () => {
    if (!startDate || !endDate) {
      setDateError("Velg både første og siste dag.");
      return;
    }
    if (endDate < startDate) {
      setDateError("Siste dag kan ikke være før første dag.");
      return;
    }
    const dates = datesBetween(startDate, endDate);
    if (dates.length > MAX_DAYS) {
      setDateError(`En meny kan være på maks ${MAX_DAYS} dager.`);
      return;
    }

    // Keep what's already been chosen for dates that are still in range,
    // fill the rest from the plan being copied (day by day), else blank.
    const existing = new Map(dayPlans.map((day) => [day.date, day.slots]));
    const sourceDays = sourcePlan
      ? groupIntoDays(sourcePlan.planned_meals)
      : [];

    setDayPlans(
      dates.map((date, i) => ({
        date,
        slots: existing.get(date) ??
          sourceDays[i]?.slots.map((slot) => ({ ...slot })) ?? [emptySlot()],
      })),
    );
    setDateError(null);
    setStep(2);
  };

  const updateDay = (dayIndex: number, update: (slots: Slot[]) => Slot[]) =>
    setDayPlans((days) =>
      days.map((day, i) =>
        i === dayIndex ? { ...day, slots: update(day.slots) } : day,
      ),
    );

  const changeSlot = (
    dayIndex: number,
    slotIndex: number,
    change: Partial<Slot>,
  ) =>
    updateDay(dayIndex, (slots) =>
      slots.map((slot, i) => (i === slotIndex ? { ...slot, ...change } : slot)),
    );

  const addSlot = (dayIndex: number) =>
    updateDay(dayIndex, (slots) => [...slots, emptySlot()]);

  const removeSlot = (dayIndex: number, slotIndex: number) =>
    updateDay(dayIndex, (slots) => {
      const rest = slots.filter((_, i) => i !== slotIndex);
      return rest.length > 0 ? rest : [emptySlot()];
    });

  /** Everything the chosen recipes need, minus pantry staples, merged */
  const buildShoppingDraft = (): DraftItem[] => {
    const recipeById = new Map(recipes.map((r) => [r.id, r]));
    const ingredients: MergeableItem[] = [];

    for (const day of dayPlans) {
      for (const slot of day.slots) {
        for (const ing of recipeById.get(slot.recipe_id)?.ingredients ?? []) {
          if (ing.is_basic) continue;
          ingredients.push({
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
          });
        }
      }
    }

    return mergeShoppingItems(ingredients).map((item) => ({
      ...item,
      checked: false,
    }));
  };

  const savePlan = async (next: "shopping" | "view") => {
    setSaving(true);
    try {
      const title =
        planTitle.trim() ||
        `Plan for ${formatDateRange({ start: startDate, end: endDate })}`;
      let planId = initialData?.id;

      if (initialData) {
        const { error } = await supabase
          .from("meal_plans")
          .update({ start_date: startDate, end_date: endDate, title })
          .eq("id", initialData.id);
        if (error) throw error;

        const { error: deleteError } = await supabase
          .from("planned_meals")
          .delete()
          .eq("meal_plan_id", initialData.id);
        if (deleteError) throw deleteError;
      } else {
        const { data, error } = await supabase
          .from("meal_plans")
          .insert({
            user_id: userId,
            household_id: householdId,
            start_date: startDate,
            end_date: endDate,
            title,
          })
          .select("id")
          .single();
        if (error) throw error;
        planId = data.id;
      }

      const rows = dayPlans.flatMap((day) =>
        day.slots.map((slot) => ({
          meal_plan_id: planId,
          date: day.date,
          recipe_id: slot.recipe_id || null,
          notes: slot.notes,
        })),
      );
      const { error: mealsError } = await supabase
        .from("planned_meals")
        .insert(rows);
      if (mealsError) throw mealsError;

      if (next === "shopping") {
        setDraftItems(buildShoppingDraft());
        setStep(3);
      } else {
        window.location.href = `/plans/${planId}`;
      }
    } catch (err) {
      alert(`Feil ved lagring av menyen: ${errorMessage(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      // Ticked items are already in the cupboard
      const toAdd = draftItems.filter((item) => !item.checked);

      if (toAdd.length > 0) {
        // Anything already on the list gets its amount bumped instead of
        // ending up as a duplicate line. Completed items are already bought,
        // so they're left alone and the ingredient starts over on a new line.
        const { data: existing, error: existingError } = await supabase
          .from("shopping_items")
          .select("id, name, amount, unit")
          .eq("household_id", householdId)
          .eq("completed", false);
        if (existingError) throw existingError;

        const { updates, inserts } = planShoppingListAdditions(
          existing ?? [],
          toAdd,
        );

        if (inserts.length > 0) {
          const { error } = await supabase.from("shopping_items").insert(
            inserts.map((item) => ({
              user_id: userId,
              household_id: householdId,
              name: item.name,
              amount: item.amount,
              unit: item.unit,
              completed: false,
            })),
          );
          if (error) throw error;
        }

        const results = await Promise.all(
          updates.map((update) =>
            supabase
              .from("shopping_items")
              .update({ name: update.name, amount: update.amount })
              .eq("id", update.id),
          ),
        );
        const failed = results.find((r) => r.error);
        if (failed?.error) throw failed.error;
      }

      window.location.href = "/plans";
    } catch (err) {
      alert(`Feil ved ferdigstilling av handlelisten: ${errorMessage(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData) return;
    if (!confirm("Er du helt sikker på at du vil slette denne menyen?")) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("meal_plans")
        .delete()
        .eq("id", initialData.id);
      if (error) throw error;

      window.location.href = "/plans";
    } catch (err) {
      alert(`Feil ved sletting: ${errorMessage(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteButton = isEditing && (
    <Button
      variant="danger"
      size="lg"
      onClick={handleDelete}
      disabled={saving}
      title="Slett meny"
    >
      <Icon icon={ui.delete} className="h-6 w-6" />
      <span className="sr-only">Slett meny</span>
    </Button>
  );

  if (step === 1) {
    return (
      <Card className="mx-auto max-w-md">
        <h2 className="text-text mb-6 text-2xl font-bold">
          Steg 1: Velg datoer
        </h2>
        <div className="space-y-6">
          <Input
            label="Navn på menyen (valgfritt)"
            value={planTitle}
            onChange={(e) => setPlanTitle(e.target.value)}
            placeholder="f.eks. «Italiensk uke»"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              label="Fra og med"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              type="date"
              label="Til og med"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          {dateError && <p className="text-sm text-red-500">{dateError}</p>}
          <Button
            onClick={handleDateSelection}
            size="lg"
            className="w-full gap-2"
          >
            Velg oppskrifter
            <Icon icon={ui.next} className="h-5 w-5" />
          </Button>
          {isEditing && (
            <Button
              variant="danger"
              size="lg"
              onClick={handleDelete}
              disabled={saving}
              className="w-full gap-2"
            >
              <Icon icon={ui.delete} className="h-6 w-6" /> Slett meny
            </Button>
          )}
        </div>
      </Card>
    );
  }

  if (step === 2) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="flex items-center justify-between gap-4">
          <h2 className="text-text text-2xl font-bold">
            Steg 2: Hva har dere lyst på?
          </h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setStep(1)}
            className="shrink-0 gap-1"
          >
            <Icon icon={ui.back} className="h-4 w-4" />
            Endre datoer
          </Button>
        </Card>

        <div className="space-y-4">
          {dayPlans.map((day, dayIndex) => (
            <Card
              key={day.date}
              className="flex flex-col items-start gap-4 md:flex-row"
            >
              <div className="min-w-30">
                <div className="text-xs font-bold tracking-wider uppercase opacity-60">
                  {formatShortDay(day.date)}
                </div>
                <div className="text-text text-lg font-bold">
                  {formatMonthDay(day.date)}
                </div>
              </div>

              <div className="w-full flex-1 space-y-3">
                {day.slots.map((slot, slotIndex) => (
                  <div key={slotIndex} className="space-y-2">
                    {slotIndex > 0 && (
                      <div className="border-border border-t pt-3" />
                    )}
                    <div className="flex items-center gap-2">
                      <RecipeSelect
                        recipes={recipes}
                        value={slot.recipe_id}
                        onChange={(recipe_id) =>
                          changeSlot(dayIndex, slotIndex, { recipe_id })
                        }
                      />
                      {day.slots.length > 1 && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => removeSlot(dayIndex, slotIndex)}
                          title="Fjern oppskrift"
                          className="text-text-muted hover:text-danger shrink-0"
                        >
                          <Icon icon={ui.x} className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Input
                      placeholder="Legg til et notat (f.eks. rester, spise ute...)"
                      value={slot.notes}
                      onChange={(e) =>
                        changeSlot(dayIndex, slotIndex, {
                          notes: e.target.value,
                        })
                      }
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addSlot(dayIndex)}
                  className="text-primary hover:text-primary/80 flex cursor-pointer items-center gap-1 text-sm font-medium transition-colors"
                >
                  <Icon icon={ui.add} className="h-4 w-4" />
                  Legg til oppskrift
                </button>
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => savePlan("shopping")}
            disabled={saving}
            className="w-full gap-2"
          >
            {saving ? "Lagrer..." : "Lag handleliste"}
            <Icon icon={ui.next} className="h-5 w-5" />
          </Button>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="secondary"
              onClick={() => savePlan("view")}
              disabled={saving}
            >
              {saving ? "Lagrer..." : "Bare lagre menyen"}
            </Button>
            <Button as="a" href="/plans" variant="secondary">
              Avbryt
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="flex items-center justify-between gap-4">
        <h2 className="text-text text-2xl font-bold">
          Steg 3: Sjekk hva som mangler
        </h2>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setStep(2)}
          className="shrink-0 gap-1"
        >
          <Icon icon={ui.back} className="h-4 w-4" />
          Tilbake til meny
        </Button>
      </Card>

      <Card>
        <p className="text-text-muted mb-6">
          Her er det dere trenger. Kryss av for det dere allerede har i skapet,
          så slipper dere å kjøpe det én gang til.
        </p>

        {draftItems.length > 0 ? (
          <div className="space-y-3">
            {draftItems.map((item, index) => (
              <CheckboxButton
                key={`${item.name}|${item.unit}`}
                checked={item.checked}
                onChange={() =>
                  setDraftItems((current) =>
                    current.map((it, i) =>
                      i === index ? { ...it, checked: !it.checked } : it,
                    ),
                  )
                }
                label={item.name}
                subLabel={formatItemAmount(item.amount, item.unit)}
              />
            ))}
          </div>
        ) : (
          <div className="text-text-muted py-8 text-center">
            <Icon
              icon={ui.basket}
              className="mx-auto mb-3 h-12 w-12 opacity-20"
            />
            Det ser ut til at dere har alt dere trenger for disse rettene!
          </div>
        )}
      </Card>

      <div className="flex gap-4">
        <Button
          onClick={handleFinish}
          disabled={saving}
          size="lg"
          className="flex-1"
        >
          {saving ? "Fullfører..." : "Ferdig"}
        </Button>
        {deleteButton}
      </div>
    </div>
  );
};
