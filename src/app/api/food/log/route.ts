import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

async function getUser(req: NextRequest, supabase: any) {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const { data } = await supabase.auth.getUser(authHeader.slice(7));
    return data.user;
  }
  const { data } = await supabase.auth.getUser();
  return data.user;
}

// GET - fetch today's food log
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getUser(req, supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("food_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("log_date", date)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Calculate totals
    const totals = (data || []).reduce(
      (acc: any, entry: any) => ({
        calories: acc.calories + (entry.calories || 0),
        protein: acc.protein + (entry.protein || 0),
        carbs: acc.carbs + (entry.carbs || 0),
        fat: acc.fat + (entry.fat || 0),
        fiber: acc.fiber + (entry.fiber || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );

    return NextResponse.json({ entries: data || [], totals, date });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST - log a food entry
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getUser(req, supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      name, calories, protein, carbs, fat, fiber = 0,
      serving_qty = 1, serving_unit = "serving",
      meal_type = "snack", log_date, recipe_id = null, fdc_id = null
    } = body;

    const date = log_date || new Date().toISOString().split("T")[0];

    const { data, error } = await supabase.from("food_logs").insert({
      user_id: user.id,
      name,
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      fiber: Math.round(fiber * 10) / 10,
      serving_qty,
      serving_unit,
      meal_type,
      log_date: date,
      recipe_id,
      fdc_id,
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ entry: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE - remove a food log entry
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getUser(req, supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { error } = await supabase
      .from("food_logs")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
