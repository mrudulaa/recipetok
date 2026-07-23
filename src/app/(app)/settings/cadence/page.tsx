"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

const CADENCE_OPTIONS = [
  { id: "same_daily", label: "Same every day", desc: "Eat the same meals daily" },
  { id: "rotating", label: "Rotating (2–3 plans)", desc: "Alternate between a few plans" },
  { id: "unique_daily", label: "Unique each day", desc: "Different meals every day" },
  { id: "training_rest", label: "Training vs Rest days", desc: "Different macros on workout days" },
];

export default function CadencePage() {
  const [cadence, setCadence] = useState("unique_daily");
  const [trainingCals, setTrainingCals] = useState(2400);
  const [trainingProtein, setTrainingProtein] = useState(150);
  const [restCals, setRestCals] = useState(1800);
  const [restProtein, setRestProtein] = useState(120);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: goals } = await supabase.from("user_goals").select("*").eq("user_id", user.id).single();
      if (goals) {
        setCadence((goals as any).plan_cadence || "unique_daily");
        setTrainingCals((goals as any).training_calories || 2400);
        setTrainingProtein((goals as any).training_protein || 150);
        setRestCals((goals as any).rest_calories || 1800);
        setRestProtein((goals as any).rest_protein || 120);
      }
    })();
  }, []);

  async function save() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("user_goals").upsert({
      user_id: user.id,
      plan_cadence: cadence,
      training_calories: trainingCals,
      training_protein: trainingProtein,
      rest_calories: restCals,
      rest_protein: restProtein,
    }, { onConflict: "user_id" });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ background: "#ffffff", minHeight: "100vh", paddingBottom: "40px" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px 8px" }}>
          <Link href="/profile" style={{
            width: "36px", height: "36px", borderRadius: "50%", background: "#F5F5F5",
            display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </Link>
          <p style={{ fontSize: "17px", fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.02em" }}>Plan Cadence</p>
        </div>

        <div style={{ padding: "16px 20px 0" }}>

          {/* Cadence options */}
          <p style={{ fontSize: "11px", fontWeight: 600, color: "#9B9B9B", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>
            How often does your plan repeat
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "28px" }}>
            {CADENCE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setCadence(opt.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  background: "white", border: `1.5px solid ${cadence === opt.id ? "#1A1A1A" : "#E8E8E8"}`,
                  borderRadius: "14px", padding: "14px 16px", cursor: "pointer",
                  textAlign: "left", fontFamily: "Inter, sans-serif",
                }}
              >
                <div style={{
                  width: "20px", height: "20px", borderRadius: "50%",
                  border: `2px solid ${cadence === opt.id ? "#1A1A1A" : "#E8E8E8"}`,
                  background: cadence === opt.id ? "#1A1A1A" : "white",
                  flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {cadence === opt.id && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "white" }} />}
                </div>
                <div>
                  <p style={{ fontSize: "15px", fontWeight: 600, color: "#1A1A1A" }}>{opt.label}</p>
                  <p style={{ fontSize: "13px", color: "#9B9B9B", marginTop: "2px" }}>{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Training/Rest day targets — only shown for training_rest cadence */}
          {cadence === "training_rest" && (
            <>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "#9B9B9B", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>
                Macro targets
              </p>
              <div style={{ display: "flex", gap: "10px", marginBottom: "28px" }}>
                {[
                  { label: "Training Day", cals: trainingCals, setCals: setTrainingCals, protein: trainingProtein, setProtein: setTrainingProtein, color: "#2E7D52" },
                  { label: "Rest Day", cals: restCals, setCals: setRestCals, protein: restProtein, setProtein: setRestProtein, color: "#3D5A8A" },
                ].map((day) => (
                  <div key={day.label} style={{ flex: 1, background: "#F5F5F5", borderRadius: "14px", padding: "14px" }}>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "#1A1A1A", marginBottom: "10px" }}>{day.label}</p>
                    <div style={{ marginBottom: "8px" }}>
                      <p style={{ fontSize: "11px", color: "#9B9B9B", marginBottom: "4px" }}>Calories</p>
                      <input
                        type="number"
                        value={day.cals}
                        onChange={(e) => day.setCals(Number(e.target.value))}
                        style={{ width: "100%", background: "white", border: "1px solid #E8E8E8", borderRadius: "8px", padding: "8px 10px", fontSize: "15px", fontWeight: 700, color: day.color, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <p style={{ fontSize: "11px", color: "#9B9B9B", marginBottom: "4px" }}>Protein (g)</p>
                      <input
                        type="number"
                        value={day.protein}
                        onChange={(e) => day.setProtein(Number(e.target.value))}
                        style={{ width: "100%", background: "white", border: "1px solid #E8E8E8", borderRadius: "8px", padding: "8px 10px", fontSize: "15px", fontWeight: 700, color: day.color, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Save button */}
          <button
            onClick={save}
            disabled={saving}
            style={{
              width: "100%", background: saved ? "#2E7D52" : "#1A1A1A", color: "white",
              fontWeight: 800, fontSize: "16px", padding: "16px 24px",
              borderRadius: "14px", border: "none", cursor: "pointer",
              fontFamily: "Inter, sans-serif", letterSpacing: "-0.01em",
              transition: "background 0.2s",
            }}
          >
            {saved ? "✓ Saved" : saving ? "Saving..." : "Save settings →"}
          </button>
        </div>
      </div>
    </div>
  );
}
