"use client";
import { useState } from "react";
import Link from "next/link";
import SwapModal from "./SwapModal";

export default function RecipeDetailClient({ recipe }: { recipe: any }) {
  const totalServings = recipe.servings || 1;
  const [servings, setServings] = useState(1);
  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

  // Group ingredients into parts
  const buildParts = (ings: any[]) => {
    const parts: { name: string; ingredients: any[] }[] = [];
    for (const ing of [...ings].sort((a, b) => a.sort_order - b.sort_order)) {
      const name = ing.part || "Main";
      let p = parts.find((x) => x.name === name);
      if (!p) { p = { name, ingredients: [] }; parts.push(p); }
      p.ingredients.push(ing);
    }
    return parts;
  };

  const [parts, setParts] = useState(() => buildParts(recipe.ingredients || []));
  const multiPart = parts.length > 1;

  // Per-part serving counts (default = 1 for single-part, 1 for each part in multi-part)
  const [partServings, setPartServings] = useState<Record<string, number>>({});
  const getPS = (name: string) => partServings[name] ?? 1;
  const setPS = (name: string, val: number) =>
    setPartServings((prev) => ({ ...prev, [name]: Math.max(0, val) }));

  // Inline quantity overrides: { ingId -> multiplier (0 = removed) }
  const [qtyOverride, setQtyOverride] = useState<Record<string, number | null>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingVal, setEditingVal] = useState("");

  const removeIngredient = (id: string) => {
    setParts((prev) =>
      prev.map((p) => ({ ...p, ingredients: p.ingredients.filter((i) => i.id !== id) }))
    );
    setQtyOverride((prev) => ({ ...prev, [id]: 0 }));
  };

  const startEdit = (ing: any, currentAmt: number) => {
    setEditingId(ing.id);
    setEditingVal(String(currentAmt));
  };

  const commitEdit = (ing: any, partName: string) => {
    const parsed = parseFloat(editingVal);
    if (!isNaN(parsed) && parsed >= 0) {
      const baseAmt = ing.amount || 1;
      const ps = getPS(partName);
      const m = ps / totalServings;
      // Store the ratio vs what the base amount would be at this scale
      const newMultiplier = parsed / (baseAmt * m);
      setQtyOverride((prev) => ({ ...prev, [ing.id]: newMultiplier }));
    }
    setEditingId(null);
  };

  // Compute effective amount for display
  const effectiveAmt = (ing: any, partName: string) => {
    const m = getPS(partName) / totalServings;
    const override = qtyOverride[ing.id];
    if (override !== undefined && override !== null) {
      return Math.round((ing.amount || 0) * m * override * 10) / 10;
    }
    return Math.round((ing.amount || 0) * m * 10) / 10;
  };

  // Effective macro contribution for an ingredient (per-serving)
  const ingMacro = (ing: any, partName: string, field: "calories_per_serving" | "protein_g" | "carbs_g" | "fat_g") => {
    const override = qtyOverride[ing.id];
    const mult = override !== undefined && override !== null ? override : 1;
    const base = field === "calories_per_serving"
      ? (ing.calories_per_serving || 0)
      : Number(ing[field] || 0);
    return base * mult;
  };

  // Part totals (for the selected number of part servings)
  const partTotals = (part: { name: string; ingredients: any[] }) => {
    const ps = getPS(part.name);
    const m = ps / totalServings; // scale from 1-serving base to ps servings
    return part.ingredients.reduce(
      (acc, ing) => {
        const override = qtyOverride[ing.id];
        const qm = override !== undefined && override !== null ? override : 1;
        return {
          cal: acc.cal + (ing.calories_per_serving || 0) * totalServings * m * qm,
          p: acc.p + Number(ing.protein_g || 0) * totalServings * m * qm,
          c: acc.c + Number(ing.carbs_g || 0) * totalServings * m * qm,
          f: acc.f + Number(ing.fat_g || 0) * totalServings * m * qm,
        };
      },
      { cal: 0, p: 0, c: 0, f: 0 }
    );
  };

  // Overall macro pills
  // For single-part: use the single scaler (servings)
  // For multi-part: sum of all parts at their own ps values
  const overallMacros = () => {
    if (!multiPart) {
      const m = servings / totalServings;
      return parts[0]?.ingredients.reduce(
        (acc, ing) => {
          const qm = qtyOverride[ing.id] ?? 1;
          return {
            cal: acc.cal + (ing.calories_per_serving || 0) * totalServings * m * qm,
            p: acc.p + Number(ing.protein_g || 0) * totalServings * m * qm,
            c: acc.c + Number(ing.carbs_g || 0) * totalServings * m * qm,
            f: acc.f + Number(ing.fat_g || 0) * totalServings * m * qm,
          };
        },
        { cal: 0, p: 0, c: 0, f: 0 }
      ) ?? { cal: 0, p: 0, c: 0, f: 0 };
    }
    return parts.reduce(
      (acc, part) => {
        const t = partTotals(part);
        return { cal: acc.cal + t.cal, p: acc.p + t.p, c: acc.c + t.c, f: acc.f + t.f };
      },
      { cal: 0, p: 0, c: 0, f: 0 }
    );
  };

  const overall = overallMacros();

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

        {/* Macro pills — live sum of all parts */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          {[
            { label: "cal", value: Math.round(overall.cal), color: "#C0392B", bg: "#FDF2F1" },
            { label: "g Protein", value: Math.round(overall.p), color: "#2E7D52", bg: "#EEF5F1" },
            { label: "g Carbs", value: Math.round(overall.c), color: "#8B6914", bg: "#FDF8EE" },
            { label: "g Fat", value: Math.round(overall.f), color: "#3D5A8A", bg: "#EEF1F8" },
          ].map((m) => (
            <div key={m.label} style={{ background: m.bg, borderRadius: "10px", padding: "8px 14px", display: "flex", alignItems: "baseline", gap: "2px" }}>
              <span style={{ fontSize: "18px", fontWeight: 800, color: m.color, letterSpacing: "-0.03em", fontFamily: "Inter, sans-serif" }}>{m.value}</span>
              <span style={{ fontSize: "12px", fontWeight: 600, color: m.color, fontFamily: "Inter, sans-serif" }}>{m.label}</span>
            </div>
          ))}
        </div>

        {/* Serving scaler — only shown for single-part recipes */}
        {!multiPart && (
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
        )}

        {/* Meta row */}
        {totalTime > 0 && (
          <div style={{ display: "flex", gap: "20px", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9B9B9B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span style={{ fontSize: "14px", color: "#9B9B9B", fontFamily: "Inter, sans-serif" }}>{totalTime} min</span>
            </div>
          </div>
        )}

        {/* Description */}
        {recipe.description && (
          <p style={{ fontSize: "14px", color: "#555555", lineHeight: 1.6, marginBottom: "24px" }}>{recipe.description}</p>
        )}

        {/* Ingredients — grouped by part, per-part scalers, inline qty editing */}
        {recipe.ingredients?.length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.02em", marginBottom: "12px" }}>Ingredients</h2>
            {parts.map((part) => {
              const ps = getPS(part.name);
              const totals = partTotals(part);
              return (
                <div key={part.name} style={{ marginBottom: multiPart ? "20px" : "0" }}>

                  {/* Part header with scaler */}
                  {multiPart && (
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: "#F5F5F5", borderRadius: "12px", padding: "10px 14px", marginBottom: "4px",
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: "13px", fontWeight: 800, color: "#1A1A1A", textTransform: "uppercase", letterSpacing: "0.06em" }}>{part.name}</p>
                        <p style={{ fontSize: "12px", color: ps === 0 ? "#BBBBBB" : "#9B9B9B", marginTop: "1px", fontFamily: "Inter, sans-serif" }}>
                          {ps === 0 ? "Skipped — not counted" : `${Math.round(totals.cal)} cal · ${Math.round(totals.p)}g P total`}
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                        <button
                          onClick={() => setPS(part.name, ps - 1)}
                          style={{
                            width: "28px", height: "28px", borderRadius: "50%",
                            background: ps <= 0 ? "#E8E8E8" : "#1A1A1A",
                            color: ps <= 0 ? "#BBBBBB" : "white",
                            border: "none", cursor: ps <= 0 ? "not-allowed" : "pointer",
                            fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                            fontFamily: "Inter, sans-serif",
                          }}
                        >−</button>
                        <span style={{ fontSize: "15px", fontWeight: 800, color: ps === 0 ? "#BBBBBB" : "#1A1A1A", minWidth: "24px", textAlign: "center", fontFamily: "Inter, sans-serif" }}>
                          {ps}×
                        </span>
                        <button
                          onClick={() => setPS(part.name, ps + 1)}
                          style={{
                            width: "28px", height: "28px", borderRadius: "50%",
                            background: "#1A1A1A", color: "white",
                            border: "none", cursor: "pointer",
                            fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                            fontFamily: "Inter, sans-serif",
                          }}
                        >+</button>
                      </div>
                    </div>
                  )}

                  {/* Ingredient rows */}
                  {ps === 0 && multiPart ? null : (
                    part.ingredients.map((ing: any, idx: number) => {
                      const amt = effectiveAmt(ing, part.name);
                      const isEditing = editingId === ing.id;
                      return (
                        <div key={ing.id} style={{
                          display: "flex", alignItems: "center", gap: "10px",
                          paddingTop: "11px", paddingBottom: "11px",
                          borderBottom: idx < part.ingredients.length - 1 ? "1px solid #F2F2F2" : "none",
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: "15px", fontWeight: 500, color: "#1A1A1A", textTransform: "capitalize" }}>{ing.name}</p>
                          </div>

                          {/* Tappable amount — becomes input on tap */}
                          {isEditing ? (
                            <input
                              autoFocus
                              type="number"
                              value={editingVal}
                              onChange={(e) => setEditingVal(e.target.value)}
                              onBlur={() => commitEdit(ing, part.name)}
                              onKeyDown={(e) => e.key === "Enter" && commitEdit(ing, part.name)}
                              style={{
                                width: "72px", textAlign: "right", fontSize: "14px", fontWeight: 700,
                                color: "#1A1A1A", border: "1.5px solid #1A1A1A", borderRadius: "8px",
                                padding: "4px 8px", fontFamily: "Inter, sans-serif", background: "white",
                                outline: "none",
                              }}
                            />
                          ) : (
                            <button
                              onClick={() => startEdit(ing, amt)}
                              style={{
                                background: "none", border: "none", cursor: "pointer", padding: "0",
                                display: "flex", alignItems: "center", gap: "2px",
                              }}
                              title="Tap to edit quantity"
                            >
                              <span style={{ fontSize: "14px", color: "#9B9B9B", fontFamily: "Inter, sans-serif" }}>
                                {amt}{ing.unit}
                              </span>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#BBBBBB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "2px" }}>
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                          )}

                          {/* Swap icon */}
                          {ing.ingredient_swaps?.length > 0 ? (
                            <SwapModal ingredient={ing} />
                          ) : (
                            /* Trash icon to remove ingredient */
                            <button
                              onClick={() => removeIngredient(ing.id)}
                              style={{
                                width: "28px", height: "28px", borderRadius: "8px",
                                background: "#FDF2F1", border: "none", cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0,
                              }}
                              title="Remove ingredient"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
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
