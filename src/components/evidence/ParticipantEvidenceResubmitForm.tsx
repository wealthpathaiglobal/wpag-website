"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function evidenceResubmissionVisible(canResubmit: boolean) { return canResubmit; }

export default function ParticipantEvidenceResubmitForm({ documentId, canResubmit }: { documentId: string; canResubmit: boolean }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  if (!evidenceResubmissionVisible(canResubmit)) return null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (submitting) return;
    setSubmitting(true); setMessage(null);
    try {
      const response = await fetch(`/api/participant/evidence/${documentId}/resubmit`, { method: "POST", body: new FormData(event.currentTarget) });
      const result = await response.json() as { success?: boolean; message?: string };
      if (!response.ok || !result.success) throw new Error(result.message ?? "Evidence resubmission could not be completed.");
      setMessage("New evidence version submitted successfully.");
      event.currentTarget.reset(); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Evidence resubmission could not be completed."); }
    finally { setSubmitting(false); }
  }

  return (
    <form onSubmit={submit} className="border border-black bg-black p-6 text-white sm:p-8" aria-busy={submitting}>
      <h2 className="font-serif text-3xl">Resubmit evidence</h2>
      <p className="mt-3 text-sm leading-7 text-white/70">Upload a corrected file. Every prior version remains preserved in the immutable evidence history.</p>
      <label className="mt-6 block text-sm font-medium">New evidence file
        <input name="file" type="file" required accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" className="mt-2 block w-full border border-white/50 bg-white p-3 text-black" />
      </label>
      <p className="mt-3 text-xs text-white/60">PDF, JPEG, or PNG · maximum 10 MiB</p>
      {message && <p role="status" className="mt-5 text-sm">{message}</p>}
      <button type="submit" disabled={submitting} className="mt-6 min-h-12 border border-white px-6 text-xs font-semibold uppercase tracking-[0.14em] disabled:opacity-50">
        {submitting ? "Submitting securely…" : "Submit New Version"}
      </button>
    </form>
  );
}
