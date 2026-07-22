"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const CATEGORY_ORDER = ["Protein", "Produce", "Dairy", "Grains", "Pantry", "Other"];
const CATEGORY_ICONS: Record<string, string> = {
  Protein: "🥩", Produce: "🥦", Dairy: "🥛", Grains: "🌾", Pantry: "🫙", Other: "🛒",
};

export default function GroceryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("grocery_items").select("*").eq("user_id", user.id).order("category").order("name");
      setItems(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const toggleItem = async (id: string, checked: boolean) => {
    await supabase.from("grocery_items").update({ is_checked: !checked }).eq("id", id);
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, is_checked: !checked } : i));
  };

  const clearChecked = async () => {
    const checkedIds = items.filter((i) => i.is_checked).map((i) => i.id);
    if (!checkedIds.length) return;
    await supabase.from("grocery_items").delete().in("id", checkedIds);
    setItems((prev) => prev.filter((i) => !i.is_checked));
  };

  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const catItems = items.filter((i) => i.category === cat);
    if (catItems.length) acc[cat] = catItems;
    return acc;
  }, {} as Record<string, any[]>);

  const checkedCount = items.filter((i) => i.is_checked).length;
  const remaining = items.length - checkedCount;

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", color: "#A89880", fontSize: "14px" }}>
      Loading...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#FAF8F4", paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(180deg, #F5EDE0 0%, #FAF8F4 100%)", padding: "20px 20px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <h1 className="serif" style={{ fontSize: "34px", fontWeight: 400, letterSpacing: "-0.02em", color: "#1A1612", lineHeight: 1.1 }}>
              Grocery List
            </h1>
            {items.length > 0 && (
              <p style={{ color: "#A89880", fontSize: "13px", marginTop: "4px" }}>
                {remaining} item{remaining !== 1 ? "s" : ""} remaining
              </p>
            )}
          </div>
          {checkedCount > 0 && (
            <button
              onClick={clearChecked}
              style={{
                fontSize: "12px", color: "#C0392B", fontWeight: 600,
                background: "#FEF2EE", border: "1px solid rgba(192,57,43,0.15)",
                borderRadius: "8px", padding: "6px 12px", cursor: "pointer",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Clear {checkedCount} ✓
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: "12px 16px 0", maxWidth: "480px", margin: "0 auto" }}>
        {!items.length ? (
          <div style={{ textAlign: "center", paddingTop: "80px" }}>
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>🛒</div>
            <p style={{ color: "#1A1612", fontSize: "18px", fontWeight: 600, marginBottom: "6px" }}>No grocery list yet</p>
            <p style={{ color: "#A89880", fontSize: "14px", marginBottom: "28px" }}>
              Plan your week and generate a list from the Planner
            </p>
            <a href="/planner" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "#D4522A", color: "white", fontWeight: 600,
              padding: "13px 24px", borderRadius: "12px", textDecoration: "none", fontSize: "14px",
              boxShadow: "0 4px 16px rgba(212,82,42,0.25)",
            }}>
              Go to Planner
            </a>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {Object.entries(grouped).map(([category, catItems]) => (
              <div key={category}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "14px" }}>{CATEGORY_ICONS[category]}</span>
                  <span className="section-label">{category}</span>
                </div>
                <div style={{
                  background: "white", border: "1px solid #E8E3D8", borderRadius: "18px",
                  overflow: "hidden", boxShadow: "0 1px 4px rgba(26,22,18,0.05)",
                }}>
                  {(catItems as any[]).map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(item.id, item.is_checked)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: "14px",
                        padding: "14px 16px", textAlign: "left", background: "none", border: "none",
                        borderTop: idx > 0 ? "1px solid #F0EDE6" : "none",
                        cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "background 0.1s ease",
                      }}
                    >
                      <div style={{
                        width: "22px", height: "22px", borderRadius: "50%",
                        border: `2px solid ${item.is_checked ? "#D4522A" : "#C4B8A8"}`,
                        background: item.is_checked ? "#D4522A" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, transition: "all 0.15s ease",
                      }}>
                        {item.is_checked && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: "14px", fontWeight: 500, color: item.is_checked ? "#C4B8A8" : "#1A1612",
                          textDecoration: item.is_checked ? "line-through" : "none",
                          textTransform: "capitalize", transition: "all 0.15s ease",
                        }}>
                          {item.name}
                        </p>
                        {(item.amount || item.unit) && (
                          <p style={{ fontSize: "12px", color: "#A89880", marginTop: "1px" }}>
                            {item.amount} {item.unit}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
