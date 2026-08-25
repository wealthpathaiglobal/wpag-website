"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  type ExplicitFollowUpScopeDecision,
  wave4ConsentAcknowledgements,
} from "@/lib/types/research/research-wave4";

type ConsentFeedback =
  | { kind: "idle" }
  | { kind: "pending"; message: string }
  | { kind: "success"; message: string; baselineGranted: boolean; followUpGranted: boolean }
  | { kind: "error"; message: string };

export function consentSuccessFeedback(
  decision: "GRANTED" | "DECLINED",
  followUpDecision: ExplicitFollowUpScopeDecision | null,
): ConsentFeedback {
  return decision === "GRANTED"
    ? {
        kind: "success",
        message: "Your research consent was recorded.",
        baselineGranted: true,
        followUpGranted: followUpDecision === "EXPLICITLY_GRANTED",
      }
    : {
        kind: "success",
        message: "Your research consent decision was recorded.",
        baselineGranted: false,
        followUpGranted: false,
      };
}

export function consentRequestError(error: unknown): string {
  return error instanceof Error && error.name === "AbortError"
    ? "The request took too long. Please try again."
    : "We could not record your choice. Please try again.";
}

async function allowFeedbackPaint() {
  if (typeof requestAnimationFrame !== "function") return;
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

export function researchConsentActionPolicy(input: { consentStatus: string; withdrawalStatus: string }) {
  return { canDecide: input.consentStatus === "PRESENTED", canWithdraw: input.consentStatus === "GRANTED" && input.withdrawalStatus === "NONE" };
}
export function canSubmitResearchGrant(input: {
  baseline: boolean;
  followUpDecision: ExplicitFollowUpScopeDecision | null;
  acknowledgements: Record<string, boolean>;
  hasPresentation: boolean;
}) {
  return input.baseline && input.followUpDecision !== null && input.hasPresentation
    && wave4ConsentAcknowledgements.every((key) => input.acknowledgements[key] === true);
}
const acknowledgementLabels = {
  research_purpose: "I understand the governed internal research purpose.",
  voluntary_participation: "Participation is voluntary.",
  research_only_no_final_state: "This is research only and provides no advice or final System State.",
  privacy_data_use: "I understand the described restricted research data use.",
  withdrawal_no_automatic_deletion: "Withdrawal does not automatically delete lawfully retained records.",
} as const;

type PresentationBinding = { eventId: string; version: string; sha256: string; presentedAt: string };

export default function ResearchParticipationActions({ consentAvailable, withdrawalAvailable, presentation }: { consentAvailable: boolean; withdrawalAvailable: boolean; presentation: PresentationBinding | null }) {
  const router = useRouter(); const [busyAction, setBusyAction] = useState<"consent" | "decline" | "withdraw" | null>(null); const [error, setError] = useState<string | null>(null);
  const [consentFeedback, setConsentFeedback] = useState<ConsentFeedback>({ kind: "idle" });
  const [baseline, setBaseline] = useState(false); const [followUpDecision, setFollowUpDecision] = useState<ExplicitFollowUpScopeDecision | null>(null); const [acks, setAcks] = useState<Record<string, boolean>>({});
  async function decide(decision: "GRANTED" | "DECLINED") {
    if (busyAction !== null) return;
    const action = decision === "GRANTED" ? "consent" : "decline";
    setBusyAction(action); setError(null); setConsentFeedback({ kind: "pending", message: decision === "GRANTED" ? "Recording your consent…" : "Recording your decision…" });
    if (!presentation) { const message="The controlled consent presentation must be presented again."; setError(message); setConsentFeedback({kind:"error",message}); setBusyAction(null); return; }
    try {
      const response = await fetch("/api/participant/research-controls/consent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, directConsent: true, baselineConsent: decision === "GRANTED" && baseline, followUpScopeDecision: decision === "GRANTED" ? followUpDecision : "NOT_APPLICABLE", acknowledgements: decision === "GRANTED" ? acks : {}, presentationEventId: presentation.eventId, presentedArtifactVersion: presentation.version, presentedArtifactSha256: presentation.sha256, presentedAt: presentation.presentedAt }) });
      let body: { error?: string } = {};
      try { body = await response.json(); } catch { if (response.ok) throw new Error("Invalid success response"); }
      if (!response.ok) { const message=body.error ?? "We could not record your choice. Please try again."; setError(message); setConsentFeedback({kind:"error",message}); setBusyAction(null); return; }
      setConsentFeedback(consentSuccessFeedback(decision, followUpDecision)); setBusyAction(null); await allowFeedbackPaint(); router.refresh();
    } catch (requestError) {
      const message=consentRequestError(requestError); setError(message); setConsentFeedback({kind:"error",message}); setBusyAction(null);
    }
  }
  async function withdraw() {
    setBusyAction("withdraw"); setError(null); const response = await fetch("/api/participant/research-controls/withdrawal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: "Participant portal request" }) });
    const body = await response.json(); if (!response.ok) { setError(body.error ?? "Request failed."); setBusyAction(null); return; } router.refresh();
  }
  if (!consentAvailable && !withdrawalAvailable) return null;
  return <div className="mt-8 border-t border-black/15 pt-7" aria-busy={busyAction !== null}>
    {consentAvailable ? <div><h2 className="font-serif text-2xl">Your direct choice</h2>
      <label className="mt-5 flex gap-3 text-sm"><input type="checkbox" checked={baseline} onChange={(e) => setBaseline(e.target.checked)} />I consent to baseline FSH research participation.</label>
      <fieldset className="mt-5" aria-required="true"><legend className="text-sm font-semibold">Follow-up research participation</legend><p className="mt-1 text-sm text-black/65">Choose one. Baseline participation does not require follow-up consent.</p><div className="mt-3 space-y-3">
        <label className="flex gap-3 text-sm"><input type="radio" name="follow-up-scope-decision" checked={followUpDecision === "EXPLICITLY_GRANTED"} onChange={() => setFollowUpDecision("EXPLICITLY_GRANTED")} />Yes, I separately consent to approved follow-up research.</label>
        <label className="flex gap-3 text-sm"><input type="radio" name="follow-up-scope-decision" checked={followUpDecision === "EXPLICITLY_DECLINED"} onChange={() => setFollowUpDecision("EXPLICITLY_DECLINED")} />No, I do not consent to follow-up research.</label>
      </div></fieldset>
      {wave4ConsentAcknowledgements.map((key) => <label key={key} className="mt-3 flex gap-3 text-sm"><input type="checkbox" checked={acks[key] === true} onChange={(e) => setAcks((old) => ({ ...old, [key]: e.target.checked }))} />{acknowledgementLabels[key]}</label>)}
      <div className="mt-6 flex flex-wrap gap-3"><button disabled={busyAction !== null || !canSubmitResearchGrant({ baseline, followUpDecision, acknowledgements: acks, hasPresentation: presentation !== null })} aria-busy={busyAction === "consent"} aria-disabled={busyAction !== null} onClick={() => decide("GRANTED")} className="inline-flex items-center gap-2 bg-black px-5 py-3 text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-35 active:translate-y-px">{busyAction === "consent" ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />Recording your consent…</> : "Give direct consent"}</button><button disabled={busyAction !== null || !presentation} aria-busy={busyAction === "decline"} aria-disabled={busyAction !== null} onClick={() => decide("DECLINED")} className="inline-flex items-center gap-2 border border-black px-5 py-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-35 active:translate-y-px">{busyAction === "decline" ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" aria-hidden="true" />Recording your decision…</> : "Decline"}</button></div>
    </div> : null}
    {withdrawalAvailable ? <button disabled={busyAction !== null} aria-busy={busyAction === "withdraw"} onClick={withdraw} className="mt-6 border border-rose-700 px-5 py-3 text-sm text-rose-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose-700 disabled:cursor-not-allowed disabled:opacity-35 active:translate-y-px">{busyAction === "withdraw" ? "Sending withdrawal request…" : "Request research withdrawal"}</button> : null}
    {consentFeedback.kind !== "idle" ? <div className={`mt-5 border p-4 text-sm ${consentFeedback.kind === "error" ? "border-rose-300 bg-rose-50 text-rose-800" : consentFeedback.kind === "success" ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-black/20 bg-black/5 text-black"}`} role={consentFeedback.kind === "error" ? "alert" : "status"} aria-live="polite">
      <div className="flex items-center gap-2">{consentFeedback.kind === "pending" ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/25 border-t-black" aria-hidden="true" /> : null}<p className="font-medium">{consentFeedback.message}</p></div>
      {consentFeedback.kind === "success" && consentFeedback.baselineGranted ? <ul className="mt-3 space-y-1" aria-label="Recorded consent scope"><li>Baseline research: Granted</li><li>Follow-up research: {consentFeedback.followUpGranted ? "Granted" : "Not granted"}</li></ul> : null}
    </div> : null}
    {error && consentFeedback.kind !== "error" ? <p role="alert" className="mt-4 text-sm text-rose-700">{error}</p> : null}
  </div>;
}
