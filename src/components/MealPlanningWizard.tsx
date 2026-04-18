import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { ui } from "../utils/icons";
import { Icon } from "@iconify/react";
import { CheckboxButton } from "./ui/CheckboxButton";
import {
  formatISODate,
  formatShortDay,
  formatMonthDay,
  formatDateRange,
} from "../utils/date";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  is_basic: boolean;
}

interface Recipe {
  id: string;
  title: string;
  cook_time?: number | null;
  ingredients?: Ingredient[];
}

interface RecipeSlot {
  recipe_id: string;
  notes: string;
}

interface DayPlan {
  date: string;
  slots: RecipeSlot[];
}

interface ShoppingItem {
  name: string;
  amount: number;
  unit: string;
  checked: boolean;
}

/**
 * Groups a flat array of planned_meals (from DB or initialData) into DayPlan[]
 * where each date has multiple slots.
 */
function groupMealsByDate(
  meals: { date: string; recipe_id?: string; notes?: string }[],
): DayPlan[] {
  const map = new Map<string, RecipeSlot[]>();
  for (const m of meals) {
    const slots = map.get(m.date) || [];
    slots.push({ recipe_id: m.recipe_id || "", notes: m.notes || "" });
    map.set(m.date, slots);
  }
  // Sort dates and return
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, slots]) => ({ date, slots }));
}

export const MealPlanningWizard: React.FC<{
  userId: string;
  householdId: string;
  initialData?: any;
}> = ({ userId, householdId, initialData }) => {
  const [step, setStep] = useState(initialData ? 2 : 1);
  const [startDate, setStartDate] = useState(initialData?.start_date || "");
  const [endDate, setEndDate] = useState(initialData?.end_date || "");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [dayPlans, setDayPlans] = useState<DayPlan[]>(
    initialData?.planned_meals
      ? groupMealsByDate(initialData.planned_meals)
      : [],
  );
  const [loading, setLoading] = useState(false);
  const [planTitle, setPlanTitle] = useState(initialData?.title || "");
  const [sourcePlan, setSourcePlan] = useState<any>(null);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);

  useEffect(() => {
    // Default to next week Mon-Sun
    const nextMonday = new Date();
    nextMonday.setDate(
      nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7 || 7),
    );
    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextMonday.getDate() + 6);

    setStartDate(formatISODate(nextMonday));
    setEndDate(formatISODate(nextSunday));

    // Fetch recipes for the picker
    const fetchRecipes = async () => {
      const { data } = await supabase
        .from("recipes")
        .select(
          "id, title, cook_time, ingredients(name, amount, unit, is_basic)",
        )
        .order("title");
      if (data) setRecipes(data as any);
    };
    fetchRecipes();

    // Check for copyFrom parameter
    const urlParams = new URLSearchParams(window.location.search);
    const copyFrom = urlParams.get("copyFrom");
    if (copyFrom && !initialData) {
      const fetchSourcePlan = async () => {
        const { data } = await supabase
          .from("meal_plans")
          .select("*, planned_meals(*)")
          .eq("id", copyFrom)
          .single();

        if (data) {
          // Sort planned_meals by date to ensure correct mapping
          if (data.planned_meals) {
            data.planned_meals.sort((a: any, b: any) =>
              a.date.localeCompare(b.date),
            );
          }
          setSourcePlan(data);
          setPlanTitle(`${data.title || "Plan"} (Kopi)`);
        }
      };
      fetchSourcePlan();
    }
  }, []);

  const handleDateSelection = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // If we have a source plan, group its meals by date
    const sourceByDate = new Map<string, RecipeSlot[]>();
    if (sourcePlan?.planned_meals) {
      for (const m of sourcePlan.planned_meals) {
        const slots = sourceByDate.get(m.date) || [];
        slots.push({ recipe_id: m.recipe_id || "", notes: m.notes || "" });
        sourceByDate.set(m.date, slots);
      }
    }

    const days: DayPlan[] = [];
    const sourceDates = Array.from(sourceByDate.keys()).sort();

    let i = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = formatISODate(d);
      // Try to match source meals by position (day index)
      const sourceDate = sourceDates[i];
      const sourceSlots = sourceDate ? sourceByDate.get(sourceDate) : undefined;

      days.push({
        date: dateStr,
        slots: sourceSlots
          ? sourceSlots.map((s) => ({ ...s }))
          : [{ recipe_id: "", notes: "" }],
      });
      i++;
    }
    setDayPlans(days);
    setStep(2);
  };

  const handleSlotChange = (
    dayIndex: number,
    slotIndex: number,
    field: "recipe_id" | "notes",
    value: string,
  ) => {
    const newPlans = [...dayPlans];
    const newSlots = [...newPlans[dayIndex].slots];
    newSlots[slotIndex] = { ...newSlots[slotIndex], [field]: value };
    newPlans[dayIndex] = { ...newPlans[dayIndex], slots: newSlots };
    setDayPlans(newPlans);
  };

  const addSlot = (dayIndex: number) => {
    const newPlans = [...dayPlans];
    newPlans[dayIndex] = {
      ...newPlans[dayIndex],
      slots: [...newPlans[dayIndex].slots, { recipe_id: "", notes: "" }],
    };
    setDayPlans(newPlans);
  };

  const removeSlot = (dayIndex: number, slotIndex: number) => {
    const newPlans = [...dayPlans];
    const newSlots = newPlans[dayIndex].slots.filter((_, i) => i !== slotIndex);
    newPlans[dayIndex] = {
      ...newPlans[dayIndex],
      slots: newSlots.length > 0 ? newSlots : [{ recipe_id: "", notes: "" }],
    };
    setDayPlans(newPlans);
  };

  const calculateShoppingItems = () => {
    const itemMap: Record<string, ShoppingItem> = {};

    dayPlans.forEach((day) => {
      day.slots.forEach((slot) => {
        const recipe = recipes.find((r) => r.id === slot.recipe_id);
        recipe?.ingredients?.forEach((ing) => {
          if (ing.is_basic) return;

          const key = `${ing.name.toLowerCase()}-${ing.unit?.toLowerCase() || "none"}`;
          if (itemMap[key]) {
            itemMap[key].amount += Number(ing.amount) || 0;
          } else {
            itemMap[key] = {
              name: ing.name,
              amount: Number(ing.amount) || 0,
              unit: ing.unit,
              checked: false,
            };
          }
        });
      });
    });

    return Object.values(itemMap);
  };

  const generateShoppingList = () => {
    const items = calculateShoppingItems();
    setShoppingItems(items);
    setStep(3);
  };

  const toggleShoppingItem = (index: number) => {
    const newItems = [...shoppingItems];
    newItems[index].checked = !newItems[index].checked;
    setShoppingItems(newItems);
  };

  /** Flatten dayPlans into individual planned_meals rows for DB insert */
  const flattenPlannedMeals = (planId: string) => {
    const rows: {
      meal_plan_id: string;
      date: string;
      recipe_id: string | null;
      notes: string;
    }[] = [];
    dayPlans.forEach((day) => {
      day.slots.forEach((slot) => {
        rows.push({
          meal_plan_id: planId,
          date: day.date,
          recipe_id: slot.recipe_id || null,
          notes: slot.notes,
        });
      });
    });
    return rows;
  };

  const savePlan = async (showShopping = false) => {
    setLoading(true);
    try {
      let planId = initialData?.id;

      if (initialData) {
        // 1. Update Meal Plan
        const { error: planError } = await supabase
          .from("meal_plans")
          .update({
            start_date: startDate,
            end_date: endDate,
            title:
              planTitle ||
              `Plan for ${formatDateRange({
                start: startDate,
                end: endDate,
              })}`,
          })
          .eq("id", planId);

        if (planError) throw planError;

        // 2. Delete old days
        await supabase
          .from("planned_meals")
          .delete()
          .eq("meal_plan_id", planId);
      } else {
        // 1. Create Meal Plan
        const { data: plan, error: planError } = await supabase
          .from("meal_plans")
          .insert({
            user_id: userId,
            household_id: householdId,
            start_date: startDate,
            end_date: endDate,
            title:
              planTitle ||
              `Plan for ${formatDateRange({
                start: startDate,
                end: endDate,
              })}`,
          })
          .select()
          .single();

        if (planError) throw planError;
        planId = plan.id;
      }

      // 3. Create Planned Meals (flattened — one row per slot)
      const planDaysToInsert = flattenPlannedMeals(planId);

      const { error: daysError } = await supabase
        .from("planned_meals")
        .insert(planDaysToInsert);

      if (daysError) throw daysError;

      // Prepare shopping items if needed
      if (showShopping) {
        const items = calculateShoppingItems();
        setShoppingItems(items);
        setStep(3);
      } else {
        window.location.href = `/plans/${planId}`;
      }
    } catch (err: any) {
      alert("Feil ved lagring av plan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishWizard = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && shoppingItems.length > 0) {
        const itemsToInsert = shoppingItems
          .filter((item) => !item.checked) // Only add things we don't have
          .map((item) => ({
            user_id: user.id,
            household_id: householdId,
            name: item.name,
            amount: item.amount,
            unit: item.unit,
            completed: false,
          }));

        if (itemsToInsert.length > 0) {
          const { error: shoppingError } = await supabase
            .from("shopping_items")
            .insert(itemsToInsert);
          if (shoppingError) throw shoppingError;
        }
      }
      window.location.href = `/plans`;
    } catch (err: any) {
      console.error("Feil ved ferdigstilling av handleliste:", err);
      alert("Feil ved ferdigstilling: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    if (!confirm("Er du helt sikker på at du vil slette denne menyen?")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("meal_plans")
        .delete()
        .eq("id", initialData.id);

      if (error) throw error;

      window.location.href = "/plans";
    } catch (err: any) {
      console.error("Feil ved sletting av plan:", err);
      alert("Feil ved sletting: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <Card className="mx-auto max-w-md">
        <h2 className="text-text mb-6 text-2xl font-bold">
          Steg 1: Velg datoer
        </h2>
        <div className="space-y-6">
          <Input
            label="Navn på plan (valgfritt)"
            value={planTitle}
            onChange={(e) => setPlanTitle(e.target.value)}
            placeholder="f.eks. «Italiensk uke»"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              label="Fra og med"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              type="date"
              label="Til og med"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <Button
            onClick={handleDateSelection}
            size="lg"
            className="w-full gap-2"
          >
            Velg oppskrifter
            <Icon icon={ui.next} className="h-5 w-5" />
          </Button>
          {initialData && (
            <Button
              type="button"
              variant="danger"
              size="lg"
              onClick={handleDelete}
              disabled={loading}
              className="w-full"
              title="Slett meny"
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
        <Card className="flex items-center justify-between">
          <h2 className="text-text text-2xl font-bold">
            Steg 2: Hva har dere lyst på?
          </h2>
          <Button
            variant="ghost"
            onClick={() => setStep(1)}
            className="gap-1 text-sm"
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
                      <select
                        value={slot.recipe_id}
                        onChange={(e) =>
                          handleSlotChange(
                            dayIndex,
                            slotIndex,
                            "recipe_id",
                            e.target.value,
                          )
                        }
                        className="focus:ring-primary border-border bg-bg text-text w-full rounded-xl border px-4 py-3 outline-none focus:ring-2"
                      >
                        <option value="">(Ingenting valgt ennå)</option>
                        {recipes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.title}{" "}
                            {r.cook_time ? `(${r.cook_time} min)` : ""}
                          </option>
                        ))}
                      </select>
                      {day.slots.length > 1 && (
                        <Button
                          variant="ghost"
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
                        handleSlotChange(
                          dayIndex,
                          slotIndex,
                          "notes",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                ))}
                <button
                  onClick={() => addSlot(dayIndex)}
                  className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm font-medium transition-colors"
                >
                  <Icon icon={ui.add} className="h-4 w-4" />
                  Legg til oppskrift
                </button>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex gap-4">
          <Button
            onClick={() => savePlan(true)}
            disabled={loading}
            size="lg"
            className="flex-1 gap-2"
          >
            {loading ? "Lagrer..." : "Lag handleliste"}
            <Icon icon={ui.next} className="h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            onClick={() => savePlan(false)}
            disabled={loading}
            size="lg"
            className="flex-1"
          >
            {loading ? "Lagrer..." : "Bare lagre menyen"}
          </Button>
          <Button as="a" href="/plans" variant="secondary" size="lg">
            Avbryt
          </Button>
          {initialData && (
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={loading}
              size="lg"
              title="Slett plan"
            >
              <Icon icon={ui.delete} className="h-6 w-6" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="flex items-center justify-between">
          <h2 className="text-text text-2xl font-bold">
            Steg 3: Sjekk hva som mangler
          </h2>
          <Button
            variant="ghost"
            onClick={() => setStep(2)}
            className="gap-1 text-sm"
          >
            <Icon icon={ui.back} className="h-4 w-4" />
            Tilbake til meny
          </Button>
        </Card>

        <Card>
          <p className="text-text-muted mb-6">
            Her er det dere trenger. Kryss av for det dere allerede har i
            skapet, så slipper dere å kjøpe det én gang til.
          </p>

          {shoppingItems.length > 0 ? (
            <div className="space-y-3">
              {shoppingItems.map((item, index) => (
                <CheckboxButton
                  key={index}
                  checked={item.checked}
                  onChange={() => toggleShoppingItem(index)}
                  label={item.name}
                  subLabel={`${item.amount} ${item.unit}`}
                />
              ))}
            </div>
          ) : (
            <div className="text-text-muted py-8 text-center">
              <Icon
                icon="hugeicons:shopping-basket-01"
                className="mx-auto mb-3 h-12 w-12 opacity-20"
              />
              Det ser ut til at dere har alt dere trenger for disse rettene!
            </div>
          )}
        </Card>

        <div className="flex gap-4">
          <Button
            onClick={handleFinishWizard}
            disabled={loading}
            size="lg"
            className="flex-1"
          >
            {loading ? "Fullfører..." : "Ferdig"}
          </Button>
          {initialData && (
            <Button
              type="button"
              variant="danger"
              size="lg"
              onClick={handleDelete}
              disabled={loading}
              title="Slett plan"
            >
              <Icon icon={ui.delete} className="h-6 w-6" />
            </Button>
          )}
        </div>
      </div>
    );
  }
};
