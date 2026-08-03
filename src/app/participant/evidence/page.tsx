import Link from "next/link";

import ParticipantEvidenceList from "@/components/evidence/ParticipantEvidenceList";
import ParticipantEvidenceUploadForm from "@/components/evidence/ParticipantEvidenceUploadForm";
import { requireParticipantAccess } from "@/lib/auth/participant-access";
import { getCurrentUser } from "@/lib/auth/current-participant";
import { participantEvidenceFoundationService } from "@/lib/services/participant/participant-evidence-foundation-service";

export default async function ParticipantEvidencePage() {
  await requireParticipantAccess("/participant/evidence", ["active"]);
  const user = await getCurrentUser();
  const [context, evidence] = await Promise.all([
    participantEvidenceFoundationService.context(user.id),
    participantEvidenceFoundationService.list(user.id),
  ]);
  return <main className="min-h-screen bg-[#f4f2ed] px-5 py-10 text-black sm:px-8"><div className="mx-auto max-w-6xl">
    <Link href="/participant/dashboard" className="text-sm text-black/55 hover:text-black">← Back to Participant Dashboard</Link>
    <header className="mt-8 border-b border-black pb-8"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-black/50">Participant Evidence</p><h1 className="mt-4 font-serif text-5xl tracking-[-0.04em]">Evidence submissions</h1><p className="mt-5 max-w-3xl text-sm leading-7 text-black/65">Submit supporting records through the governed private evidence workflow. Files remain private and every accepted version is preserved.</p>{context && <p className="mt-4 text-sm font-medium">Active assessment: #{context.assessmentNumber} · {context.sessionStatus.replace("_", " ")}</p>}</header>
    <section className="grid gap-8 py-10 lg:grid-cols-[0.9fr_1.1fr]"><div>{context ? <ParticipantEvidenceUploadForm assessmentId={context.assessmentId} /> : <div className="border border-black/20 p-8"><h2 className="font-serif text-3xl">No active assessment</h2><p className="mt-3 text-sm leading-7 text-black/60">Evidence upload becomes available when an eligible assessment is active.</p></div>}</div><div><h2 className="mb-5 font-serif text-3xl">Your evidence</h2><ParticipantEvidenceList evidence={evidence} /></div></section>
    <aside className="border-t border-black py-8 text-sm leading-7 text-black/60">Evidence records support governed research review only. Uploading evidence does not create a diagnosis, recommendation, treatment, transition, execution, Pilot, or Production decision.</aside>
  </div></main>;
}
