"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MEALS = ["breakfast", "lunch", "dinner"] as const;
const MEAL_ICONS: Record<string, string> = { breakfast: "🌅", lunch: "☀️", dinner: "🌙" };

function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

export default function PlannerPage() {
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [picker, setPicker] = useState<{ day: number; meal: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const weekStart = getWeekStart();
  const supabase = createClient();

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get or create meal plan for this week
    let { data: plan } = await supabase
      .from("meal_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("week_start", weekStart)
      .single();

    if (!plan) {
      const { data: newPlan } = await supabase
        .from("meal_plans")
        .insert({ user_id: user.id, week_start: weekStart })
        .select()
        .single();
      plan = newPlan;
    }

    setMealPlan(plan);

    const [{ data: planEntries }, { data: userRecipes }] = await Promise.all([
      supabase.from("meal_plan_entries")
        .select("*, recipes(id, title, total_calories, total_protein_g)")
        .eq("meal_plan_id", plan.id),
      supabase.from("recipes")
        .select("id, title, total_calories, total_protein_g")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    setEntries(planEntries || []);
    setRecipes(userRecipes || []);
    setLoading(false);
  }, [weekStart]);

  useEffect(() => { load(); }, [load]);

  const getEntry = (day: number, meal: string) =>
    entries.find((e) => e.day_of_week === day && e.meal_type === meal);

  const assignRecipe = async (recipeId: string) => {
    if (!picker || !mealPlan) return;
    const existing = getEntry(picker.day, picker.meal);

    if (existing) {
      await supabase.from("meal_plan_entries").update({ recipe_id: recipeId }).eq("id", existing.id);
    } else {
      await supabase.from("meal_plan_entries").insert({
        meal_plan_id: mealPlan.id,
        recipe_id: recipeId,
        day_of_week: picker.day,
        meal_type: picker.meal,
        servings: 1,
      });
    }
    setPicker(null);
    load();
  };

  const removeEntry = async (day: number, meal: string) => {
    const entry = getEntry(day, meal);
    if (!entry) return;
    await supabase.from("meal_plan_entries").delete().eq("id", entry.id);
    load();
  };

  const generateGrocery = async () => {
    if (!mealPlan) return;
    setGenerating(true);
    await fetch("/api/grocery/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mealPlanId: mealPlan.id }),
    });
    setGenerating(false);
    window.location.href = "/grocery";
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading...</div>;

  return (
    <div className="px-4 pt-12 pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">This Week</h1>
        <button
          onClick={generateGrocery}
          disabled={generating || entries.length === 0}
          className="text-xs bg-orange-500 text-white font-semibold px-3 py-2 rounded-xl disabled:opacity-40 active:scale-95 transition-transform"
        >
          {generating ? "..." : "🛒 Grocery list"}
        </button>
      </div>

      <div className="space-y-4">
        {DAYS.map((day, dayIdx) => (
          <div key={day} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <p className="text-sm font-bold text-gray-700">{day}</p>
            </div>
            <div className="divide-y divide-gray-50">
              {MEALS.map((meal) => {
                const entry = getEntry(dayIdx, meal);
                return (
                  <div key={meal} className="px-4 py-2.5 flex items-center gap-3">
                    <span className="text-base w-5 text-center">{MEAL_ICONS[meal]}</span>
                    <div className="flex-1 min-w-0">
                      {entry?.recipes ? (
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">{entry.recipes.title}</p>
                            <p className="text-xs text-gray-400">{entry.recipes.total_calories} cal · {entry.recipes.total_protein_g}g P</p>
                          </div>
                          <button onClick={() => removeEntry(dayIdx, meal)} className="text-gray-300 text-lg ml-2 flex-shrink-0">×</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setPicker({ day: dayIdx, meal })}
                          className="text-xs text-gray-400 hover:text-orange-500 transition-colors"
                        >
                          + Add {meal}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Recipe Picker Modal */}
      {picker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setPicker(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-t-3xl w-full max-w-md p-5 pb-8 max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <h3 className="text-base font-bold text-gray-900 mb-4">
              {MEAL_ICONS[picker.meal]} {DAYS[picker.day]} {picker.meal}
            </h3>
            {recipes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No recipes yet. Import one first!</p>
            ) : (
              <div className="overflow-y-auto space-y-2">
                {recipes.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => assignRecipe(r.id)}
                    className="w-full text-left bg-gray-50 hover:bg-orange-50 border border-gray-100 rounded-xl px-4 py-3 transition-colors"
                  >
                    <p className="text-sm font-semibold text-gray-900">{r.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.total_calories} cal · {r.total_protein_g}g protein</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
