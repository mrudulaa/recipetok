"use client";
import { useState } from "react";

const BENEFIT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  higher_protein: { label: "↑ Protein", color: "#2E7D52", bg: "#EEF5F1" },
  lower_carb: { label: "↓ Carbs", color: "#8B6914", bg: "#FDF8EE" },
  lower_calorie: { label: "↓ Calories", color: "#C0392B", bg: "#FDF2F1" },
  lower_fat: { label: "↓ Fat", color: "#3D5A8A", bg: "#EEF1F8" },
  dairy_free: { label: "Dairy-free", color: "#6B3FA0", bg: "#F3EEF8" },
  vegan: { label: "Vegan", color: "#2E7D52", bg: "#EEF5F1" },
};

export default function SwapModal({ ingredient }: { ingredient: any }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Swap icon button — green ↔ arrows */}
      <button
        onClick={() => setOpen(true)}
        style={{
          width: "28px", height: "28px", borderRadius: "8px",
          background: "#EEF5F1", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2E7D52" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
          <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
        </svg>
      </button>

      {open && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={() => setOpen(false)}
        >
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
          <div
            style={{
              position: "relative", background: "white", borderRadius: "24px 24px 0 0",
              width: "100%", maxWidth: "480px", padding: "20px 20px 40px",
              maxHeight: "75vh", display: "flex", flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: "36px", height: "4px", background: "#E8E8E8", borderRadius: "2px", margin: "0 auto 20px" }} />
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#1A1A1A", marginBottom: "4px", letterSpacing: "-0.02em", textTransform: "capitalize" }}>
              Swap: {ingredient.name}
            </h3>
            <p style={{ fontSize: "13px", color: "#9B9B9B", marginBottom: "20px", fontFamily: "Inter, sans-serif" }}>
              Original: {ingredient.amount}{ingredient.unit} · {ingredient.calories_per_serving} cal · {ingredient.protein_g}g P
            </p>

            <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
              {ingredient.ingredient_swaps.map((swap: any) => {
                const benefit = BENEFIT_LABELS[swap.goal_benefit] || { label: swap.goal_benefit, color: "#555555", bg: "#F5F5F5" };
                return (
                  <div key={swap.id} style={{
                    background: "#FAFAFA", border: "1px solid #E8E8E8",
                    borderRadius: "14px", padding: "14px 16px",
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "6px" }}>
                      <p style={{ fontSize: "15px", fontWeight: 700, color: "#1A1A1A", textTransform: "capitalize" }}>{swap.swap_name}</p>
                      <span style={{
                        fontSize: "11px", fontWeight: 700, padding: "3px 8px",
                        borderRadius: "6px", flexShrink: 0,
                        background: benefit.bg, color: benefit.color,
                        fontFamily: "Inter, sans-serif",
                      }}>
                        {benefit.label}
                      </span>
                    </div>
                    <p style={{ fontSize: "13px", color: "#9B9B9B", marginBottom: "6px", fontFamily: "Inter, sans-serif" }}>
                      {swap.swap_amount}{swap.swap_unit} · {swap.calories_per_serving} cal · {swap.protein_g}g P · {swap.carbs_g}g C · {swap.fat_g}g F
                    </p>
                    {swap.reason && (
                      <p style={{ fontSize: "13px", color: "#555555", lineHeight: 1.5, fontFamily: "Inter, sans-serif" }}>{swap.reason}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setOpen(false)}
              style={{
                marginTop: "16px", width: "100%", padding: "14px",
                background: "white", border: "1.5px solid #E8E8E8",
                borderRadius: "12px", color: "#1A1A1A", fontWeight: 600,
                fontSize: "14px", cursor: "pointer", fontFamily: "Inter, sans-serif",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
