"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/browser";
import { getSafeInternalPath } from "@/lib/auth/safe-redirect";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError("Please enter your email address and password.");
      return;
    }

    setLoading(true);

    const { error: signInError } =
      await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "The email address or password is incorrect."
          : "We could not sign you in. Please try again."
      );

      setLoading(false);
      return;
    }

    const next = getSafeInternalPath(
      new URLSearchParams(window.location.search).get("next"),
      "/participant/dashboard",
    );
    router.replace(next);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center bg-[#f4f2ed] px-5 py-10 text-black sm:px-8">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden border border-black bg-white/40 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="bg-black p-8 text-white sm:p-12 lg:flex lg:flex-col lg:justify-between" aria-labelledby="portal-title">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">
              Wealth Path AI Global
            </p>
            <p className="mt-4 text-sm uppercase tracking-[0.18em] text-white/70">
              Participant Portal
            </p>
            <h1 id="portal-title" className="mt-10 max-w-md font-serif text-5xl leading-[0.98] tracking-[-0.04em] sm:text-6xl">
              Your private participant workspace.
            </h1>
          </div>
          <div className="mt-12 border-t border-white/25 pt-6">
            <p className="max-w-md text-sm leading-7 text-white/75">
              Use this protected sign-in to view your participant information and the activities currently available to you.
            </p>
          </div>
        </section>

        <section className="p-8 sm:p-12" aria-labelledby="sign-in-title">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Secure sign-in</p>
          <h2 id="sign-in-title" className="mt-4 font-serif text-4xl tracking-[-0.03em]">
            Sign in
          </h2>

          <p className="mt-4 text-sm leading-6 text-black/60">
            You are signing in to the WPAG Participant Portal. Only authorized participant accounts can continue.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} aria-busy={loading}>
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium"
            >
              Email Address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              disabled={loading}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              className="w-full border border-black/30 bg-white px-4 py-3 outline-none transition focus-visible:border-black focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-neutral-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium"
            >
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={loading}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="w-full border border-black/30 bg-white px-4 py-3 outline-none transition focus-visible:border-black focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-neutral-100"
            />
          </div>

          {error ? (
            <p
              role="alert"
              aria-live="polite"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="min-h-12 w-full bg-black px-4 py-3 font-semibold text-white transition hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black disabled:cursor-wait disabled:opacity-60 active:translate-y-px"
          >
            {loading ? "Signing in…" : "Sign in to Participant Portal"}
          </button>
          <p className="sr-only" role="status" aria-live="polite">
            {loading ? "Sign-in in progress." : ""}
          </p>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/auth/forgot-password"
            className="text-sm underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
          >
            Forgot your password?
          </Link>
        </div>

        <p className="mt-8 text-center text-xs text-neutral-500">
          Participant access is provided directly by WPAG. This page does not create a new account.
        </p>
        </section>
      </div>
    </main>
  );
}
