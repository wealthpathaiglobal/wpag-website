import Link from "next/link";
import { requireParticipantAccess } from "@/lib/auth/participant-access";
import { getCurrentUser } from "@/lib/auth/current-participant";
import { participantResearchJourneyService } from "@/lib/services/participant/participant-research-journey-service";
import ControlledResearchConsentPresentation from "@/components/participant/research/ControlledResearchConsentPresentation";
import ResearchParticipationActions from "./ResearchParticipationActions";
import ParticipantResearchRequestPanel from "@/components/participant/research/ParticipantResearchRequestPanel";
import { participantResearchControlsService } from "@/lib/services/participant/participant-research-controls-service";
import { participantConsentReceipt, participantResearchStateLabel } from "./participant-research-presentation-policy";

function technicalLabel(value: string) {
  return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export default async function ResearchParticipationPage() {
  const participant = await requireParticipantAccess("/participant/research-participation");
  const user = await getCurrentUser();
  const journey = await participantResearchJourneyService.get(participant.participant_id, user.id);
  const requests = journey ? await participantResearchControlsService.listRequests(participant.participant_id, user.id) : [];
  const receipt = journey ? participantConsentReceipt({ available: journey.consentReceiptAvailable, baselineStatus: journey.consentBaselineScopeStatus, followUpStatus: journey.consentFollowUpScopeStatus, decidedAt: journey.consentDecidedAt, informationVersion: journey.consentInformationVersion }) : null;
  return <main className="min-h-screen bg-[#f4f2ed] px-5 py-10 text-black sm:px-8"><div className="mx-auto max-w-5xl">
    <Link href="/participant/dashboard" className="text-sm underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black">Back to dashboard</Link>
    <header className="mt-10 border-b border-black pb-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/55">WPAG Participant Portal</p>
      <h1 className="mt-4 font-serif text-5xl tracking-[-0.04em] sm:text-6xl">Your research participation</h1>
      <p className="mt-6 max-w-3xl text-base leading-8 text-black/65">View your current position, understand your rights and limitations, and read the full controlled research information before any choice is available.</p>
    </header>
    {!journey ? <p className="mt-8 border border-black/20 p-5">Research participation information is not currently available for this account.</p> : <>
      <section className="grid gap-4 py-10 lg:grid-cols-[1.1fr_0.9fr]" aria-labelledby="research-position-title">
        <div className="border border-black bg-black p-6 text-white sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">Your current position</p><h2 id="research-position-title" className="mt-4 font-serif text-3xl">{participantResearchStateLabel(journey.consentStatus)}</h2><p className="mt-5 text-sm leading-7 text-white/75">{journey.consentActionAvailable ? "Read the information below carefully. A choice is available after the full controlled information." : "You can read the information below and send a question. No consent choice is currently available."}</p></div>
        <div className="border border-black/20 bg-white/35 p-6 sm:p-8"><h2 className="font-serif text-3xl">Key rights and limits</h2><ul className="mt-5 list-disc space-y-3 pl-5 text-sm leading-6 text-black/65"><li>Participation is voluntary.</li><li>You may ask questions before making a choice.</li><li>This research does not provide financial advice, diagnosis, or a final system state.</li><li>Research results and participant release remain unavailable unless separately authorized.</li></ul></div>
      </section>

      <details className="border border-black/20 bg-white/30 p-5">
        <summary className="cursor-pointer font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black">Detailed participation status</summary>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <div><dt className="text-xs uppercase text-black/50">Consent</dt><dd className="mt-1">{participantResearchStateLabel(journey.consentStatus)}</dd></div>
        <div><dt className="text-xs uppercase text-black/50">Withdrawal</dt><dd className="mt-1">{participantResearchStateLabel(journey.withdrawalStatus)}</dd></div>
        <div><dt className="text-xs uppercase text-black/50">Baseline</dt><dd className="mt-1">{participantResearchStateLabel(journey.baselineSnapshotStatus)}</dd></div>
        <div><dt className="text-xs uppercase text-black/50">Evidence versions</dt><dd className="mt-1">{journey.evidenceVersionCount}</dd></div>
        <div><dt className="text-xs uppercase text-black/50">Research results</dt><dd className="mt-1">Not available</dd></div>
        <div><dt className="text-xs uppercase text-black/50">Participant release</dt><dd className="mt-1">Not available</dd></div>
      </dl>
      </details>
      {receipt ? <section className="mt-8 border border-black/20 bg-white/45 p-5 sm:p-6" aria-labelledby="recorded-research-choice-title">
        <h2 id="recorded-research-choice-title" className="font-serif text-2xl">Your recorded research choice</h2>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div><dt className="text-xs uppercase text-black/50">Baseline research</dt><dd className="mt-1">{receipt.baseline}</dd></div>
          <div><dt className="text-xs uppercase text-black/50">Follow-up research</dt><dd className="mt-1">{receipt.followUp}</dd></div>
          {receipt.decidedAt ? <div><dt className="text-xs uppercase text-black/50">Recorded</dt><dd className="mt-1"><time dateTime={receipt.decidedAt}>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(receipt.decidedAt))} UTC</time></dd></div> : null}
          {receipt.informationVersion ? <div><dt className="text-xs uppercase text-black/50">Consent information version</dt><dd className="mt-1 break-words">{receipt.informationVersion}</dd></div> : null}
        </dl>
      </section> : null}
      {journey.followUps.length ? <section className="mt-8"><h2 className="font-serif text-2xl">Follow-up status</h2>{journey.followUps.map((item) => <p key={`${item.family}-${item.sequenceNumber}`} className="mt-2 text-sm">{item.family} follow-up {item.sequenceNumber}: {technicalLabel(item.status)}</p>)}</section> : null}

      <section className="mt-12 border-t border-black pt-10" aria-labelledby="controlled-information-title">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Full controlled information</p>
        <h2 id="controlled-information-title" className="mt-3 font-serif text-4xl">Read before making any research choice</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-black/60">The complete controlled presentation follows. Its wording, identity, version, and authority are unchanged.</p>
        <ControlledResearchConsentPresentation />
      </section>
      <ResearchParticipationActions
        consentAvailable={journey.consentActionAvailable}
        withdrawalAvailable={journey.consentStatus === "GRANTED" && journey.withdrawalStatus === "NONE"}
        presentation={journey.consentPresentationEventId && journey.consentPresentedAt ? {
          eventId: journey.consentPresentationEventId,
          version: journey.consentArtifactVersion,
          sha256: journey.consentArtifactSha256,
          presentedAt: journey.consentPresentedAt,
        } : null}
      />
      <ParticipantResearchRequestPanel requests={requests} />
    </>}
  </div></main>;
}
