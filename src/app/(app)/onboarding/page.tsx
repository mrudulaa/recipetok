"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

const GOAL_TYPES = [
  { value: "high_protein", label: "High Protein", desc: "Build muscle, stay full longer", icon: "💪" },
  { value: "low_carb", label: "Low Carb", desc: "Reduce carbs, burn fat", icon: "🥩" },
  { value: "balanced", label: "Balanced", desc: "Healthy, well-rounded eating", icon: "⚖️" },
  { value: "weight_loss", label: "Weight Loss", desc: "Calorie deficit, lean meals", icon: "🎯" },
];

export default function OnboardingPage() {
  const [goalType, setGoalType] = useState("high_protein");
  const [calories, setCalories] = useState(2000);
  const [protein, setProtein] = useState(130);
  const [carbs, setCarbs] = useState(200);
  const [fat, setFat] = useState(65);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("user_goals").upsert({
      user_id: user.id,
      goal_type: goalType,
      daily_calories: calories,
      daily_protein: protein,
      daily_carbs: carbs,
      daily_fat: fat,
    }, { onConflict: "user_id" });
    router.push("/import");
  };

  return (
    <div className="px-5 pt-12 pb-8">
      <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Set your goals</h1>
      <p className="text-gray-500 text-sm mb-8">We'll use these to suggest smarter ingredient swaps.</p>

      {/* Goal type */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 block">Goal type</label>
        <div className="grid grid-cols-2 gap-2">
          {GOAL_TYPES.map((g) => (
            <button
              key={g.value}
              onClick={() => setGoalType(g.value)}
              className={`p-3 rounded-xl border text-left transition-all ${
                goalType === g.value
                  ? "border-orange-400 bg-orange-50"
                  : "border-gray-100 bg-white"
              }`}
            >
              <span className="text-xl block mb-1">{g.icon}</span>
              <p className={`text-sm font-semibold ${goalType === g.value ? "text-orange-600" : "text-gray-800"}`}>{g.label}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight">{g.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Daily targets */}
      <div className="mb-8">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 block">Daily targets</label>
        <div className="space-y-3">
          {[
            { label: "Calories", value: calories, set: setCalories, min: 1200, max: 4000, step: 50, unit: "kcal", color: "orange" },
            { label: "Protein", value: protein, set: setProtein, min: 50, max: 300, step: 5, unit: "g", color: "green" },
            { label: "Carbs", value: carbs, set: setCarbs, min: 50, max: 500, step: 5, unit: "g", color: "blue" },
            { label: "Fat", value: fat, set: setFat, min: 20, max: 200, step: 5, unit: "g", color: "yellow" },
          ].map((field) => (
            <div key={field.label} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{field.label}</span>
                <span className="text-sm font-bold text-gray-900">{field.value} {field.unit}</span>
              </div>
              <input
                type="range"
                min={field.min}
                max={field.max}
                step={field.step}
                value={field.value}
                onChange={(e) => field.set(Number(e.target.value))}
                className="w-full accent-orange-500"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-xl text-base transition-all disabled:opacity-60 active:scale-[0.98]"
      >
        {saving ? "Saving..." : "Save goals →"}
      </button>
    </div>
  );
}
