import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function RecipesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, title, tiktok_author_handle, thumbnail_url, total_calories, total_protein_g, total_carbs_g, total_fat_g, tags, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{
          padding: "20px 20px 16px",
          background: "white",
          borderBottom: "1px solid #F2F2F2",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.03em", color: "#1A1A1A", lineHeight: 1.1 }}>
                My Recipes
              </h1>
              <p style={{ color: "#9B9B9B", fontSize: "13px", marginTop: "3px" }}>
                {recipes?.length || 0} saved
              </p>
            </div>
            <Link href="/import" style={{
              background: "#1A1A1A", color: "white", fontWeight: 700,
              padding: "9px 16px", borderRadius: "10px", textDecoration: "none",
              fontSize: "13px", display: "flex", alignItems: "center", gap: "6px",
              fontFamily: "Inter, sans-serif",
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Import
            </Link>
          </div>

          {/* Filter chips */}
          <div style={{ display: "flex", gap: "8px", marginTop: "14px", overflowX: "auto", paddingBottom: "2px" }}>
            {["All", "High Protein", "Low Carb", "Quick", "Vegetarian"].map((chip, i) => (
              <button key={chip} style={{
                padding: "6px 14px", borderRadius: "100px", fontSize: "13px", fontWeight: 500,
                whiteSpace: "nowrap", cursor: "pointer", border: "1.5px solid",
                borderColor: i === 0 ? "#1A1A1A" : "#E8E8E8",
                background: i === 0 ? "#1A1A1A" : "white",
                color: i === 0 ? "white" : "#1A1A1A",
                fontFamily: "Inter, sans-serif",
              }}>
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Recipe grid */}
        <div style={{ padding: "16px 16px 0" }}>
          {!recipes?.length ? (
            <div style={{ textAlign: "center", paddingTop: "80px" }}>
              <div style={{ fontSize: "56px", marginBottom: "16px" }}>📖</div>
              <p style={{ color: "#1A1A1A", fontSize: "18px", fontWeight: 700, marginBottom: "6px" }}>No recipes yet</p>
              <p style={{ color: "#9B9B9B", fontSize: "14px", marginBottom: "28px" }}>
                Import a TikTok cooking video to get started
              </p>
              <Link href="/import" style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                background: "#1A1A1A", color: "white", fontWeight: 700,
                padding: "13px 24px", borderRadius: "12px", textDecoration: "none", fontSize: "14px",
              }}>
                Import your first recipe
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {recipes.map((r) => (
                <Link key={r.id} href={`/recipes/${r.id}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    background: "white", border: "1px solid #E8E8E8",
                    borderRadius: "16px", overflow: "hidden", cursor: "pointer",
                  }}>
                    {r.thumbnail_url ? (
                      <img src={r.thumbnail_url} alt={r.title} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
                    ) : (
                      <div style={{ width: "100%", aspectRatio: "1", background: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px" }}>🍽️</div>
                    )}
                    <div style={{ padding: "10px 12px 12px" }}>
                      <p style={{ fontWeight: 700, color: "#1A1A1A", fontSize: "13px", lineHeight: 1.3, marginBottom: "3px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {r.title}
                      </p>
                      {r.tiktok_author_handle && (
                        <p style={{ fontSize: "11px", color: "#9B9B9B", marginBottom: "8px" }}>@{r.tiktok_author_handle}</p>
                      )}
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        <MacroPill label="cal" value={r.total_calories} color="#C0392B" bg="#FDF2F1" />
                        <MacroPill label="P" value={r.total_protein_g} unit="g" color="#2E7D52" bg="#EEF5F1" />
                        <MacroPill label="C" value={r.total_carbs_g} unit="g" color="#8B6914" bg="#FDF8EE" />
                        <MacroPill label="F" value={r.total_fat_g} unit="g" color="#3D5A8A" bg="#EEF1F8" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MacroPill({ label, value, unit = "", color, bg }: { label: string; value: any; unit?: string; color: string; bg: string }) {
  return (
    <span style={{
      fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "6px",
      background: bg, color, fontFamily: "Inter, sans-serif",
    }}>
      {label} {Math.round(value || 0)}{unit}
    </span>
  );
}
