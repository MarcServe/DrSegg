"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppLogo } from "@/components/AppLogo";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/cases"), 2500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-[var(--color-background)]">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <AppLogo href="/" size={240} emphasis />
          </div>
          <h1 className="mt-4 text-2xl font-headline font-bold text-[var(--color-on-surface)]">
            Set new password
          </h1>
          <p className="mt-2 text-sm text-[var(--color-on-surface-variant)]">
            Choose a strong password for your account
          </p>
        </div>

        {done ? (
          <div className="rounded-xl bg-[var(--color-secondary-container)] px-6 py-5 text-center space-y-2">
            <p className="font-bold text-[var(--color-on-secondary-container)]">Password updated!</p>
            <p className="text-sm text-[var(--color-on-surface-variant)]">
              Redirecting you to your cases…
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 px-4 py-2 rounded-lg">
                {error}
              </p>
            )}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-bold text-[var(--color-on-surface-variant)] mb-1"
              >
                New password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-4 py-3 text-[var(--color-on-surface)]"
              />
            </div>
            <div>
              <label
                htmlFor="confirm"
                className="block text-sm font-bold text-[var(--color-on-surface-variant)] mb-1"
              >
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-4 py-3 text-[var(--color-on-surface)]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-[var(--color-primary)] text-white font-headline font-bold disabled:opacity-50"
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
