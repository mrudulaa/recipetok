-- RecipeTok Database Schema
-- Run this in Supabase SQL Editor

-- User goals (macro targets)
create table if not exists user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  daily_calories int default 2000,
  daily_protein int default 130,
  daily_carbs int default 200,
  daily_fat int default 65,
  goal_type text default 'high_protein', -- 'high_protein', 'low_carb', 'balanced', 'weight_loss'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Recipes
create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  tiktok_url text,
  tiktok_author text,
  tiktok_author_handle text,
  thumbnail_url text,
  servings int default 1,
  prep_time_minutes int,
  cook_time_minutes int,
  total_calories int,
  total_protein_g numeric(6,1),
  total_carbs_g numeric(6,1),
  total_fat_g numeric(6,1),
  instructions text[], -- array of steps
  tags text[],
  created_at timestamptz default now()
);

-- Ingredients (linked to recipes)
create table if not exists ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid references recipes(id) on delete cascade not null,
  name text not null,
  amount numeric(8,2),
  unit text,
  calories_per_serving int,
  protein_g numeric(6,1),
  carbs_g numeric(6,1),
  fat_g numeric(6,1),
  is_swappable boolean default true,
  sort_order int default 0,
  part text default 'Main' -- recipe component this ingredient belongs to (e.g. 'Main', 'Side Salad', 'Sauce')
);

-- Migration for existing databases:
-- alter table ingredients add column if not exists part text default 'Main';

-- Ingredient swaps
create table if not exists ingredient_swaps (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid references ingredients(id) on delete cascade not null,
  swap_name text not null,
  swap_amount numeric(8,2),
  swap_unit text,
  calories_per_serving int,
  protein_g numeric(6,1),
  carbs_g numeric(6,1),
  fat_g numeric(6,1),
  goal_benefit text, -- e.g. 'higher_protein', 'lower_carb', 'lower_calorie'
  reason text -- human-readable explanation
);

-- Meal plans (weekly)
create table if not exists meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  week_start date not null, -- Monday of the week
  created_at timestamptz default now(),
  unique(user_id, week_start)
);

-- Meal plan entries (recipe assigned to a day/meal)
create table if not exists meal_plan_entries (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid references meal_plans(id) on delete cascade not null,
  recipe_id uuid references recipes(id) on delete set null,
  day_of_week int not null check (day_of_week between 0 and 6), -- 0=Mon, 6=Sun
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner')),
  servings numeric(4,1) default 1,
  unique(meal_plan_id, day_of_week, meal_type)
);

-- Grocery list items
create table if not exists grocery_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  meal_plan_id uuid references meal_plans(id) on delete cascade,
  name text not null,
  amount numeric(8,2),
  unit text,
  category text default 'Other', -- 'Protein', 'Produce', 'Dairy', 'Grains', 'Pantry', 'Other'
  is_checked boolean default false,
  created_at timestamptz default now()
);

-- Row Level Security
alter table user_goals enable row level security;
alter table recipes enable row level security;
alter table ingredients enable row level security;
alter table ingredient_swaps enable row level security;
alter table meal_plans enable row level security;
alter table meal_plan_entries enable row level security;
alter table grocery_items enable row level security;

-- RLS Policies: users can only access their own data
create policy "Users can manage their own goals" on user_goals for all using (auth.uid() = user_id);
create policy "Users can manage their own recipes" on recipes for all using (auth.uid() = user_id);
create policy "Users can manage ingredients of their recipes" on ingredients for all using (
  exists (select 1 from recipes where recipes.id = ingredients.recipe_id and recipes.user_id = auth.uid())
);
create policy "Users can manage swaps of their ingredients" on ingredient_swaps for all using (
  exists (
    select 1 from ingredients
    join recipes on recipes.id = ingredients.recipe_id
    where ingredients.id = ingredient_swaps.ingredient_id and recipes.user_id = auth.uid()
  )
);
create policy "Users can manage their own meal plans" on meal_plans for all using (auth.uid() = user_id);
create policy "Users can manage their own meal plan entries" on meal_plan_entries for all using (
  exists (select 1 from meal_plans where meal_plans.id = meal_plan_entries.meal_plan_id and meal_plans.user_id = auth.uid())
);
create policy "Users can manage their own grocery items" on grocery_items for all using (auth.uid() = user_id);
