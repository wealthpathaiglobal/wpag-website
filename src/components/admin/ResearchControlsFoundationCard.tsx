import type { ResearchControlsStatus } from "@/lib/types/research/research-controls";

function label(value: string) {
  return value.toLowerCase().split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}
export default function ResearchControlsFoundationCard({ status }: { status: ResearchControlsStatus | null }) {
  return (
    <section className="mt-8 rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-6" aria-label="Research controls foundation">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-amber-200/60">Internal · Foundation Only</p>
          <h2 className="mt-2 text-lg font-semibold">Research Controls</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/50">
            Governed research identity, pre-enrollment, consent, privacy, and withdrawal status. This view creates no enrollment or evidence-collection authority.
          </p>
        </div>
        <span className="rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-1 text-xs font-medium text-rose-200">
          Soft launch blocked
        </span>
      </div>
      {!status ? (
        <p className="mt-5 text-sm text-white/45">No controlled research foundation exists for this participant.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div><p className="text-xs text-white/35">Research ID</p><p className="mt-2 font-mono text-sm text-white/75">{status.researchId}</p></div>
          <div><p className="text-xs text-white/35">Lifecycle</p><p className="mt-2 text-sm text-white/75">{label(status.lifecycleStatus)}</p></div>
          <div><p className="text-xs text-white/35">Consent</p><p className="mt-2 text-sm text-white/75">{label(status.consentStatus)} · {label(status.consentGate)}</p></div>
          <div><p className="text-xs text-white/35">Privacy</p><p className="mt-2 text-sm text-white/75">{label(status.privacyGate)}</p></div>
          <div><p className="text-xs text-white/35">Withdrawal</p><p className="mt-2 text-sm text-white/75">{label(status.withdrawalStatus)}</p></div>
          <div><p className="text-xs text-white/35">Evidence collection</p><p className="mt-2 text-sm text-rose-200">Not authorized</p></div>
          <div><p className="text-xs text-white/35">Actual enrollment</p><p className="mt-2 text-sm text-rose-200">Not authorized</p></div>
          <div><p className="text-xs text-white/35">Pilot / Production</p><p className="mt-2 text-sm text-rose-200">Not authorized</p></div>
        </div>
      )}
    </section>
  );
}
