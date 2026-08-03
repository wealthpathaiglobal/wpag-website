"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { evidenceClassifications } from "@/lib/evidence/evidence-classification";

export default function ParticipantEvidenceUploadForm({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true); setMessage(null);
    try {
      const form = new FormData(event.currentTarget);
      form.set("assessmentId", assessmentId);
      const response = await fetch("/api/participant/evidence/upload", { method: "POST", body: form });
      const result = await response.json() as { success?: boolean; message?: string };
      if (!response.ok || !result.success) throw new Error(result.message ?? "Evidence upload could not be completed.");
      setMessage("Evidence uploaded successfully.");
      event.currentTarget.reset();
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Evidence upload could not be completed.");
    } finally { setSubmitting(false); }
  }

  return (
    <form onSubmit={submit} className="border border-black bg-white/45 p-6 sm:p-8" aria-busy={submitting}>
      <h2 className="font-serif text-3xl">Upload evidence</h2>
      <p className="mt-3 text-sm leading-6 text-black/60">PDF, JPEG, or PNG only. Maximum file size: 10 MiB.</p>
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium">Category
          <select name="documentCategory" required defaultValue="" className="mt-2 min-h-12 w-full border border-black bg-white px-3">
            <option value="" disabled>Select category</option>
            {evidenceClassifications.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Document type
          <select name="documentType" required defaultValue="" className="mt-2 min-h-12 w-full border border-black bg-white px-3">
            <option value="" disabled>Select type</option>
            {evidenceClassifications.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium sm:col-span-2">Display name
          <input name="displayName" required maxLength={200} className="mt-2 min-h-12 w-full border border-black bg-white px-3" />
        </label>
        <label className="text-sm font-medium sm:col-span-2">Description <span className="font-normal text-black/50">(optional)</span>
          <textarea name="description" maxLength={2000} rows={3} className="mt-2 w-full border border-black bg-white p-3" />
        </label>
        <label className="text-sm font-medium sm:col-span-2">Evidence file
          <input name="file" type="file" required accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" className="mt-2 block w-full border border-black bg-white p-3 text-sm" />
        </label>
      </div>
      {message && <p role="status" className="mt-5 text-sm leading-6">{message}</p>}
      <button type="submit" disabled={submitting} className="mt-6 min-h-12 border border-black bg-black px-6 text-xs font-semibold uppercase tracking-[0.14em] text-white disabled:opacity-50">
        {submitting ? "Uploading securely…" : "Upload Evidence"}
      </button>
    </form>
  );
}
