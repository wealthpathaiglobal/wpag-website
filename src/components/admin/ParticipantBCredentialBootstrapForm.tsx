"use client";

import { FormEvent, useState } from "react";

export default function ParticipantBCredentialBootstrapForm() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !confirmation) return;

    setPending(true);
    setMessage(null);

    try {
      const response = await fetch(
        "/api/admin/staging/participant-b-credential-bootstrap",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ password, confirmed: confirmation }),
        },
      );
      const result = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || result.success !== true) {
        throw new Error(result.error || "Password update could not be completed.");
      }

      setPassword("");
      setConfirmation(false);
      setSucceeded(true);
      setMessage("Participant B temporary password was updated in staging.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Password update could not be completed.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} aria-busy={pending} className="mt-8 space-y-6">
      <div>
        <label htmlFor="participant-b-password" className="block text-sm font-semibold text-slate-900">
          Founder-chosen temporary password
        </label>
        <input
          id="participant-b-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={16}
          autoComplete="new-password"
          required
          disabled={pending || succeeded}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-200"
        />
        <p className="mt-2 text-sm text-slate-600">
          At least 16 characters. The password is sent only to the protected server endpoint and is not returned or stored in application tables.
        </p>
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-slate-800">
        <input
          type="checkbox"
          checked={confirmation}
          onChange={(event) => setConfirmation(event.target.checked)}
          disabled={pending || succeeded}
          className="mt-1 h-4 w-4"
        />
        <span>
          I confirm this update is only for synthetic Participant B (WPAG-000002) in HFOS Research Staging. No participant or research state will be changed.
        </span>
      </label>

      <button
        type="submit"
        disabled={pending || succeeded || !confirmation || password.length < 16}
        className="rounded-xl bg-sky-700 px-5 py-3 font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Updating Participant B password…" : "Update Participant B password"}
      </button>

      <p role="status" aria-live="polite" className="min-h-6 text-sm text-slate-700">
        {message}
      </p>
    </form>
  );
}
