// app/dashboard/SettingsSection.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile, updatePassword, deleteAccount } from "./actions";
import { User, Lock, AlertTriangle, Check, Loader2 } from "lucide-react";

export default function SettingsSection({ user }: { user: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Profile update state
  const [fullName, setFullName] = useState(user.user_metadata?.full_name || "");
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Password update state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Delete account state
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);

    const formData = new FormData();
    formData.append("full_name", fullName);

    const res = await updateProfile(formData);
    if (res?.error) {
      setProfileMessage({ type: "error", text: res.error });
    } else {
      setProfileMessage({
        type: "success",
        text: "Profile updated successfully!",
      });
      startTransition(() => {
        router.refresh();
      });
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "New passwords do not match.",
      });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({
        type: "error",
        text: "Password must be at least 6 characters long.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("current_password", currentPassword);
    formData.append("new_password", newPassword);

    const res = await updatePassword(formData);
    if (res?.error) {
      setPasswordMessage({ type: "error", text: res.error });
    } else {
      setPasswordMessage({
        type: "success",
        text: "Password updated successfully!",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setDeleteError("Please type DELETE to confirm account deletion.");
      return;
    }

    setDeleteError(null);
    const res = await deleteAccount();
    if (res?.error) {
      setDeleteError(res.error);
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">
          Account Settings
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage your profile credentials, security preferences, and account
          status.
        </p>
      </div>

      {/* Profile Information Section */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Profile Information
            </h3>
            <p className="text-xs text-slate-400">
              Update your display name and view account metadata.
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-xs uppercase text-slate-400 mb-1 font-medium">
              Email Address
            </label>
            <input
              type="email"
              disabled
              value={user.email || ""}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Email address cannot be modified directly.
            </span>
          </div>

          <div>
            <label className="block text-xs uppercase text-slate-400 mb-1 font-medium">
              Username
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs uppercase text-slate-400 mb-1 font-medium">
              User ID
            </label>
            <input
              type="text"
              disabled
              value={user.id}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-400 cursor-not-allowed font-mono text-xs"
            />
          </div>

          {profileMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                profileMessage.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                  : "bg-red-500/10 border border-red-500/30 text-red-400"
              }`}
            >
              {profileMessage.type === "success" && (
                <Check className="h-4 w-4 shrink-0" />
              )}
              <span>{profileMessage.text}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition disabled:opacity-50 flex items-center gap-2"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Password Update Section */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Security &amp; Password
            </h3>
            <p className="text-xs text-slate-400">
              Ensure your account is using a secure password.
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-xs uppercase text-slate-400 mb-1 font-medium">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase text-slate-400 mb-1 font-medium">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs uppercase text-slate-400 mb-1 font-medium">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          {passwordMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                passwordMessage.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                  : "bg-red-500/10 border border-red-500/30 text-red-400"
              }`}
            >
              {passwordMessage.type === "success" && (
                <Check className="h-4 w-4 shrink-0" />
              )}
              <span>{passwordMessage.text}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone / Delete Account Section */}
      <div className="bg-slate-900 border border-red-500/30 p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
          <div className="p-2 bg-red-500/10 text-red-400 rounded-lg">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-400">Danger Zone</h3>
            <p className="text-xs text-slate-400">
              Permanently delete your account and all associated transaction
              records.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <p className="text-xs text-slate-400 max-w-md">
            Once your account is deleted, all your budgets, categories, and
            financial data will be permanently removed.
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 rounded-lg bg-red-600/10 border border-red-500/30 hover:bg-red-600 hover:text-white text-xs font-semibold text-red-400 transition shrink-0"
          >
            Delete Account
          </button>
        </div>

        {/* Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="bg-slate-900 border border-red-500/40 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-500/10 text-red-400 rounded-xl">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Delete Account
                  </h3>
                  <p className="text-xs text-slate-400">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Please type{" "}
                <span className="font-mono font-bold text-red-400">DELETE</span>{" "}
                below to confirm permanent deletion of your account.
              </p>

              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition font-mono tracking-wider"
              />

              {deleteError && (
                <p className="text-xs text-red-400 font-medium">
                  {deleteError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText("");
                    setDeleteError(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white transition shadow-lg shadow-red-600/20"
                >
                  Confirm Deletion
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
