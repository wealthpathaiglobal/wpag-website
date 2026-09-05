"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { signInExistingBookReader } from "@/lib/book-reader/sign-in";
import { getSafeBookReturnPath } from "@/lib/book-reader/return-path";

export function BookAuthForm({ mode }: { mode: "login" | "recover" | "update" }) {
  const client = useMemo(() => createClient(), []);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      if (mode === "login") {
        const { error } = await signInExistingBookReader(client, email, password);
        if (error) { setError("We could not sign you in with those details."); return; }
        router.replace(getSafeBookReturnPath(new URLSearchParams(window.location.search).get("next"), "login"));
        router.refresh();
      } else if (mode === "recover") {
        const { error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo: `${window.location.origin}/book-reader/callback?next=/book-reader/update-password`,
        });
        if (error) { setError("We could not process your request. Please try again later."); return; }
        setMessage("If an account exists for this email, password reset instructions have been sent.");
      } else {
        if (password.length < 8 || password !== confirmation) { setError("Enter matching passwords of at least eight characters."); return; }
        const { error } = await client.auth.updateUser({ password });
        if (error) { setError("We could not update your password. Request a new reset link."); return; }
        const { error: signOutError } = await client.auth.signOut();
        if (signOutError) { setError("Password updated. Please sign out before signing in again."); return; }
        router.replace("/book-reader/login?password=updated"); router.refresh();
      }
    } catch { setError("We could not complete this request. Please try again."); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto min-h-screen max-w-md px-6 py-16">
    <h1 className="text-3xl font-semibold">{mode === "login" ? "Book reader sign in" : mode === "recover" ? "Reset your book reader password" : "Set your account password"}</h1>
    <p className="my-4">Use your existing WPAG account. Book access is separate from research participation. Public book-reader registration is not open.</p>
    {mode !== "login" && <p className="my-4 text-sm">Your password belongs to your shared WPAG account, including any existing participant access.</p>}
    <form onSubmit={submit} className="space-y-4">
      {mode !== "update" && <label className="block">Email<input className="mt-1 block w-full rounded border p-2" type="email" autoComplete="email" required disabled={busy} value={email} onChange={e => setEmail(e.target.value)} /></label>}
      {mode !== "recover" && <label className="block">Password<input className="mt-1 block w-full rounded border p-2" type="password" autoComplete={mode === "update" ? "new-password" : "current-password"} required minLength={mode === "update" ? 8 : undefined} disabled={busy} value={password} onChange={e => setPassword(e.target.value)} /></label>}
      {mode === "update" && <label className="block">Confirm password<input className="mt-1 block w-full rounded border p-2" type="password" autoComplete="new-password" required minLength={8} disabled={busy} value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>}
      {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
      <button className="rounded bg-black px-4 py-2 text-white" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : mode === "recover" ? "Send reset instructions" : "Update password"}</button>
    </form>
    <p className="mt-6"><Link className="underline" href={mode === "login" ? "/book-reader/recover" : "/book-reader/login"}>{mode === "login" ? "Forgot your password?" : "Return to book reader sign in"}</Link></p>
    <p className="mt-4"><Link className="underline" href="/books">Explore the public book preview</Link></p>
  </main>;
}
