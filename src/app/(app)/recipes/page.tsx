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
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-primary)",
      paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
      position: "relative",
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "fixed", top: "-80px", left: "50%", transform: "translateX(-50%)",
        width: "400px", height: "300px",
        background: "radial-gradient(ellipse, rgba(232,119,58,0.07) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "480px", margin: "0 auto", padding: "20px 16px 0" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "20px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-primary)", lineHeight: 1.1 }}>
              My Recipes
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>
              {recipes?.length || 0} saved
            </p>
          </div>
          <Link href="/import" style={{
            background: "var(--accent)", color: "white", fontWeight: 600,
            padding: "8px 16px", borderRadius: "10px", textDecoration: "none",
            fontSize: "13px", display: "flex", alignItems: "center", gap: "6px",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Import
          </Link>
        </div>

        {!recipes?.length ? (
          <div style={{ textAlign: "center", paddingTop: "80px", paddingBottom: "40px" }}>
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>📖</div>
            <p style={{ color: "var(--text-secondary)", fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>No recipes yet</p>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "24px" }}>
              Import a TikTok cooking video to get started
            </p>
            <Link href="/import" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "var(--accent)", color: "white", fontWeight: 600,
              padding: "12px 24px", borderRadius: "12px", textDecoration: "none", fontSize: "14px",
            }}>
              Import your first recipe
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {recipes.map((r) => (
              <Link key={r.id} href={`/recipes/${r.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  background: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "18px",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "14px",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
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
                      background: "rgba(232,119,58,0.12)", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "26px",
                    }}>🍽️</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontWeight: 600, color: "var(--text-primary)", fontSize: "14px",
                      lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {r.title}
                    </p>
                    {r.tiktok_author_handle && (
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                        @{r.tiktok_author_handle}
                      </p>
                    )}
                    <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                      <MacroPill label="cal" value={r.total_calories} color="#E8773A" />
                      <MacroPill label="P" value={r.total_protein_g} unit="g" color="#5CB87A" />
                      <MacroPill label="C" value={r.total_carbs_g} unit="g" color="#E8B73A" />
                      <MacroPill label="F" value={r.total_fat_g} unit="g" color="#7A8EE8" />
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(245,237,214,0.25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
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

function MacroPill({ label, value, unit = "", color }: { label: string; value: any; unit?: string; color: string }) {
  return (
    <span style={{
      fontSize: "11px",
      fontWeight: 600,
      padding: "3px 8px",
      borderRadius: "6px",
      background: `${color}18`,
      color: color,
      border: `1px solid ${color}30`,
    }}>
      {label} {Math.round(value || 0)}{unit}
    </span>
  );
}
