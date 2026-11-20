// app/dashboard/SettingsSection.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { updateProfile, updatePassword, deleteAccount } from "./actions";
import {
  User,
  Lock,
  AlertTriangle,
  Check,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const inputClass =
  "w-full rounded-lg bg-slate-950 border border-slate-700/80 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:text-slate-500 disabled:cursor-not-allowed";
const labelClass = "block text-sm font-medium text-slate-300 mb-1.5";
const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400";

type Message = { type: "success" | "error"; text: string } | null;

function PanelHeader({
  icon: Icon,
  title,
  description,
  tone = "neutral",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: "neutral" | "danger";
}) {
  return (
    <header className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
      <div
        className={`h-9 w-9 shrink-0 rounded-lg flex items-center justify-center ${
          tone === "danger"
            ? "bg-red-500/10 text-red-400"
            : "bg-slate-800 text-slate-300"
        }`}
      >
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div>
        <h3
          className={`text-sm font-semibold ${tone === "danger" ? "text-red-400" : "text-slate-100"}`}
        >
          {title}
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
    </header>
  );
}

function Notice({ message }: { message: Message }) {
  if (!message) return null;
  const ok = message.type === "success";
  return (
    <div
      role={ok ? "status" : "alert"}
      className={`rounded-lg border px-3.5 py-2.5 text-sm flex items-start gap-2.5 ${
        ok
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : "border-red-500/30 bg-red-500/10 text-red-300"
      }`}
    >
      {ok ? (
        <Check className="h-4 w-4 mt-0.5 shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
      )}
      <span>{message.text}</span>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  hint,
  autoFocus,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  hint?: ReactNode;
  autoFocus?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          className={`${inputClass} pr-10`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={
            visible
              ? `Hide ${label.toLowerCase()}`
              : `Show ${label.toLowerCase()}`
          }
          aria-pressed={visible}
          className={`absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-200 transition-colors ${focusRing}`}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
      {hint && <p className="text-xs text-slate-500 mt-1.5">{hint}</p>}
    </div>
  );
}

export default function SettingsSection({
  user,
  displayName,
  contactEmail,
}: {
  user: any;
  displayName?: string;
  contactEmail?: string;
}) {
  const router = useRouter();

  // Whether this account signs in with a password (the server re-checks this)
  const usesPassword =
    Boolean(user.email) &&
    (user.app_metadata?.providers ?? ["email"]).includes("email");

  // Profile
  const [profilePending, startProfile] = useTransition();
  const [fullName, setFullName] = useState<string>(
    displayName ?? user.user_metadata?.full_name ?? "",
  );
  const [profileMessage, setProfileMessage] = useState<Message>(null);

  // Password
  const [passwordPending, startPassword] = useTransition();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<Message>(null);

  // Delete account
  const [deletePending, startDelete] = useTransition();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirmText("");
    setDeletePassword("");
    setDeleteError(null);
  };

  // Escape closes the dialog (unless a deletion is running)
  useEffect(() => {
    if (!showDeleteModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deletePending) closeDeleteModal();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showDeleteModal, deletePending]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    const formData = new FormData();
    formData.append("full_name", fullName);

    startProfile(async () => {
      const res = await updateProfile(formData);
      if (res?.error) {
        setProfileMessage({ type: "error", text: res.error });
      } else {
        setProfileMessage({ type: "success", text: "Profile updated." });
        router.refresh();
      }
    });
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "The new passwords don’t match.",
      });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage({
        type: "error",
        text: "Use at least 8 characters for the new password.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("current_password", currentPassword);
    formData.append("new_password", newPassword);

    startPassword(async () => {
      const res = await updatePassword(formData);
      if (res?.error) {
        setPasswordMessage({ type: "error", text: res.error });
      } else {
        setPasswordMessage({
          type: "success",
          text: "Password updated. Your other devices have been signed out.",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    });
  };

  const handleDeleteAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== "DELETE") {
      setDeleteError("Type DELETE to confirm.");
      return;
    }
    setDeleteError(null);

    const formData = new FormData();
    formData.append("confirmation", deleteConfirmText);
    if (usesPassword) formData.append("password", deletePassword);

    startDelete(async () => {
      const res = await deleteAccount(formData);
      if (res?.error) {
        setDeleteError(res.error);
      } else {
        router.replace("/login");
        router.refresh();
      }
    });
  };

  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Account settings
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Manage your profile, password and account.
        </p>
      </div>

      {/* Profile */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60">
        <PanelHeader
          icon={User}
          title="Profile"
          description="Your display name appears in the dashboard greeting."
        />
        <form onSubmit={handleUpdateProfile} className="p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="settings-email" className={labelClass}>
                Email address
              </label>
              <input
                id="settings-email"
                type="email"
                disabled
                value={contactEmail || user.email || ""}
                className={inputClass}
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Your email can’t be changed here.
              </p>
            </div>
            <div>
              <label htmlFor="settings-name" className={labelClass}>
                Display name
              </label>
              <input
                id="settings-name"
                type="text"
                value={fullName}
                maxLength={80}
                autoComplete="name"
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="settings-id" className={labelClass}>
              Account ID
            </label>
            <input
              id="settings-id"
              type="text"
              disabled
              value={user.id}
              className={`${inputClass} font-mono !text-xs`}
            />
          </div>

          <Notice message={profileMessage} />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={profilePending}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${focusRing}`}
            >
              {profilePending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </button>
          </div>
        </form>
      </section>

      {/* Password */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60">
        <PanelHeader
          icon={Lock}
          title="Password"
          description="Changing it signs you out of your other devices."
        />
        {usesPassword ? (
          <form onSubmit={handleUpdatePassword} className="p-5 space-y-5">
            <PasswordField
              id="current-password"
              label="Current password"
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <PasswordField
                id="new-password"
                label="New password"
                value={newPassword}
                onChange={setNewPassword}
                autoComplete="new-password"
                hint="8 to 72 characters."
              />
              <PasswordField
                id="confirm-password"
                label="Confirm new password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
                hint={
                  confirmPassword.length === 0 ? undefined : passwordsMatch ? (
                    <span className="text-emerald-400">Passwords match.</span>
                  ) : (
                    <span className="text-red-400">
                      Passwords don’t match yet.
                    </span>
                  )
                }
              />
            </div>

            <Notice message={passwordMessage} />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={passwordPending}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${focusRing}`}
              >
                {passwordPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Update password
              </button>
            </div>
          </form>
        ) : (
          <p className="p-5 text-sm text-slate-400">
            Your account doesn’t sign in with a password, so there is nothing to
            change here.
          </p>
        )}
      </section>

      {/* Danger zone */}
      <section className="rounded-xl border border-red-500/30 bg-slate-900/60">
        <PanelHeader
          icon={AlertTriangle}
          tone="danger"
          title="Delete account"
          description="Permanently remove your account and all of your data."
        />
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-slate-400 max-w-md">
            Your transactions, budgets and categories are deleted for good. This
            can’t be undone.
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className={`shrink-0 px-4 py-2 rounded-lg border border-red-500/40 text-sm font-semibold text-red-400 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors ${focusRing}`}
          >
            Delete account
          </button>
        </div>
      </section>

      {/* Confirmation dialog */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => !deletePending && closeDeleteModal()}
        >
          <form
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            aria-describedby="delete-desc"
            onSubmit={handleDeleteAccount}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-red-500/40 bg-slate-900 p-6 space-y-5 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3
                  id="delete-title"
                  className="text-base font-semibold text-white"
                >
                  Delete your account?
                </h3>
                <p id="delete-desc" className="text-sm text-slate-400 mt-1">
                  All of your data will be permanently removed. This can’t be
                  undone.
                </p>
              </div>
            </div>

            {usesPassword && (
              <PasswordField
                id="delete-password"
                label="Your password"
                value={deletePassword}
                onChange={setDeletePassword}
                autoComplete="current-password"
                autoFocus
              />
            )}

            <div>
              <label htmlFor="delete-confirm" className={labelClass}>
                Type{" "}
                <span className="font-mono font-semibold text-red-400">
                  DELETE
                </span>{" "}
                to confirm
              </label>
              <input
                id="delete-confirm"
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                autoComplete="off"
                autoFocus={!usesPassword}
                className={`${inputClass} font-mono tracking-wider focus:!border-red-500 focus:!ring-red-500`}
              />
            </div>

            {deleteError && (
              <p role="alert" className="text-sm text-red-400">
                {deleteError}
              </p>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deletePending}
                className={`px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium text-slate-200 transition-colors disabled:opacity-50 ${focusRing}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={deletePending || deleteConfirmText !== "DELETE"}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${focusRing}`}
              >
                {deletePending && <Loader2 className="h-4 w-4 animate-spin" />}
                {deletePending ? "Deleting…" : "Delete account"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
