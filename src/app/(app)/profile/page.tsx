"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [goals, setGoals] = useState<any>(null);
  const [mfpUsername, setMfpUsername] = useState("");
  const [mfpInput, setMfpInput] = useState("");
  const [mfpConnected, setMfpConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mfpSaving, setMfpSaving] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setToken(session?.access_token || null);

      if (user) {
        const { data: g } = await supabase.from("user_goals").select("*").eq("user_id", user.id).single();
        if (g) {
          setGoals(g);
          if (g.mfp_username) {
            setMfpUsername(g.mfp_username);
            setMfpInput(g.mfp_username);
            setMfpConnected(true);
          }
        }
      }
    };
    load();
  }, []);

  const saveMfp = async () => {
    setMfpSaving(true);
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    await fetch("/api/mfp", {
      method: "POST",
      headers,
      body: JSON.stringify({ username: mfpInput.trim() }),
    });
    setMfpUsername(mfpInput.trim());
    setMfpConnected(!!mfpInput.trim());
    setMfpSaving(false);
  };

  const disconnect = async () => {
    setMfpInput("");
    setMfpUsername("");
    setMfpConnected(false);
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    await fetch("/api/mfp", {
      method: "POST",
      headers,
      body: JSON.stringify({ username: "" }),
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="px-5 pt-12 pb-8">
      <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-6">Profile</h1>

      {/* User info */}
      {user && (
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 font-bold text-sm">
            {user.email?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user.email}</p>
          </div>
          <button onClick={signOut} className="text-xs text-red-400 font-medium">Sign out</button>
        </div>
      )}

      {/* MFP Integration */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">MyFitnessPal</h2>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">M</div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {mfpConnected ? "Connected to MyFitnessPal" : "Connect MyFitnessPal"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {mfpConnected ? `@${mfpUsername}` : "Sync your food diary to track macros"}
              </p>
            </div>
          </div>

          {!mfpConnected ? (
            <div className="space-y-2">
              <input
                type="text"
                value={mfpInput}
                onChange={(e) => setMfpInput(e.target.value)}
                placeholder="Your MFP username"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <p className="text-xs text-gray-400">
                Make sure your{" "}
                <a href="https://www.myfitnesspal.com/account/diary_settings" target="_blank" rel="noopener noreferrer" className="text-orange-500 underline">
                  Food Diary sharing
                </a>{" "}
                is set to Public in MFP settings.
              </p>
              <button
                onClick={saveMfp}
                disabled={mfpSaving || !mfpInput.trim()}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-all disabled:opacity-50"
              >
                {mfpSaving ? "Connecting..." : "Connect"}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-green-50 rounded-xl px-3 py-2">
                <span className="text-green-500 text-sm">✓</span>
                <p className="text-xs text-green-700 font-medium">Diary syncing from @{mfpUsername}</p>
              </div>
              <p className="text-xs text-gray-400">
                Make sure your{" "}
                <a href="https://www.myfitnesspal.com/account/diary_settings" target="_blank" rel="noopener noreferrer" className="text-orange-500 underline">
                  Food Diary sharing
                </a>{" "}
                is set to Public.
              </p>
              <button
                onClick={disconnect}
                className="w-full bg-gray-100 text-gray-500 font-semibold py-2.5 rounded-xl text-sm"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Macro Goals */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Daily Goals</h2>
          <button onClick={() => router.push("/onboarding")} className="text-xs text-orange-500 font-medium">Edit</button>
        </div>
        {goals ? (
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Calories", value: goals.daily_calories, unit: "kcal", color: "bg-orange-50 text-orange-600" },
              { label: "Protein", value: goals.daily_protein, unit: "g", color: "bg-green-50 text-green-600" },
              { label: "Carbs", value: goals.daily_carbs, unit: "g", color: "bg-blue-50 text-blue-600" },
              { label: "Fat", value: goals.daily_fat, unit: "g", color: "bg-yellow-50 text-yellow-600" },
            ].map((g) => (
              <div key={g.label} className={`rounded-xl p-3 ${g.color}`}>
                <p className="text-lg font-extrabold leading-none">{g.value}{g.unit}</p>
                <p className="text-xs mt-0.5 opacity-80">{g.label}</p>
              </div>
            ))}
          </div>
        ) : (
          <button onClick={() => router.push("/onboarding")} className="w-full bg-orange-50 text-orange-500 font-semibold py-3 rounded-xl text-sm">
            Set your macro goals →
          </button>
        )}
      </div>
    </div>
  );
}
