import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/utils/supabase/api-auth";
import { createOpenAIClient } from "@/utils/openai-client";

export async function POST(req: NextRequest) {
  try {
    const { user, supabase } = await getApiUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { targetCalories, targetProtein, mealType, dietaryNotes } = await req.json();

    const { client: openai, model } = createOpenAIClient();

    const prompt = `Generate a simple, healthy ${mealType || "meal"} recipe that fits these macro targets:
- Calories: approximately ${targetCalories} cal
- Protein: approximately ${targetProtein}g
${dietaryNotes ? `- Notes: ${dietaryNotes}` : ""}

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{
  "title": "Recipe Name",
  "description": "One sentence description",
  "servings": 1,
  "prep_time_minutes": 10,
  "cook_time_minutes": 15,
  "total_calories": 400,
  "total_protein_g": 35,
  "total_carbs_g": 30,
  "total_fat_g": 12,
  "ingredients": [
    {"name": "chicken breast", "amount": 150, "unit": "g", "calories": 165, "protein_g": 31, "carbs_g": 0, "fat_g": 3.6}
  ],
  "instructions": ["Step 1", "Step 2"],
  "tags": ["high-protein", "quick"]
}`;

    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 800,
    });

    let content = completion.choices?.[0]?.message?.content || "";
    // Strip markdown code blocks if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let recipe;
    try {
      recipe = JSON.parse(content);
    } catch {
      return NextResponse.json({ error: "AI returned invalid recipe format" }, { status: 500 });
    }

    // Save to database
    const { data: savedRecipe, error: dbError } = await supabase
      .from("recipes")
      .insert({
        user_id: user.id,
        title: recipe.title,
        description: recipe.description,
        servings: recipe.servings || 1,
        prep_time_minutes: recipe.prep_time_minutes,
        cook_time_minutes: recipe.cook_time_minutes,
        total_calories: recipe.total_calories,
        total_protein_g: recipe.total_protein_g,
        total_carbs_g: recipe.total_carbs_g,
        total_fat_g: recipe.total_fat_g,
        instructions: recipe.instructions || [],
        tags: [...(recipe.tags || []), "ai-generated"],
        tiktok_url: null,
        tiktok_author_handle: "AI Generated",
        thumbnail_url: null,
      })
      .select()
      .single();

    if (dbError || !savedRecipe) {
      return NextResponse.json({ error: "Failed to save recipe" }, { status: 500 });
    }

    // Save ingredients
    if (recipe.ingredients?.length > 0) {
      await supabase.from("ingredients").insert(
        recipe.ingredients.map((ing: any, idx: number) => ({
          recipe_id: savedRecipe.id,
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit || "",
          calories: ing.calories || 0,
          protein_g: ing.protein_g || 0,
          carbs_g: ing.carbs_g || 0,
          fat_g: ing.fat_g || 0,
          sort_order: idx,
        }))
      );
    }

    return NextResponse.json({ recipe: savedRecipe });
  } catch (err: any) {
    console.error("[ai-swap] Error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Failed to generate recipe" }, { status: 500 });
  }
}
