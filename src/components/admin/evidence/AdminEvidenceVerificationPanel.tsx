"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import AdminActionButton from "@/components/admin/AdminActionButton";
import ConfirmActionDialog from "@/components/admin/ConfirmActionDialog";
import { getAdminEvidenceActionPolicy } from "@/components/admin/evidence/admin-evidence-action-policy";
import type { AdminEvidenceDetail, EvidenceVerificationCommand } from "@/lib/types/admin/admin-evidence-verification";

type ConfirmedAction = "request_information" | "verify" | "reject";

const confirmations = {
  request_information: { title: "Request more information", description: "Send participant-visible guidance and wait for a governed resubmission.", confirmLabel: "Send Request", reasonLabel: "Participant-visible information request", reasonRequired: true },
  verify: { title: "Verify evidence", description: "Record this evidence version as verified. This does not create a financial conclusion.", confirmLabel: "Verify Evidence" },
  reject: { title: "Reject evidence", description: "Reject this evidence with a participant-visible resubmission reason.", confirmLabel: "Reject Evidence", reasonLabel: "Participant-visible rejection reason", reasonRequired: true, destructive: true },
} as const;

export default function AdminEvidenceVerificationPanel({ evidence }: { evidence: AdminEvidenceDetail }) {
  const router = useRouter();
  const policy = getAdminEvidenceActionPolicy(evidence);
  const [internalNotes, setInternalNotes] = useState(evidence.internalNotes ?? "");
  const [confirmedAction, setConfirmedAction] = useState<ConfirmedAction | null>(null);
  const [participantComment, setParticipantComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function submit(command: EvidenceVerificationCommand, comment: string | null = null) {
    if (loading) return;
    setLoading(true); setFeedback(null);
    try {
      const response = await fetch("/api/admin/evidence/transition", { method: "POST",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({
          documentId: evidence.documentId, command, participantComment: comment,
          internalNotes: internalNotes.trim() || null,
        }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Evidence verification could not be updated.");
      setConfirmedAction(null); setParticipantComment(""); router.refresh();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Evidence verification could not be updated.");
    } finally { setLoading(false); }
  }

  const confirmation = confirmedAction ? confirmations[confirmedAction] : null;
  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <h2 className="text-lg font-semibold">Evidence Verification Actions</h2>
      <p className="mt-2 text-sm leading-6 text-white/45">Internal notes are visible only to authorized staff. Participant feedback is shown to the participant.</p>
      {feedback ? <p role="alert" className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{feedback}</p> : null}
      {policy.canStartVerification ? <div className="mt-6"><AdminActionButton label="Start Verification" loading={loading} onClick={() => void submit("start_verification")} /></div> : null}
      {evidence.verificationStatus === "in_progress" ? (
        <div className="mt-6 space-y-5">
          <div><label htmlFor="evidence-internal-notes" className="text-sm font-medium text-white/80">Internal verification notes — staff only</label>
            <textarea id="evidence-internal-notes" value={internalNotes} onChange={(event) => setInternalNotes(event.target.value)} disabled={loading || !policy.canSaveInternalNotes} rows={6} maxLength={5000} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white disabled:opacity-50" /></div>
          <div className="flex flex-wrap gap-3">
            {policy.canSaveInternalNotes ? <AdminActionButton label="Save Internal Notes" variant="secondary" loading={loading} disabled={!internalNotes.trim()} onClick={() => void submit("save_internal_notes")} /> : null}
            {policy.canRequestInformation ? <AdminActionButton label="Request More Information" variant="warning" disabled={loading} onClick={() => setConfirmedAction("request_information")} /> : null}
            {policy.canVerify ? <AdminActionButton label="Verify Evidence" variant="success" disabled={loading} onClick={() => setConfirmedAction("verify")} /> : null}
            {policy.canReject ? <AdminActionButton label="Reject Evidence" variant="danger" disabled={loading} onClick={() => setConfirmedAction("reject")} /> : null}
          </div>
        </div>
      ) : null}
      {policy.readOnly ? <p className="mt-6 text-sm text-white/50">No verification action is available in the current governed state.</p> : null}
      {confirmation ? <ConfirmActionDialog open title={confirmation.title} description={confirmation.description} confirmLabel={confirmation.confirmLabel} loading={loading} destructive={"destructive" in confirmation ? confirmation.destructive : false} reasonLabel={"reasonLabel" in confirmation ? confirmation.reasonLabel : undefined} reasonRequired={"reasonRequired" in confirmation ? confirmation.reasonRequired : false} reasonValue={participantComment} onReasonChange={setParticipantComment} onCancel={() => { setConfirmedAction(null); setParticipantComment(""); }} onConfirm={() => void submit(confirmedAction!, participantComment.trim() || null)} /> : null}
    </section>
  );
}
