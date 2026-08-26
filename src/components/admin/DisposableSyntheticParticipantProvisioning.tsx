"use client";

import { FormEvent, useState } from "react";
import type { DisposableAuthOrphan, DisposableSyntheticParticipant } from "@/lib/auth/disposable-synthetic-participant";

export default function DisposableSyntheticParticipantProvisioning({ initialFixtures, initialOrphans }: { initialFixtures: DisposableSyntheticParticipant[]; initialOrphans: DisposableAuthOrphan[] }) {
  const [fixtures, setFixtures] = useState(initialFixtures);
  const [orphans, setOrphans] = useState(initialOrphans);
  const [requestId, setRequestId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [cleanupConfirmed, setCleanupConfirmed] = useState<string | null>(null);
  const [pending, setPending] = useState<"create" | string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [created, setCreated] = useState(false);

  async function createFixture(event: FormEvent) {
    event.preventDefault();
    if (pending || !confirmed || created) return;
    setPending("create"); setMessage(null);
    const explicitRequestId = requestId || crypto.randomUUID();
    if (!requestId) setRequestId(explicitRequestId);
    try {
      const response = await fetch("/api/admin/staging/disposable-participants", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({ requestId: explicitRequestId, password, confirmed: true }) });
      const result = await response.json() as { success?: boolean; fixture?: DisposableSyntheticParticipant; error?: string };
      if (!response.ok || !result.fixture) throw new Error(result.error || "Fixture could not be created.");
      setFixtures((current) => [result.fixture!, ...current.filter((item) => item.fixtureId !== result.fixture!.fixtureId)]);
      setCreated(true); setConfirmed(false); setMessage(`Created ${result.fixture.participantCode}. The credential was not retained.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Fixture could not be created. Retry is available."); }
    finally { setPassword(""); setPending(null); }
  }

  async function cleanup(fixtureId: string) {
    if (pending || cleanupConfirmed !== fixtureId) return;
    setPending(fixtureId); setMessage(null);
    try {
      const response = await fetch("/api/admin/staging/disposable-participants", { method: "DELETE", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({ fixtureId, confirmed: true }) });
      const result = await response.json() as { success?: boolean; fixture?: DisposableSyntheticParticipant; error?: string };
      if (!response.ok || !result.fixture) throw new Error(result.error || "Fixture could not be revoked.");
      setFixtures((current) => current.map((item) => item.fixtureId === fixtureId ? { ...item, status: "REVOKED", revokedAt: result.fixture!.revokedAt } : item));
      setCleanupConfirmed(null); setMessage("The exact disposable fixture was revoked and its portal/profile records were soft-deleted.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Fixture could not be revoked. Retry is available."); }
    finally { setPending(null); }
  }

  async function cleanupOrphan(orphanId: string) {
    if (pending || cleanupConfirmed !== orphanId) return;
    setPending(orphanId); setMessage(null);
    try {
      const response = await fetch("/api/admin/staging/disposable-participants", { method: "DELETE", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({ orphanId, confirmed: true }) });
      const result = await response.json() as { orphan?: DisposableAuthOrphan; error?: string };
      if (!response.ok || !result.orphan) throw new Error(result.error || "Orphan Auth identity could not be deleted.");
      setOrphans((current) => current.map((item) => item.orphanId === orphanId ? result.orphan! : item));
      setCleanupConfirmed(null); setMessage("The exact Auth identity is deleted. The durable recovery state is AUTH_DELETED.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Orphan recovery failed. Retry remains available."); }
    finally { setPending(null); }
  }

  function prepareAnother() {
    if (pending) return;
    setRequestId(crypto.randomUUID()); setCreated(false); setMessage(null); setConfirmed(false); setPassword("");
  }

  return <div className="mt-8 space-y-10">
    <form onSubmit={createFixture} aria-busy={pending === "create"} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="font-serif text-2xl">Create one disposable participant</h2>
      <p className="text-sm text-slate-600">Creates one synthetic Auth identity, pending participant record, and incomplete profile. It creates no research, consent, evidence, FSH, report, or release records.</p>
      <label className="block text-sm font-semibold">Founder-chosen temporary password
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={16} autoComplete="new-password" required disabled={Boolean(pending) || created} className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-300" />
      </label>
      <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} disabled={Boolean(pending) || created} className="mt-1" /><span>I confirm creation of exactly one disposable STAGING fixture for Participant Portal/Profile testing only.</span></label>
      <div className="flex flex-wrap gap-3">
        <button disabled={Boolean(pending) || created || !confirmed || password.length < 16} className="rounded-xl bg-sky-700 px-5 py-3 font-semibold text-white focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:opacity-50">{pending === "create" ? "Creating disposable participant…" : "Create disposable participant"}</button>
        {created ? <button type="button" onClick={prepareAnother} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-300">Prepare another explicit action</button> : null}
      </div>
    </form>
    <section aria-labelledby="disposable-fixtures-title"><h2 id="disposable-fixtures-title" className="font-serif text-2xl">Disposable fixtures</h2>
      <div className="mt-4 space-y-4">{fixtures.length ? fixtures.map((fixture) => <article key={fixture.fixtureId} className="rounded-2xl border border-slate-200 p-5">
        <h3 className="font-semibold">{fixture.participantCode} · {fixture.status}</h3><p className="mt-1 break-all text-sm text-slate-600">{fixture.syntheticEmail}</p>
        {fixture.status !== "REVOKED" ? <div className="mt-4 space-y-3"><label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={cleanupConfirmed === fixture.fixtureId} onChange={(event) => setCleanupConfirmed(event.target.checked ? fixture.fixtureId : null)} disabled={Boolean(pending)} /><span>Confirm revocation of this exact fixture only.</span></label><button type="button" onClick={() => cleanup(fixture.fixtureId)} disabled={Boolean(pending) || cleanupConfirmed !== fixture.fixtureId} className="rounded-xl border border-red-300 px-4 py-2 font-semibold text-red-800 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50">{pending === fixture.fixtureId ? "Revoking exact fixture…" : fixture.status === "REVOCATION_PENDING" ? "Resume exact-fixture revocation" : "Revoke exact fixture"}</button></div> : null}
      </article>) : <p className="text-sm text-slate-600">No disposable fixtures have been provisioned.</p>}</div>
    </section>
    <section aria-labelledby="disposable-orphans-title"><h2 id="disposable-orphans-title" className="font-serif text-2xl">Blocked Auth recovery</h2>
      <p className="mt-2 text-sm text-slate-600">Failed provisioning and ambiguous activation identities remain visible until exact-record recovery is complete.</p>
      <div className="mt-4 space-y-4">{orphans.map((orphan) => { const reban = orphan.status === "AMBIGUOUS_REBAN_REQUIRED"; const actionable = Boolean(orphan.authUserId) && orphan.status !== "AUTH_DELETED" && !reban; const ambiguous = orphan.status === "AUTH_CREATION_AMBIGUOUS_HIGH_SEVERITY"; return <article key={orphan.orphanId} className={`rounded-2xl border p-5 ${reban ? "border-red-400 bg-red-50" : "border-amber-200"}`}><p className="break-all text-sm">{orphan.syntheticEmail}</p><p className={`mt-1 text-xs font-semibold ${reban ? "text-red-900" : "text-amber-900"}`}>Recovery state: {orphan.status}{reban ? " · HIGH SEVERITY" : ""}</p>{reban ? <p className="mt-3 text-sm text-red-900">Auth unban outcome is uncertain. Do not use broad cleanup. Re-ban and verify only this exact Auth UUID, then record the exact reservation recovery outcome.</p> : actionable ? <><label className="mt-3 flex gap-2 text-sm"><input type="checkbox" checked={cleanupConfirmed === orphan.orphanId} onChange={(event) => setCleanupConfirmed(event.target.checked ? orphan.orphanId : null)} disabled={Boolean(pending)} />Confirm deletion of this exact Auth identity.</label><button type="button" onClick={() => cleanupOrphan(orphan.orphanId)} disabled={Boolean(pending) || cleanupConfirmed !== orphan.orphanId} className="mt-3 rounded-xl border border-red-300 px-4 py-2 font-semibold text-red-800 disabled:opacity-50">{pending === orphan.orphanId ? "Recovering exact identity…" : "Delete exact recovery Auth identity"}</button></> : <p className="mt-3 text-sm text-slate-600">{ambiguous ? "Remote Auth creation may have committed. Operator investigation is required; no completion or absence is claimed." : "This terminal reservation has no callable activation path and requires no Auth deletion action."}</p>}</article>; })}</div>
    </section>
    <p role="status" aria-live="polite" className="min-h-6 text-sm text-slate-700">{message}</p>
  </div>;
}
