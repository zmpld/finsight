// app/auth/actions.ts
"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

const MAX_ACCOUNTS_PER_EMAIL = 5; // keep in sync with handle_new_user() in the SQL migration
const MAX_NAME_LENGTH = 80;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_BYTES = 72;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALIAS_TAG_REGEX = /\+fs[0-9a-f]{8}@/;

const INVALID_LOGIN = "Incorrect email or password.";
const RATE_LIMITED =
  "Too many attempts. Please wait a few minutes and try again.";

/** Errors are returned, not thrown: Next.js hides thrown messages in production. */
export type AuthResult =
  | { success: true; message?: string }
  | { success: false; error: string; needsDisplayName?: boolean };

const fail = (
  error: string,
  extra: { needsDisplayName?: boolean } = {},
): AuthResult => ({
  success: false,
  error,
  ...extra,
});

/* ----------------------------- helpers ----------------------------- */
function supabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

// Service-role client: bypasses RLS. Used only on the server, only for profile lookups.
function adminClient() {
  const { url, serviceKey } = supabaseEnv();
  if (!url || !serviceKey) return null;
  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Anon client that never stores a session or cookies
function statelessClient() {
  const { url, anonKey } = supabaseEnv();
  return createSupabaseClient(url!, anonKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function cleanName(value: FormDataEntryValue | null): string {
  return String(value ?? "")
    .replace(/[\x00-\x1F\x7F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NAME_LENGTH);
}

function normalizeEmail(value: FormDataEntryValue | null): string | null {
  const email = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!email || email.length > 254 || !EMAIL_REGEX.test(email)) return null;
  return email;
}

// name@gmail.com -> name+fs1a2b3c4d@gmail.com (delivered to the same inbox by most providers)
function makeAlias(email: string): string {
  const base = email.replace(ALIAS_TAG_REGEX, "@");
  const at = base.lastIndexOf("@");
  return `${base.slice(0, at)}+fs${randomBytes(4).toString("hex")}${base.slice(at)}`;
}

function friendlyAuthError(err: {
  code?: string;
  message?: string;
  status?: number;
}) {
  const code = err.code ?? "";
  const message = (err.message ?? "").toLowerCase();

  if (
    code === "invalid_credentials" ||
    message.includes("invalid login credentials")
  ) {
    return INVALID_LOGIN;
  }
  if (
    code === "email_not_confirmed" ||
    message.includes("email not confirmed")
  ) {
    return "Please confirm your email first. Check your inbox for the verification link.";
  }
  if (code.startsWith("over_") || err.status === 429) return RATE_LIMITED;
  return "We couldn’t sign you in. Please try again.";
}

/* ------------------------------ sign up ------------------------------ */
export async function signUpAccount(formData: FormData): Promise<AuthResult> {
  try {
    const name = cleanName(formData.get("full_name"));
    const email = normalizeEmail(formData.get("email"));
    const password = String(formData.get("password") ?? "");
    const agreed = formData.get("agreed") === "true";

    if (!name) return fail("Enter a display name.");
    if (!email) return fail("Enter a valid email address.");
    if (!agreed) {
      return fail(
        "You must agree to the Privacy Policy and Terms of Use to create an account.",
      );
    }
    if (
      password.length < MIN_PASSWORD_LENGTH ||
      new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES
    ) {
      return fail(
        `Use ${MIN_PASSWORD_LENGTH} to ${MAX_PASSWORD_BYTES} characters for your password.`,
      );
    }

    const admin = adminClient();
    if (!admin || !supabaseEnv().anonKey) {
      console.error("signUpAccount: Supabase env vars are missing");
      return fail(
        "Sign-up is temporarily unavailable. Please try again later.",
      );
    }

    // Which accounts already use this real email?
    const { data: existing, error: lookupError } = await admin
      .from("profiles")
      .select("display_name")
      .eq("contact_email", email)
      .limit(MAX_ACCOUNTS_PER_EMAIL + 1);

    if (lookupError) {
      console.error("signUpAccount lookup failed:", lookupError.message);
      return fail(
        "We couldn’t create your account right now. Please try again.",
      );
    }

    const taken = existing ?? [];
    if (taken.length >= MAX_ACCOUNTS_PER_EMAIL) {
      return fail(
        `This email already has the maximum of ${MAX_ACCOUNTS_PER_EMAIL} accounts.`,
      );
    }
    if (
      taken.some(
        (p) => p.display_name.trim().toLowerCase() === name.toLowerCase(),
      )
    ) {
      return fail(
        "An account with this email and display name already exists. Choose a different display name.",
      );
    }

    // First account keeps the plain email; further ones get a unique alias so Supabase
    // treats them as new users and actually sends a verification email.
    const authEmail = taken.length === 0 ? email : makeAlias(email);

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL || (await headers()).get("origin") || "";

    const { error } = await statelessClient().auth.signUp({
      email: authEmail,
      password,
      options: {
        data: { full_name: name, display_name: name },
        emailRedirectTo: origin ? `${origin}/auth/confirm` : undefined,
      },
    });

    if (error) {
      const code = error.code ?? "";
      const msg = error.message.toLowerCase();
      if (code.startsWith("over_") || error.status === 429)
        return fail(RATE_LIMITED);
      if (code === "weak_password") return fail(error.message);
      if (code === "email_address_invalid") {
        return fail(
          "That email address can’t be used. Check it and try again.",
        );
      }
      if (code === "unexpected_failure" || msg.includes("database error")) {
        // Raised by the profile trigger: duplicate display name or account cap (e.g. a race)
        return fail(
          "We couldn’t create this account. The display name may already be used with this email.",
        );
      }
      console.error("signUp failed:", error.code, error.message);
      return fail(
        "We couldn’t create your account. Please check your details and try again.",
      );
    }

    return {
      success: true,
      message:
        taken.length === 0
          ? "Check your inbox. We’ve sent a verification link to continue."
          : "Check your inbox. We’ve sent a verification link for this new account. It may show a tag after your name, like name+fs1234abcd@…, which is normal.",
    };
  } catch (err) {
    console.error("Unexpected signUpAccount error:", err);
    return fail("Something went wrong. Please try again.");
  }
}

/* ------------------------------ sign in ------------------------------ */
export async function signInAccount(formData: FormData): Promise<AuthResult> {
  try {
    const email = normalizeEmail(formData.get("email"));
    const password = String(formData.get("password") ?? "");
    const displayName = cleanName(formData.get("display_name"));

    if (!email || !password || password.length > 256)
      return fail(INVALID_LOGIN);

    // Work out which login address(es) belong to this real email
    let candidates: { login_email: string }[] = [{ login_email: email }];
    const admin = adminClient();
    if (admin) {
      const { data } = await admin
        .from("profiles")
        .select("display_name, login_email")
        .eq("contact_email", email)
        .limit(MAX_ACCOUNTS_PER_EMAIL);

      if (data && data.length > 0) {
        candidates = displayName
          ? data.filter(
              (p) =>
                p.display_name.trim().toLowerCase() ===
                displayName.toLowerCase(),
            )
          : data;
        if (candidates.length === 0) return fail(INVALID_LOGIN);
      }
    }

    // One possible account: normal sign-in that sets the session cookies
    if (candidates.length === 1) {
      const supabase = await createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: candidates[0].login_email,
        password,
      });
      return error ? fail(friendlyAuthError(error)) : { success: true };
    }

    // Several accounts share this email: find the one(s) this password opens, without cookies
    const probe = statelessClient();
    const sessions: { access_token: string; refresh_token: string }[] = [];
    let sawUnconfirmed = false;
    let sawRateLimit = false;

    for (const c of candidates) {
      const { data, error } = await probe.auth.signInWithPassword({
        email: c.login_email,
        password,
      });
      if (!error && data.session) {
        sessions.push(data.session);
      } else if (error?.code === "email_not_confirmed") {
        sawUnconfirmed = true;
      } else if (
        error &&
        (error.status === 429 || (error.code ?? "").startsWith("over_"))
      ) {
        sawRateLimit = true;
        break;
      }
    }

    if (sessions.length === 0) {
      return fail(
        sawRateLimit
          ? RATE_LIMITED
          : sawUnconfirmed
            ? "Please confirm your email first. Check your inbox for the verification link."
            : INVALID_LOGIN,
      );
    }

    if (sessions.length > 1) {
      // Same password on more than one account: discard these sessions and ask which one
      if (admin) {
        await Promise.allSettled(
          sessions.map((s) =>
            admin.auth.admin.signOut(s.access_token, "local"),
          ),
        );
      }
      return fail(
        "More than one of your accounts uses this password. Enter your display name to choose one.",
        { needsDisplayName: true },
      );
    }

    const supabase = await createClient();
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: sessions[0].access_token,
      refresh_token: sessions[0].refresh_token,
    });
    if (sessionError) return fail("We couldn’t sign you in. Please try again.");

    return { success: true };
  } catch (err) {
    console.error("Unexpected signInAccount error:", err);
    return fail("We couldn’t sign you in. Please try again.");
  }
}
