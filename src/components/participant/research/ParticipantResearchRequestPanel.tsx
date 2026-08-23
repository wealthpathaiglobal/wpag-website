"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { participantRequestTypes, type ParticipantRequestType, type ParticipantResearchRequest } from "@/lib/types/research/research-controls";

const labels: Record<ParticipantRequestType, string> = {
  ACCESS_REQUEST: "Access-related request",
  CORRECTION_REQUEST: "Correction request",
  PRIVACY_QUESTION: "Privacy question",
  COMPLAINT_INCIDENT: "Complaint or problem report",
};
function label(value: string) { return value.toLowerCase().split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" "); }

export default function ParticipantResearchRequestPanel({ requests }: { requests: ParticipantResearchRequest[] }) {
  const router = useRouter(); const [requestType, setRequestType] = useState<ParticipantRequestType>("PRIVACY_QUESTION"); const [details, setDetails] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  async function submit() {
    setBusy(true); setError(null);
    const response = await fetch("/api/participant/research-controls/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestType, details }) });
    const body = await response.json();
    if (!response.ok) { setError(body.error ?? "Request failed."); setBusy(false); return; }
    setDetails(""); router.refresh();
  }
  return <section className="mt-10 border-t border-black/15 pt-7" aria-label="Research questions and requests">
    <h2 className="font-serif text-2xl">Questions, corrections and complaints</h2>
    <p className="mt-2 text-sm leading-6">Send an access request, correction request, privacy question, or complaint. This form does not change your consent or withdrawal status and does not promise a particular response deadline.</p>
    <label className="mt-5 block text-sm">Request type<select value={requestType} onChange={(event) => setRequestType(event.target.value as ParticipantRequestType)} className="mt-2 block w-full border border-black/25 bg-white p-3 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2">{participantRequestTypes.map((type) => <option key={type} value={type}>{labels[type]}</option>)}</select></label>
    <label className="mt-4 block text-sm">Details<textarea value={details} onChange={(event) => setDetails(event.target.value)} maxLength={4000} rows={5} className="mt-2 block w-full border border-black/25 bg-white p-3 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2" /></label>
    <button type="button" disabled={busy || !details.trim()} aria-busy={busy} onClick={submit} className="mt-4 bg-black px-5 py-3 text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-35 active:translate-y-px">{busy ? "Sending…" : "Send request"}</button>
    <p className="sr-only" role="status" aria-live="polite">{busy ? "Your request is being sent." : ""}</p>
    {error ? <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p> : null}
    {requests.length ? <div className="mt-7"><h3 className="text-sm font-semibold">Submitted requests</h3><ul className="mt-3 space-y-2">{requests.map((request) => <li key={request.requestEventId} className="border border-black/15 p-3 text-sm"><span>{labels[request.requestType]}</span><span className="ml-2 text-black/55">{label(request.requestStatus)}</span></li>)}</ul></div> : null}
  </section>;
}
