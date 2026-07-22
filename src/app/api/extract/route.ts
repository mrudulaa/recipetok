import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/utils/supabase/server";

// Fetch TikTok oEmbed metadata
async function fetchTikTokMeta(url: string) {
  const cleanUrl = url.split("?")[0];
  const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(cleanUrl)}`);
  if (!res.ok) throw new Error("Could not fetch TikTok metadata");
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    // Use Manus built-in LLM forge (works in sandbox without external API key)
    const forgeUrl = process.env.BUILT_IN_FORGE_API_URL;
    const forgeKey = process.env.BUILT_IN_FORGE_API_KEY;
    const openai = new OpenAI({
      apiKey: forgeKey || process.env.RECIPETOK_OPENAI_KEY,
      baseURL: forgeUrl ? `${forgeUrl}/v1` : undefined,
    });

    const supabase = await createClient();

    // Support both cookie-based auth and Bearer token auth
    const authHeader = req.headers.get("authorization");
    let user: any = null;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { data } = await supabase.auth.getUser(token);
      user = data.user;
    } else {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    }
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { url } = await req.json();
    if (!url || !url.includes("tiktok.com")) {
      return NextResponse.json({ error: "Please provide a valid TikTok URL" }, { status: 400 });
    }

    // Fetch TikTok metadata
    const meta = await fetchTikTokMeta(url);
    const videoTitle = meta.title || "";
    const authorName = meta.author_name || "";
    const authorHandle = meta.author_unique_id || "";
    const thumbnail = meta.thumbnail_url || "";

    // Get user goals for context
    const { data: goals } = await supabase
      .from("user_goals")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const goalContext = goals
      ? `The user's daily goals are: ${goals.daily_calories} calories, ${goals.daily_protein}g protein, ${goals.daily_carbs}g carbs, ${goals.daily_fat}g fat. Goal type: ${goals.goal_type}.`
      : "The user is focused on high protein eating.";

    // Use GPT-4o to extract the recipe from the video title/caption
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 4000,
      messages: [
        {
          role: "system",
          content: `You are a nutrition expert and recipe parser. Extract a complete recipe from a TikTok video title/caption. 
${goalContext}

You MUST respond with ONLY a valid JSON object — no markdown, no code blocks, no explanation. Start your response with { and end with }.

Return a JSON object with this exact structure:
{
  "title": "Recipe name",
  "description": "1-2 sentence description",
  "servings": 2,
  "prep_time_minutes": 10,
  "cook_time_minutes": 20,
  "instructions": ["Step 1...", "Step 2...", "Step 3..."],
  "tags": ["high-protein", "quick", "dinner"],
  "ingredients": [
    {
      "name": "chicken breast",
      "amount": 200,
      "unit": "g",
      "calories_per_serving": 220,
      "protein_g": 41,
      "carbs_g": 0,
      "fat_g": 5,
      "is_swappable": true,
      "swaps": [
        {
          "swap_name": "tofu",
          "swap_amount": 200,
          "swap_unit": "g",
          "calories_per_serving": 160,
          "protein_g": 17,
          "carbs_g": 4,
          "fat_g": 9,
          "goal_benefit": "lower_calorie",
          "reason": "Lower calorie plant-based option"
        }
      ]
    }
  ]
}

Be accurate with nutrition data. For each swappable ingredient, provide 1-3 goal-aware swaps based on the user's goals.`
        },
        {
          role: "user",
          content: `Extract the recipe from this TikTok video by @${authorHandle}: "${videoTitle}"\n\nTikTok URL: ${url}`
        }
      ]
    });

    console.log("[extract] completion keys:", Object.keys(completion || {}));
    console.log("[extract] completion raw:", JSON.stringify(completion).slice(0, 400));
    if (!completion?.choices?.length) {
      throw new Error("OpenAI returned no response. Please try again.");
    }
    let rawContent = completion.choices[0].message.content || "{}";
    // Strip markdown code blocks if present
    rawContent = rawContent.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    // Extract JSON object if there's surrounding text
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) rawContent = jsonMatch[0];
    const parsed = JSON.parse(rawContent);

    // Calculate totals
    const totalCalories = parsed.ingredients?.reduce((sum: number, i: any) => sum + (i.calories_per_serving || 0), 0) || 0;
    const totalProtein = parsed.ingredients?.reduce((sum: number, i: any) => sum + (i.protein_g || 0), 0) || 0;
    const totalCarbs = parsed.ingredients?.reduce((sum: number, i: any) => sum + (i.carbs_g || 0), 0) || 0;
    const totalFat = parsed.ingredients?.reduce((sum: number, i: any) => sum + (i.fat_g || 0), 0) || 0;

    // Save recipe to DB
    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .insert({
        user_id: user.id,
        title: parsed.title || videoTitle,
        description: parsed.description,
        tiktok_url: url,
        tiktok_author: authorName,
        tiktok_author_handle: authorHandle,
        thumbnail_url: thumbnail,
        servings: parsed.servings || 1,
        prep_time_minutes: parsed.prep_time_minutes,
        cook_time_minutes: parsed.cook_time_minutes,
        total_calories: Math.round(totalCalories),
        total_protein_g: totalProtein.toFixed(1),
        total_carbs_g: totalCarbs.toFixed(1),
        total_fat_g: totalFat.toFixed(1),
        instructions: parsed.instructions || [],
        tags: parsed.tags || [],
      })
      .select()
      .single();

    if (recipeError) throw recipeError;

    // Save ingredients and swaps
    for (let i = 0; i < (parsed.ingredients || []).length; i++) {
      const ing = parsed.ingredients[i];
      const { data: ingredient } = await supabase
        .from("ingredients")
        .insert({
          recipe_id: recipe.id,
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          calories_per_serving: ing.calories_per_serving,
          protein_g: ing.protein_g,
          carbs_g: ing.carbs_g,
          fat_g: ing.fat_g,
          is_swappable: ing.is_swappable !== false,
          sort_order: i,
        })
        .select()
        .single();

      if (ingredient && ing.swaps?.length) {
        await supabase.from("ingredient_swaps").insert(
          ing.swaps.map((s: any) => ({
            ingredient_id: ingredient.id,
            swap_name: s.swap_name,
            swap_amount: s.swap_amount,
            swap_unit: s.swap_unit,
            calories_per_serving: s.calories_per_serving,
            protein_g: s.protein_g,
            carbs_g: s.carbs_g,
            fat_g: s.fat_g,
            goal_benefit: s.goal_benefit,
            reason: s.reason,
          }))
        );
      }
    }

    return NextResponse.json({ recipeId: recipe.id, success: true });
  } catch (err: any) {
    console.error("[extract]", err);
    return NextResponse.json({ error: err.message || "Failed to extract recipe" }, { status: 500 });
  }
}
