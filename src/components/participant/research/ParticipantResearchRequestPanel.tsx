"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { participantRequestTypes, type ParticipantRequestType, type ParticipantResearchRequest } from "@/lib/types/research/research-controls";

const labels: Record<ParticipantRequestType, string> = {
  ACCESS_REQUEST: "Access-related request",
  CORRECTION_REQUEST: "Correction request",
  PRIVACY_QUESTION: "Privacy question",
  COMPLAINT_INCIDENT: "Complaint or Incident report",
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
    <p className="mt-2 text-sm leading-6">Use this governed intake to route an access-related request, correction request, privacy question, or complaint/Incident report. This intake does not state a legal entitlement or response deadline. Research withdrawal remains a separate immediate-block action above.</p>
    <label className="mt-5 block text-sm">Request type<select value={requestType} onChange={(event) => setRequestType(event.target.value as ParticipantRequestType)} className="mt-2 block w-full border border-black/25 bg-white p-3">{participantRequestTypes.map((type) => <option key={type} value={type}>{labels[type]}</option>)}</select></label>
    <label className="mt-4 block text-sm">Details<textarea value={details} onChange={(event) => setDetails(event.target.value)} maxLength={4000} rows={5} className="mt-2 block w-full border border-black/25 bg-white p-3" /></label>
    <button type="button" disabled={busy || !details.trim()} onClick={submit} className="mt-4 bg-black px-5 py-3 text-sm text-white disabled:opacity-35">Submit governed request</button>
    {error ? <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p> : null}
    {requests.length ? <div className="mt-7"><h3 className="text-sm font-semibold">Submitted requests</h3><ul className="mt-3 space-y-2">{requests.map((request) => <li key={request.requestEventId} className="border border-black/15 p-3 text-sm"><span>{labels[request.requestType]}</span><span className="ml-2 text-black/55">{label(request.requestStatus)}</span></li>)}</ul></div> : null}
  </section>;
}
