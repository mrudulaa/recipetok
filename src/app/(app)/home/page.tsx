import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: recipes }, { data: goals }] = await Promise.all([
    supabase.from("recipes").select("id, title, tiktok_author_handle, thumbnail_url, total_calories, total_protein_g, total_carbs_g, total_fat_g").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(10),
    supabase.from("user_goals").select("*").eq("user_id", user!.id).single(),
  ]);

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const featured = recipes?.[0] || null;
  const recent = recipes?.slice(1, 4) || [];

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>

        {/* Top bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px 8px",
        }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: "#1A1A1A", display: "flex", alignItems: "center",
            justifyContent: "center", color: "white", fontWeight: 800, fontSize: "14px",
          }}>
            {firstName[0]?.toUpperCase()}
          </div>
          <span style={{ fontSize: "17px", fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.02em" }}>RecipeTok</span>
          <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
        </div>

        {/* Greeting */}
        <div style={{ padding: "12px 20px 0" }}>
          <p style={{ fontSize: "26px", fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            {greeting}, {firstName}
          </p>
          <p style={{ fontSize: "14px", color: "#9B9B9B", marginTop: "4px" }}>Here is your nutrition summary</p>
        </div>

        {/* Macro stats */}
        {goals && (
          <div style={{ padding: "16px 20px 0", display: "flex", gap: "8px" }}>
            {[
              { label: "calories", value: 0, goal: goals.daily_calories, color: "#2E7D52", barColor: "#2E7D52" },
              { label: "protein", value: 0, goal: goals.daily_protein, unit: "g", color: "#3D5A8A", barColor: "#3D5A8A" },
              { label: "carbs", value: 0, goal: goals.daily_carbs, unit: "g", color: "#8B6914", barColor: "#8B6914" },
              { label: "fat", value: 0, goal: goals.daily_fat, unit: "g", color: "#C0392B", barColor: "#F59E0B" },
            ].map((m) => (
              <div key={m.label} style={{ flex: 1, background: "#F5F5F5", borderRadius: "14px", padding: "12px 10px" }}>
                <p style={{ fontSize: "20px", fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.03em", lineHeight: 1 }}>
                  {m.value}{m.unit || ""}
                </p>
                <p style={{ fontSize: "10px", color: "#9B9B9B", marginTop: "3px", fontWeight: 500 }}>{m.label}</p>
                <div style={{ marginTop: "8px", height: "3px", background: "#E8E8E8", borderRadius: "2px" }}>
                  <div style={{ width: "0%", height: "100%", background: m.barColor, borderRadius: "2px" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Featured Recipe */}
        {featured && (
          <div style={{ padding: "24px 20px 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontSize: "17px", fontWeight: 700, color: "#1A1A1A", letterSpacing: "-0.01em" }}>Featured Recipe</span>
              <Link href="/recipes" style={{ fontSize: "13px", color: "#3D7A5F", fontWeight: 500, textDecoration: "none" }}>See all &rsaquo;</Link>
            </div>
            <Link href={`/recipes/${featured.id}`} style={{ textDecoration: "none", display: "block" }}>
              <div style={{ position: "relative", borderRadius: "20px", overflow: "hidden", aspectRatio: "16/9" }}>
                {featured.thumbnail_url ? (
                  <img src={featured.thumbnail_url} alt={featured.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "48px" }}>🍽️</div>
                )}
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  padding: "32px 16px 16px",
                  background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
                }}>
                  <p style={{ color: "white", fontWeight: 800, fontSize: "18px", letterSpacing: "-0.02em", lineHeight: 1.2 }}>{featured.title}</p>
                  {featured.tiktok_author_handle && (
                    <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", marginTop: "3px" }}>@{featured.tiktok_author_handle}</p>
                  )}
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Recent Recipes */}
        {recent.length > 0 && (
          <div style={{ padding: "24px 0 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", padding: "0 20px" }}>
              <span style={{ fontSize: "17px", fontWeight: 700, color: "#1A1A1A", letterSpacing: "-0.01em" }}>Recent Recipes</span>
              <Link href="/recipes" style={{ fontSize: "13px", color: "#3D7A5F", fontWeight: 500, textDecoration: "none" }}>See all &rsaquo;</Link>
            </div>
            <div style={{ display: "flex", gap: "12px", overflowX: "auto", padding: "0 20px 4px", scrollbarWidth: "none" }}>
              {recent.map((r) => (
                <Link key={r.id} href={`/recipes/${r.id}`} style={{ textDecoration: "none", flexShrink: 0 }}>
                  <div style={{ width: "140px" }}>
                    <div style={{ width: "140px", height: "140px", borderRadius: "14px", overflow: "hidden", background: "#F5F5F5", marginBottom: "8px" }}>
                      {r.thumbnail_url ? (
                        <img src={r.thumbnail_url} alt={r.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px" }}>🍽️</div>
                      )}
                    </div>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#1A1A1A", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{r.title}</p>
                    <p style={{ fontSize: "11px", color: "#9B9B9B", marginTop: "2px" }}>{r.total_calories} cal</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!featured && (
          <div style={{ padding: "48px 20px 0", textAlign: "center" }}>
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>🎵</div>
            <p style={{ fontSize: "20px", fontWeight: 800, color: "#1A1A1A", marginBottom: "8px", letterSpacing: "-0.02em" }}>No recipes yet</p>
            <p style={{ fontSize: "14px", color: "#9B9B9B", marginBottom: "28px" }}>Import your first TikTok cooking video to get started</p>
            <Link href="/import" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "#1A1A1A", color: "white", fontWeight: 700,
              padding: "14px 28px", borderRadius: "14px", textDecoration: "none", fontSize: "15px",
            }}>
              Import a Recipe →
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
