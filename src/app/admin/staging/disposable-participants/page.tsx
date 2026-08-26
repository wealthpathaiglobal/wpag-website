import DisposableSyntheticParticipantProvisioning from "@/components/admin/DisposableSyntheticParticipantProvisioning";
import { requireRole } from "@/lib/auth/authorization";
import { assertDisposableFixtureEnvironment, listDisposableAuthOrphans, listDisposableSyntheticParticipants } from "@/lib/auth/disposable-synthetic-participant";

export const dynamic = "force-dynamic";

export default async function DisposableSyntheticParticipantsPage() {
  assertDisposableFixtureEnvironment();
  const staff = await requireRole("administrator");
  const [fixtures, orphans] = await Promise.all([listDisposableSyntheticParticipants(staff.auth_user_id), listDisposableAuthOrphans(staff.auth_user_id)]);
  return <main className="mx-auto max-w-3xl px-6 py-10">
    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">HFOS Research Staging · Administrator only</p>
    <h1 className="mt-3 font-serif text-4xl text-slate-950">Disposable synthetic participants</h1>
    <p className="mt-4 text-slate-700">Controlled, single-fixture provisioning for founder E2E of the Participant Portal and Profile only. Production, research enrollment, consent, evidence, FSH, reports, and release remain unavailable.</p>
    <DisposableSyntheticParticipantProvisioning initialFixtures={fixtures} initialOrphans={orphans} />
  </main>;
}
