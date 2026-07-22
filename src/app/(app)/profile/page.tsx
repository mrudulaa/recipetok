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
    { label: "Calories", value: goals.daily_calories, unit: "kcal", color: "#D4522A", bg: "#FEF2EE" },
    { label: "Protein", value: goals.daily_protein, unit: "g", color: "#4A7C59", bg: "#EEF5F1" },
    { label: "Carbs", value: goals.daily_carbs, unit: "g", color: "#B8860B", bg: "#FDF8EC" },
    { label: "Fat", value: goals.daily_fat, unit: "g", color: "#5B6FA8", bg: "#EEF0F8" },
  ] : [];

  return (
    <div style={{ minHeight: "100vh", background: "#FAF8F4", paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(180deg, #F5EDE0 0%, #FAF8F4 100%)",
        padding: "20px 20px 20px",
      }}>
        <h1 className="serif" style={{
          fontSize: "34px", fontWeight: 400, letterSpacing: "-0.02em",
          color: "#1A1612", lineHeight: 1.1,
        }}>
          Profile
        </h1>
      </div>

      <div style={{ padding: "12px 16px 0", maxWidth: "480px", margin: "0 auto" }}>
        {/* User card */}
        {user && (
          <div style={{
            background: "white", border: "1px solid #E8E3D8", borderRadius: "18px",
            padding: "16px", display: "flex", alignItems: "center", gap: "14px",
            marginBottom: "20px", boxShadow: "0 1px 4px rgba(26,22,18,0.05)",
          }}>
            <div style={{
              width: "44px", height: "44px", borderRadius: "12px",
              background: "#D4522A",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontWeight: 700, fontSize: "18px", flexShrink: 0,
            }}>
              {user.email?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#1A1612", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.email}
              </p>
              <p style={{ fontSize: "12px", color: "#A89880", marginTop: "2px" }}>RecipeTok account</p>
            </div>
            <button
              onClick={signOut}
              style={{
                fontSize: "12px", color: "#C0392B", fontWeight: 600,
                background: "#FEF2EE", border: "1px solid rgba(192,57,43,0.15)",
                borderRadius: "8px", padding: "6px 12px", cursor: "pointer",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Sign out
            </button>
          </div>
        )}

        {/* Daily Goals */}
        <p className="section-label" style={{ marginBottom: "10px" }}>Daily Goals</p>
        {goals ? (
          <div style={{
            background: "white", border: "1px solid #E8E3D8", borderRadius: "18px",
            padding: "18px", marginBottom: "20px", boxShadow: "0 1px 4px rgba(26,22,18,0.05)",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
              {macroItems.map((m) => (
                <div key={m.label} style={{
                  background: m.bg, borderRadius: "12px", padding: "12px",
                }}>
                  <p style={{ fontSize: "22px", fontWeight: 700, color: m.color, letterSpacing: "-0.02em", fontFamily: "Inter, sans-serif" }}>
                    {m.value}
                    <span style={{ fontSize: "11px", fontWeight: 400, color: "#A89880", marginLeft: "2px" }}>{m.unit}</span>
                  </p>
                  <p style={{ fontSize: "11px", color: "#6B5E52", marginTop: "2px", fontWeight: 500 }}>{m.label}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => router.push("/onboarding")}
              className="btn-secondary"
              style={{ width: "100%", fontSize: "13px", padding: "10px" }}
            >
              Edit goals
            </button>
          </div>
        ) : (
          <button
            onClick={() => router.push("/onboarding")}
            style={{
              width: "100%", background: "white", border: "1.5px dashed #D4522A",
              borderRadius: "14px", color: "#D4522A", fontWeight: 600,
              padding: "16px", fontSize: "14px", cursor: "pointer",
              marginBottom: "20px", fontFamily: "Inter, sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              boxShadow: "0 1px 4px rgba(26,22,18,0.04)",
            }}
          >
            🎯 Set your daily macro goals →
          </button>
        )}

        {/* MFP Integration */}
        <p className="section-label" style={{ marginBottom: "10px" }}>App Integrations</p>
        <div style={{
          background: "white", border: "1px solid #E8E3D8", borderRadius: "18px",
          padding: "18px", marginBottom: "20px", boxShadow: "0 1px 4px rgba(26,22,18,0.05)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
            <div style={{
              width: "42px", height: "42px", borderRadius: "12px",
              background: "#1565C0", display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontWeight: 700, fontSize: "18px", flexShrink: 0,
            }}>M</div>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#1A1612" }}>
                {mfpConnected ? "Connected to MyFitnessPal" : "Connect MyFitnessPal"}
              </p>
              <p style={{ fontSize: "12px", color: "#A89880", marginTop: "2px" }}>
                {mfpConnected ? `@${mfpInput}` : "Sync your food diary"}
              </p>
            </div>
          </div>

          {mfpConnected ? (
            <div>
              <div style={{
                background: "#EEF5F1", border: "1px solid rgba(74,124,89,0.2)",
                borderRadius: "10px", padding: "10px 14px", marginBottom: "10px",
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                <span style={{ color: "#4A7C59", fontSize: "14px" }}>✓</span>
                <p style={{ fontSize: "12px", color: "#4A7C59", fontWeight: 500 }}>Syncing from @{mfpInput}</p>
              </div>
              <p style={{ fontSize: "12px", color: "#A89880", marginBottom: "10px" }}>
                Make sure your{" "}
                <a href="https://www.myfitnesspal.com/account/diary_settings" target="_blank" rel="noopener noreferrer" style={{ color: "#D4522A" }}>
                  Food Diary sharing
                </a>{" "}
                is set to Public.
              </p>
              <button
                onClick={() => { setMfpConnected(false); setMfpInput(""); }}
                className="btn-secondary"
                style={{ width: "100%", fontSize: "13px", padding: "10px" }}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div>
              <input
                className="input-field"
                type="text"
                value={mfpInput}
                onChange={(e) => setMfpInput(e.target.value)}
                placeholder="Your MFP username"
                style={{ marginBottom: "8px" }}
              />
              <p style={{ fontSize: "12px", color: "#A89880", marginBottom: "10px" }}>
                Set your{" "}
                <a href="https://www.myfitnesspal.com/account/diary_settings" target="_blank" rel="noopener noreferrer" style={{ color: "#D4522A" }}>
                  Food Diary sharing
                </a>{" "}
                to Public in MFP settings.
              </p>
              <button
                onClick={saveMfp}
                disabled={saving || !mfpInput.trim()}
                className="btn-primary"
                style={{ width: "100%" }}
              >
                {saving ? "Connecting..." : "Connect"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
