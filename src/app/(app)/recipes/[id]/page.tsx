import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import SwapModal from "@/components/SwapModal";

export default async function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: recipe } = await supabase
    .from("recipes")
    .select(`*, ingredients(*, ingredient_swaps(*))`)
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!recipe) notFound();

  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

  return (
    <div className="pb-8">
      {/* Hero */}
      <div className="relative">
        {recipe.thumbnail_url ? (
          <img src={recipe.thumbnail_url} alt={recipe.title} className="w-full h-52 object-cover" />
        ) : (
          <div className="w-full h-52 bg-orange-50 flex items-center justify-center text-6xl">🍽️</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <Link href="/recipes" className="absolute top-4 left-4 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center text-gray-700 text-lg font-bold shadow">
          ‹
        </Link>
        <div className="absolute bottom-4 left-5 right-5">
          <h1 className="text-white font-extrabold text-xl leading-tight">{recipe.title}</h1>
          {recipe.tiktok_author_handle && (
            <a href={recipe.tiktok_url} target="_blank" rel="noopener noreferrer"
              className="text-white/70 text-xs mt-0.5 block">
              @{recipe.tiktok_author_handle} ↗
            </a>
          )}
        </div>
      </div>

      <div className="px-5 pt-5 space-y-6">
        {/* Macro Summary */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Calories", value: recipe.total_calories, unit: "", color: "bg-orange-50 text-orange-600" },
            { label: "Protein", value: recipe.total_protein_g, unit: "g", color: "bg-green-50 text-green-600" },
            { label: "Carbs", value: recipe.total_carbs_g, unit: "g", color: "bg-blue-50 text-blue-600" },
            { label: "Fat", value: recipe.total_fat_g, unit: "g", color: "bg-yellow-50 text-yellow-600" },
          ].map((m) => (
            <div key={m.label} className={`rounded-xl p-2.5 text-center ${m.color}`}>
              <p className="text-lg font-extrabold leading-none">{Math.round(m.value || 0)}{m.unit}</p>
              <p className="text-xs mt-0.5 opacity-80">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Meta */}
        <div className="flex gap-4 text-sm text-gray-500">
          {recipe.servings > 1 && <span>🍽 {recipe.servings} servings</span>}
          {totalTime > 0 && <span>⏱ {totalTime} min</span>}
        </div>

        {/* Description */}
        {recipe.description && (
          <p className="text-gray-600 text-sm leading-relaxed">{recipe.description}</p>
        )}

        {/* Ingredients */}
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-3">Ingredients</h2>
          <div className="space-y-2">
            {recipe.ingredients?.sort((a: any, b: any) => a.sort_order - b.sort_order).map((ing: any) => (
              <div key={ing.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">{ing.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {ing.amount} {ing.unit} · {ing.calories_per_serving} cal · {ing.protein_g}g P
                    </p>
                  </div>
                  {ing.ingredient_swaps?.length > 0 && (
                    <SwapModal ingredient={ing} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        {recipe.instructions?.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-3">Instructions</h2>
            <div className="space-y-3">
              {recipe.instructions.map((step: string, i: number) => (
                <div key={i} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-500 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {recipe.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {recipe.tags.map((tag: string) => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full capitalize">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
