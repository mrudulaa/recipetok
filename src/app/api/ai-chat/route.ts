import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import OpenAI from "openai";

function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

function getTodayIndex() {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Also check Authorization header
    if (!user) {
      const authHeader = req.headers.get("authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const { message, history } = await req.json();
    if (!message) return NextResponse.json({ error: "Message required" }, { status: 400 });

    const userId = user!.id;
    const todayIdx = getTodayIndex();
    const weekStartStr = getWeekStart();

    // Fetch context: goals + today's plan
    const [{ data: goals }, { data: mealPlan }] = await Promise.all([
      supabase.from("user_goals").select("*").eq("user_id", userId).single(),
      supabase.from("meal_plans").select("id").eq("user_id", userId).eq("week_start", weekStartStr).single(),
    ]);

    let todayPlan: any[] = [];
    if (mealPlan?.id) {
      const { data: entries } = await supabase
        .from("meal_plan_entries")
        .select("meal_type, servings, recipes(id, title, total_calories, total_protein_g, total_carbs_g, total_fat_g)")
        .eq("meal_plan_id", mealPlan.id)
        .eq("day_of_week", todayIdx);
      todayPlan = entries || [];
    }

    // Build context string
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const todayName = dayNames[todayIdx];
    const goalsStr = goals
      ? `Daily targets: ${goals.daily_calories} cal, ${goals.daily_protein}g protein, ${goals.daily_carbs}g carbs, ${goals.daily_fat}g fat`
      : "No macro goals set";

    const planStr = todayPlan.length > 0
      ? todayPlan.map((e: any) => {
          const r = e.recipes;
          const s = Number(e.servings) || 1;
          return `- ${e.meal_type}: ${r?.title || "Unknown"} (${Math.round((r?.total_calories || 0) * s)} cal, ${Math.round((r?.total_protein_g || 0) * s)}g P)`;
        }).join("\n")
      : "No meals planned yet today";

    const systemPrompt = `You are a friendly AI nutrition coach for RecipeTok, a meal planning app. Today is ${todayName}.

User's macro goals: ${goalsStr}

Today's current meal plan:
${planStr}

Your job is to help the user adapt their meal plan to real-life situations. When they tell you something that affects their eating (going out, skipping a meal, having a snack, etc.), you should:
1. Acknowledge what they said warmly and briefly
2. Explain how it affects their macros for the day
3. Suggest a specific adjustment to their remaining meals to stay on track
4. Keep your response concise (2-4 sentences max) and conversational

If they ask a general nutrition question, answer it helpfully. If they want to swap a meal, suggest a specific recipe type that would fit their remaining macro budget.

Always be encouraging and practical, not preachy.`;

    const openai = new OpenAI({
      apiKey: process.env.RECIPETOK_OPENAI_KEY || process.env.OPENAI_API_KEY,
      baseURL: process.env.BUILT_IN_FORGE_API_URL ? `${process.env.BUILT_IN_FORGE_API_URL}/v1` : undefined,
    });

    const messages: any[] = [
      { role: "system", content: systemPrompt },
      ...(history || []),
      { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: process.env.BUILT_IN_FORGE_API_URL ? "gpt-5-mini" : "gpt-4o-mini",
      messages,
      max_completion_tokens: 300,
    });

    const reply = completion.choices?.[0]?.message?.content;
    if (!reply) {
      return NextResponse.json({ error: "AI returned no response. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ reply, todayPlan });
  } catch (err: any) {
    console.error("[ai-chat] Error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Failed to get AI response" }, { status: 500 });
  }
}
