import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { lockedSlots, weekStart } = await req.json();
    // lockedSlots: { "0_breakfast": recipeId, "2_dinner": recipeId, ... }

    const [{ data: goals }, { data: recipes }] = await Promise.all([
      supabase.from("user_goals").select("*").eq("user_id", user.id).single(),
      supabase.from("recipes").select("id, title, total_calories, total_protein_g, total_carbs_g, total_fat_g, tags").eq("user_id", user.id),
    ]);

    if (!recipes || recipes.length === 0) {
      return NextResponse.json({ error: "No recipes in library. Import some recipes first." }, { status: 400 });
    }

    const goalsStr = goals
      ? `Daily targets: ${goals.daily_calories} cal, ${goals.daily_protein}g protein, ${goals.daily_carbs}g carbs, ${goals.daily_fat}g fat`
      : "No specific goals";

    const recipeList = recipes.map((r: any) =>
      `ID:${r.id} | ${r.title} | ${r.total_calories}cal | ${r.total_protein_g}g P | ${r.total_carbs_g}g C | ${r.total_fat_g}g F | tags: ${(r.tags || []).join(",")}`
    ).join("\n");

    const lockedStr = Object.entries(lockedSlots || {}).length > 0
      ? "Locked slots (do not change these):\n" + Object.entries(lockedSlots).map(([k, v]) => `- ${k}: recipe ID ${v}`).join("\n")
      : "No locked slots";

    const prompt = `You are a meal planning AI. Fill in a 7-day meal plan (Mon-Sun) using only recipes from the provided library.

${goalsStr}

Available recipes:
${recipeList}

${lockedStr}

Rules:
- Each day needs breakfast, lunch, and dinner
- Try to hit the daily macro targets each day
- Vary the meals across the week (don't repeat the same recipe more than twice)
- For locked slots, use the recipe ID specified
- For unlocked slots, pick the best recipe from the library

Return ONLY a JSON object with this structure (no markdown):
{
  "plan": {
    "0": { "breakfast": "recipe_id", "lunch": "recipe_id", "dinner": "recipe_id" },
    "1": { "breakfast": "recipe_id", "lunch": "recipe_id", "dinner": "recipe_id" },
    "2": { "breakfast": "recipe_id", "lunch": "recipe_id", "dinner": "recipe_id" },
    "3": { "breakfast": "recipe_id", "lunch": "recipe_id", "dinner": "recipe_id" },
    "4": { "breakfast": "recipe_id", "lunch": "recipe_id", "dinner": "recipe_id" },
    "5": { "breakfast": "recipe_id", "lunch": "recipe_id", "dinner": "recipe_id" },
    "6": { "breakfast": "recipe_id", "lunch": "recipe_id", "dinner": "recipe_id" }
  }
}
Where keys 0-6 represent Monday through Sunday.`;

    const openai = new OpenAI({
      apiKey: process.env.RECIPETOK_OPENAI_KEY || process.env.OPENAI_API_KEY,
      baseURL: process.env.BUILT_IN_FORGE_API_URL ? `${process.env.BUILT_IN_FORGE_API_URL}/v1` : undefined,
    });

    const completion = await openai.chat.completions.create({
      model: process.env.BUILT_IN_FORGE_API_URL ? "gpt-5-mini" : "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 600,
    });

    let content = completion.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let plan;
    try {
      plan = JSON.parse(content);
    } catch {
      return NextResponse.json({ error: "AI returned invalid plan format" }, { status: 500 });
    }

    // Save the plan to the database
    // First get or create the meal plan for this week
    let { data: mealPlan } = await supabase
      .from("meal_plans")
      .select("id")
      .eq("user_id", user.id)
      .eq("week_start", weekStart)
      .single();

    if (!mealPlan) {
      const { data: newPlan } = await supabase
        .from("meal_plans")
        .insert({ user_id: user.id, week_start: weekStart })
        .select()
        .single();
      mealPlan = newPlan;
    }

    if (!mealPlan) return NextResponse.json({ error: "Failed to create meal plan" }, { status: 500 });

    // Delete existing non-locked entries
    const lockedKeys = Object.keys(lockedSlots || {});
    if (lockedKeys.length > 0) {
      // Delete only unlocked entries
      for (const [dayStr, meals] of Object.entries(plan.plan)) {
        const dayIdx = parseInt(dayStr);
        for (const [mealType] of Object.entries(meals as any)) {
          const key = `${dayIdx}_${mealType}`;
          if (!lockedSlots[key]) {
            await supabase.from("meal_plan_entries")
              .delete()
              .eq("meal_plan_id", mealPlan.id)
              .eq("day_of_week", dayIdx)
              .eq("meal_type", mealType);
          }
        }
      }
    } else {
      await supabase.from("meal_plan_entries").delete().eq("meal_plan_id", mealPlan.id);
    }

    // Insert new entries
    const entries = [];
    for (const [dayStr, meals] of Object.entries(plan.plan)) {
      const dayIdx = parseInt(dayStr);
      for (const [mealType, recipeId] of Object.entries(meals as any)) {
        const key = `${dayIdx}_${mealType}`;
        if (!lockedSlots?.[key]) {
          entries.push({
            meal_plan_id: mealPlan.id,
            day_of_week: dayIdx,
            meal_type: mealType,
            recipe_id: recipeId,
            servings: 1,
          });
        }
      }
    }

    if (entries.length > 0) {
      await supabase.from("meal_plan_entries").insert(entries);
    }

    return NextResponse.json({ success: true, plan: plan.plan });
  } catch (err: any) {
    console.error("[ai-plan] Error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Failed to generate plan" }, { status: 500 });
  }
}
