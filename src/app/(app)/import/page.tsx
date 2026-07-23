"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function ImportPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [goals, setGoals] = useState<any>(null);
  const [mfpData, setMfpData] = useState<any>(null);
  const [userName, setUserName] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      setToken(session?.access_token || null);
      if (user) {
        const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "there";
        setUserName(name.split(" ")[0]);
        const { data: g } = await supabase.from("user_goals").select("*").eq("user_id", user.id).single();
        if (g) {
          setGoals(g);
          if (g.mfp_username) {
            try {
              const headers: Record<string, string> = {};
              if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
              const res = await fetch(`/api/mfp?username=${g.mfp_username}`, { headers });
              if (res.ok) setMfpData(await res.json());
            } catch {}
          }
        }
      }
    };
    load();
  }, []);

  const handleExtract = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/extract", { method: "POST", headers, body: JSON.stringify({ url: url.trim() }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to extract recipe");
      router.push(`/recipes/${data.id}`);
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const macros = goals ? [
    { label: "calories", value: mfpData?.calories ?? 0, goal: goals.daily_calories, color: "#C0392B", bg: "#FDF2F1" },
    { label: "protein", value: mfpData?.protein ?? 0, goal: goals.daily_protein, color: "#2E7D52", bg: "#EEF5F1", unit: "g" },
    { label: "carbs", value: mfpData?.carbs ?? 0, goal: goals.daily_carbs, color: "#8B6914", bg: "#FDF8EE", unit: "g" },
    { label: "fat", value: mfpData?.fat ?? 0, goal: goals.daily_fat, color: "#3D5A8A", bg: "#EEF1F8", unit: "g" },
  ] : [];

  return (
    <div style={{ minHeight: "100vh", background: "#fff", paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%",
              background: "#1A1A1A", display: "flex", alignItems: "center",
              justifyContent: "center", color: "white", fontWeight: 700, fontSize: "14px",
            }}>
              {userName?.[0]?.toUpperCase() || "R"}
            </div>
            <div>
              <p style={{ fontSize: "12px", color: "#9B9B9B", fontWeight: 400 }}>{getGreeting()}</p>
              <p style={{ fontSize: "15px", fontWeight: 700, color: "#1A1A1A", letterSpacing: "-0.01em" }}>{userName || "there"}</p>
            </div>
          </div>
          <div style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.03em", color: "#1A1A1A" }}>RecipeTok</div>
        </div>

        {/* Macro dashboard */}
        {goals && (
          <div style={{ padding: "20px 20px 0" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              {macros.map((m) => {
                const pct = Math.min(100, Math.round((m.value / m.goal) * 100));
                return (
                  <div key={m.label} style={{
                    flex: 1, background: m.bg, borderRadius: "14px", padding: "12px 10px",
                  }}>
                    <p style={{ fontSize: "18px", fontWeight: 800, color: m.color, letterSpacing: "-0.03em", lineHeight: 1 }}>
                      {m.value}{m.unit || ""}
                    </p>
                    <p style={{ fontSize: "10px", color: "#9B9B9B", marginTop: "3px", fontWeight: 500 }}>{m.label}</p>
                    <div style={{ marginTop: "8px", height: "3px", background: "rgba(0,0,0,0.08)", borderRadius: "2px" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: m.color, borderRadius: "2px", transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Import section */}
        <div style={{ padding: "24px 20px 0" }}>
          <p style={{ fontSize: "28px", fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "6px" }}>
            Import a Recipe
          </p>
          <p style={{ fontSize: "14px", color: "#9B9B9B", marginBottom: "20px" }}>
            Paste any TikTok cooking video link
          </p>

          <div style={{ position: "relative", marginBottom: "12px" }}>
            <input
              className="input-field"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleExtract()}
              placeholder="https://www.tiktok.com/@..."
              style={{ paddingRight: "48px" }}
            />
            {url && (
              <button
                onClick={() => setUrl("")}
                style={{
                  position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "#9B9B9B", fontSize: "18px", lineHeight: 1,
                }}
              >×</button>
            )}
          </div>

          {error && (
            <div style={{
              background: "#FDF2F1", border: "1px solid rgba(192,57,43,0.2)",
              borderRadius: "10px", padding: "12px 14px", marginBottom: "12px",
              fontSize: "13px", color: "#C0392B",
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleExtract}
            disabled={loading || !url.trim()}
            className="btn-primary"
            style={{ width: "100%", fontSize: "15px" }}
          >
            {loading ? (
              <>
                <span className="animate-spin" style={{ display: "inline-block", width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%" }} />
                Extracting recipe...
              </>
            ) : (
              <>Extract Recipe →</>
            )}
          </button>
        </div>

        {/* How it works */}
        <div style={{ padding: "28px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <p style={{ fontSize: "17px", fontWeight: 700, color: "#1A1A1A", letterSpacing: "-0.01em" }}>How it works</p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            {[
              { num: "1", title: "Paste link", desc: "Copy any TikTok cooking video URL" },
              { num: "2", title: "AI extracts", desc: "We parse the recipe and ingredients" },
              { num: "3", title: "Get macros", desc: "Calories, protein, carbs, fat + swaps" },
            ].map((step) => (
              <div key={step.num} style={{ flex: 1, background: "#F5F5F5", borderRadius: "14px", padding: "14px 12px" }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%", background: "#1A1A1A",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontWeight: 800, fontSize: "13px", marginBottom: "8px",
                }}>
                  {step.num}
                </div>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#1A1A1A", marginBottom: "3px" }}>{step.title}</p>
                <p style={{ fontSize: "11px", color: "#9B9B9B", lineHeight: 1.4 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick tip */}
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{
            background: "#F5F5F5", borderRadius: "14px", padding: "14px 16px",
            display: "flex", alignItems: "flex-start", gap: "10px",
          }}>
            <span style={{ fontSize: "18px", flexShrink: 0 }}>💡</span>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#1A1A1A", marginBottom: "2px" }}>How to get the link</p>
              <p style={{ fontSize: "12px", color: "#9B9B9B", lineHeight: 1.5 }}>
                Open TikTok → tap Share on any cooking video → tap "Copy link" → paste it here
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
