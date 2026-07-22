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
    <div style={{ minHeight: "100vh", background: "#FAF8F4", paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(180deg, #F5EDE0 0%, #FAF8F4 100%)",
        padding: "20px 20px 20px",
      }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <h1 className="serif" style={{
              fontSize: "34px", fontWeight: 400, letterSpacing: "-0.02em",
              color: "#1A1612", lineHeight: 1.1,
            }}>
              My Recipes
            </h1>
            <p style={{ color: "#A89880", fontSize: "13px", marginTop: "4px" }}>
              {recipes?.length || 0} saved
            </p>
          </div>
          <Link href="/import" style={{
            background: "#D4522A", color: "white", fontWeight: 600,
            padding: "9px 16px", borderRadius: "10px", textDecoration: "none",
            fontSize: "13px", display: "flex", alignItems: "center", gap: "6px",
            boxShadow: "0 2px 8px rgba(212,82,42,0.2)",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Import
          </Link>
        </div>
      </div>

      <div style={{ padding: "12px 16px 0", maxWidth: "480px", margin: "0 auto" }}>
        {!recipes?.length ? (
          <div style={{ textAlign: "center", paddingTop: "80px" }}>
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>📖</div>
            <p style={{ color: "#1A1612", fontSize: "18px", fontWeight: 600, marginBottom: "6px" }}>No recipes yet</p>
            <p style={{ color: "#A89880", fontSize: "14px", marginBottom: "28px" }}>
              Import a TikTok cooking video to get started
            </p>
            <Link href="/import" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "#D4522A", color: "white", fontWeight: 600,
              padding: "13px 24px", borderRadius: "12px", textDecoration: "none", fontSize: "14px",
              boxShadow: "0 4px 16px rgba(212,82,42,0.25)",
            }}>
              Import your first recipe
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {recipes.map((r) => (
              <Link key={r.id} href={`/recipes/${r.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  background: "white",
                  border: "1px solid #E8E3D8",
                  borderRadius: "18px",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "14px",
                  transition: "all 0.15s ease",
                  cursor: "pointer",
                  boxShadow: "0 1px 4px rgba(26,22,18,0.05)",
                }}>
                  {r.thumbnail_url ? (
                    <img
                      src={r.thumbnail_url}
                      alt={r.title}
                      style={{ width: "64px", height: "64px", borderRadius: "12px", objectFit: "cover", flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{
                      width: "64px", height: "64px", borderRadius: "12px", flexShrink: 0,
                      background: "#FEF2EE", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "26px",
                    }}>🍽️</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontWeight: 600, color: "#1A1612", fontSize: "14px",
                      lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {r.title}
                    </p>
                    {r.tiktok_author_handle && (
                      <p style={{ fontSize: "11px", color: "#A89880", marginTop: "2px" }}>
                        @{r.tiktok_author_handle}
                      </p>
                    )}
                    <div style={{ display: "flex", gap: "5px", marginTop: "8px", flexWrap: "wrap" }}>
                      <MacroPill label="cal" value={r.total_calories} color="#D4522A" bg="#FEF2EE" />
                      <MacroPill label="P" value={r.total_protein_g} unit="g" color="#4A7C59" bg="#EEF5F1" />
                      <MacroPill label="C" value={r.total_carbs_g} unit="g" color="#B8860B" bg="#FDF8EC" />
                      <MacroPill label="F" value={r.total_fat_g} unit="g" color="#5B6FA8" bg="#EEF0F8" />
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C4B8A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MacroPill({ label, value, unit = "", color, bg }: { label: string; value: any; unit?: string; color: string; bg: string }) {
  return (
    <span style={{
      fontSize: "11px",
      fontWeight: 600,
      padding: "3px 8px",
      borderRadius: "6px",
      background: bg,
      color: color,
      fontFamily: "Inter, sans-serif",
    }}>
      {label} {Math.round(value || 0)}{unit}
    </span>
  );
}
