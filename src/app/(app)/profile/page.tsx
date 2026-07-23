"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [goals, setGoals] = useState<any>(null);
  const [mfpInput, setMfpInput] = useState("");
  const [mfpConnected, setMfpConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingGoals, setEditingGoals] = useState(false);
  const [goalForm, setGoalForm] = useState({ daily_calories: 2000, daily_protein: 130, daily_carbs: 200, daily_fat: 65 });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: g } = await supabase.from("user_goals").select("*").eq("user_id", user.id).single();
        if (g) {
          setGoals(g);
          setGoalForm({ daily_calories: g.daily_calories, daily_protein: g.daily_protein, daily_carbs: g.daily_carbs, daily_fat: g.daily_fat });
          if (g.mfp_username) { setMfpInput(g.mfp_username); setMfpConnected(true); }
        }
      }
    };
    load();
  }, []);

  const saveGoals = async () => {
    if (!user) return;
    setSaving(true);
    const { data: existing } = await supabase.from("user_goals").select("id").eq("user_id", user.id).single();
    if (existing) {
      await supabase.from("user_goals").update(goalForm).eq("user_id", user.id);
    } else {
      await supabase.from("user_goals").insert({ ...goalForm, user_id: user.id });
    }
    setGoals({ ...goals, ...goalForm });
    setEditingGoals(false);
    setSaving(false);
  };

  const saveMfp = async () => {
    if (!user) return;
    setSaving(true);
    const { data: existing } = await supabase.from("user_goals").select("id").eq("user_id", user.id).single();
    if (existing) {
      await supabase.from("user_goals").update({ mfp_username: mfpInput.trim() }).eq("user_id", user.id);
    } else {
      await supabase.from("user_goals").insert({ user_id: user.id, mfp_username: mfpInput.trim() });
    }
    setMfpConnected(!!mfpInput.trim());
    setSaving(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ padding: "20px 20px 0" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.03em", color: "#1A1A1A", lineHeight: 1.1 }}>
            Profile
          </h1>
        </div>

        <div style={{ padding: "20px 16px 0", display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Account card */}
          {user && (
            <div style={{ background: "white", border: "1px solid #E8E8E8", borderRadius: "16px", padding: "16px", display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "12px", background: "#1A1A1A",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontWeight: 800, fontSize: "18px", flexShrink: 0,
              }}>
                {user.email?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "#1A1A1A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>
                <p style={{ fontSize: "12px", color: "#9B9B9B", marginTop: "2px" }}>RecipeTok account</p>
              </div>
              <button onClick={signOut} style={{
                fontSize: "13px", color: "#C0392B", fontWeight: 600,
                background: "none", border: "1px solid rgba(192,57,43,0.25)",
                borderRadius: "8px", padding: "7px 14px", cursor: "pointer", fontFamily: "Inter, sans-serif",
                flexShrink: 0,
              }}>
                Sign out
              </button>
            </div>
          )}

          {/* Daily Goals */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px", paddingLeft: "4px" }}>
              Daily Goals
            </p>
            <div style={{ background: "white", border: "1px solid #E8E8E8", borderRadius: "16px", padding: "16px" }}>
              {editingGoals ? (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                    {[
                      { key: "daily_calories", label: "Calories", unit: "kcal", color: "#C0392B", bg: "#FDF2F1" },
                      { key: "daily_protein", label: "Protein", unit: "g", color: "#2E7D52", bg: "#EEF5F1" },
                      { key: "daily_carbs", label: "Carbs", unit: "g", color: "#8B6914", bg: "#FDF8EE" },
                      { key: "daily_fat", label: "Fat", unit: "g", color: "#3D5A8A", bg: "#EEF1F8" },
                    ].map((m) => (
                      <div key={m.key} style={{ background: m.bg, borderRadius: "12px", padding: "12px" }}>
                        <p style={{ fontSize: "11px", color: "#555555", marginBottom: "6px", fontWeight: 600 }}>{m.label} ({m.unit})</p>
                        <input
                          type="number"
                          value={(goalForm as any)[m.key]}
                          onChange={(e) => setGoalForm((prev) => ({ ...prev, [m.key]: parseInt(e.target.value) || 0 }))}
                          style={{
                            width: "100%", background: "white", border: "1.5px solid #E8E8E8",
                            borderRadius: "8px", padding: "8px 10px", fontSize: "16px",
                            fontWeight: 700, color: m.color, fontFamily: "Inter, sans-serif", outline: "none",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => setEditingGoals(false)} style={{
                      flex: 1, background: "white", border: "1.5px solid #E8E8E8", borderRadius: "12px",
                      color: "#1A1A1A", fontWeight: 600, padding: "12px", fontSize: "14px",
                      cursor: "pointer", fontFamily: "Inter, sans-serif",
                    }}>Cancel</button>
                    <button onClick={saveGoals} disabled={saving} style={{
                      flex: 1, background: "#1A1A1A", border: "none", borderRadius: "12px",
                      color: "white", fontWeight: 700, padding: "12px", fontSize: "14px",
                      cursor: saving ? "not-allowed" : "pointer", fontFamily: "Inter, sans-serif",
                      opacity: saving ? 0.6 : 1,
                    }}>
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              ) : goals ? (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                    {[
                      { label: "Calories", value: goals.daily_calories, unit: "kcal", color: "#C0392B", bg: "#FDF2F1" },
                      { label: "Protein", value: goals.daily_protein, unit: "g", color: "#2E7D52", bg: "#EEF5F1" },
                      { label: "Carbs", value: goals.daily_carbs, unit: "g", color: "#8B6914", bg: "#FDF8EE" },
                      { label: "Fat", value: goals.daily_fat, unit: "g", color: "#3D5A8A", bg: "#EEF1F8" },
                    ].map((m) => (
                      <div key={m.label} style={{ background: m.bg, borderRadius: "12px", padding: "14px 12px" }}>
                        <p style={{ fontSize: "24px", fontWeight: 800, color: m.color, letterSpacing: "-0.03em", lineHeight: 1, fontFamily: "Inter, sans-serif" }}>
                          {m.value}<span style={{ fontSize: "11px", fontWeight: 400, color: "#9B9B9B", marginLeft: "2px" }}>{m.unit}</span>
                        </p>
                        <p style={{ fontSize: "12px", color: "#555555", marginTop: "4px", fontWeight: 500 }}>{m.label}</p>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setEditingGoals(true)} style={{
                    width: "100%", background: "white", border: "1.5px solid #E8E8E8",
                    borderRadius: "12px", color: "#1A1A1A", fontWeight: 600,
                    padding: "12px", fontSize: "14px", cursor: "pointer", fontFamily: "Inter, sans-serif",
                  }}>
                    Edit goals
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditingGoals(true)} style={{
                  width: "100%", background: "white", border: "1.5px dashed #E8E8E8",
                  borderRadius: "12px", color: "#9B9B9B", fontWeight: 500,
                  padding: "20px", fontSize: "14px", cursor: "pointer", fontFamily: "Inter, sans-serif",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                }}>
                  + Set your daily macro goals
                </button>
              )}
            </div>
          </div>

          {/* Plan Settings */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px", paddingLeft: "4px" }}>
              Plan Settings
            </p>
            <a href="/settings/cadence" style={{ textDecoration: "none" }}>
              <div style={{
                background: "white", border: "1px solid #E8E8E8", borderRadius: "16px",
                padding: "16px", display: "flex", alignItems: "center", gap: "12px",
              }}>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "10px",
                  background: "#EEF5F1", display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0,
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E7D52" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "#1A1A1A" }}>Plan Cadence</p>
                  <p style={{ fontSize: "12px", color: "#9B9B9B", marginTop: "1px" }}>How often your meals repeat</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#BBBBBB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </a>
          </div>

          {/* MFP Integration */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px", paddingLeft: "4px" }}>
              Integrations
            </p>
            <div style={{ background: "white", border: "1px solid #E8E8E8", borderRadius: "16px", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "10px",
                  background: "#1565C0", display: "flex", alignItems: "center",
                  justifyContent: "center", color: "white", fontWeight: 800, fontSize: "16px", flexShrink: 0,
                }}>M</div>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "#1A1A1A" }}>
                    {mfpConnected ? "Connected to MyFitnessPal" : "Connect MyFitnessPal"}
                  </p>
                  <p style={{ fontSize: "12px", color: "#9B9B9B", marginTop: "1px" }}>
                    {mfpConnected ? `@${mfpInput}` : "Sync your food diary"}
                  </p>
                </div>
              </div>

              {mfpConnected ? (
                <div>
                  <div style={{
                    background: "#EEF5F1", border: "1px solid rgba(46,125,82,0.2)",
                    borderRadius: "10px", padding: "10px 14px", marginBottom: "10px",
                    display: "flex", alignItems: "center", gap: "8px",
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2E7D52" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <p style={{ fontSize: "13px", color: "#2E7D52", fontWeight: 600 }}>Syncing from @{mfpInput}</p>
                  </div>
                  <p style={{ fontSize: "12px", color: "#9B9B9B", marginBottom: "12px", lineHeight: 1.5 }}>
                    Make sure your{" "}
                    <a href="https://www.myfitnesspal.com/account/diary_settings" target="_blank" rel="noopener noreferrer" style={{ color: "#3D7A5F" }}>
                      Food Diary sharing
                    </a>{" "}
                    is set to Public.
                  </p>
                  <button onClick={() => { setMfpConnected(false); setMfpInput(""); }} style={{
                    width: "100%", background: "white", border: "1.5px solid #E8E8E8",
                    borderRadius: "12px", color: "#1A1A1A", fontWeight: 600,
                    padding: "12px", fontSize: "14px", cursor: "pointer", fontFamily: "Inter, sans-serif",
                  }}>
                    Disconnect
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    value={mfpInput}
                    onChange={(e) => setMfpInput(e.target.value)}
                    placeholder="Your MFP username"
                    style={{
                      width: "100%", background: "#F5F5F5", border: "1.5px solid #E8E8E8",
                      borderRadius: "12px", padding: "13px 16px", fontSize: "15px",
                      color: "#1A1A1A", fontFamily: "Inter, sans-serif", outline: "none",
                      marginBottom: "8px", boxSizing: "border-box",
                    }}
                  />
                  <p style={{ fontSize: "12px", color: "#9B9B9B", marginBottom: "12px", lineHeight: 1.5 }}>
                    Set your{" "}
                    <a href="https://www.myfitnesspal.com/account/diary_settings" target="_blank" rel="noopener noreferrer" style={{ color: "#3D7A5F" }}>
                      Food Diary sharing
                    </a>{" "}
                    to Public in MFP settings first.
                  </p>
                  <button onClick={saveMfp} disabled={saving || !mfpInput.trim()} style={{
                    width: "100%", background: "#1A1A1A", border: "none", borderRadius: "12px",
                    color: "white", fontWeight: 700, padding: "14px", fontSize: "15px",
                    cursor: saving || !mfpInput.trim() ? "not-allowed" : "pointer",
                    opacity: saving || !mfpInput.trim() ? 0.4 : 1, fontFamily: "Inter, sans-serif",
                  }}>
                    {saving ? "Connecting..." : "Connect"}
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
