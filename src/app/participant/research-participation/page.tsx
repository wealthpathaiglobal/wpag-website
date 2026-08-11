import Link from "next/link";
import { requireParticipantAccess } from "@/lib/auth/participant-access";
import { getCurrentUser } from "@/lib/auth/current-participant";
import { participantResearchJourneyService } from "@/lib/services/participant/participant-research-journey-service";
import ResearchParticipationActions from "./ResearchParticipationActions";

function label(value: string) {
  return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export default async function ResearchParticipationPage() {
  const participant = await requireParticipantAccess("/participant/research-participation");
  const user = await getCurrentUser();
  const journey = await participantResearchJourneyService.get(participant.participant_id, user.id);
  return <main className="min-h-screen bg-[#f4f2ed] px-5 py-10 text-black sm:px-8"><div className="mx-auto max-w-4xl">
    <Link href="/participant/dashboard" className="text-sm underline">Back to dashboard</Link>
    <p className="mt-10 text-xs font-semibold uppercase tracking-[0.24em]">Synthetic research readiness · factual status only</p>
    <h1 className="mt-4 font-serif text-5xl">Research participation</h1>
    <div className="mt-8 border border-black p-6">
      <p className="font-semibold">Controlled wording is pending independent governance review.</p>
      <p className="mt-3 text-sm leading-7">Participation is voluntary and direct consent only. Baseline research concerns FSH only. Follow-up participation is a separate choice. Information is used for governed internal research; no external sharing or AI participant-data processing is authorized. Withdrawal stops future collection but does not automatically delete lawfully retained records.</p>
      <p className="mt-3 text-sm leading-7">This page provides no financial advice, diagnosis, final System State, thresholds, STRESS predicates, participant interpretation, Pilot authority, or Production authority.</p>
    </div>
    {!journey ? <p className="mt-8">No controlled synthetic research context is available.</p> : <>
      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        <div><dt className="text-xs uppercase text-black/50">Consent</dt><dd className="mt-1">{label(journey.consentStatus)}</dd></div>
        <div><dt className="text-xs uppercase text-black/50">Withdrawal</dt><dd className="mt-1">{label(journey.withdrawalStatus)}</dd></div>
        <div><dt className="text-xs uppercase text-black/50">Baseline</dt><dd className="mt-1">{label(journey.baselineSnapshotStatus)}</dd></div>
        <div><dt className="text-xs uppercase text-black/50">Evidence versions</dt><dd className="mt-1">{journey.evidenceVersionCount}</dd></div>
        <div><dt className="text-xs uppercase text-black/50">FSH output</dt><dd className="mt-1">Suppressed</dd></div>
        <div><dt className="text-xs uppercase text-black/50">Release</dt><dd className="mt-1">Blocked</dd></div>
      </dl>
      {journey.followUps.length ? <section className="mt-8"><h2 className="font-serif text-2xl">Follow-up status</h2>{journey.followUps.map((item) => <p key={`${item.family}-${item.sequenceNumber}`} className="mt-2 text-sm">{item.family} follow-up {item.sequenceNumber}: {label(item.status)}</p>)}</section> : null}
      <ResearchParticipationActions consentAvailable={journey.consentActionAvailable} withdrawalAvailable={journey.consentStatus === "GRANTED" && journey.withdrawalStatus === "NONE"} />
    </>}
  </div></main>;
}
