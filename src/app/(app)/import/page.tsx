"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface Goals {
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fat: number;
}

interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function ImportPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [goals, setGoals] = useState<Goals | null>(null);
  const [totals, setTotals] = useState<DailyTotals>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [session, setSession] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (!session) return;
      const { data: g } = await supabase.from("user_goals").select("*").eq("user_id", session.user.id).single();
      if (g) setGoals(g);
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/food/log?date=${today}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTotals(data.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 });
      }
    };
    load();
  }, []);

  const handleExtract = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Extraction failed");
      router.push(`/recipes/${data.recipeId}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const macros = [
    { key: "calories", label: "Calories", unit: "kcal", color: "#D4522A", bg: "#FEF2EE", value: totals.calories, goal: goals?.daily_calories || 2000 },
    { key: "protein", label: "Protein", unit: "g", color: "#4A7C59", bg: "#EEF5F1", value: totals.protein, goal: goals?.daily_protein || 150 },
    { key: "carbs", label: "Carbs", unit: "g", color: "#B8860B", bg: "#FDF8EC", value: totals.carbs, goal: goals?.daily_carbs || 200 },
    { key: "fat", label: "Fat", unit: "g", color: "#5B6FA8", bg: "#EEF0F8", value: totals.fat, goal: goals?.daily_fat || 65 },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#FAF8F4",
      paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
    }}>
      {/* Warm gradient header band */}
      <div style={{
        background: "linear-gradient(180deg, #F5EDE0 0%, #FAF8F4 100%)",
        padding: "20px 20px 24px",
        marginBottom: "4px",
      }}>
        <p style={{ fontSize: "12px", color: "#A89880", fontWeight: 500, marginBottom: "6px" }}>
          {today}
        </p>
        <h1 className="serif" style={{
          fontSize: "34px", fontWeight: 400, letterSpacing: "-0.02em",
          color: "#1A1612", lineHeight: 1.1, marginBottom: "4px",
        }}>
          {greeting} 👋
        </h1>
        <p style={{ color: "#6B5E52", fontSize: "14px" }}>
          {goals ? "Here's your macro progress today." : "Paste a TikTok link to extract a recipe."}
        </p>
      </div>

      <div style={{ padding: "0 16px", maxWidth: "480px", margin: "0 auto" }}>

        {/* Macro Dashboard */}
        {goals && (
          <div style={{
            background: "white",
            border: "1px solid #E8E3D8",
            borderRadius: "20px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(26,22,18,0.05)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span className="section-label">Today's Macros</span>
              <a href="/profile" style={{ fontSize: "12px", color: "#D4522A", textDecoration: "none", fontWeight: 500 }}>
                Edit goals →
              </a>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {macros.map((m) => {
                const pct = Math.min((m.value / m.goal) * 100, 100);
                const over = m.value > m.goal;
                return (
                  <div key={m.key} style={{
                    background: m.bg,
                    borderRadius: "14px",
                    padding: "14px",
                    border: `1px solid ${m.color}18`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "11px", color: "#6B5E52", fontWeight: 500 }}>{m.label}</span>
                      <span style={{ fontSize: "10px", color: over ? "#C0392B" : "#A89880" }}>
                        /{m.goal}{m.unit}
                      </span>
                    </div>
                    <div style={{ fontSize: "22px", fontWeight: 700, color: m.color, letterSpacing: "-0.02em", marginBottom: "8px", fontFamily: "Inter, sans-serif" }}>
                      {Math.round(m.value)}
                      <span style={{ fontSize: "11px", fontWeight: 400, color: "#A89880", marginLeft: "2px" }}>{m.unit}</span>
                    </div>
                    <div className="macro-bar">
                      <div className="macro-bar-fill" style={{ width: `${pct}%`, background: m.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Set Goals CTA */}
        {!goals && (
          <a href="/profile" style={{ textDecoration: "none", display: "block", marginBottom: "20px" }}>
            <div style={{
              background: "white",
              border: "1.5px dashed #D4522A",
              borderRadius: "16px",
              padding: "18px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(26,22,18,0.04)",
            }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "12px",
                background: "#FEF2EE", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "20px", flexShrink: 0,
              }}>🎯</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, color: "#1A1612", fontSize: "14px" }}>Set your macro goals</p>
                <p style={{ color: "#A89880", fontSize: "12px", marginTop: "2px" }}>Track calories, protein, carbs & fat daily</p>
              </div>
              <span style={{ color: "#D4522A", fontSize: "18px" }}>→</span>
            </div>
          </a>
        )}

        {/* Import Section */}
        <div style={{
          background: "white",
          border: "1px solid #E8E3D8",
          borderRadius: "20px",
          padding: "20px",
          marginBottom: "16px",
          boxShadow: "0 2px 8px rgba(26,22,18,0.05)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "#FEF2EE", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px",
            }}>📱</div>
            <div>
              <p style={{ fontWeight: 600, color: "#1A1612", fontSize: "15px" }}>Import from TikTok</p>
              <p style={{ color: "#A89880", fontSize: "12px" }}>Paste a cooking video link below</p>
            </div>
          </div>

          <input
            className="input-field"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.tiktok.com/@creator/video/..."
            onKeyDown={(e) => e.key === "Enter" && handleExtract()}
            style={{ marginBottom: "12px" }}
          />

          {error && (
            <div style={{
              background: "#FEF2EE", border: "1px solid rgba(212,82,42,0.2)",
              borderRadius: "10px", padding: "10px 14px", marginBottom: "12px",
              fontSize: "13px", color: "#C0392B",
            }}>
              {error}
            </div>
          )}

          <button
            className="btn-primary"
            onClick={handleExtract}
            disabled={loading || !url.trim()}
            style={{ width: "100%" }}
          >
            {loading ? (
              <>
                <svg style={{ animation: "spin 1s linear infinite" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Extracting recipe...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                Extract Recipe
              </>
            )}
          </button>
        </div>

        {/* How it works */}
        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { icon: "📱", text: "Copy link in TikTok" },
            { icon: "🤖", text: "AI parses recipe" },
            { icon: "💪", text: "Get macros + swaps" },
          ].map((step, i) => (
            <div key={i} style={{
              flex: 1,
              background: "white",
              border: "1px solid #E8E3D8",
              borderRadius: "14px",
              padding: "14px 8px",
              textAlign: "center",
              boxShadow: "0 1px 4px rgba(26,22,18,0.04)",
            }}>
              <div style={{ fontSize: "20px", marginBottom: "6px" }}>{step.icon}</div>
              <p style={{ fontSize: "11px", color: "#6B5E52", lineHeight: 1.4, fontWeight: 500 }}>{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
