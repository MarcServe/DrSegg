"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppLogo } from "@/components/AppLogo";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/cases";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (signError) {
        setError(signError.message);
        return;
      }
      router.push(next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-[var(--color-background)]">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <AppLogo href="/" size={240} />
          </div>
          <h1 className="mt-4 text-2xl font-headline font-bold text-[var(--color-on-surface)]">
            Create account
          </h1>
          <p className="mt-2 text-sm text-[var(--color-on-surface-variant)]">
            Start tracking herd health
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 px-4 py-2 rounded-lg">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-[var(--color-on-surface-variant)] mb-1">
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
          <div>
            <label htmlFor="password" className="block text-sm font-bold text-[var(--color-on-surface-variant)] mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-4 py-3 text-[var(--color-on-surface)]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-[var(--color-primary)] text-white font-headline font-bold disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--color-on-surface-variant)]">
          Already have an account?{" "}
          <Link href={`/login${next !== "/cases" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-bold text-[var(--color-primary)]">
            Sign in
          </Link>
        </p>
        <p className="text-center">
          <Link href="/" className="text-sm text-[var(--color-outline)] hover:text-[var(--color-primary)]">
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <SignupForm />
    </Suspense>
  );
}
