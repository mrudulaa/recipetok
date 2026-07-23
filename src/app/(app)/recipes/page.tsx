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
    <div style={{ minHeight: "100vh", background: "#ffffff", paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "4px" }}>
            <div>
              <h1 style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.03em", color: "#1A1A1A", lineHeight: 1.1 }}>
                My Recipes
              </h1>
              <p style={{ color: "#9B9B9B", fontSize: "14px", marginTop: "4px" }}>
                {recipes?.length || 0} saved
              </p>
            </div>
            <Link href="/import" style={{
              background: "#1A1A1A", color: "white", fontWeight: 700,
              padding: "11px 18px", borderRadius: "12px", textDecoration: "none",
              fontSize: "14px", display: "flex", alignItems: "center", gap: "6px",
              fontFamily: "Inter, sans-serif", marginTop: "4px",
            }}>
              Import +
            </Link>
          </div>

          {/* Filter chips */}
          <div style={{ display: "flex", gap: "8px", marginTop: "16px", overflowX: "auto", paddingBottom: "4px", scrollbarWidth: "none" }}>
            {["All", "High Protein", "Low Carb", "Quick", "Vegetarian"].map((chip, i) => (
              <button key={chip} style={{
                padding: "8px 16px", borderRadius: "100px", fontSize: "14px", fontWeight: i === 0 ? 700 : 500,
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
              <p style={{ color: "#1A1A1A", fontSize: "20px", fontWeight: 800, marginBottom: "8px", letterSpacing: "-0.02em" }}>No recipes yet</p>
              <p style={{ color: "#9B9B9B", fontSize: "14px", marginBottom: "28px" }}>
                Import a TikTok cooking video to get started
              </p>
              <Link href="/import" style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                background: "#1A1A1A", color: "white", fontWeight: 700,
                padding: "14px 28px", borderRadius: "14px", textDecoration: "none", fontSize: "15px",
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
                    borderRadius: "16px", overflow: "hidden",
                  }}>
                    {/* Photo */}
                    <div style={{ width: "100%", aspectRatio: "1", background: "#F5F5F5", overflow: "hidden" }}>
                      {r.thumbnail_url ? (
                        <img src={r.thumbnail_url} alt={r.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px" }}>🍽️</div>
                      )}
                    </div>
                    {/* Info */}
                    <div style={{ padding: "10px 12px 12px" }}>
                      <p style={{
                        fontWeight: 700, color: "#1A1A1A", fontSize: "14px", lineHeight: 1.3,
                        marginBottom: "2px", overflow: "hidden",
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                      }}>
                        {r.title}
                      </p>
                      {r.tiktok_author_handle && (
                        <p style={{ fontSize: "11px", color: "#9B9B9B", marginBottom: "8px" }}>@{r.tiktok_author_handle}</p>
                      )}
                      {/* Macro pills */}
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "6px", background: "#FDF2F1", color: "#C0392B" }}>
                          {Math.round(r.total_calories || 0)} CAL
                        </span>
                        <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "6px", background: "#EEF5F1", color: "#2E7D52" }}>
                          {Math.round(r.total_protein_g || 0)}P
                        </span>
                        <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "6px", background: "#FDF8EE", color: "#8B6914" }}>
                          {Math.round(r.total_carbs_g || 0)}C
                        </span>
                        <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "6px", background: "#EEF1F8", color: "#3D5A8A" }}>
                          {Math.round(r.total_fat_g || 0)}F
                        </span>
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
