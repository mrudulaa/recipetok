"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function ImportPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleExtract = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    try {
      // Always fetch a fresh session token at call time to avoid stale state
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
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

  return (
    <div style={{
      minHeight: "100vh",
      background: "#ffffff",
      paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
    }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 20px" }}>

        {/* Nav header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          paddingTop: "16px", paddingBottom: "8px", position: "relative",
        }}>
          <span style={{ fontSize: "17px", fontWeight: 700, color: "#1A1A1A", letterSpacing: "-0.01em" }}>Import Recipe</span>
        </div>

        {/* TikTok logo */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "32px", marginBottom: "24px" }}>
          <div style={{ position: "relative" }}>
            <div style={{
              width: "88px", height: "88px", borderRadius: "50%",
              background: "#000000",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            }}>
              {/* TikTok icon SVG */}
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" fill="white"/>
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" fill="#69C9D0" opacity="0.6" style={{mixBlendMode: "screen"}}/>
              </svg>
            </div>
            {/* Sparkle badge */}
            <div style={{
              position: "absolute", bottom: "2px", right: "2px",
              width: "26px", height: "26px", borderRadius: "50%",
              background: "white", border: "2px solid white",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              fontSize: "13px",
            }}>✨</div>
          </div>
        </div>

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{
            fontSize: "32px", fontWeight: 800, color: "#1A1A1A",
            letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "8px",
          }}>
            Import a Recipe
          </h1>
          <p style={{ fontSize: "15px", color: "#9B9B9B", lineHeight: 1.5 }}>
            Paste any TikTok cooking video link
          </p>
        </div>

        {/* Input */}
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleExtract()}
          placeholder="https://www.tiktok.com/@..."
          style={{
            width: "100%", background: "#F5F5F5",
            border: "1.5px solid #E8E8E8", borderRadius: "14px",
            padding: "16px 18px", fontSize: "15px", color: "#1A1A1A",
            fontFamily: "Inter, sans-serif", outline: "none",
            marginBottom: "12px", boxSizing: "border-box",
          }}
        />

        {error && (
          <div style={{
            background: "#FDF2F1", border: "1px solid rgba(192,57,43,0.2)",
            borderRadius: "12px", padding: "12px 16px", marginBottom: "12px",
            fontSize: "13px", color: "#C0392B",
          }}>
            {error}
          </div>
        )}

        {/* Extract button */}
        <button
          onClick={handleExtract}
          disabled={loading || !url.trim()}
          style={{
            width: "100%", background: loading || !url.trim() ? "#555555" : "#1A1A1A",
            color: "white", fontWeight: 800, fontSize: "16px",
            padding: "18px 24px", borderRadius: "14px", border: "none",
            cursor: loading || !url.trim() ? "not-allowed" : "pointer",
            fontFamily: "Inter, sans-serif", letterSpacing: "-0.01em",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
            marginBottom: "36px", transition: "opacity 0.15s ease",
            opacity: loading || !url.trim() ? 0.5 : 1,
          }}
        >
          {loading ? (
            <>
              <span style={{
                display: "inline-block", width: "18px", height: "18px",
                border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "white",
                borderRadius: "50%", animation: "spin 1s linear infinite",
              }} />
              Extracting recipe...
            </>
          ) : (
            <>Extract Recipe →</>
          )}
        </button>

        {/* How it works */}
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.02em", marginBottom: "16px" }}>
            How it works
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            {[
              { num: "1", title: "Paste link", desc: "Paste any TikTok cooking video link." },
              { num: "2", title: "AI extracts", desc: "Our AI analyzes the video and extracts ingredients." },
              { num: "3", title: "Get macros", desc: "Get full nutrition stats and macros instantly." },
            ].map((step) => (
              <div key={step.num} style={{
                background: "white", border: "1px solid #E8E8E8",
                borderRadius: "16px", padding: "16px 12px",
                display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
              }}>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "50%",
                  background: "#1A1A1A", color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: "15px", marginBottom: "10px",
                }}>
                  {step.num}
                </div>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#1A1A1A", marginBottom: "6px", lineHeight: 1.2 }}>{step.title}</p>
                <p style={{ fontSize: "11px", color: "#9B9B9B", lineHeight: 1.5 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tip */}
        <div style={{
          background: "#F5F5F5", borderRadius: "16px", padding: "16px",
          display: "flex", alignItems: "flex-start", gap: "12px",
        }}>
          <span style={{ fontSize: "22px", flexShrink: 0 }}>💡</span>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#1A1A1A", marginBottom: "4px" }}>How to get the link</p>
            <p style={{ fontSize: "13px", color: "#9B9B9B", lineHeight: 1.5 }}>
              Tap the Share button on TikTok and select "Copy link" to get the video URL.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
