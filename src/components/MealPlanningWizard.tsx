import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Icon } from "@iconify/react";
import { Checkbox } from "./Checkbox";

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  is_basic: boolean;
}

interface Recipe {
  id: string;
  title: string;
  ingredients?: Ingredient[];
}

interface DayPlan {
  date: string;
  recipe_id: string;
  notes: string;
}

interface ShoppingItem {
  name: string;
  amount: number;
  unit: string;
  checked: boolean;
}

export const MealPlanningWizard: React.FC<{
  userId: string;
  initialData?: any;
}> = ({ userId, initialData }) => {
  const [step, setStep] = useState(initialData ? 2 : 1);
  const [startDate, setStartDate] = useState(initialData?.start_date || "");
  const [endDate, setEndDate] = useState(initialData?.end_date || "");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [dayPlans, setDayPlans] = useState<DayPlan[]>(
    initialData?.planned_meals?.map((dp: any) => ({
      date: dp.date,
      recipe_id: dp.recipe_id || "",
      notes: dp.notes || "",
    })) || [],
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

    setStartDate(nextMonday.toISOString().split("T")[0]);
    setEndDate(nextSunday.toISOString().split("T")[0]);

    // Fetch recipes for the picker
    const fetchRecipes = async () => {
      const { data } = await supabase
        .from("recipes")
        .select("id, title, ingredients(name, amount, unit, is_basic)")
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
    const days: DayPlan[] = [];

    const sourceMeals = sourcePlan?.planned_meals || [];

    let i = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const sourceMeal = sourceMeals[i];
      days.push({
        date: d.toISOString().split("T")[0],
        recipe_id: sourceMeal?.recipe_id || "",
        notes: sourceMeal?.notes || "",
      });
      i++;
    }
    setDayPlans(days);
    setStep(2);
  };

  const handleRecipeChange = (index: number, recipeId: string) => {
    const newPlans = [...dayPlans];
    newPlans[index].recipe_id = recipeId;
    setDayPlans(newPlans);
  };

  const handleNotesChange = (index: number, notes: string) => {
    const newPlans = [...dayPlans];
    newPlans[index].notes = notes;
    setDayPlans(newPlans);
  };

  const generateShoppingList = () => {
    const itemMap: Record<string, ShoppingItem> = {};

    dayPlans.forEach((plan) => {
      const recipe = recipes.find((r) => r.id === plan.recipe_id);
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

    setShoppingItems(Object.values(itemMap));
    setStep(3);
  };

  const toggleShoppingItem = (index: number) => {
    const newItems = [...shoppingItems];
    newItems[index].checked = !newItems[index].checked;
    setShoppingItems(newItems);
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
            title: planTitle || `Plan for ${startDate}`,
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
            start_date: startDate,
            end_date: endDate,
            title: planTitle || `Plan for ${startDate}`,
          })
          .select()
          .single();

        if (planError) throw planError;
        planId = plan.id;
      }

      // 3. Create Planned Meals
      const planDaysToInsert = dayPlans.map((dp) => ({
        meal_plan_id: planId,
        date: dp.date,
        recipe_id: dp.recipe_id || null, // Allow no recipe (notes only)
        notes: dp.notes,
      }));

      const { error: daysError } = await supabase
        .from("planned_meals")
        .insert(planDaysToInsert);

      if (daysError) throw daysError;

      if (showShopping) {
        generateShoppingList();
        // Update URL to edit mode quietly or just stay in wizard
      } else {
        window.location.href = `/plan/${planId}`;
      }
    } catch (err: any) {
      alert("Feil ved lagring av plan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    if (!confirm("Er du sikker på at du vil slette denne middagsplanen?"))
      return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("meal_plans")
        .delete()
        .eq("id", initialData.id);

      if (error) throw error;

      window.location.href = "/plan";
    } catch (err: any) {
      console.error("Feil ved sletting av plan:", err);
      alert("Feil ved sletting: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">
          Steg 1: Velg datoer
        </h2>
        <div className="space-y-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Navn på plan (Valgfritt)
            </label>
            <input
              type="text"
              value={planTitle}
              onChange={(e) => setPlanTitle(e.target.value)}
              placeholder="f.eks. Neste ukes middager"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Startdato
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Sluttdato
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={handleDateSelection}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-4 font-bold text-white shadow-lg shadow-green-100 transition-colors hover:bg-green-700"
          >
            Velg oppskrifter
            <Icon icon="hugeicons:arrow-right-01" className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">
            Steg 2: Velg middager
          </h2>
          <button
            onClick={() => setStep(1)}
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
          >
            <Icon icon="hugeicons:arrow-left-01" className="h-4 w-4" />
            Endre datoer
          </button>
        </div>

        <div className="space-y-4">
          {dayPlans.map((day, index) => {
            const date = new Date(day.date);
            return (
              <div
                key={day.date}
                className="flex flex-col items-start gap-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:flex-row md:items-center"
              >
                <div className="min-w-[120px]">
                  <div className="text-xs font-bold tracking-wider text-blue-600 uppercase">
                    {date.toLocaleDateString("no-NO", { weekday: "short" })}
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {date.toLocaleDateString("no-NO", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>

                <div className="w-full flex-1 space-y-2">
                  <select
                    value={day.recipe_id}
                    onChange={(e) => handleRecipeChange(index, e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">(Ingen oppskrift valgt)</option>
                    {recipes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Notater (f.eks. Spise ute, rester...)"
                    value={day.notes}
                    onChange={(e) => handleNotesChange(index, e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none focus:border-blue-300"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => savePlan(true)}
            disabled={loading}
            className="flex-1 rounded-2xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-100 transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Lagrer..." : "Lagre og se handleliste"}
            <Icon
              icon="hugeicons:arrow-right-01"
              className="ml-2 inline-block h-5 w-5"
            />
          </button>
          <button
            onClick={() => savePlan(false)}
            disabled={loading}
            className="flex-1 rounded-2xl bg-green-600 py-4 font-bold text-white shadow-lg shadow-green-100 transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Lagrer..." : "Bare lagre plan"}
          </button>
          <a
            href="/plan"
            className="flex items-center rounded-2xl bg-gray-100 px-8 py-4 font-bold text-gray-700 transition-colors hover:bg-gray-200"
          >
            Avbryt
          </a>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">
            Steg 3: Sjekk handlelisten
          </h2>
          <button
            onClick={() => setStep(2)}
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
          >
            <Icon icon="hugeicons:arrow-left-01" className="h-4 w-4" />
            Tilbake til meny
          </button>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
          <p className="mb-6 text-gray-500">
            Her er ingrediensene du trenger. Kryss av det du allerede har i
            skapet.
          </p>

          {shoppingItems.length > 0 ? (
            <div className="space-y-3">
              {shoppingItems.map((item, index) => (
                <Checkbox
                  key={index}
                  checked={item.checked}
                  onChange={() => toggleShoppingItem(index)}
                  label={item.name}
                  subLabel={`${item.amount} ${item.unit}`}
                />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-400">
              <Icon
                icon="hugeicons:shopping-basket-01"
                className="mx-auto mb-3 h-12 w-12 opacity-20"
              />
              Ingen varer å handle for disse oppskriftene.
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => (window.location.href = `/plan`)}
            className="flex-1 rounded-2xl bg-green-600 py-4 font-bold text-white shadow-lg shadow-green-100 transition-colors hover:bg-green-700"
          >
            Ferdig
          </button>
        </div>
      </div>
    );
  }
};
