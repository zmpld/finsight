// app/dashboard/budget-actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const MAX_LIMIT = 1_000_000_000;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MONTH_REGEX = /^(19|20|21)\d{2}-(0[1-9]|1[0-2])$/; // YYYY-MM
const AMOUNT_REGEX = /^\d{1,10}(\.\d{1,2})?$/;

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user || !UUID_REGEX.test(user.id))
    throw new Error("Unauthorized");
  return { supabase, user };
}

export async function setBudgetLimit(formData: FormData) {
  const { supabase, user } = await requireUser();

  const category_id = String(formData.get("category_id") ?? "").trim();
  const rawLimit = String(formData.get("monthly_limit") ?? "").trim();
  const month_year = String(formData.get("month_year") ?? "").trim(); // 'YYYY-MM'

  if (!UUID_REGEX.test(category_id)) {
    throw new Error("Choose a category for this budget.");
  }
  if (!MONTH_REGEX.test(month_year)) {
    throw new Error("Invalid budget month.");
  }
  const monthly_limit = Number(rawLimit);
  if (
    !AMOUNT_REGEX.test(rawLimit) ||
    !Number.isFinite(monthly_limit) ||
    monthly_limit <= 0 ||
    monthly_limit > MAX_LIMIT
  ) {
    throw new Error(
      "Enter a budget amount greater than zero, with up to 2 decimals.",
    );
  }

  // The category must be the caller's own (or a default) and an expense category
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id, type")
    .eq("id", category_id)
    .or(`user_id.eq.${user.id},is_default.eq.true`)
    .maybeSingle();

  if (categoryError || !category || category.type !== "expense") {
    throw new Error("Selected category is invalid or inaccessible.");
  }

  const { error } = await supabase.from("budgets").upsert(
    {
      user_id: user.id,
      category_id,
      monthly_limit: Math.round(monthly_limit * 100) / 100,
      month_year,
    },
    { onConflict: "user_id,category_id,month_year" },
  );

  if (error) {
    console.error("Failed to save budget:", error.message);
    throw new Error("Failed to save budget. Please try again.");
  }
  revalidatePath("/dashboard");
}

export async function deleteBudget(budgetId: string) {
  const { supabase, user } = await requireUser();

  if (typeof budgetId !== "string" || !UUID_REGEX.test(budgetId)) {
    throw new Error("Valid budget ID is required.");
  }

  const { data, error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", budgetId)
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    console.error("Failed to delete budget:", error.message);
    throw new Error("Failed to delete budget. Please try again.");
  }
  if (!data || data.length === 0) {
    throw new Error("Budget not found.");
  }

  revalidatePath("/dashboard");
}
