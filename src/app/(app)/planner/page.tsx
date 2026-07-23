"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MEALS = ["breakfast", "lunch", "dinner"] as const;
const MEAL_LABELS: Record<string, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" };
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
    let { data: plan } = await supabase.from("meal_plans").select("*").eq("user_id", user.id).eq("week_start", weekStart).single();
    if (!plan) {
      const { data: newPlan } = await supabase.from("meal_plans").insert({ user_id: user.id, week_start: weekStart }).select().single();
      plan = newPlan;
    }
    setMealPlan(plan);
    const [{ data: planEntries }, { data: userRecipes }] = await Promise.all([
      supabase.from("meal_plan_entries").select("*, recipes(id, title, total_calories, total_protein_g, thumbnail_url)").eq("meal_plan_id", plan.id),
      supabase.from("recipes").select("id, title, total_calories, total_protein_g, thumbnail_url").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setEntries(planEntries || []);
    setRecipes(userRecipes || []);
    setLoading(false);
  }, [weekStart]);

  useEffect(() => { load(); }, [load]);

  const getEntry = (day: number, meal: string) => entries.find((e) => e.day_of_week === day && e.meal_type === meal);

  const assignRecipe = async (recipeId: string) => {
    if (!picker || !mealPlan) return;
    const existing = getEntry(picker.day, picker.meal);
    if (existing) {
      await supabase.from("meal_plan_entries").update({ recipe_id: recipeId }).eq("id", existing.id);
    } else {
      await supabase.from("meal_plan_entries").insert({ meal_plan_id: mealPlan.id, recipe_id: recipeId, day_of_week: picker.day, meal_type: picker.meal, servings: 1 });
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
    await fetch("/api/grocery/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mealPlanId: mealPlan.id }) });
    setGenerating(false);
    window.location.href = "/grocery";
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", color: "#9B9B9B", fontSize: "14px" }}>
      Loading...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ padding: "20px 20px 16px", background: "white", borderBottom: "1px solid #F2F2F2", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.03em", color: "#1A1A1A", lineHeight: 1.1 }}>
                This Week
              </h1>
              <p style={{ color: "#9B9B9B", fontSize: "13px", marginTop: "3px" }}>
                {entries.length} meal{entries.length !== 1 ? "s" : ""} planned
              </p>
            </div>
            <button
              onClick={generateGrocery}
              disabled={generating || entries.length === 0}
              style={{
                background: "#1A1A1A", color: "white", fontWeight: 700,
                padding: "9px 14px", borderRadius: "10px", border: "none",
                fontSize: "13px", cursor: entries.length === 0 ? "not-allowed" : "pointer",
                opacity: entries.length === 0 ? 0.35 : 1,
                display: "flex", alignItems: "center", gap: "6px",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {generating ? "..." : "🛒 Grocery list"}
            </button>
          </div>
        </div>

        {/* Week grid */}
        <div style={{ padding: "12px 16px 0", display: "flex", flexDirection: "column", gap: "10px" }}>
          {DAYS.map((day, dayIdx) => (
            <div key={day} style={{ background: "white", border: "1px solid #E8E8E8", borderRadius: "16px", overflow: "hidden" }}>
              <div style={{ padding: "10px 16px", background: "#F5F5F5", borderBottom: "1px solid #F2F2F2" }}>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#1A1A1A", letterSpacing: "-0.01em" }}>{day}</p>
              </div>
              <div>
                {MEALS.map((meal, mealIdx) => {
                  const entry = getEntry(dayIdx, meal);
                  return (
                    <div key={meal} style={{
                      padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px",
                      borderTop: mealIdx > 0 ? "1px solid #F2F2F2" : "none",
                    }}>
                      <span style={{ fontSize: "15px", width: "20px", textAlign: "center", flexShrink: 0 }}>{MEAL_ICONS[meal]}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {entry?.recipes ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {entry.recipes.thumbnail_url && (
                              <img src={entry.recipes.thumbnail_url} alt="" style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }} />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: "13px", fontWeight: 600, color: "#1A1A1A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {entry.recipes.title}
                              </p>
                              <p style={{ fontSize: "11px", color: "#9B9B9B", marginTop: "1px" }}>
                                {entry.recipes.total_calories} cal · {entry.recipes.total_protein_g}g P
                              </p>
                            </div>
                            <button onClick={() => removeEntry(dayIdx, meal)} style={{ color: "#BBBBBB", fontSize: "18px", background: "none", border: "none", cursor: "pointer", flexShrink: 0, lineHeight: 1, padding: "4px" }}>×</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setPicker({ day: dayIdx, meal })}
                            style={{ fontSize: "13px", color: "#9B9B9B", background: "none", border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif", padding: 0, display: "flex", alignItems: "center", gap: "4px" }}
                          >
                            <span style={{ fontSize: "14px", color: "#BBBBBB" }}>+</span>
                            Add {MEAL_LABELS[meal].toLowerCase()}
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
      </div>

      {/* Recipe Picker Modal */}
      {picker && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setPicker(null)}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }} />
          <div style={{
            position: "relative", background: "white", borderRadius: "24px 24px 0 0",
            width: "100%", maxWidth: "480px", padding: "20px 20px 40px",
            maxHeight: "70vh", display: "flex", flexDirection: "column",
            boxShadow: "0 -8px 32px rgba(0,0,0,0.1)",
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: "36px", height: "4px", background: "#E8E8E8", borderRadius: "2px", margin: "0 auto 20px" }} />
            <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#1A1A1A", marginBottom: "16px" }}>
              {MEAL_ICONS[picker.meal]} {DAYS[picker.day]} — {MEAL_LABELS[picker.meal]}
            </h3>
            {recipes.length === 0 ? (
              <p style={{ fontSize: "14px", color: "#9B9B9B", textAlign: "center", padding: "32px 0" }}>No recipes yet. Import one first!</p>
            ) : (
              <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                {recipes.map((r) => (
                  <button key={r.id} onClick={() => assignRecipe(r.id)} style={{
                    width: "100%", textAlign: "left", background: "#F5F5F5",
                    border: "1px solid #E8E8E8", borderRadius: "14px",
                    padding: "12px 14px", cursor: "pointer", fontFamily: "Inter, sans-serif",
                    display: "flex", alignItems: "center", gap: "12px",
                  }}>
                    {r.thumbnail_url && <img src={r.thumbnail_url} alt="" style={{ width: "44px", height: "44px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }} />}
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "#1A1A1A" }}>{r.title}</p>
                      <p style={{ fontSize: "12px", color: "#9B9B9B", marginTop: "2px" }}>{r.total_calories} cal · {r.total_protein_g}g protein</p>
                    </div>
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
