"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) { setError(error.message); setLoading(false); }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#ffffff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 24px",
    }}>
      <div style={{ width: "100%", maxWidth: "360px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "18px",
            background: "#1A1A1A",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "30px", margin: "0 auto 20px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          }}>🍴</div>
          <h1 style={{
            fontSize: "36px", fontWeight: 800, letterSpacing: "-0.03em",
            color: "#1A1A1A", lineHeight: 1.05, marginBottom: "10px",
            fontFamily: "Inter, sans-serif",
          }}>
            RecipeTok
          </h1>
          <p style={{ color: "#9B9B9B", fontSize: "15px", lineHeight: 1.5 }}>
            From TikTok to your table.
          </p>
        </div>

        {/* Feature highlights */}
        <div style={{
          background: "white",
          border: "1px solid #E8E8E8",
          borderRadius: "20px",
          padding: "24px",
          marginBottom: "28px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}>
          {[
            { icon: "📱", title: "Paste any TikTok link", desc: "Works with any cooking video" },
            { icon: "🤖", title: "AI extracts the recipe", desc: "Full ingredients, steps & macros" },
            { icon: "💪", title: "Goal-aware swaps", desc: "Hit your protein targets" },
            { icon: "📅", title: "Plan your week", desc: "Meal planner + grocery list" },
          ].map((f) => (
            <div key={f.title} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <span style={{
                width: "40px", height: "40px", borderRadius: "12px",
                background: "#F5F5F5", border: "1px solid #E8E8E8",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "18px", flexShrink: 0,
              }}>{f.icon}</span>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "#1A1A1A", lineHeight: 1.2 }}>{f.title}</p>
                <p style={{ fontSize: "12px", color: "#9B9B9B", marginTop: "1px" }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div style={{
            background: "#FDF2F1", border: "1px solid rgba(192,57,43,0.2)",
            borderRadius: "12px", padding: "12px 16px", marginBottom: "16px",
            fontSize: "13px", color: "#C0392B",
          }}>
            {error}
          </div>
        )}

        {/* Google Sign In */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: "100%",
            background: "white",
            border: "1.5px solid #E8E8E8",
            borderRadius: "14px",
            color: "#1A1A1A",
            fontWeight: 600,
            padding: "15px 24px",
            fontSize: "15px",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            transition: "all 0.15s ease",
            fontFamily: "Inter, sans-serif",
            marginBottom: "12px",
            opacity: loading ? 0.6 : 1,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          {loading ? (
            <span style={{ color: "#9B9B9B" }}>Redirecting to Google...</span>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: "100%",
            background: "#1A1A1A",
            border: "none",
            borderRadius: "14px",
            color: "white",
            fontWeight: 700,
            padding: "15px 24px",
            fontSize: "15px",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "opacity 0.15s ease",
            fontFamily: "Inter, sans-serif",
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            opacity: loading ? 0.6 : 1,
          }}
        >
          Get started — it&apos;s free
        </button>

        <p style={{ textAlign: "center", fontSize: "12px", color: "#BBBBBB", marginTop: "20px" }}>
          Your data is private and never shared.
        </p>
      </div>
    </div>
  );
}
