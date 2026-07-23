"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

export default function AIPlannerPage() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [lockedSlots, setLockedSlots] = useState<Record<string, string>>({}); // "dayIdx_mealType" -> recipeId
  const [lockedRecipes, setLockedRecipes] = useState<Record<string, any>>({}); // recipeId -> recipe
  const [generating, setGenerating] = useState(false);
  const [picker, setPicker] = useState<{ key: string } | null>(null);
  const [error, setError] = useState("");
  const supabase = createClient();
  const router = useRouter();
  const weekStart = getWeekStart();

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userRecipes } = await supabase
      .from("recipes")
      .select("id, title, total_calories, total_protein_g, thumbnail_url")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setRecipes(userRecipes || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  function toggleLock(dayIdx: number, meal: string) {
    const key = `${dayIdx}_${meal}`;
    if (lockedSlots[key]) {
      const newLocked = { ...lockedSlots };
      delete newLocked[key];
      setLockedSlots(newLocked);
    } else {
      setPicker({ key });
    }
  }

  function assignLock(key: string, recipeId: string) {
    const recipe = recipes.find((r) => r.id === recipeId);
    setLockedSlots({ ...lockedSlots, [key]: recipeId });
    setLockedRecipes({ ...lockedRecipes, [recipeId]: recipe });
    setPicker(null);
  }

  async function generatePlan() {
    setGenerating(true);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/ai-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ lockedSlots, weekStart }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate plan");
      router.push("/planner");
    } catch (err: any) {
      setError(err.message || "Failed to generate plan");
    } finally {
      setGenerating(false);
    }
  }

  const lockedCount = Object.keys(lockedSlots).length;

  return (
    <div style={{ background: "#ffffff", minHeight: "100vh", paddingBottom: "40px" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px 8px" }}>
          <Link href="/planner" style={{
            width: "36px", height: "36px", borderRadius: "50%", background: "#F5F5F5",
            display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </Link>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "17px", fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.02em" }}>AI Week Planner</p>
            <p style={{ fontSize: "12px", color: "#3D7A5F", marginTop: "1px" }}>Lock meals, AI fills the rest</p>
          </div>
        </div>

        <div style={{ padding: "8px 20px 0" }}>
          <p style={{ fontSize: "13px", color: "#9B9B9B", lineHeight: 1.5, marginBottom: "20px" }}>
            Lock any meals you want to keep, then tap "Generate Week Plan" and the AI will fill in the rest to hit your macro targets.
          </p>

          {error && (
            <div style={{ background: "#FDF2F1", border: "1px solid #F5C6C2", borderRadius: "12px", padding: "12px 16px", marginBottom: "16px" }}>
              <p style={{ fontSize: "13px", color: "#C0392B" }}>{error}</p>
            </div>
          )}

          {/* Week grid */}
          {DAYS.map((day, dayIdx) => (
            <div key={day} style={{ marginBottom: "20px" }}>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#1A1A1A", marginBottom: "8px" }}>{day}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {MEALS.map((meal) => {
                  const key = `${dayIdx}_${meal}`;
                  const isLocked = !!lockedSlots[key];
                  const recipe = isLocked ? lockedRecipes[lockedSlots[key]] : null;
                  return (
                    <div key={meal} style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      background: isLocked ? "#F0F7F4" : "#FAFAFA",
                      border: `1px solid ${isLocked ? "#C8E6D8" : "#E8E8E8"}`,
                      borderRadius: "12px", padding: "10px 12px",
                    }}>
                      <span style={{ fontSize: "16px", flexShrink: 0 }}>{MEAL_ICONS[meal]}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {isLocked && recipe ? (
                          <>
                            <p style={{ fontSize: "13px", fontWeight: 600, color: "#1A1A1A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{recipe.title}</p>
                            <p style={{ fontSize: "11px", color: "#3D7A5F", marginTop: "1px" }}>🔒 Locked</p>
                          </>
                        ) : (
                          <p style={{ fontSize: "13px", color: "#9B9B9B", fontStyle: "italic" }}>✦ AI will fill</p>
                        )}
                      </div>
                      <button
                        onClick={() => toggleLock(dayIdx, meal)}
                        style={{
                          flexShrink: 0, padding: "5px 10px", borderRadius: "8px",
                          background: isLocked ? "white" : "#1A1A1A",
                          color: isLocked ? "#C0392B" : "white",
                          border: isLocked ? "1px solid #E8E8E8" : "none",
                          fontSize: "12px", fontWeight: 600, cursor: "pointer",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        {isLocked ? "Unlock" : "Lock"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Generate button */}
          <button
            onClick={generatePlan}
            disabled={generating || recipes.length === 0}
            style={{
              width: "100%", background: generating ? "#555" : "#1A1A1A", color: "white",
              fontWeight: 800, fontSize: "16px", padding: "16px 24px",
              borderRadius: "14px", border: "none", cursor: generating || recipes.length === 0 ? "not-allowed" : "pointer",
              fontFamily: "Inter, sans-serif", letterSpacing: "-0.01em",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              opacity: recipes.length === 0 ? 0.4 : 1,
            }}
          >
            <span>✦</span>
            {generating ? "Generating your plan..." : `Generate Week Plan${lockedCount > 0 ? ` (${lockedCount} locked)` : ""}`}
          </button>
          {recipes.length === 0 && (
            <p style={{ fontSize: "13px", color: "#9B9B9B", textAlign: "center", marginTop: "8px" }}>
              Import some recipes first to generate a plan.
            </p>
          )}
        </div>
      </div>

      {/* Recipe picker modal */}
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
              Lock a recipe
            </h3>
            <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
              {recipes.map((r) => (
                <button
                  key={r.id}
                  onClick={() => assignLock(picker.key, r.id)}
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
                    <p style={{ fontSize: "12px", color: "#9B9B9B", marginTop: "2px" }}>{r.total_calories} cal · {r.total_protein_g}g P</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
