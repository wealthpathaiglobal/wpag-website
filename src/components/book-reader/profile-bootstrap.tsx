"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export function ProfileBootstrap({ exists }: { exists: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function bootstrap() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/book-reader/profile", { method: "POST", credentials: "same-origin" });
      if (!response.ok) { setError("Your book reader profile could not be prepared."); return; }
      router.refresh();
    } catch { setError("Your book reader profile could not be prepared."); }
    finally { setBusy(false); }
  }
  async function signOut() {
    setBusy(true); setError("");
    try {
      // Auth deletes the session; the lease boundary checks live auth.sessions on every request.
      const { error } = await createClient().auth.signOut({ scope: "local" });
      if (error) { setError("We could not sign you out. Please try again."); return; }
      router.replace("/book-reader/login"); router.refresh();
    } catch { setError("We could not sign you out. Please try again."); }
    finally { setBusy(false); }
  }
  return <div className="my-6 space-y-4">
    {exists ? <p>Your book reader profile is ready. Purchases are not available yet.</p> : <button className="rounded border px-4 py-2" disabled={busy} onClick={bootstrap}>Set up book reader profile</button>}
    {error && <p role="alert">{error}</p>}
    <button className="block underline" disabled={busy} onClick={signOut}>Sign out of this session</button>
  </div>;
}
