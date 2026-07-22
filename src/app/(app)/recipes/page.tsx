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
    <div className="px-5 pt-12 pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">My Recipes</h1>
        <span className="text-sm text-gray-400">{recipes?.length || 0} saved</span>
      </div>

      {!recipes?.length ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📖</div>
          <p className="text-gray-500 text-sm">No recipes yet.</p>
          <p className="text-gray-400 text-xs mt-1">Import a TikTok video to get started.</p>
          <Link href="/import" className="inline-block mt-4 bg-orange-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl">
            Import a recipe
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {recipes.map((r) => (
            <Link key={r.id} href={`/recipes/${r.id}`}>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex items-center gap-3 p-3 active:scale-[0.98] transition-transform">
                {r.thumbnail_url ? (
                  <img src={r.thumbnail_url} alt={r.title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-orange-50 flex items-center justify-center text-2xl flex-shrink-0">🍽️</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{r.title}</p>
                  {r.tiktok_author_handle && (
                    <p className="text-xs text-gray-400 mt-0.5">@{r.tiktok_author_handle}</p>
                  )}
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    <MacroPill label="cal" value={r.total_calories} color="orange" />
                    <MacroPill label="P" value={r.total_protein_g} unit="g" color="green" />
                    <MacroPill label="C" value={r.total_carbs_g} unit="g" color="blue" />
                    <MacroPill label="F" value={r.total_fat_g} unit="g" color="yellow" />
                  </div>
                </div>
                <span className="text-gray-300 text-lg flex-shrink-0">›</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MacroPill({ label, value, unit = "", color }: { label: string; value: any; unit?: string; color: string }) {
  const colors: Record<string, string> = {
    orange: "bg-orange-50 text-orange-600",
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    yellow: "bg-yellow-50 text-yellow-600",
  };
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${colors[color]}`}>
      {label} {Math.round(value || 0)}{unit}
    </span>
  );
}
