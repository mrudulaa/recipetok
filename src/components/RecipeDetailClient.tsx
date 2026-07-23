"use client";
import { useState } from "react";
import Link from "next/link";
import SwapModal from "./SwapModal";

export default function RecipeDetailClient({ recipe }: { recipe: any }) {
  const totalServings = recipe.servings || 1;
  const [servings, setServings] = useState(1); // default to 1 serving
  const multiplier = servings / totalServings; // scale macros per serving count
  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

  const scale = (val: number | null) => {
    if (!val) return 0;
    return Math.round(val * multiplier * 10) / 10;
  };

  return (
    <div style={{ background: "#ffffff", minHeight: "100vh", paddingBottom: "100px" }}>

      {/* Hero image */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", overflow: "hidden", borderRadius: "0 0 24px 24px" }}>
        {recipe.thumbnail_url ? (
          <img src={recipe.thumbnail_url} alt={recipe.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "64px" }}>🍽️</div>
        )}
        <Link href="/recipes" style={{
          position: "absolute", top: "16px", left: "16px",
          width: "40px", height: "40px", borderRadius: "50%",
          background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          textDecoration: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <button style={{
          position: "absolute", top: "16px", right: "16px",
          width: "40px", height: "40px", borderRadius: "50%",
          background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
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

        {/* Macro pills — scaled by servings */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          {[
            { label: "cal", value: Math.round(scale(recipe.total_calories)), color: "#C0392B", bg: "#FDF2F1" },
            { label: "g Protein", value: Math.round(scale(recipe.total_protein_g)), color: "#2E7D52", bg: "#EEF5F1" },
            { label: "g Carbs", value: Math.round(scale(recipe.total_carbs_g)), color: "#8B6914", bg: "#FDF8EE" },
            { label: "g Fat", value: Math.round(scale(recipe.total_fat_g)), color: "#3D5A8A", bg: "#EEF1F8" },
          ].map((m) => (
            <div key={m.label} style={{ background: m.bg, borderRadius: "10px", padding: "8px 14px", display: "flex", alignItems: "baseline", gap: "2px" }}>
              <span style={{ fontSize: "18px", fontWeight: 800, color: m.color, letterSpacing: "-0.03em", fontFamily: "Inter, sans-serif" }}>{m.value}</span>
              <span style={{ fontSize: "12px", fontWeight: 600, color: m.color, fontFamily: "Inter, sans-serif" }}>{m.label}</span>
            </div>
          ))}
        </div>

        {/* Serving scaler */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#F5F5F5", borderRadius: "14px", padding: "12px 16px", marginBottom: "20px",
        }}>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#1A1A1A" }}>Servings</p>
            <p style={{ fontSize: "12px", color: "#9B9B9B", marginTop: "1px" }}>
              {servings} of {totalServings} · macros scale automatically
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => setServings(Math.max(1, servings - 1))}
              style={{
                width: "32px", height: "32px", borderRadius: "50%",
                background: servings <= 1 ? "#E8E8E8" : "#1A1A1A",
                color: servings <= 1 ? "#BBBBBB" : "white",
                border: "none", cursor: servings <= 1 ? "not-allowed" : "pointer",
                fontSize: "20px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "Inter, sans-serif",
              }}
            >−</button>
            <span style={{ fontSize: "18px", fontWeight: 800, color: "#1A1A1A", minWidth: "32px", textAlign: "center", fontFamily: "Inter, sans-serif" }}>
              {servings}
            </span>
            <button
              onClick={() => setServings(servings + 1)}
              style={{
                width: "32px", height: "32px", borderRadius: "50%",
                background: "#1A1A1A", color: "white",
                border: "none", cursor: "pointer",
                fontSize: "20px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "Inter, sans-serif",
              }}
            >+</button>
          </div>
        </div>

        {/* Meta row */}
        {(recipe.servings > 1 || totalTime > 0) && (
          <div style={{ display: "flex", gap: "20px", marginBottom: "16px" }}>
            {totalTime > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9B9B9B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <span style={{ fontSize: "14px", color: "#9B9B9B", fontFamily: "Inter, sans-serif" }}>{totalTime} min</span>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {recipe.description && (
          <p style={{ fontSize: "14px", color: "#555555", lineHeight: 1.6, marginBottom: "24px" }}>{recipe.description}</p>
        )}

        {/* Ingredients */}
        {recipe.ingredients?.length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.02em", marginBottom: "12px" }}>Ingredients</h2>
            <div>
              {recipe.ingredients
                .sort((a: any, b: any) => a.sort_order - b.sort_order)
                .map((ing: any, idx: number) => {
                  const scaledAmt = Math.round(((ing.amount || 0) * multiplier) * 10) / 10;
                  return (
                    <div key={ing.id} style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      paddingTop: "12px", paddingBottom: "12px",
                      borderBottom: idx < recipe.ingredients.length - 1 ? "1px solid #F2F2F2" : "none",
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "15px", fontWeight: 500, color: "#1A1A1A", textTransform: "capitalize" }}>{ing.name}</p>
                      </div>
                      <p style={{ fontSize: "14px", color: "#9B9B9B", flexShrink: 0, fontFamily: "Inter, sans-serif" }}>
                        {scaledAmt}{ing.unit}
                      </p>
                      {ing.ingredient_swaps?.length > 0 ? (
                        <SwapModal ingredient={ing} />
                      ) : (
                        <div style={{ width: "28px" }} />
                      )}
                    </div>
                  );
                })}
            </div>
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
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
            {recipe.tags.map((tag: string) => (
              <span key={tag} style={{ fontSize: "12px", background: "#F5F5F5", color: "#555555", padding: "5px 12px", borderRadius: "100px", textTransform: "capitalize", fontFamily: "Inter, sans-serif" }}>{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Sticky Log This Meal button */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        padding: "12px 20px",
        paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))",
        background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)",
        borderTop: "1px solid #E8E8E8",
      }}>
        <div style={{ maxWidth: "480px", margin: "0 auto" }}>
          <button style={{
            width: "100%", background: "#1A1A1A", color: "white",
            fontWeight: 800, fontSize: "16px", padding: "16px 24px",
            borderRadius: "14px", border: "none", cursor: "pointer",
            fontFamily: "Inter, sans-serif", letterSpacing: "-0.01em",
          }}>
            Log This Meal
          </button>
        </div>
      </div>
    </div>
  );
}
