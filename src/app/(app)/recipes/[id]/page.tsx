import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import RecipeDetailClient from "@/components/RecipeDetailClient";

export default async function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: recipe } = await supabase
    .from("recipes")
    .select(`*, ingredients(*, ingredient_swaps(*))`)
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!recipe) notFound();

  return <RecipeDetailClient recipe={recipe} />;
}
