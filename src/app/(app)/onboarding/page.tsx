"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

const PRESETS = [
  { value: "high_protein", label: "High Protein", desc: "Build muscle, stay full longer", icon: "💪", calories: 2200, protein: 160, carbs: 220, fat: 65 },
  { value: "low_carb", label: "Low Carb", desc: "Reduce carbs, burn fat", icon: "🥑", calories: 1800, protein: 140, carbs: 80, fat: 90 },
  { value: "balanced", label: "Balanced", desc: "Healthy, well-rounded eating", icon: "⚖️", calories: 2000, protein: 100, carbs: 250, fat: 65 },
  { value: "weight_loss", label: "Weight Loss", desc: "Calorie deficit, lean meals", icon: "🎯", calories: 1500, protein: 120, carbs: 150, fat: 50 },
];

export default function OnboardingPage() {
  const [selected, setSelected] = useState("high_protein");
  const [calories, setCalories] = useState(2200);
  const [protein, setProtein] = useState(160);
  const [carbs, setCarbs] = useState(220);
  const [fat, setFat] = useState(65);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const p = PRESETS.find((x) => x.value === selected);
    if (p) { setCalories(p.calories); setProtein(p.protein); setCarbs(p.carbs); setFat(p.fat); }
  }, [selected]);

  const save = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    await supabase.from("user_goals").upsert({
      user_id: user.id, goal_type: selected,
      daily_calories: calories, daily_protein: protein, daily_carbs: carbs, daily_fat: fat,
    }, { onConflict: "user_id" });
    setSaving(false);
    router.push("/home");
  };

  const fields = [
    { label: "Calories", value: calories, set: setCalories, unit: "kcal", color: "#C0392B", bg: "#FDF2F1", min: 1000, max: 4000, step: 50 },
    { label: "Protein", value: protein, set: setProtein, unit: "g", color: "#2E7D52", bg: "#EEF5F1", min: 50, max: 300, step: 5 },
    { label: "Carbs", value: carbs, set: setCarbs, unit: "g", color: "#8B6914", bg: "#FDF8EE", min: 50, max: 500, step: 5 },
    { label: "Fat", value: fat, set: setFat, unit: "g", color: "#3D5A8A", bg: "#EEF1F8", min: 20, max: 200, step: 5 },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 16px" }}>

        <div style={{ paddingTop: "20px", paddingBottom: "8px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.03em", color: "#1A1A1A", lineHeight: 1.1, marginBottom: "6px" }}>
            Set your goals
          </h1>
          <p style={{ fontSize: "14px", color: "#9B9B9B" }}>
            We&apos;ll use these to suggest smarter ingredient swaps.
          </p>
        </div>

        {/* Goal type */}
        <div style={{ marginTop: "20px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>
            Goal Type
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {PRESETS.map((p) => {
              const active = selected === p.value;
              return (
                <button key={p.value} onClick={() => setSelected(p.value)} style={{
                  background: active ? "#1A1A1A" : "white",
                  border: `1.5px solid ${active ? "#1A1A1A" : "#E8E8E8"}`,
                  borderRadius: "14px", padding: "14px",
                  cursor: "pointer", textAlign: "left", fontFamily: "Inter, sans-serif",
                  transition: "all 0.15s ease",
                }}>
                  <span style={{ fontSize: "20px", display: "block", marginBottom: "8px" }}>{p.icon}</span>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: active ? "white" : "#1A1A1A", marginBottom: "3px" }}>{p.label}</p>
                  <p style={{ fontSize: "11px", color: active ? "rgba(255,255,255,0.55)" : "#9B9B9B", lineHeight: 1.4 }}>{p.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Daily targets */}
        <div style={{ marginTop: "24px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>
            Daily Targets
          </p>
          <div style={{ background: "white", border: "1px solid #E8E8E8", borderRadius: "16px", overflow: "hidden" }}>
            {fields.map((f, idx) => {
              const pct = ((f.value - f.min) / (f.max - f.min)) * 100;
              return (
                <div key={f.label} style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  padding: "14px 16px",
                  borderTop: idx > 0 ? "1px solid #F2F2F2" : "none",
                }}>
                  <div style={{ background: f.bg, borderRadius: "8px", padding: "5px 10px", minWidth: "60px", textAlign: "center", flexShrink: 0 }}>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: f.color, fontFamily: "Inter, sans-serif" }}>{f.label}</p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      type="range"
                      min={f.min} max={f.max} step={f.step}
                      value={f.value}
                      onChange={(e) => f.set(parseInt(e.target.value))}
                      style={{
                        width: "100%", height: "4px", borderRadius: "2px",
                        appearance: "none", WebkitAppearance: "none", outline: "none",
                        background: `linear-gradient(to right, #1A1A1A 0%, #1A1A1A ${pct}%, #E8E8E8 ${pct}%, #E8E8E8 100%)`,
                        cursor: "pointer",
                      }}
                    />
                  </div>
                  <div style={{ minWidth: "68px", textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: "15px", fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.02em", fontFamily: "Inter, sans-serif" }}>
                      {f.value} <span style={{ fontSize: "11px", fontWeight: 400, color: "#9B9B9B" }}>{f.unit}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Save */}
        <div style={{ marginTop: "24px" }}>
          <button
            onClick={save}
            disabled={saving}
            style={{
              width: "100%", background: "#1A1A1A", color: "white",
              fontWeight: 800, fontSize: "16px", padding: "18px 24px",
              borderRadius: "14px", border: "none", cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "Inter, sans-serif", letterSpacing: "-0.01em",
              opacity: saving ? 0.6 : 1, transition: "opacity 0.15s ease",
            }}
          >
            {saving ? "Saving..." : "Save goals →"}
          </button>
        </div>

      </div>
    </div>
  );
}
