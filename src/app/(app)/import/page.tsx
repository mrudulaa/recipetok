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

  const macros = [
    { key: "calories", label: "Cal", unit: "kcal", color: "#E8773A", value: totals.calories, goal: goals?.daily_calories || 2000 },
    { key: "protein", label: "Protein", unit: "g", color: "#5CB87A", value: totals.protein, goal: goals?.daily_protein || 150 },
    { key: "carbs", label: "Carbs", unit: "g", color: "#E8B73A", value: totals.carbs, goal: goals?.daily_carbs || 200 },
    { key: "fat", label: "Fat", unit: "g", color: "#7A8EE8", value: totals.fat, goal: goals?.daily_fat || 65 },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-primary)",
      paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Ambient glows */}
      <div style={{
        position: "fixed", top: "-100px", right: "-100px", width: "500px", height: "500px",
        background: "radial-gradient(circle, rgba(232,119,58,0.1) 0%, transparent 65%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "480px", margin: "0 auto", padding: "20px 16px 0" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "4px" }}>
            {today}
          </p>
          <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-primary)", lineHeight: 1.15 }}>
            {greeting} 👋
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            {goals ? "Here's your macro progress today." : "Paste a TikTok link to extract a recipe."}
          </p>
        </div>

        {/* Macro Dashboard */}
        {goals && (
          <div style={{
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "20px",
            padding: "18px",
            marginBottom: "20px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                Today's Macros
              </span>
              <a href="/profile" style={{ fontSize: "12px", color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>
                Edit goals →
              </a>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {macros.map((m) => {
                const pct = Math.min((m.value / m.goal) * 100, 100);
                const over = m.value > m.goal;
                return (
                  <div key={m.key} style={{
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: "14px",
                    padding: "12px",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>{m.label}</span>
                      <span style={{ fontSize: "10px", color: over ? "#E85A3A" : "var(--text-muted)" }}>
                        /{m.goal}{m.unit}
                      </span>
                    </div>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: m.color, letterSpacing: "-0.02em", marginBottom: "8px" }}>
                      {Math.round(m.value)}
                      <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--text-muted)", marginLeft: "2px" }}>{m.unit}</span>
                    </div>
                    <div style={{ height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: "2px", width: `${pct}%`, background: m.color, transition: "width 0.8s ease" }} />
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
              background: "rgba(232,119,58,0.08)",
              border: "1px solid rgba(232,119,58,0.2)",
              borderRadius: "16px",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              cursor: "pointer",
            }}>
              <div style={{
                width: "42px", height: "42px", borderRadius: "12px",
                background: "rgba(232,119,58,0.15)", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "20px", flexShrink: 0,
              }}>🎯</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "14px" }}>Set your macro goals</p>
                <p style={{ color: "var(--text-secondary)", fontSize: "12px", marginTop: "2px" }}>Track calories, protein, carbs & fat</p>
              </div>
              <span style={{ color: "var(--accent)", fontSize: "16px" }}>→</span>
            </div>
          </a>
        )}

        {/* Import Section */}
        <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "10px" }}>
          Import from TikTok
        </p>
        <div style={{
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "20px",
          padding: "18px",
          marginBottom: "16px",
        }}>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "14px", lineHeight: 1.5 }}>
            Paste any TikTok cooking video URL. AI extracts the full recipe, calculates macros, and suggests goal-aware ingredient swaps.
          </p>
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
              background: "rgba(232,90,58,0.1)", border: "1px solid rgba(232,90,58,0.2)",
              borderRadius: "10px", padding: "10px 14px", marginBottom: "12px",
              fontSize: "13px", color: "#F09080",
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

        {/* Steps */}
        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { icon: "📱", text: "Copy link in TikTok" },
            { icon: "🤖", text: "AI parses recipe" },
            { icon: "💪", text: "Get macros + swaps" },
          ].map((step, i) => (
            <div key={i} style={{
              flex: 1,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: "12px",
              padding: "12px 8px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "18px", marginBottom: "5px" }}>{step.icon}</div>
              <p style={{ fontSize: "10px", color: "var(--text-muted)", lineHeight: 1.3 }}>{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
