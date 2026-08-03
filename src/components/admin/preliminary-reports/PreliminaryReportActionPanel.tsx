"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AdminActionButton from "@/components/admin/AdminActionButton";
import ConfirmActionDialog from "@/components/admin/ConfirmActionDialog";
import { getPreliminaryReportActionPolicy } from "@/components/admin/preliminary-reports/preliminary-report-action-policy";
import type { PreliminaryReportTransitionCommand } from "@/lib/types/admin/admin-preliminary-report";
import {
  preliminaryReportListKeys,
  preliminaryReportTextKeys,
  type PreliminaryReportContent,
  type PreliminaryReportStatus,
} from "@/lib/types/preliminary-report";

type Feedback = { type: "success" | "error"; message: string };
type ConfirmedAction = "submit_for_review" | "return_to_draft" | "approve" | "release";

const labels: Record<keyof PreliminaryReportContent, string> = {
  reportTitle: "Report Title", reportPurpose: "Report Purpose",
  participantContext: "Participant Context", assessmentContext: "Assessment Context",
  informationBasis: "Information Basis", humanReviewSummary: "Human Review Summary",
  reportedFinancialConditions: "Reported Financial Conditions",
  reportedStrengths: "Reported Strengths", reportedPressures: "Reported Pressures",
  evidenceStatus: "Evidence Status", limitations: "Limitations",
  preliminaryObservations: "Preliminary Observations", nextSteps: "Next Steps",
  participantNotice: "Participant Notice",
};

const confirmations = {
  submit_for_review: { title: "Submit for internal review", description: "Submit the current saved version for internal human review.", confirmLabel: "Submit Report" },
  return_to_draft: { title: "Return report to draft", description: "Return the report with documented internal review notes.", confirmLabel: "Return to Draft", reasonLabel: "Review notes", reasonRequired: true },
  approve: { title: "Approve preliminary report", description: "Approve the current immutable report version without changing its content.", confirmLabel: "Approve Report" },
  release: { title: "Release preliminary report", description: "Make the approved preliminary report visible to the participant.", confirmLabel: "Release Report" },
} satisfies Record<ConfirmedAction, { title: string; description: string; confirmLabel: string; reasonLabel?: string; reasonRequired?: boolean }>;

export default function PreliminaryReportActionPanel({
  reportId, status, currentVersion, initialContent,
}: {
  reportId: string; status: PreliminaryReportStatus; currentVersion: number;
  initialContent: PreliminaryReportContent;
}) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [changeSummary, setChangeSummary] = useState("");
  const [confirmedAction, setConfirmedAction] = useState<ConfirmedAction | null>(null);
  const [dialogValue, setDialogValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const actionPolicy = getPreliminaryReportActionPolicy(status);
  const dirty = useMemo(() => JSON.stringify(content) !== JSON.stringify(initialContent), [content, initialContent]);

  function updateText(key: (typeof preliminaryReportTextKeys)[number], value: string) {
    setContent((current) => ({ ...current, [key]: value }));
  }
  function updateList(key: (typeof preliminaryReportListKeys)[number], value: string) {
    setContent((current) => ({ ...current, [key]: value.split("\n").map((item) => item.trim()).filter(Boolean) }));
  }

  async function submit(command: PreliminaryReportTransitionCommand, overrides?: { reviewNotes?: string | null }) {
    if (loading) return;
    setLoading(true); setFeedback(null);
    try {
      const response = await fetch("/api/admin/preliminary-reports/transition", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId, command,
          content: command === "save_draft" || command === "submit_for_review" ? content : undefined,
          changeSummary: command === "save_draft" ? changeSummary : undefined,
          reviewNotes: overrides?.reviewNotes,
        }),
      });
      const result = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Preliminary report could not be updated.");
      setConfirmedAction(null); setDialogValue(""); setChangeSummary("");
      setFeedback({ type: "success", message: result.message ?? "Preliminary report updated successfully." });
      router.refresh();
    } catch (caught) {
      setFeedback({ type: "error", message: caught instanceof Error ? caught.message : "Preliminary report could not be updated." });
    } finally { setLoading(false); }
  }

  function confirm() {
    if (!confirmedAction) return;
    void submit(confirmedAction, confirmedAction === "return_to_draft" ? { reviewNotes: dialogValue.trim() } : undefined);
  }
  const confirmation = confirmedAction ? confirmations[confirmedAction] : null;
  const reasonLabel = confirmedAction === "return_to_draft" ? confirmations.return_to_draft.reasonLabel : undefined;
  const reasonRequired = confirmedAction === "return_to_draft" ? confirmations.return_to_draft.reasonRequired : false;

  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <h2 className="text-lg font-semibold">Structured Report Content</h2>
      <p className="mt-2 text-sm leading-6 text-white/45">
        Manually authored preliminary research content only. No formula, score, diagnosis, treatment, recommendation, or official PDF is produced here.
      </p>

      {feedback ? <p role={feedback.type === "error" ? "alert" : "status"} className={`mt-5 rounded-xl border px-4 py-3 text-sm ${feedback.type === "error" ? "border-rose-400/20 bg-rose-400/10 text-rose-200" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"}`}>{feedback.message}</p> : null}

      <div className="mt-6 grid gap-5">
        {preliminaryReportTextKeys.map((key) => (
          <label key={key} className="block text-sm font-medium text-white/75">
            {labels[key]}
            <textarea
              value={content[key]} onChange={(event) => updateText(key, event.target.value)}
              disabled={!actionPolicy.canEdit || loading} rows={key === "reportTitle" ? 2 : 5}
              maxLength={key === "reportTitle" ? 200 : 5000}
              className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/25 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>
        ))}
        {preliminaryReportListKeys.map((key) => (
          <label key={key} className="block text-sm font-medium text-white/75">
            {labels[key]} <span className="font-normal text-white/35">(one item per line)</span>
            <textarea
              value={content[key].join("\n")} onChange={(event) => updateList(key, event.target.value)}
              disabled={!actionPolicy.canEdit || loading} rows={5} maxLength={10000}
              className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/25 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>
        ))}
      </div>

      {actionPolicy.canSaveDraft ? (
        <div className="mt-6 border-t border-white/10 pt-6">
          <label className="block text-sm font-medium text-white/75">
            Change summary for version {currentVersion + 1}
            <input value={changeSummary} onChange={(event) => setChangeSummary(event.target.value)} disabled={loading} maxLength={1000} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-white/25" />
          </label>
          <div className="mt-5 flex flex-wrap gap-3">
            <AdminActionButton label={status === "returned" ? "Save Revised Draft" : "Save Draft"} loading={loading} disabled={!dirty || !changeSummary.trim()} onClick={() => void submit("save_draft")} />
            {actionPolicy.canSubmitForReview ? <AdminActionButton label="Submit for Internal Review" variant="success" disabled={loading || dirty} onClick={() => setConfirmedAction("submit_for_review")} /> : null}
          </div>
          {dirty ? <p className="mt-3 text-xs text-amber-300/80">Save the current edits before submitting for review.</p> : null}
        </div>
      ) : null}

      {actionPolicy.canReturn || actionPolicy.canApprove ? <div className="mt-6 flex flex-wrap gap-3 border-t border-white/10 pt-6">{actionPolicy.canReturn ? <AdminActionButton label="Return to Draft" variant="warning" disabled={loading} onClick={() => { setDialogValue(""); setConfirmedAction("return_to_draft"); }} /> : null}{actionPolicy.canApprove ? <AdminActionButton label="Approve Report" variant="success" disabled={loading} onClick={() => setConfirmedAction("approve")} /> : null}</div> : null}
      {actionPolicy.canRelease ? <div className="mt-6 border-t border-white/10 pt-6"><AdminActionButton label="Release to Participant" variant="success" disabled={loading} onClick={() => setConfirmedAction("release")} /></div> : null}
      {status === "released" ? <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/60">Released reports and their content are read-only.</div> : null}

      <ConfirmActionDialog
        open={confirmation !== null} title={confirmation?.title ?? "Confirm report action"}
        description={confirmation?.description ?? "Confirm this action."}
        confirmLabel={confirmation?.confirmLabel ?? "Confirm"}
        reasonLabel={reasonLabel}
        reasonRequired={reasonRequired}
        reasonValue={dialogValue} onReasonChange={setDialogValue}
        loading={loading} onCancel={() => { if (!loading) { setConfirmedAction(null); setDialogValue(""); } }} onConfirm={confirm}
      />
    </section>
  );
}
