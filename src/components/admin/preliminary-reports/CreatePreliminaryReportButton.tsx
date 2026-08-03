"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createInitialPreliminaryReportContent } from "@/lib/types/preliminary-report";

export default function CreatePreliminaryReportButton({
  assessmentId,
  participantName,
  assessmentNumber,
}: {
  assessmentId: string;
  participantName: string;
  assessmentNumber: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createDraft() {
    if (loading) return;
    setLoading(true); setError(null);
    try {
      const response = await fetch("/api/admin/preliminary-reports/transition", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId, command: "create_draft",
          content: createInitialPreliminaryReportContent(participantName, assessmentNumber),
        }),
      });
      const result = (await response.json()) as { error?: string; report?: { reportId?: string } };
      if (!response.ok || !result.report?.reportId) {
        throw new Error(result.error ?? "Preliminary report could not be created.");
      }
      router.push(`/admin/reports/${result.report.reportId}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Preliminary report could not be created.");
    } finally { setLoading(false); }
  }

  return (
    <div>
      <button
        type="button" onClick={() => void createDraft()} disabled={loading}
        className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create Report"}
      </button>
      {error ? <p role="alert" className="mt-2 max-w-52 text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
