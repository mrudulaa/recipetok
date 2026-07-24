import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/utils/supabase/api-auth";

// POST /api/recipe/share — toggle is_public on a recipe and return the share URL
export async function POST(req: NextRequest) {
  try {
    const { user, supabase } = await getApiUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { recipeId, makePublic } = await req.json();
    if (!recipeId) return NextResponse.json({ error: "recipeId required" }, { status: 400 });

    // Verify ownership
    const { data: recipe, error: fetchErr } = await supabase
      .from("recipes")
      .select("id, is_public")
      .eq("id", recipeId)
      .eq("user_id", user.id)
      .single();

    if (fetchErr || !recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    const newPublic = makePublic !== undefined ? makePublic : !recipe.is_public;

    const { error: updateErr } = await supabase
      .from("recipes")
      .update({ is_public: newPublic })
      .eq("id", recipeId)
      .eq("user_id", user.id);

    if (updateErr) throw updateErr;

    const baseUrl = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "https://recipetok.vercel.app";
    const shareUrl = `${baseUrl}/r/${recipeId}`;

    return NextResponse.json({ isPublic: newPublic, shareUrl });
  } catch (err: any) {
    console.error("[recipe/share]", err);
    return NextResponse.json({ error: err.message || "Failed to update share status" }, { status: 500 });
  }
}
