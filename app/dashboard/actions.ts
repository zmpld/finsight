// app/dashboard/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const MAX_DESCRIPTION_LENGTH = 200;
const MAX_NAME_LENGTH = 80;
const MAX_AMOUNT = 1_000_000_000; // 1B cap to prevent overflow/abuse
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  return { supabase, user };
}

function isValidDateString(dateStr: string): boolean {
  if (!DATE_REGEX.test(dateStr)) return false;
  const parsed = new Date(`${dateStr}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(dateStr)
  );
}

function parseTransactionForm(formData: FormData) {
  const rawAmount = String(formData.get("amount") ?? "").trim();
  const amount = Number(rawAmount);
  const type = String(formData.get("type") ?? "").trim() as
    | "income"
    | "expense";
  const description = String(formData.get("description") ?? "")
    .replace(/[\x00-\x1F\x7F]/g, " ")
    .trim();
  const rawCategoryId = String(formData.get("category_id") ?? "").trim();
  const rawDate = String(formData.get("transaction_date") ?? "").trim();

  if (!description) {
    throw new Error("Description is required");
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    throw new Error(
      `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`,
    );
  }

  if (
    !rawAmount ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > MAX_AMOUNT
  ) {
    throw new Error("Amount must be a valid positive number");
  }

  if (type !== "income" && type !== "expense") {
    throw new Error("Type must be income or expense");
  }

  if (rawCategoryId && !UUID_REGEX.test(rawCategoryId)) {
    throw new Error("Invalid category selected");
  }

  const fallbackDate = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Manila",
  });
  const transaction_date = rawDate || fallbackDate;

  if (!isValidDateString(transaction_date)) {
    throw new Error("Invalid transaction date");
  }

  return {
    amount: Math.round(amount * 100) / 100,
    type,
    description,
    category_id: rawCategoryId || null,
    transaction_date,
  };
}

async function verifyCategoryOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  categoryId: string | null,
  expectedType: "income" | "expense",
) {
  if (!categoryId) return;

  const { data: category, error } = await supabase
    .from("categories")
    .select("id, type, user_id, is_default")
    .eq("id", categoryId)
    .or(`user_id.eq.${userId},is_default.eq.true`)
    .maybeSingle();

  if (error || !category) {
    throw new Error("Selected category is invalid or inaccessible");
  }

  if (category.type !== expectedType) {
    throw new Error("Category type does not match transaction type");
  }
}

export async function addTransaction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const payload = parseTransactionForm(formData);

  await verifyCategoryOwnership(
    supabase,
    user.id,
    payload.category_id,
    payload.type,
  );

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    ...payload,
  });

  if (error) {
    console.error("Failed to add transaction:", error.message);
    throw new Error("Failed to add transaction. Please try again.");
  }

  revalidatePath("/dashboard");
}

export async function updateTransaction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "").trim();
  if (!id || !UUID_REGEX.test(id)) {
    throw new Error("Valid transaction ID is required");
  }

  const payload = parseTransactionForm(formData);

  await verifyCategoryOwnership(
    supabase,
    user.id,
    payload.category_id,
    payload.type,
  );

  const { error } = await supabase
    .from("transactions")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to update transaction:", error.message);
    throw new Error("Failed to update transaction. Please try again.");
  }

  revalidatePath("/dashboard");
}

export async function deleteTransaction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "").trim();
  if (!id || !UUID_REGEX.test(id)) {
    throw new Error("Valid transaction ID is required");
  }

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to delete transaction:", error.message);
    throw new Error("Failed to delete transaction. Please try again.");
  }

  revalidatePath("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ==========================================
// ACCOUNT & SETTINGS ACTIONS
// ==========================================

export async function updateProfile(formData: FormData) {
  const { supabase } = await requireUser();
  const fullName = String(formData.get("full_name") ?? "")
    .replace(/[\x00-\x1F\x7F]/g, " ")
    .trim();

  if (!fullName) {
    return { error: "Display name cannot be empty." };
  }

  if (fullName.length > MAX_NAME_LENGTH) {
    return {
      error: `Display name must be ${MAX_NAME_LENGTH} characters or less.`,
    };
  }

  const { error } = await supabase.auth.updateUser({
    data: { full_name: fullName },
  });

  if (error) {
    console.error("Failed to update profile:", error.message);
    return { error: "Failed to update profile. Please try again." };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updatePassword(formData: FormData) {
  const { supabase, user } = await requireUser();
  const currentPassword = String(formData.get("current_password") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");

  if (!user.email) {
    return {
      error: "Password updates are not supported for this account type.",
    };
  }

  if (!currentPassword || !newPassword) {
    return { error: "Please enter both your current and new passwords." };
  }

  if (newPassword.length < 8 || newPassword.length > 72) {
    return { error: "New password must be between 8 and 72 characters long." };
  }

  if (currentPassword === newPassword) {
    return {
      error: "New password must be different from your current password.",
    };
  }

  // Verify current password before allowing change
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    return { error: "Incorrect current password." };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    console.error("Failed to update password:", updateError.message);
    return { error: "Failed to update password. Please try again." };
  }

  return { success: true };
}

export async function deleteAccount() {
  const { supabase, user } = await requireUser();

  // Delete all user-owned rows and verify each step succeeds
  const tables = [
    "transactions",
    "budgets",
    "categories",
    "ai_insight_requests",
  ] as const;

  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("user_id", user.id);
    if (error) {
      console.error(`Failed to delete user data from ${table}:`, error.message);
      return {
        error:
          "Unable to delete all account records right now. Please try again.",
      };
    }
  }

  // If SUPABASE_SERVICE_ROLE_KEY is configured on the server, delete the auth user completely
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    const adminSupabase = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error: deleteUserError } =
      await adminSupabase.auth.admin.deleteUser(user.id);
    if (deleteUserError) {
      console.error("Failed to delete auth user:", deleteUserError.message);
      return {
        error:
          "Account data cleared, but auth deletion failed. Please contact support.",
      };
    }
  }

  const { error: signOutError } = await supabase.auth.signOut();
  if (signOutError) {
    console.error("Failed to sign out after deletion:", signOutError.message);
  }

  return { success: true };
}
