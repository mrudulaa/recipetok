import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface MFPDayData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  meals: { name: string; calories: number }[];
  date: string;
  isPrivate?: boolean;
  error?: string;
}

async function scrapeMFPDiary(username: string, date?: string): Promise<MFPDayData> {
  const today = date || new Date().toISOString().split("T")[0];
  const url = `https://www.myfitnesspal.com/food/diary/${encodeURIComponent(username)}?date=${today}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
      "Referer": "https://www.myfitnesspal.com/",
    },
    next: { revalidate: 300 }, // cache for 5 minutes
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch MFP diary: ${res.status}`);
  }

  const html = await res.text();

  // Check if diary is private
  if (html.includes("This diary is private") || html.includes("diary-private")) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, meals: [], date: today, isPrivate: true };
  }

  // Check for Cloudflare challenge
  if (html.includes("Just a moment") || html.includes("cf-browser-verification") || html.includes("Challenge")) {
    throw new Error("MFP is temporarily blocking automated requests. Please try again in a few minutes.");
  }

  // Parse nutrition totals from the diary page
  // MFP uses a table with class "main-title-2" for meal sections and "total" for totals
  const result: MFPDayData = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, meals: [], date: today };

  // Extract the "Totals" row - look for the bottom totals row
  // Pattern: <tr class="total"> ... <td>calories</td><td>fat</td><td>carbs</td><td>protein</td>
  const totalRowMatch = html.match(/class="[^"]*bottom[^"]*"[^>]*>[\s\S]{0,2000}?<\/tr>/i) ||
    html.match(/id="[^"]*total[^"]*"[\s\S]{0,2000}?<\/tr>/i);

  // Try to find nutrition numbers from the page's JSON data
  // MFP embeds diary data as JSON in a script tag
  const jsonMatch = html.match(/window\.__pageProps\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
  if (jsonMatch) {
    try {
      const pageProps = JSON.parse(jsonMatch[1]);
      const diary = pageProps?.diary || pageProps?.initialData?.diary;
      if (diary?.totals) {
        result.calories = diary.totals.calories || 0;
        result.protein = diary.totals.protein || 0;
        result.carbs = diary.totals.carbohydrates || 0;
        result.fat = diary.totals.fat || 0;
        result.fiber = diary.totals.fiber || 0;
        return result;
      }
    } catch {}
  }

  // Fallback: parse HTML table
  // Look for the "Totals" row in the nutrition summary table
  const rows = html.match(/<tr[^>]*class="[^"]*total[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi) || [];
  for (const row of rows) {
    const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
    const nums = cells.map(c => {
      const text = c.replace(/<[^>]+>/g, "").replace(/,/g, "").trim();
      return parseInt(text) || 0;
    }).filter(n => n > 0);

    if (nums.length >= 4) {
      // MFP table order: Calories, Fat, Carbs, Protein, Sodium, Sugar, Fiber
      result.calories = nums[0] || 0;
      result.fat = nums[1] || 0;
      result.carbs = nums[2] || 0;
      result.protein = nums[3] || 0;
      result.fiber = nums[6] || 0;
      break;
    }
  }

  // Parse meal names
  const mealHeaders = html.match(/class="[^"]*main-title-2[^"]*"[^>]*>([\s\S]*?)<\/td>/gi) || [];
  result.meals = mealHeaders.map(h => ({
    name: h.replace(/<[^>]+>/g, "").trim(),
    calories: 0,
  }));

  return result;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Support Bearer token auth
    const authHeader = req.headers.get("authorization");
    let user: any = null;
    if (authHeader?.startsWith("Bearer ")) {
      const { data } = await supabase.auth.getUser(authHeader.slice(7));
      user = data.user;
    } else {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    }
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || undefined;

    // Get user's MFP username from their goals
    const { data: goals } = await supabase
      .from("user_goals")
      .select("mfp_username")
      .eq("user_id", user.id)
      .single();

    const mfpUsername = goals?.mfp_username;
    if (!mfpUsername) {
      return NextResponse.json({ error: "No MFP username set", connected: false });
    }

    const data = await scrapeMFPDiary(mfpUsername, date);
    return NextResponse.json({ ...data, connected: true, username: mfpUsername });
  } catch (err: any) {
    console.error("[mfp]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Save MFP username
  try {
    const supabase = await createClient();

    const authHeader = req.headers.get("authorization");
    let user: any = null;
    if (authHeader?.startsWith("Bearer ")) {
      const { data } = await supabase.auth.getUser(authHeader.slice(7));
      user = data.user;
    } else {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    }
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { username } = await req.json();

    await supabase.from("user_goals").upsert({
      user_id: user.id,
      mfp_username: username || null,
    }, { onConflict: "user_id" });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
