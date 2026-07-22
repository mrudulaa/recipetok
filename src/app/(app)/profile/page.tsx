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
    { label: "Calories", value: goals.daily_calories, unit: "kcal", color: "#E8773A" },
    { label: "Protein", value: goals.daily_protein, unit: "g", color: "#5CB87A" },
    { label: "Carbs", value: goals.daily_carbs, unit: "g", color: "#E8B73A" },
    { label: "Fat", value: goals.daily_fat, unit: "g", color: "#7A8EE8" },
  ] : [];

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-primary)",
      paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
      position: "relative",
    }}>
      <div style={{ position: "relative", zIndex: 1, maxWidth: "480px", margin: "0 auto", padding: "20px 16px 0" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: "24px" }}>
          Profile
        </h1>

        {/* User card */}
        {user && (
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "18px",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            marginBottom: "20px",
          }}>
            <div style={{
              width: "44px", height: "44px", borderRadius: "12px",
              background: "linear-gradient(135deg, #E8773A, #F09060)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontWeight: 700, fontSize: "18px", flexShrink: 0,
            }}>
              {user.email?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.email}
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>RecipeTok account</p>
            </div>
            <button
              onClick={signOut}
              style={{
                fontSize: "12px", color: "#E85A3A", fontWeight: 600,
                background: "rgba(232,90,58,0.1)", border: "1px solid rgba(232,90,58,0.2)",
                borderRadius: "8px", padding: "6px 12px", cursor: "pointer",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Sign out
            </button>
          </div>
        )}

        {/* Daily Goals */}
        <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "10px" }}>
          Daily Goals
        </p>
        {goals ? (
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "18px",
            padding: "16px",
            marginBottom: "20px",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
              {macroItems.map((m) => (
                <div key={m.label} style={{
                  background: `${m.color}12`,
                  border: `1px solid ${m.color}25`,
                  borderRadius: "12px",
                  padding: "12px",
                }}>
                  <p style={{ fontSize: "22px", fontWeight: 700, color: m.color, letterSpacing: "-0.02em" }}>
                    {m.value}
                    <span style={{ fontSize: "12px", fontWeight: 400, color: "var(--text-muted)", marginLeft: "2px" }}>{m.unit}</span>
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{m.label}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => router.push("/onboarding")}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px",
                color: "var(--text-secondary)",
                fontWeight: 500,
                padding: "10px",
                fontSize: "13px",
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Edit goals
            </button>
          </div>
        ) : (
          <button
            onClick={() => router.push("/onboarding")}
            style={{
              width: "100%",
              background: "rgba(232,119,58,0.1)",
              border: "1px solid rgba(232,119,58,0.2)",
              borderRadius: "14px",
              color: "var(--accent)",
              fontWeight: 600,
              padding: "16px",
              fontSize: "14px",
              cursor: "pointer",
              marginBottom: "20px",
              fontFamily: "Inter, sans-serif",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            🎯 Set your daily macro goals →
          </button>
        )}

        {/* MFP Integration */}
        <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "10px" }}>
          App Integrations
        </p>
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "18px",
          padding: "16px",
          marginBottom: "20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
            <div style={{
              width: "42px", height: "42px", borderRadius: "12px",
              background: "#1565C0", display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontWeight: 700, fontSize: "18px", flexShrink: 0,
            }}>M</div>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                {mfpConnected ? "Connected to MyFitnessPal" : "Connect MyFitnessPal"}
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                {mfpConnected ? `@${mfpInput}` : "Sync your food diary"}
              </p>
            </div>
          </div>

          {mfpConnected ? (
            <div>
              <div style={{
                background: "rgba(92,184,122,0.1)", border: "1px solid rgba(92,184,122,0.2)",
                borderRadius: "10px", padding: "10px 14px", marginBottom: "10px",
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                <span style={{ color: "#5CB87A", fontSize: "14px" }}>✓</span>
                <p style={{ fontSize: "12px", color: "#5CB87A", fontWeight: 500 }}>Syncing from @{mfpInput}</p>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "10px" }}>
                Make sure your{" "}
                <a href="https://www.myfitnesspal.com/account/diary_settings" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>
                  Food Diary sharing
                </a>{" "}
                is set to Public.
              </p>
              <button
                onClick={() => { setMfpConnected(false); setMfpInput(""); }}
                style={{
                  width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px", color: "var(--text-muted)", fontWeight: 500,
                  padding: "10px", fontSize: "13px", cursor: "pointer", fontFamily: "Inter, sans-serif",
                }}
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
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "10px" }}>
                Set your{" "}
                <a href="https://www.myfitnesspal.com/account/diary_settings" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>
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
