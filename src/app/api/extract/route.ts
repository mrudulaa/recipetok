import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getApiUser } from "@/utils/supabase/api-auth";

// Fetch TikTok oEmbed metadata
async function fetchTikTokMeta(url: string) {
  const cleanUrl = url.split("?")[0];
  const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(cleanUrl)}`);
  if (!res.ok) throw new Error("Could not fetch TikTok metadata");
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    // Use direct OpenAI API key on Vercel; fall back to Manus forge in sandbox
    const forgeUrl = process.env.BUILT_IN_FORGE_API_URL;
    const forgeKey = process.env.BUILT_IN_FORGE_API_KEY;
    const openaiKey = process.env.RECIPETOK_OPENAI_KEY;
    const openai = new OpenAI(
      openaiKey
        ? { apiKey: openaiKey } // Direct OpenAI - use on Vercel
        : { apiKey: forgeKey, baseURL: forgeUrl ? `${forgeUrl}/v1` : undefined } // Manus forge - sandbox only
    );

    const { user, supabase } = await getApiUser(req);
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
    const model = openaiKey ? "gpt-4o-mini" : "gpt-5-mini";
    const completion = await openai.chat.completions.create({
      model,
      max_tokens: 4000,
      messages: [
        {
          role: "system",
          content: `You are a nutrition expert and recipe parser. Extract a complete recipe from a TikTok video title/caption.
${goalContext}

CRITICAL RULES FOR INGREDIENTS:
1. NO DUPLICATES: Each physical ingredient appears EXACTLY ONCE. If the caption lists both a brand name and a generic name for the same item (e.g. "Palmini noodles" and "pasta" when they're the same dish component), list them as separate items ONLY if the recipe genuinely uses both. Read the instructions carefully to determine this.
2. EXCLUDE SIDE DISHES: If the caption or instructions mention a separate side dish (e.g. "mix greens and caesar salad kit" served alongside a pasta), DO NOT include the side dish ingredients in the main recipe. Only include ingredients that go INTO the main dish. Mention the side in the description instead.
3. USE THE CAPTION'S EXACT AMOUNTS: "1 lb ground beef" = 454g, "1/2 lb pasta" = 227g, "1 jar sauce" = ~680g (24oz), "2-3 tbsp cottage cheese" = ~40g. Convert to grams. Do NOT invent amounts like "150g" when the caption specifies otherwise.
4. AMOUNTS ARE FULL-RECIPE amounts (what the whole recipe uses), NOT per-serving.
5. Break multi-component dishes into raw ingredients; include all seasonings, sauces, oils, garnishes.

CRITICAL RULES FOR SERVINGS:
- Estimate servings from TOTAL FOOD QUANTITY. A recipe with 1 lb beef + 1/2 lb pasta + a full jar of sauce is 4-5 servings, NOT 2.
- Rule of thumb: one dinner serving is roughly 400-700 cal. If your total ÷ servings gives >900 cal/serving for a normal home recipe, your serving count is too LOW — increase it.

CRITICAL RULES FOR NUTRITION MATH (follow this order):
1. For each ingredient, compute nutrition for its FULL amount using standard USDA/label values (e.g. 90/10 raw ground beef = 176 cal/100g; dry pasta = 371 cal/100g; butter = 717 cal/100g; tomato-based jarred sauce = 60-90 cal/125g).
2. Sum all ingredients = TOTAL RECIPE nutrition.
3. DIVIDE by servings to get per-serving values.
4. The "calories_per_serving", "protein_g", "carbs_g", "fat_g" fields on each ingredient are that ingredient's contribution PER SERVING (full-amount nutrition ÷ servings).
5. SANITY CHECK before answering: (protein_g×4 + carbs_g×4 + fat_g×9) summed across ingredients should approximately equal the summed calories. If not, fix your numbers.

You MUST respond with ONLY a valid JSON object — no markdown, no code blocks, no explanation. Start your response with { and end with }.

Return a JSON object with this exact structure:
{
  "title": "Recipe name",
  "description": "1-2 sentence description",
  "servings": 4,
  "prep_time_minutes": 10,
  "cook_time_minutes": 20,
  "instructions": ["Step 1...", "Step 2...", "Step 3..."],
  "tags": ["high-protein", "quick", "dinner"],
  "ingredients": [
    {
      "name": "ground beef (90/10)",
      "amount": 454,
      "unit": "g",
      "calories_per_serving": 200,
      "protein_g": 22.7,
      "carbs_g": 0,
      "fat_g": 11.4,
      "is_swappable": true,
      "swaps": [
        {
          "swap_name": "ground turkey (93/7)",
          "swap_amount": 454,
          "swap_unit": "g",
          "calories_per_serving": 170,
          "protein_g": 21.5,
          "carbs_g": 0,
          "fat_g": 9,
          "goal_benefit": "lower_calorie",
          "reason": "Leaner protein with fewer calories"
        }
      ]
    }
  ]
}

Note in the example: amount=454 is the FULL recipe amount; calories_per_serving=200 is 454g × 176cal/100g ÷ 4 servings. For each swappable ingredient, provide 1-3 goal-aware swaps based on the user's goals.`
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
