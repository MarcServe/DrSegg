"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AppLogo } from "@/components/AppLogo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setSubmitted(true);
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
            Reset password
          </h1>
          <p className="mt-2 text-sm text-[var(--color-on-surface-variant)]">
            Enter your email and we&apos;ll send a reset link
          </p>
        </div>

        {submitted ? (
          <div className="rounded-xl bg-[var(--color-secondary-container)] px-6 py-5 text-center space-y-2">
            <p className="font-bold text-[var(--color-on-secondary-container)]">Check your email</p>
            <p className="text-sm text-[var(--color-on-surface-variant)]">
              If an account exists for <strong>{email}</strong>, a password reset link has been
              sent. Check your spam folder if you don&apos;t see it within a few minutes.
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
                htmlFor="email"
                className="block text-sm font-bold text-[var(--color-on-surface-variant)] mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-4 py-3 text-[var(--color-on-surface)]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-[var(--color-primary)] text-white font-headline font-bold disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-[var(--color-on-surface-variant)]">
          Remember it?{" "}
          <Link href="/login" className="font-bold text-[var(--color-primary)]">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
