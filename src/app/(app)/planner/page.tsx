"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MEALS = ["breakfast", "lunch", "dinner"] as const;
const MEAL_ICONS: Record<string, string> = { breakfast: "🌅", lunch: "☀️", dinner: "🌙" };

function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

function getTodayIndex() {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1; // Mon=0 ... Sun=6
}

export default function PlannerPage() {
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(getTodayIndex());
  const [picker, setPicker] = useState<{ day: number; meal: string } | null>(null);
  const [swapPicker, setSwapPicker] = useState<{ day: number; meal: string; currentCalories: number; currentProtein: number } | null>(null);
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
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
    await fetch("/api/grocery/generate", { method: "POST", headers, body: JSON.stringify({ mealPlanId: mealPlan.id }) });
    setGenerating(false);
    window.location.href = "/grocery";
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", color: "#9B9B9B", fontSize: "14px" }}>Loading...</div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.03em", color: "#1A1A1A", lineHeight: 1.1 }}>
              This Week
            </h1>
            <p style={{ color: "#9B9B9B", fontSize: "14px", marginTop: "4px" }}>
              {entries.length} meal{entries.length !== 1 ? "s" : ""} planned
            </p>
          </div>
          <button
            onClick={generateGrocery}
            disabled={generating || entries.length === 0}
            style={{
              background: "#1A1A1A", color: "white", fontWeight: 700,
              padding: "11px 16px", borderRadius: "12px", border: "none",
              fontSize: "14px", cursor: entries.length === 0 ? "not-allowed" : "pointer",
              opacity: entries.length === 0 ? 0.35 : 1,
              display: "flex", alignItems: "center", gap: "6px",
              fontFamily: "Inter, sans-serif", marginTop: "4px",
            }}
          >
            {generating ? "..." : "Grocery List"}
          </button>
        </div>

        {/* Day pill selector */}
        <div style={{
          display: "flex", gap: "6px", padding: "16px 20px 0",
          overflowX: "auto", scrollbarWidth: "none",
        }}>
          {DAYS.map((day, idx) => {
            const active = idx === selectedDay;
            const hasEntries = MEALS.some((m) => getEntry(idx, m));
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(idx)}
                style={{
                  flexShrink: 0, padding: "8px 14px", borderRadius: "100px",
                  border: `1.5px solid ${active ? "#1A1A1A" : "#E8E8E8"}`,
                  background: active ? "#1A1A1A" : "white",
                  color: active ? "white" : "#1A1A1A",
                  fontWeight: active ? 700 : 500, fontSize: "14px",
                  cursor: "pointer", fontFamily: "Inter, sans-serif",
                  position: "relative",
                }}
              >
                {day}
                {hasEntries && !active && (
                  <span style={{
                    position: "absolute", top: "4px", right: "4px",
                    width: "5px", height: "5px", borderRadius: "50%",
                    background: "#3D7A5F",
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Day meals */}
        <div style={{ padding: "20px 20px 0" }}>
          {MEALS.map((meal) => {
            const entry = getEntry(selectedDay, meal);
            return (
              <div key={meal} style={{ marginBottom: "24px" }}>
                {/* Meal type header */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <span style={{ fontSize: "18px" }}>{MEAL_ICONS[meal]}</span>
                  <span style={{ fontSize: "16px", fontWeight: 700, color: "#1A1A1A", textTransform: "capitalize" }}>{meal}</span>
                </div>

                {entry?.recipes ? (
                  /* Filled meal card */
                  <div style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    background: "white", border: "1px solid #E8E8E8",
                    borderRadius: "14px", padding: "12px 14px",
                  }}>
                    {entry.recipes.thumbnail_url && (
                      <img
                        src={entry.recipes.thumbnail_url}
                        alt=""
                        style={{ width: "56px", height: "56px", borderRadius: "10px", objectFit: "cover", flexShrink: 0 }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "15px", fontWeight: 600, color: "#1A1A1A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {entry.recipes.title}
                      </p>
                      <p style={{ fontSize: "13px", color: "#9B9B9B", marginTop: "2px" }}>
                        {entry.recipes.total_calories} cal · {entry.recipes.total_protein_g}g P
                      </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", flexShrink: 0 }}>
                      {/* Swap button */}
                      <button
                        onClick={() => setSwapPicker({ day: selectedDay, meal, currentCalories: entry.recipes.total_calories || 0, currentProtein: entry.recipes.total_protein_g || 0 })}
                        style={{
                          width: "28px", height: "28px", borderRadius: "8px",
                          background: "#EEF5F1", border: "none", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                        title="Swap meal"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2E7D52" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                          <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                        </svg>
                      </button>
                      {/* Remove button */}
                      <button
                        onClick={() => removeEntry(selectedDay, meal)}
                        style={{
                          color: "#BBBBBB", fontSize: "18px", background: "none", border: "none",
                          cursor: "pointer", lineHeight: 1, padding: "4px",
                          fontFamily: "Inter, sans-serif", width: "28px", height: "28px",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >×</button>
                    </div>
                  </div>
                ) : (
                  /* Empty meal slot */
                  <button
                    onClick={() => setPicker({ day: selectedDay, meal })}
                    style={{
                      width: "100%", background: "white",
                      border: "1.5px dashed #E8E8E8", borderRadius: "14px",
                      padding: "16px", cursor: "pointer", fontFamily: "Inter, sans-serif",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                      color: "#9B9B9B", fontSize: "14px",
                    }}
                  >
                    <span style={{ fontSize: "18px", color: "#BBBBBB" }}>+</span>
                    Add {meal}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Swap Meal Modal */}
      {swapPicker && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={() => setSwapPicker(null)}
        >
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
          <div
            style={{
              position: "relative", background: "white", borderRadius: "24px 24px 0 0",
              width: "100%", maxWidth: "480px", padding: "20px 20px 40px",
              maxHeight: "70vh", display: "flex", flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: "36px", height: "4px", background: "#E8E8E8", borderRadius: "2px", margin: "0 auto 20px" }} />
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#1A1A1A", marginBottom: "4px", letterSpacing: "-0.02em" }}>
              Swap Meal
            </h3>
            <p style={{ fontSize: "13px", color: "#9B9B9B", marginBottom: "16px" }}>
              Current: {swapPicker.currentCalories} cal · {swapPicker.currentProtein}g P — showing similar options
            </p>
            {recipes.length === 0 ? (
              <p style={{ fontSize: "14px", color: "#9B9B9B", textAlign: "center", padding: "32px 0" }}>No other recipes in your library.</p>
            ) : (
              <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                {recipes
                  .filter((r) => {
                    const entry = getEntry(swapPicker.day, swapPicker.meal);
                    return r.id !== entry?.recipes?.id; // exclude current recipe
                  })
                  .sort((a, b) => {
                    // Sort by closest calorie match
                    const diffA = Math.abs((a.total_calories || 0) - swapPicker.currentCalories);
                    const diffB = Math.abs((b.total_calories || 0) - swapPicker.currentCalories);
                    return diffA - diffB;
                  })
                  .map((r) => {
                    const calDiff = (r.total_calories || 0) - swapPicker.currentCalories;
                    const proteinDiff = (r.total_protein_g || 0) - swapPicker.currentProtein;
                    return (
                      <button
                        key={r.id}
                        onClick={() => { assignRecipe(r.id); setSwapPicker(null); }}
                        style={{
                          width: "100%", textAlign: "left", background: "white",
                          border: "1px solid #E8E8E8", borderRadius: "14px",
                          padding: "12px 14px", cursor: "pointer", fontFamily: "Inter, sans-serif",
                          display: "flex", alignItems: "center", gap: "12px",
                        }}
                      >
                        {r.thumbnail_url && (
                          <img src={r.thumbnail_url} alt="" style={{ width: "44px", height: "44px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "14px", fontWeight: 600, color: "#1A1A1A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</p>
                          <p style={{ fontSize: "12px", color: "#9B9B9B", marginTop: "2px" }}>{r.total_calories} cal · {r.total_protein_g}g P</p>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <p style={{ fontSize: "11px", color: calDiff > 0 ? "#C0392B" : "#2E7D52", fontWeight: 600 }}>
                            {calDiff > 0 ? "+" : ""}{calDiff} cal
                          </p>
                          <p style={{ fontSize: "11px", color: proteinDiff > 0 ? "#2E7D52" : "#C0392B", fontWeight: 600 }}>
                            {proteinDiff > 0 ? "+" : ""}{proteinDiff}g P
                          </p>
                        </div>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recipe Picker Modal */}
      {picker && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={() => setPicker(null)}
        >
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
          <div
            style={{
              position: "relative", background: "white", borderRadius: "24px 24px 0 0",
              width: "100%", maxWidth: "480px", padding: "20px 20px 40px",
              maxHeight: "70vh", display: "flex", flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: "36px", height: "4px", background: "#E8E8E8", borderRadius: "2px", margin: "0 auto 20px" }} />
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#1A1A1A", marginBottom: "16px", letterSpacing: "-0.02em" }}>
              {MEAL_ICONS[picker.meal]} {DAYS[picker.day]} — {picker.meal.charAt(0).toUpperCase() + picker.meal.slice(1)}
            </h3>
            {recipes.length === 0 ? (
              <p style={{ fontSize: "14px", color: "#9B9B9B", textAlign: "center", padding: "32px 0" }}>No recipes yet. Import one first!</p>
            ) : (
              <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                {recipes.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => assignRecipe(r.id)}
                    style={{
                      width: "100%", textAlign: "left", background: "white",
                      border: "1px solid #E8E8E8", borderRadius: "14px",
                      padding: "12px 14px", cursor: "pointer", fontFamily: "Inter, sans-serif",
                      display: "flex", alignItems: "center", gap: "12px",
                    }}
                  >
                    {r.thumbnail_url && (
                      <img src={r.thumbnail_url} alt="" style={{ width: "44px", height: "44px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }} />
                    )}
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
