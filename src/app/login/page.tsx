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
      background: "var(--bg-primary)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Ambient glows */}
      <div style={{
        position: "fixed", top: "-20%", right: "-20%", width: "500px", height: "500px",
        background: "radial-gradient(circle, rgba(232,119,58,0.15) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", bottom: "-20%", left: "-20%", width: "400px", height: "400px",
        background: "radial-gradient(circle, rgba(92,184,122,0.08) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />

      <div style={{ width: "100%", maxWidth: "360px", position: "relative", zIndex: 1 }}>
        {/* Logo mark */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{
            width: "72px", height: "72px", borderRadius: "20px",
            background: "linear-gradient(135deg, #E8773A 0%, #F09060 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "36px", margin: "0 auto 20px",
            boxShadow: "0 16px 40px rgba(232,119,58,0.35)",
          }}>🍴</div>
          <h1 style={{
            fontSize: "38px", fontWeight: 900, letterSpacing: "-0.04em",
            color: "var(--text-primary)", lineHeight: 1.05, marginBottom: "8px",
          }}>
            RecipeTok
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "16px", lineHeight: 1.4 }}>
            From TikTok to your table.
          </p>
        </div>

        {/* Feature list */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "18px",
          padding: "20px",
          marginBottom: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}>
          {[
            { icon: "📱", text: "Paste any TikTok cooking video URL" },
            { icon: "🤖", text: "AI extracts the full recipe + macros" },
            { icon: "💪", text: "Goal-aware ingredient swap suggestions" },
            { icon: "📅", text: "Weekly meal planner + grocery list" },
          ].map((f) => (
            <div key={f.text} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{
                width: "36px", height: "36px", borderRadius: "10px",
                background: "rgba(232,119,58,0.1)", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "18px", flexShrink: 0,
              }}>{f.icon}</span>
              <span style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.3 }}>{f.text}</span>
            </div>
          ))}
        </div>

        {error && (
          <div style={{
            background: "rgba(232,90,58,0.1)", border: "1px solid rgba(232,90,58,0.2)",
            borderRadius: "12px", padding: "12px 16px", marginBottom: "16px",
            fontSize: "13px", color: "#F09080",
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
            background: loading ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.09)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "14px",
            color: "var(--text-primary)",
            fontWeight: 600,
            padding: "16px 24px",
            fontSize: "15px",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            transition: "all 0.2s ease",
            fontFamily: "Inter, sans-serif",
            marginBottom: "16px",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? (
            <span style={{ color: "var(--text-secondary)" }}>Redirecting to Google...</span>
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

        {/* Primary CTA */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #E8773A 0%, #F09060 100%)",
            border: "none",
            borderRadius: "14px",
            color: "white",
            fontWeight: 700,
            padding: "16px 24px",
            fontSize: "16px",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.2s ease",
            fontFamily: "Inter, sans-serif",
            boxShadow: "0 8px 24px rgba(232,119,58,0.3)",
            opacity: loading ? 0.6 : 1,
          }}
        >
          Get started — it's free
        </button>

        <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)", marginTop: "16px" }}>
          Your data is private and never shared.
        </p>
      </div>
    </div>
  );
}
