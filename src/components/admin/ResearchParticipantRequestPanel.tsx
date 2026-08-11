"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { participantRequestRoutes, type AdminResearchRequest, type ParticipantRequestStatus } from "@/lib/types/research/research-controls";

function label(value: string) { return value.toLowerCase().split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" "); }
export function researchRequestActions(status: string): ParticipantRequestStatus[] {
  if (status === "RECEIVED") return ["ROUTED", "ESCALATED"];
  if (status === "ROUTED") return ["IN_REVIEW", "COMPLETED", "ESCALATED"];
  if (status === "IN_REVIEW") return ["COMPLETED", "ESCALATED"];
  if (status === "ESCALATED") return ["IN_REVIEW", "COMPLETED"];
  return [];
}

export default function ResearchParticipantRequestPanel({ participantId, requests }: { participantId: string; requests: AdminResearchRequest[] }) {
  const router = useRouter(); const [busy, setBusy] = useState<string | null>(null); const [error, setError] = useState<string | null>(null);
  async function route(request: AdminResearchRequest, targetStatus: ParticipantRequestStatus) {
    setBusy(request.requestEventId); setError(null);
    const response = await fetch(`/api/admin/participants/${participantId}/research-requests`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestEventId: request.requestEventId, targetStatus, routingClass: request.routingClass, internalNote: `GOVERNED_${targetStatus}_ROUTING` }) });
    const body = await response.json(); if (!response.ok) { setError(body.error ?? "Request failed."); setBusy(null); return; } router.refresh();
  }
  return <section className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-300/[0.04] p-6" aria-label="Participant research requests">
    <h2 className="text-lg font-semibold">Participant Requests</h2><p className="mt-1 text-sm text-white/45">Restricted operational routing. Legal entitlement and deadlines remain unresolved pending qualified review.</p>
    {requests.length === 0 ? <p className="mt-5 text-sm text-white/45">No governed participant requests.</p> : <div className="mt-5 space-y-3">{requests.map((request) => <article key={request.requestEventId} className="rounded-xl border border-white/10 p-4"><div className="flex flex-wrap justify-between gap-2"><span>{label(request.requestType)}</span><span className="text-sm text-white/50">{label(request.requestStatus)}</span></div><p className="mt-2 text-sm text-white/60">{request.details}</p><p className="mt-2 text-xs text-white/35">Route: {label(request.routingClass)}</p><div className="mt-3 flex flex-wrap gap-2">{researchRequestActions(request.requestStatus).map((status) => <button key={status} disabled={busy === request.requestEventId} onClick={() => route(request,status)} className="rounded border border-white/20 px-3 py-1.5 text-xs disabled:opacity-40">{label(status)}</button>)}</div></article>)}</div>}
    {error ? <p role="alert" className="mt-4 text-sm text-rose-300">{error}</p> : null}
    <span className="sr-only">Available routes: {participantRequestRoutes.join(", ")}</span>
  </section>;
}
