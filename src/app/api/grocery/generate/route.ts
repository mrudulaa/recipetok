import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const CATEGORIES: Record<string, string> = {
  "chicken": "Protein", "beef": "Protein", "salmon": "Protein", "tuna": "Protein",
  "shrimp": "Protein", "turkey": "Protein", "eggs": "Protein", "tofu": "Protein",
  "greek yogurt": "Dairy", "yogurt": "Dairy", "milk": "Dairy", "cheese": "Dairy",
  "butter": "Dairy", "cream": "Dairy", "mozzarella": "Dairy", "parmesan": "Dairy",
  "spinach": "Produce", "kale": "Produce", "broccoli": "Produce", "tomato": "Produce",
  "onion": "Produce", "garlic": "Produce",   "bell pepper": "Produce", "avocado": "Produce",
  "lemon": "Produce", "lime": "Produce", "zucchini": "Produce", "mushroom": "Produce",
  "rice": "Grains", "pasta": "Grains", "bread": "Grains", "oats": "Grains",
  "quinoa": "Grains", "flour": "Grains", "tortilla": "Grains",
  "olive oil": "Pantry", "soy sauce": "Pantry", "salt": "Pantry", "pepper": "Pantry",
  "cumin": "Pantry", "paprika": "Pantry", "garlic powder": "Pantry", "honey": "Pantry",
};

function categorize(name: string): string {
  const lower = name.toLowerCase();
  for (const [keyword, cat] of Object.entries(CATEGORIES)) {
    if (lower.includes(keyword)) return cat;
  }
  return "Other";
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { mealPlanId } = await req.json();

    // Get all meal plan entries with their recipes and ingredients
    const { data: entries } = await supabase
      .from("meal_plan_entries")
      .select(`
        servings,
        recipes (
          id, title,
          ingredients (name, amount, unit)
        )
      `)
      .eq("meal_plan_id", mealPlanId);

    if (!entries?.length) {
      return NextResponse.json({ error: "No meals planned" }, { status: 400 });
    }

    // Consolidate ingredients
    const consolidated: Record<string, { name: string; amount: number; unit: string; category: string }> = {};

    for (const entry of entries) {
      const recipe = entry.recipes as any;
      if (!recipe?.ingredients) continue;
      const servingMultiplier = entry.servings || 1;

      for (const ing of recipe.ingredients) {
        const key = `${ing.name.toLowerCase()}_${ing.unit}`;
        if (consolidated[key]) {
          consolidated[key].amount += (ing.amount || 0) * servingMultiplier;
        } else {
          consolidated[key] = {
            name: ing.name,
            amount: (ing.amount || 0) * servingMultiplier,
            unit: ing.unit || "",
            category: categorize(ing.name),
          };
        }
      }
    }

    // Delete old grocery items for this meal plan
    await supabase.from("grocery_items").delete().eq("meal_plan_id", mealPlanId).eq("user_id", user.id);

    // Insert new items
    const items = Object.values(consolidated).map(item => ({
      user_id: user.id,
      meal_plan_id: mealPlanId,
      name: item.name,
      amount: Math.ceil(item.amount * 10) / 10,
      unit: item.unit,
      category: item.category,
      is_checked: false,
    }));

    const { data: groceryItems } = await supabase.from("grocery_items").insert(items).select();

    return NextResponse.json({ items: groceryItems, count: items.length });
  } catch (err: any) {
    console.error("[grocery/generate]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
