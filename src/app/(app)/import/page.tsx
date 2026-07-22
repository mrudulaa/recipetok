"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface MacroData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  connected?: boolean;
  isPrivate?: boolean;
  error?: string;
}

interface Goals {
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fat: number;
}

function MacroBar({ label, consumed, goal, color }: { label: string; consumed: number; goal: number; color: string }) {
  const pct = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0;
  const over = goal > 0 && consumed > goal;
  const colors: Record<string, { bar: string; text: string }> = {
    orange: { bar: "bg-orange-400", text: "text-orange-600" },
    green: { bar: "bg-green-400", text: "text-green-600" },
    blue: { bar: "bg-blue-400", text: "text-blue-600" },
    yellow: { bar: "bg-yellow-400", text: "text-yellow-600" },
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <span className={`text-xs font-bold ${over ? "text-red-500" : colors[color].text}`}>
          {Math.round(consumed)} / {goal}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${over ? "bg-red-400" : colors[color].bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ImportPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mfpData, setMfpData] = useState<MacroData | null>(null);
  const [goals, setGoals] = useState<Goals | null>(null);
  const [mfpLoading, setMfpLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      setToken(session?.access_token || null);

      if (user) {
        const { data: g } = await supabase.from("user_goals").select("*").eq("user_id", user.id).single();
        if (g) setGoals(g);

        // Fetch MFP data if username is set
        if (g?.mfp_username) {
          setMfpLoading(true);
          try {
            const headers: Record<string, string> = {};
            if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
            const res = await fetch("/api/mfp", { headers });
            const data = await res.json();
            setMfpData(data);
          } catch {}
          setMfpLoading(false);
        }
      }
    };
    load();
  }, []);

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      const res = await fetch("/api/extract", {
        method: "POST",
        headers,
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to extract recipe");
      router.push(`/recipes/${data.recipeId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const hasMfp = mfpData?.connected;
  const showDashboard = hasMfp && goals && !mfpData?.isPrivate;

  return (
    <div className="px-5 pt-12 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">RecipeTok</h1>
          <p className="text-gray-500 text-sm mt-0.5">Paste a TikTok cooking video to extract the recipe.</p>
        </div>
      </div>

      {/* MFP Macro Dashboard */}
      {goals && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-900">Today's Macros</p>
            {mfpLoading && <span className="text-xs text-gray-400 animate-pulse">Syncing MFP...</span>}
            {hasMfp && !mfpLoading && (
              <span className="text-xs text-blue-500 font-medium">via MyFitnessPal</span>
            )}
            {!hasMfp && !mfpLoading && (
              <button onClick={() => router.push("/profile")} className="text-xs text-orange-500 font-medium">
                Connect MFP →
              </button>
            )}
          </div>

          {mfpData?.isPrivate && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-3">
              Your MFP diary is private. Set it to Public in{" "}
              <a href="https://www.myfitnesspal.com/account/diary_settings" target="_blank" rel="noopener noreferrer" className="underline">
                MFP settings
              </a>.
            </p>
          )}

          {mfpData?.error && !mfpData?.isPrivate && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-3">{mfpData.error}</p>
          )}

          <div className="space-y-3">
            <MacroBar
              label="Calories"
              consumed={showDashboard ? mfpData!.calories : 0}
              goal={goals.daily_calories}
              color="orange"
            />
            <MacroBar
              label="Protein"
              consumed={showDashboard ? mfpData!.protein : 0}
              goal={goals.daily_protein}
              color="green"
            />
            <MacroBar
              label="Carbs"
              consumed={showDashboard ? mfpData!.carbs : 0}
              goal={goals.daily_carbs}
              color="blue"
            />
            <MacroBar
              label="Fat"
              consumed={showDashboard ? mfpData!.fat : 0}
              goal={goals.daily_fat}
              color="yellow"
            />
          </div>

          {!hasMfp && !mfpLoading && (
            <p className="text-xs text-gray-400 mt-3 text-center">
              Connect MyFitnessPal to see your actual intake
            </p>
          )}
        </div>
      )}

      {/* URL Input */}
      <form onSubmit={handleExtract} className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
            TikTok URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.tiktok.com/@..."
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Open TikTok → tap Share → Copy Link → paste here
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-semibold py-4 rounded-xl text-base transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin text-lg">⏳</span>
              <span>Extracting recipe...</span>
            </>
          ) : (
            <>
              <span>🤖</span>
              <span>Extract Recipe</span>
            </>
          )}
        </button>
      </form>

      {/* How it works */}
      {!goals && (
        <div className="mt-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">How it works</h2>
          <div className="space-y-4">
            {[
              { n: "1", text: "AI reads the TikTok video and extracts the full recipe" },
              { n: "2", text: "Macros are calculated for every ingredient" },
              { n: "3", text: "Smart swaps are suggested based on your goals" },
            ].map((step) => (
              <div key={step.n} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-500 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {step.n}
                </span>
                <p className="text-sm text-gray-600 leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
