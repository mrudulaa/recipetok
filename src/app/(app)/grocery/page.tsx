"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const CATEGORY_ORDER = ["Protein", "Produce", "Dairy", "Grains", "Pantry", "Other"];

export default function GroceryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("grocery_items")
        .select("*")
        .eq("user_id", user.id)
        .order("category")
        .order("name");
      setItems(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const toggleItem = async (id: string, checked: boolean) => {
    await supabase.from("grocery_items").update({ is_checked: !checked }).eq("id", id);
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, is_checked: !checked } : i));
  };

  const clearChecked = async () => {
    const checkedIds = items.filter((i) => i.is_checked).map((i) => i.id);
    if (!checkedIds.length) return;
    await supabase.from("grocery_items").delete().in("id", checkedIds);
    setItems((prev) => prev.filter((i) => !i.is_checked));
  };

  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const catItems = items.filter((i) => i.category === cat);
    if (catItems.length) acc[cat] = catItems;
    return acc;
  }, {} as Record<string, any[]>);

  const checkedCount = items.filter((i) => i.is_checked).length;

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading...</div>;

  return (
    <div className="px-5 pt-12 pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Grocery List</h1>
          {items.length > 0 && (
            <p className="text-sm text-gray-400 mt-0.5">{items.length - checkedCount} items remaining</p>
          )}
        </div>
        {checkedCount > 0 && (
          <button onClick={clearChecked} className="text-xs text-red-400 font-medium">
            Clear {checkedCount} ✓
          </button>
        )}
      </div>

      {!items.length ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🛒</div>
          <p className="text-gray-500 text-sm">No grocery list yet.</p>
          <p className="text-gray-400 text-xs mt-1">Plan your week and generate a list from the Planner.</p>
          <a href="/planner" className="inline-block mt-4 bg-orange-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl">
            Go to Planner
          </a>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([category, catItems]) => (
            <div key={category}>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{category}</h2>
              <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                {catItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id, item.is_checked)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-gray-50 transition-colors"
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      item.is_checked ? "bg-orange-500 border-orange-500" : "border-gray-300"
                    }`}>
                      {item.is_checked && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium capitalize transition-colors ${item.is_checked ? "line-through text-gray-300" : "text-gray-800"}`}>
                        {item.name}
                      </p>
                      {(item.amount || item.unit) && (
                        <p className="text-xs text-gray-400">{item.amount} {item.unit}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
