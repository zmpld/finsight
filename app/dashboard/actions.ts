// app/dashboard/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const MAX_DESCRIPTION_LENGTH = 200;
const MAX_NAME_LENGTH = 80;
const MAX_AMOUNT = 1_000_000_000; // 1B cap to prevent overflow/abuse
const MAX_PASSWORD_BYTES = 72; // bcrypt ignores anything longer
const MIN_YEAR = 1990;
const MAX_YEAR = 2100;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
// Plain decimal only: rejects "1e5", "0x10", "Infinity", "+5", " 5 " etc.
const AMOUNT_REGEX = /^\d{1,10}(\.\d{1,2})?$/;

async function requireUser() {
  const supabase = await createClient();
  // getUser() re-validates the token with Supabase (never trust getSession on the server)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  // Defense in depth: this id is interpolated into a PostgREST filter below
  if (!UUID_REGEX.test(user.id)) throw new Error("Unauthorized");
  return { supabase, user };
}

function isValidDateString(dateStr: string): boolean {
  if (!DATE_REGEX.test(dateStr)) return false;
  const parsed = new Date(`${dateStr}T00:00:00Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    !parsed.toISOString().startsWith(dateStr)
  ) {
    return false;
  }
  const year = parsed.getUTCFullYear();
  return year >= MIN_YEAR && year <= MAX_YEAR;
}

function parseTransactionForm(formData: FormData) {
  const rawAmount = String(formData.get("amount") ?? "").trim();
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

  const amount = Number(rawAmount);
  if (
    !AMOUNT_REGEX.test(rawAmount) ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > MAX_AMOUNT
  ) {
    throw new Error(
      "Amount must be a valid positive number with up to 2 decimals",
    );
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

  const { data, error } = await supabase
    .from("transactions")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    console.error("Failed to update transaction:", error.message);
    throw new Error("Failed to update transaction. Please try again.");
  }
  // Nothing matched: wrong id or not the caller's row
  if (!data || data.length === 0) {
    throw new Error("Transaction not found");
  }

  revalidatePath("/dashboard");
}

export async function deleteTransaction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "").trim();
  if (!id || !UUID_REGEX.test(id)) {
    throw new Error("Valid transaction ID is required");
  }

  const { data, error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    console.error("Failed to delete transaction:", error.message);
    throw new Error("Failed to delete transaction. Please try again.");
  }
  if (!data || data.length === 0) {
    throw new Error("Transaction not found");
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
  const { supabase, user } = await requireUser();
  const fullName = String(formData.get("full_name") ?? "")
    .replace(/[\x00-\x1F\x7F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!fullName) {
    return { error: "Display name cannot be empty." };
  }

  if (fullName.length > MAX_NAME_LENGTH) {
    return {
      error: `Display name must be ${MAX_NAME_LENGTH} characters or less.`,
    };
  }

  // Remember the current value so we can roll back if the second write fails
  const { data: current } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  // 1) The profiles table is the source of truth. A unique index on
  //    (contact_email, lower(display_name)) rejects names already used by
  //    another account that shares this email.
  const { data: updated, error: profileError } = await supabase
    .from("profiles")
    .update({ display_name: fullName })
    .eq("id", user.id)
    .select("id");

  if (profileError) {
    if (profileError.code === "23505") {
      return {
        error:
          "Another account with your email already uses that display name.",
      };
    }
    console.error("Failed to update profile row:", profileError.message);
    return { error: "Failed to update profile. Please try again." };
  }
  if (!updated || updated.length === 0) {
    return { error: "Profile not found. Please sign out and back in." };
  }

  // 2) Mirror it into Supabase Auth so the Auth dashboard shows the same name
  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name: fullName, display_name: fullName },
  });

  if (authError) {
    console.error("Failed to update auth metadata:", authError.message);
    if (current?.display_name) {
      await supabase
        .from("profiles")
        .update({ display_name: current.display_name })
        .eq("id", user.id);
    }
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

  // Length in bytes, not characters: multi-byte characters count more
  const newPasswordBytes = new TextEncoder().encode(newPassword).length;
  if (newPassword.length < 8 || newPasswordBytes > MAX_PASSWORD_BYTES) {
    return { error: "New password must be 8 to 72 characters long." };
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

  // Sign out every other device; this session stays signed in
  const { error: revokeError } = await supabase.auth.signOut({
    scope: "others",
  });
  if (revokeError) {
    console.error("Failed to revoke other sessions:", revokeError.message);
  }

  return { success: true };
}

export async function deleteAccount(formData: FormData) {
  const { supabase, user } = await requireUser();

  // Server-side confirmation: never rely on the UI alone for a destructive action
  const confirmation = String(formData.get("confirmation") ?? "").trim();
  if (confirmation !== "DELETE") {
    return { error: "Type DELETE to confirm." };
  }

  // Password accounts must re-enter their password (protects against a stolen session)
  const providers: string[] = user.app_metadata?.providers ?? ["email"];
  const usesPassword = Boolean(user.email) && providers.includes("email");
  if (usesPassword) {
    const password = String(formData.get("password") ?? "");
    if (!password) {
      return { error: "Enter your password to delete your account." };
    }
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email as string,
      password,
    });
    if (reauthError) {
      return { error: "Incorrect password." };
    }
  }

  // Check the server is able to finish the job BEFORE deleting anything,
  // so the account can never be left half-deleted or reported as deleted when it isn't.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("deleteAccount: SUPABASE_SERVICE_ROLE_KEY is not configured");
    return {
      error:
        "Account deletion is not available right now. Please contact support.",
    };
  }

  // The service-role client is created only here, server-side, and never exposed
  const adminSupabase = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Delete all user-owned rows (service role bypasses RLS, so tables that users
  // can't delete from themselves, like ai_insight_requests, are cleaned too)
  const tables = [
    "transactions",
    "budgets",
    "categories",
    "ai_insight_requests",
  ] as const;

  for (const table of tables) {
    const { error } = await adminSupabase
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

  // profiles is keyed by id (and also cascades when the auth user is deleted)
  const { error: profileDeleteError } = await adminSupabase
    .from("profiles")
    .delete()
    .eq("id", user.id);
  if (profileDeleteError) {
    console.error("Failed to delete profile:", profileDeleteError.message);
    return {
      error:
        "Unable to delete all account records right now. Please try again.",
    };
  }

  const { error: deleteUserError } = await adminSupabase.auth.admin.deleteUser(
    user.id,
  );
  if (deleteUserError) {
    console.error("Failed to delete auth user:", deleteUserError.message);
    return {
      error:
        "Account data cleared, but auth deletion failed. Please contact support.",
    };
  }

  const { error: signOutError } = await supabase.auth.signOut();
  if (signOutError) {
    console.error("Failed to sign out after deletion:", signOutError.message);
  }

  return { success: true };
}
