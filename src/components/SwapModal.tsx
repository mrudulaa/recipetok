"use client";
import { useState } from "react";

const BENEFIT_LABELS: Record<string, { label: string; color: string }> = {
  higher_protein: { label: "↑ Protein", color: "bg-green-100 text-green-700" },
  lower_carb: { label: "↓ Carbs", color: "bg-blue-100 text-blue-700" },
  lower_calorie: { label: "↓ Calories", color: "bg-orange-100 text-orange-700" },
  lower_fat: { label: "↓ Fat", color: "bg-yellow-100 text-yellow-700" },
  dairy_free: { label: "Dairy-free", color: "bg-purple-100 text-purple-700" },
  vegan: { label: "Vegan", color: "bg-emerald-100 text-emerald-700" },
};

export default function SwapModal({ ingredient }: { ingredient: any }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs bg-orange-50 text-orange-500 font-semibold px-2.5 py-1 rounded-lg border border-orange-100 active:scale-95 transition-transform"
      >
        Swap
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white rounded-t-3xl w-full max-w-md p-5 pb-8 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <h3 className="text-base font-bold text-gray-900 mb-1 capitalize">
              Swap: {ingredient.name}
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Original: {ingredient.amount} {ingredient.unit} · {ingredient.calories_per_serving} cal · {ingredient.protein_g}g protein
            </p>

            <div className="space-y-3">
              {ingredient.ingredient_swaps.map((swap: any) => {
                const benefit = BENEFIT_LABELS[swap.goal_benefit] || { label: swap.goal_benefit, color: "bg-gray-100 text-gray-600" };
                return (
                  <div key={swap.id} className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 capitalize">{swap.swap_name}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${benefit.color}`}>
                        {benefit.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {swap.swap_amount} {swap.swap_unit} · {swap.calories_per_serving} cal · {swap.protein_g}g P · {swap.carbs_g}g C · {swap.fat_g}g F
                    </p>
                    {swap.reason && (
                      <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{swap.reason}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setOpen(false)}
              className="mt-4 w-full py-3 bg-gray-100 text-gray-600 font-semibold rounded-xl text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
