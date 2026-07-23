"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const CATEGORY_ORDER = ["Protein", "Produce", "Dairy", "Grains", "Pantry", "Other"];
const CATEGORY_ICONS: Record<string, string> = { Protein: "🥩", Produce: "🥦", Dairy: "🥛", Grains: "🌾", Pantry: "🫙", Other: "🛒" };

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

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", color: "#9B9B9B", fontSize: "14px" }}>Loading...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ padding: "20px 20px 16px", background: "white", borderBottom: "1px solid #F2F2F2", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.03em", color: "#1A1A1A", lineHeight: 1.1 }}>
                Grocery List
              </h1>
              {items.length > 0 && (
                <p style={{ color: "#9B9B9B", fontSize: "13px", marginTop: "3px" }}>
                  {remaining} item{remaining !== 1 ? "s" : ""} remaining
                </p>
              )}
            </div>
            {checkedCount > 0 && (
              <button onClick={clearChecked} style={{
                fontSize: "12px", color: "#C0392B", fontWeight: 600,
                background: "#FDF2F1", border: "1px solid rgba(192,57,43,0.15)",
                borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontFamily: "Inter, sans-serif",
              }}>
                Clear {checkedCount} ✓
              </button>
            )}
          </div>
        </div>

        <div style={{ padding: "16px 16px 0" }}>
          {!items.length ? (
            <div style={{ textAlign: "center", paddingTop: "80px" }}>
              <div style={{ fontSize: "56px", marginBottom: "16px" }}>🛒</div>
              <p style={{ color: "#1A1A1A", fontSize: "18px", fontWeight: 700, marginBottom: "6px" }}>No grocery list yet</p>
              <p style={{ color: "#9B9B9B", fontSize: "14px", marginBottom: "28px" }}>Plan your week and generate a list from the Planner</p>
              <a href="/planner" style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                background: "#1A1A1A", color: "white", fontWeight: 700,
                padding: "13px 24px", borderRadius: "12px", textDecoration: "none", fontSize: "14px",
              }}>
                Go to Planner
              </a>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {Object.entries(grouped).map(([category, catItems]) => (
                <div key={category}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "13px" }}>{CATEGORY_ICONS[category]}</span>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.08em" }}>{category}</span>
                  </div>
                  <div style={{ background: "white", border: "1px solid #E8E8E8", borderRadius: "16px", overflow: "hidden" }}>
                    {(catItems as any[]).map((item, idx) => (
                      <button key={item.id} onClick={() => toggleItem(item.id, item.is_checked)} style={{
                        width: "100%", display: "flex", alignItems: "center", gap: "14px",
                        padding: "14px 16px", textAlign: "left", background: "none", border: "none",
                        borderTop: idx > 0 ? "1px solid #F2F2F2" : "none",
                        cursor: "pointer", fontFamily: "Inter, sans-serif",
                      }}>
                        <div style={{
                          width: "22px", height: "22px", borderRadius: "50%",
                          border: `2px solid ${item.is_checked ? "#1A1A1A" : "#E8E8E8"}`,
                          background: item.is_checked ? "#1A1A1A" : "transparent",
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
                            fontSize: "14px", fontWeight: 500, color: item.is_checked ? "#BBBBBB" : "#1A1A1A",
                            textDecoration: item.is_checked ? "line-through" : "none",
                            textTransform: "capitalize",
                          }}>
                            {item.name}
                          </p>
                          {(item.amount || item.unit) && (
                            <p style={{ fontSize: "12px", color: "#9B9B9B", marginTop: "1px" }}>{item.amount} {item.unit}</p>
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
    </div>
  );
}
