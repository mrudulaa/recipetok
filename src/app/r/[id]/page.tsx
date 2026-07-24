import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PublicRecipeView from "@/components/PublicRecipeView";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: recipe } = await supabase
    .from("recipes")
    .select("title, description, thumbnail_url, total_calories, total_protein_g")
    .eq("id", id)
    .eq("is_public", true)
    .single();

  if (!recipe) return { title: "Recipe not found" };

  return {
    title: recipe.title,
    description: recipe.description || `${recipe.total_calories} cal · ${recipe.total_protein_g}g protein`,
    openGraph: {
      title: recipe.title,
      description: recipe.description || `${recipe.total_calories} cal · ${recipe.total_protein_g}g protein`,
      images: recipe.thumbnail_url ? [{ url: recipe.thumbnail_url }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: recipe.title,
      description: recipe.description || `${recipe.total_calories} cal · ${recipe.total_protein_g}g protein`,
      images: recipe.thumbnail_url ? [recipe.thumbnail_url] : [],
    },
  };
}

export default async function PublicRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: recipe } = await supabase
    .from("recipes")
    .select(`*, ingredients(*, ingredient_swaps(*))`)
    .eq("id", id)
    .eq("is_public", true)
    .single();

  if (!recipe) notFound();

  return <PublicRecipeView recipe={recipe} />;
}
