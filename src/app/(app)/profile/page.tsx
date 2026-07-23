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
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setToken(session?.access_token || null);
      if (user) {
        const { data: g } = await supabase.from("user_goals").select("*").eq("user_id", user.id).single();
        if (g) {
          setGoals(g);
          if (g.mfp_username) { setMfpInput(g.mfp_username); setMfpConnected(true); }
        }
      }
    };
    load();
  }, []);

  const saveMfp = async () => {
    setSaving(true);
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    await fetch("/api/mfp", { method: "POST", headers, body: JSON.stringify({ username: mfpInput.trim() }) });
    setMfpConnected(!!mfpInput.trim());
    setSaving(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const macroItems = goals ? [
    { label: "Calories", value: goals.daily_calories, unit: "kcal", color: "#C0392B", bg: "#FDF2F1" },
    { label: "Protein", value: goals.daily_protein, unit: "g", color: "#2E7D52", bg: "#EEF5F1" },
    { label: "Carbs", value: goals.daily_carbs, unit: "g", color: "#8B6914", bg: "#FDF8EE" },
    { label: "Fat", value: goals.daily_fat, unit: "g", color: "#3D5A8A", bg: "#EEF1F8" },
  ] : [];

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ padding: "20px 20px 16px", background: "white", borderBottom: "1px solid #F2F2F2", position: "sticky", top: 0, zIndex: 10 }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.03em", color: "#1A1A1A", lineHeight: 1.1 }}>
            Profile
          </h1>
        </div>

        <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* User card */}
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
                fontSize: "12px", color: "#C0392B", fontWeight: 600,
                background: "#FDF2F1", border: "1px solid rgba(192,57,43,0.15)",
                borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontFamily: "Inter, sans-serif",
              }}>
                Sign out
              </button>
            </div>
          )}

          {/* Daily Goals */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.08em" }}>Daily Goals</span>
            </div>
            {goals ? (
              <div style={{ background: "white", border: "1px solid #E8E8E8", borderRadius: "16px", padding: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                  {macroItems.map((m) => (
                    <div key={m.label} style={{ background: m.bg, borderRadius: "12px", padding: "12px" }}>
                      <p style={{ fontSize: "22px", fontWeight: 800, color: m.color, letterSpacing: "-0.02em", fontFamily: "Inter, sans-serif" }}>
                        {m.value}<span style={{ fontSize: "11px", fontWeight: 400, color: "#9B9B9B", marginLeft: "2px" }}>{m.unit}</span>
                      </p>
                      <p style={{ fontSize: "11px", color: "#555555", marginTop: "2px", fontWeight: 500 }}>{m.label}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => router.push("/onboarding")} style={{
                  width: "100%", background: "white", border: "1.5px solid #E8E8E8",
                  borderRadius: "12px", color: "#1A1A1A", fontWeight: 600,
                  padding: "11px", fontSize: "13px", cursor: "pointer", fontFamily: "Inter, sans-serif",
                }}>
                  Edit goals
                </button>
              </div>
            ) : (
              <button onClick={() => router.push("/onboarding")} style={{
                width: "100%", background: "white", border: "1.5px dashed #E8E8E8",
                borderRadius: "14px", color: "#1A1A1A", fontWeight: 600,
                padding: "16px", fontSize: "14px", cursor: "pointer", fontFamily: "Inter, sans-serif",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              }}>
                🎯 Set your daily macro goals →
              </button>
            )}
          </div>

          {/* MFP Integration */}
          <div>
            <div style={{ marginBottom: "10px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.08em" }}>Integrations</span>
            </div>
            <div style={{ background: "white", border: "1px solid #E8E8E8", borderRadius: "16px", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#1565C0", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "16px", flexShrink: 0 }}>M</div>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#1A1A1A" }}>{mfpConnected ? "Connected to MyFitnessPal" : "Connect MyFitnessPal"}</p>
                  <p style={{ fontSize: "12px", color: "#9B9B9B", marginTop: "1px" }}>{mfpConnected ? `@${mfpInput}` : "Sync your food diary"}</p>
                </div>
              </div>
              {mfpConnected ? (
                <div>
                  <div style={{ background: "#EEF5F1", border: "1px solid rgba(46,125,82,0.2)", borderRadius: "10px", padding: "10px 14px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "#2E7D52", fontSize: "14px" }}>✓</span>
                    <p style={{ fontSize: "12px", color: "#2E7D52", fontWeight: 500 }}>Syncing from @{mfpInput}</p>
                  </div>
                  <p style={{ fontSize: "12px", color: "#9B9B9B", marginBottom: "10px" }}>
                    Make sure your <a href="https://www.myfitnesspal.com/account/diary_settings" target="_blank" rel="noopener noreferrer" style={{ color: "#3D7A5F" }}>Food Diary sharing</a> is set to Public.
                  </p>
                  <button onClick={() => { setMfpConnected(false); setMfpInput(""); }} style={{ width: "100%", background: "white", border: "1.5px solid #E8E8E8", borderRadius: "12px", color: "#1A1A1A", fontWeight: 600, padding: "11px", fontSize: "13px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                    Disconnect
                  </button>
                </div>
              ) : (
                <div>
                  <input className="input-field" type="text" value={mfpInput} onChange={(e) => setMfpInput(e.target.value)} placeholder="Your MFP username" style={{ marginBottom: "8px" }} />
                  <p style={{ fontSize: "12px", color: "#9B9B9B", marginBottom: "10px" }}>
                    Set your <a href="https://www.myfitnesspal.com/account/diary_settings" target="_blank" rel="noopener noreferrer" style={{ color: "#3D7A5F" }}>Food Diary sharing</a> to Public in MFP settings.
                  </p>
                  <button onClick={saveMfp} disabled={saving || !mfpInput.trim()} style={{
                    width: "100%", background: "#1A1A1A", border: "none", borderRadius: "12px",
                    color: "white", fontWeight: 700, padding: "13px", fontSize: "14px",
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
