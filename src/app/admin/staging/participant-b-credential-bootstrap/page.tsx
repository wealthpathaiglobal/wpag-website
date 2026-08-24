import ParticipantBCredentialBootstrapForm from "@/components/admin/ParticipantBCredentialBootstrapForm";
import {
  assertParticipantBBootstrapEnvironment,
  PARTICIPANT_B_CODE,
  PARTICIPANT_B_EMAIL,
} from "@/lib/auth/participant-b-credential-bootstrap";

export const dynamic = "force-dynamic";

export default function ParticipantBCredentialBootstrapPage() {
  assertParticipantBBootstrapEnvironment();

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
        HFOS Research Staging · Administrator only
      </p>
      <h1 className="mt-3 font-serif text-4xl text-slate-950">
        Participant B credential bootstrap
      </h1>
      <p className="mt-4 text-slate-700">
        This narrowly controlled action updates only the Auth password for {PARTICIPANT_B_CODE}.
        It does not alter the participant record, lifecycle, research, consent, privacy, evidence,
        FSH, report, or release state.
      </p>
      <dl className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm">
        <div className="grid gap-1 sm:grid-cols-[9rem_1fr]"><dt className="font-semibold">Participant</dt><dd>{PARTICIPANT_B_CODE}</dd></div>
        <div className="mt-3 grid gap-1 sm:grid-cols-[9rem_1fr]"><dt className="font-semibold">Synthetic email</dt><dd className="break-all">{PARTICIPANT_B_EMAIL}</dd></div>
        <div className="mt-3 grid gap-1 sm:grid-cols-[9rem_1fr]"><dt className="font-semibold">Release gate</dt><dd>BLOCKED (unchanged)</dd></div>
      </dl>
      <ParticipantBCredentialBootstrapForm />
    </main>
  );
}
