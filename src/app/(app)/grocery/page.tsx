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
    <div style={{ minHeight: "100vh", background: "#ffffff", paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "4px" }}>
            <div>
              <h1 style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.03em", color: "#1A1A1A", lineHeight: 1.1 }}>
                Grocery List
              </h1>
              {items.length > 0 && (
                <p style={{ color: "#9B9B9B", fontSize: "14px", marginTop: "4px" }}>
                  {remaining} item{remaining !== 1 ? "s" : ""} remaining
                </p>
              )}
            </div>
            {checkedCount > 0 && (
              <button onClick={clearChecked} style={{
                fontSize: "14px", color: "#C0392B", fontWeight: 600,
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "Inter, sans-serif", marginTop: "6px",
              }}>
                Clear {checkedCount} done
              </button>
            )}
          </div>
        </div>

        <div style={{ padding: "20px 16px 0" }}>
          {!items.length ? (
            <div style={{ textAlign: "center", paddingTop: "80px" }}>
              <div style={{ fontSize: "56px", marginBottom: "16px" }}>🛒</div>
              <p style={{ color: "#1A1A1A", fontSize: "20px", fontWeight: 800, marginBottom: "8px", letterSpacing: "-0.02em" }}>No grocery list yet</p>
              <p style={{ color: "#9B9B9B", fontSize: "14px", marginBottom: "28px" }}>Plan your week and generate a list from the Planner</p>
              <a href="/planner" style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                background: "#1A1A1A", color: "white", fontWeight: 700,
                padding: "14px 28px", borderRadius: "14px", textDecoration: "none", fontSize: "15px",
              }}>
                Go to Planner
              </a>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {Object.entries(grouped).map(([category, catItems]) => (
                <div key={category}>
                  {/* Category label */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    <span style={{ fontSize: "18px" }}>{CATEGORY_ICONS[category]}</span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.1em" }}>{category}</span>
                  </div>
                  {/* Items card */}
                  <div style={{ background: "white", border: "1px solid #E8E8E8", borderRadius: "16px", overflow: "hidden" }}>
                    {(catItems as any[]).map((item, idx) => (
                      <button key={item.id} onClick={() => toggleItem(item.id, item.is_checked)} style={{
                        width: "100%", display: "flex", alignItems: "center", gap: "16px",
                        padding: "16px 16px", textAlign: "left", background: "none", border: "none",
                        borderTop: idx > 0 ? "1px solid #F2F2F2" : "none",
                        cursor: "pointer", fontFamily: "Inter, sans-serif",
                      }}>
                        {/* Checkbox */}
                        <div style={{
                          width: "24px", height: "24px", borderRadius: "50%",
                          border: `2px solid ${item.is_checked ? "#1A1A1A" : "#D0D0D0"}`,
                          background: item.is_checked ? "#1A1A1A" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0, transition: "all 0.15s ease",
                        }}>
                          {item.is_checked && (
                            <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                              <path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        {/* Name */}
                        <p style={{
                          flex: 1, fontSize: "15px", fontWeight: 500,
                          color: item.is_checked ? "#BBBBBB" : "#1A1A1A",
                          textDecoration: item.is_checked ? "line-through" : "none",
                          textTransform: "capitalize", textAlign: "left",
                        }}>
                          {item.name}
                        </p>
                        {/* Amount */}
                        {(item.amount || item.unit) && (
                          <p style={{ fontSize: "14px", color: item.is_checked ? "#BBBBBB" : "#9B9B9B", flexShrink: 0 }}>
                            {item.amount}{item.unit ? ` ${item.unit}` : ""}
                          </p>
                        )}
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
