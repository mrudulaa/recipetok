"use client";
import { useState } from "react";

export default function PublicRecipeView({ recipe }: { recipe: any }) {
  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

  // Group ingredients by part
  const parts: { name: string; ingredients: any[] }[] = [];
  for (const ing of (recipe.ingredients || []).slice().sort((a: any, b: any) => a.sort_order - b.sort_order)) {
    const name = ing.part || "Main";
    let p = parts.find((x) => x.name === name);
    if (!p) { p = { name, ingredients: [] }; parts.push(p); }
    p.ingredients.push(ing);
  }
  const multiPart = parts.length > 1;

  const [copied, setCopied] = useState(false);
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ background: "#ffffff", minHeight: "100vh", paddingBottom: "80px" }}>

      {/* Hero image */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", overflow: "hidden", borderRadius: "0 0 24px 24px" }}>
        {recipe.thumbnail_url ? (
          <img src={recipe.thumbnail_url} alt={recipe.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "64px" }}>🍽️</div>
        )}
        {/* RecipeTok badge */}
        <div style={{
          position: "absolute", top: "16px", left: "16px",
          background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)",
          borderRadius: "100px", padding: "6px 12px",
          display: "flex", alignItems: "center", gap: "6px",
        }}>
          <span style={{ fontSize: "13px", fontWeight: 800, color: "white", fontFamily: "Inter, sans-serif", letterSpacing: "-0.01em" }}>RecipeTok</span>
        </div>
        {/* Copy link button */}
        <button
          onClick={copyLink}
          style={{
            position: "absolute", top: "16px", right: "16px",
            background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
            borderRadius: "100px", padding: "8px 14px",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "6px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2E7D52" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#2E7D52", fontFamily: "Inter, sans-serif" }}>Copied!</span>
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1A1A1A", fontFamily: "Inter, sans-serif" }}>Copy link</span>
            </>
          )}
        </button>
      </div>

      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 20px" }}>

        {/* Title + author */}
        <div style={{ paddingTop: "20px", marginBottom: "16px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: "6px" }}>
            {recipe.title}
          </h1>
          {recipe.tiktok_author_handle && (
            <a href={recipe.tiktok_url || "#"} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: "14px", color: "#9B9B9B", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
              @{recipe.tiktok_author_handle} on TikTok
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9B9B9B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          )}
        </div>

        {/* Macro pills */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          {[
            { label: "cal", value: recipe.total_calories, color: "#C0392B", bg: "#FDF2F1" },
            { label: "g Protein", value: Math.round(recipe.total_protein_g), color: "#2E7D52", bg: "#EEF5F1" },
            { label: "g Carbs", value: Math.round(recipe.total_carbs_g), color: "#8B6914", bg: "#FDF8EE" },
            { label: "g Fat", value: Math.round(recipe.total_fat_g), color: "#3D5A8A", bg: "#EEF1F8" },
          ].map((m) => (
            <div key={m.label} style={{ background: m.bg, borderRadius: "10px", padding: "8px 14px", display: "flex", alignItems: "baseline", gap: "2px" }}>
              <span style={{ fontSize: "18px", fontWeight: 800, color: m.color, letterSpacing: "-0.03em", fontFamily: "Inter, sans-serif" }}>{m.value}</span>
              <span style={{ fontSize: "12px", fontWeight: 600, color: m.color, fontFamily: "Inter, sans-serif" }}>{m.label}</span>
            </div>
          ))}
        </div>

        {/* Meta */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "16px" }}>
          {totalTime > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9B9B9B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span style={{ fontSize: "14px", color: "#9B9B9B", fontFamily: "Inter, sans-serif" }}>{totalTime} min</span>
            </div>
          )}
          {recipe.servings > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9B9B9B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span style={{ fontSize: "14px", color: "#9B9B9B", fontFamily: "Inter, sans-serif" }}>{recipe.servings} servings</span>
            </div>
          )}
        </div>

        {/* Description */}
        {recipe.description && (
          <p style={{ fontSize: "14px", color: "#555555", lineHeight: 1.6, marginBottom: "24px" }}>{recipe.description}</p>
        )}

        {/* Ingredients */}
        {recipe.ingredients?.length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.02em", marginBottom: "12px" }}>Ingredients</h2>
            {parts.map((part) => (
              <div key={part.name} style={{ marginBottom: multiPart ? "20px" : "0" }}>
                {multiPart && (
                  <p style={{
                    fontSize: "11px", fontWeight: 800, color: "#9B9B9B",
                    textTransform: "uppercase", letterSpacing: "0.08em",
                    marginBottom: "8px", paddingLeft: "2px",
                  }}>{part.name}</p>
                )}
                {part.ingredients.map((ing: any, idx: number) => (
                  <div key={ing.id} style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    paddingTop: "12px", paddingBottom: "12px",
                    borderBottom: idx < part.ingredients.length - 1 ? "1px solid #F2F2F2" : "none",
                  }}>
                    <p style={{ flex: 1, fontSize: "15px", fontWeight: 500, color: "#1A1A1A", textTransform: "capitalize" }}>{ing.name}</p>
                    <p style={{ fontSize: "14px", color: "#9B9B9B", flexShrink: 0, fontFamily: "Inter, sans-serif" }}>
                      {ing.amount}{ing.unit}
                    </p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        {recipe.instructions?.length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.02em", marginBottom: "16px" }}>Instructions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {recipe.instructions.map((step: string, i: number) => (
                <div key={i} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                  <span style={{
                    width: "28px", height: "28px", borderRadius: "50%",
                    background: "#1A1A1A", color: "white", fontSize: "13px", fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, fontFamily: "Inter, sans-serif",
                  }}>{i + 1}</span>
                  <p style={{ fontSize: "15px", color: "#333333", lineHeight: 1.6, paddingTop: "4px", fontFamily: "Inter, sans-serif" }}>{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {recipe.tags?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
            {recipe.tags.map((tag: string) => (
              <span key={tag} style={{ fontSize: "12px", background: "#F5F5F5", color: "#555555", padding: "5px 12px", borderRadius: "100px", textTransform: "capitalize", fontFamily: "Inter, sans-serif" }}>{tag}</span>
            ))}
          </div>
        )}

        {/* RecipeTok CTA */}
        <div style={{
          background: "#F5F5F5", borderRadius: "20px", padding: "20px",
          textAlign: "center", marginBottom: "32px",
        }}>
          <p style={{ fontSize: "15px", fontWeight: 700, color: "#1A1A1A", marginBottom: "4px", fontFamily: "Inter, sans-serif" }}>
            Save recipes from TikTok
          </p>
          <p style={{ fontSize: "13px", color: "#9B9B9B", marginBottom: "16px", lineHeight: 1.5, fontFamily: "Inter, sans-serif" }}>
            Import any TikTok recipe, track macros, and plan your week with RecipeTok.
          </p>
          <a href="https://recipetok.vercel.app" style={{
            display: "inline-block",
            background: "#1A1A1A", color: "white",
            fontWeight: 800, fontSize: "14px", padding: "12px 24px",
            borderRadius: "12px", textDecoration: "none",
            fontFamily: "Inter, sans-serif", letterSpacing: "-0.01em",
          }}>
            Try RecipeTok →
          </a>
        </div>
      </div>
    </div>
  );
}
