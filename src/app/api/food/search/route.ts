import { NextRequest, NextResponse } from "next/server";

const USDA_API_KEY = process.env.USDA_API_KEY || "DEMO_KEY";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  if (!query) return NextResponse.json({ foods: [] });

  try {
    const res = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=20&dataType=Foundation,SR%20Legacy,Branded&api_key=${USDA_API_KEY}`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();

    const foods = (data.foods || []).map((f: any) => {
      const nutrients = Object.fromEntries(
        (f.foodNutrients || []).map((n: any) => [n.nutrientName, n.value])
      );
      return {
        fdcId: f.fdcId,
        name: f.description,
        brand: f.brandOwner || f.brandName || null,
        calories: Math.round(nutrients["Energy"] || nutrients["Energy (Atwater General Factors)"] || 0),
        protein: Math.round((nutrients["Protein"] || 0) * 10) / 10,
        carbs: Math.round((nutrients["Carbohydrate, by difference"] || 0) * 10) / 10,
        fat: Math.round((nutrients["Total lipid (fat)"] || 0) * 10) / 10,
        fiber: Math.round((nutrients["Fiber, total dietary"] || 0) * 10) / 10,
        servingSize: f.servingSize || 100,
        servingUnit: f.servingSizeUnit || "g",
      };
    });

    return NextResponse.json({ foods });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, foods: [] }, { status: 500 });
  }
}
