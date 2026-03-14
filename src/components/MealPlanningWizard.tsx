import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Icon } from "@iconify/react";

interface Recipe {
  id: string;
  title: string;
}

interface DayPlan {
  date: string;
  recipe_id: string;
  notes: string;
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
        .select("id, title")
        .order("title");
      if (data) setRecipes(data);
    };
    fetchRecipes();
  }, []);

  const handleDateSelection = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days: DayPlan[] = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push({
        date: d.toISOString().split("T")[0],
        recipe_id: "",
        notes: "",
      });
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

  const savePlan = async () => {
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

      window.location.href = `/plan/${planId}`;
    } catch (err: any) {
      alert("Feil ved lagring av plan: " + err.message);
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
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {date.toLocaleDateString("en-US", {
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
          onClick={savePlan}
          disabled={loading}
          className="flex-1 rounded-2xl bg-green-600 py-4 font-bold text-white shadow-lg shadow-green-100 transition-colors hover:bg-green-700 disabled:opacity-50"
        >
          {loading
            ? "Lagrer plan..."
            : initialData
              ? "Oppdater ukeplan"
              : "Opprett ukeplan"}
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
};
