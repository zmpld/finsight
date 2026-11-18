// app/dashboard/budget-actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function setBudgetLimit(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const category_id = formData.get("category_id") as string;
  const monthly_limit = parseFloat(formData.get("monthly_limit") as string);
  const month_year = formData.get("month_year") as string; // 'YYYY-MM'

  const { error } = await supabase
    .from("budgets")
    .upsert(
      { user_id: user.id, category_id, monthly_limit, month_year },
      { onConflict: "user_id,category_id,month_year" },
    );

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function deleteBudget(budgetId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", budgetId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  // Revalidate both dashboard paths to cover query parameters
  revalidatePath("/dashboard", "page");
}
