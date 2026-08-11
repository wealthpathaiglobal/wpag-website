"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { wave4ConsentAcknowledgements } from "@/lib/types/research/research-wave4";

export function researchConsentActionPolicy(input: { consentStatus: string; withdrawalStatus: string }) {
  return { canDecide: input.consentStatus === "PRESENTED", canWithdraw: input.consentStatus === "GRANTED" && input.withdrawalStatus === "NONE" };
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
  const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const [baseline, setBaseline] = useState(false); const [followUp, setFollowUp] = useState(false); const [acks, setAcks] = useState<Record<string, boolean>>({});
  async function decide(decision: "GRANTED" | "DECLINED") {
    setBusy(true); setError(null);
    if (!presentation) { setError("The controlled consent presentation must be presented again."); setBusy(false); return; }
    const response = await fetch("/api/participant/research-controls/consent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, directConsent: true, baselineConsent: decision === "GRANTED" && baseline, followUpConsent: decision === "GRANTED" && followUp, acknowledgements: decision === "GRANTED" ? acks : {}, presentationEventId: presentation.eventId, presentedArtifactVersion: presentation.version, presentedArtifactSha256: presentation.sha256, presentedAt: presentation.presentedAt }) });
    const body = await response.json(); if (!response.ok) { setError(body.error ?? "Request failed."); setBusy(false); return; } router.refresh();
  }
  async function withdraw() {
    setBusy(true); setError(null); const response = await fetch("/api/participant/research-controls/withdrawal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: "Participant portal request" }) });
    const body = await response.json(); if (!response.ok) { setError(body.error ?? "Request failed."); setBusy(false); return; } router.refresh();
  }
  if (!consentAvailable && !withdrawalAvailable) return null;
  return <div className="mt-8 border-t border-black/15 pt-7">
    {consentAvailable ? <div><h2 className="font-serif text-2xl">Your direct choice</h2>
      <label className="mt-5 flex gap-3 text-sm"><input type="checkbox" checked={baseline} onChange={(e) => setBaseline(e.target.checked)} />I consent to baseline FSH research participation.</label>
      <label className="mt-3 flex gap-3 text-sm"><input type="checkbox" checked={followUp} onChange={(e) => setFollowUp(e.target.checked)} />I separately consent to follow-up research participation.</label>
      {wave4ConsentAcknowledgements.map((key) => <label key={key} className="mt-3 flex gap-3 text-sm"><input type="checkbox" checked={acks[key] === true} onChange={(e) => setAcks((old) => ({ ...old, [key]: e.target.checked }))} />{acknowledgementLabels[key]}</label>)}
      <div className="mt-6 flex flex-wrap gap-3"><button disabled={busy || !presentation || !baseline || wave4ConsentAcknowledgements.some((key) => acks[key] !== true)} onClick={() => decide("GRANTED")} className="bg-black px-5 py-3 text-sm text-white disabled:opacity-35">Give direct consent</button><button disabled={busy || !presentation} onClick={() => decide("DECLINED")} className="border border-black px-5 py-3 text-sm disabled:opacity-35">Decline</button></div>
    </div> : null}
    {withdrawalAvailable ? <button disabled={busy} onClick={withdraw} className="mt-6 border border-rose-700 px-5 py-3 text-sm text-rose-800 disabled:opacity-35">Request research withdrawal</button> : null}
    {error ? <p role="alert" className="mt-4 text-sm text-rose-700">{error}</p> : null}
  </div>;
}
