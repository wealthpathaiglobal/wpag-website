import type { ResearchWave3Overview } from "@/lib/types/research/research-wave3";

function label(value: string) { return value.toLowerCase().split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" "); }

export default function ResearchWave3GovernanceCard({ overview }: { overview: ResearchWave3Overview | null }) {
  return (
    <section className="mt-8 rounded-2xl border border-violet-400/20 bg-violet-400/[0.04] p-6" aria-label="Wave 3 research governance">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs uppercase tracking-[0.22em] text-violet-200/60">Internal · Synthetic Research Only</p><h2 className="mt-2 text-lg font-semibold">Incident, Audit &amp; Governed FSH</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-white/50">Append-only protection and computation records. FSH is a signed nominal research value, not System State, diagnosis, advice, or participant output.</p></div>
        <span className="rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-1 text-xs font-medium text-rose-200">Release blocked</span>
      </div>
      {!overview ? <p className="mt-5 text-sm text-white/45">No controlled Wave 3 research context exists.</p> : <>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div><p className="text-xs text-white/35">Incidents</p><p className="mt-2 text-sm text-white/75">{overview.incidents.length}</p></div>
          <div><p className="text-xs text-white/35">Audit events</p><p className="mt-2 text-sm text-white/75">{overview.auditEventCount}</p></div>
          <div><p className="text-xs text-white/35">Audit integrity</p><p className="mt-2 text-sm text-white/75">{label(overview.auditIntegrityStatus)}</p></div>
          <div><p className="text-xs text-white/35">Release gate</p><p className="mt-2 text-sm text-rose-200">{label(overview.releaseGateStatus)}</p></div>
        </div>
        {overview.incidents.length ? <div className="mt-6"><h3 className="text-sm font-medium text-white/80">Incident register</h3><div className="mt-3 space-y-2">{overview.incidents.map((incident) => <div key={incident.incidentId} className="rounded-xl border border-white/10 p-4"><div className="flex flex-wrap justify-between gap-2"><span className="text-sm text-white/80">{label(incident.type)} · {incident.family}</span><span className="text-xs text-white/50">{label(incident.status)}</span></div><p className="mt-2 text-xs text-white/40">{incident.affectedGates.map(label).join(" · ")}</p></div>)}</div></div> : null}
        {overview.fshResults.length ? <div className="mt-6"><h3 className="text-sm font-medium text-white/80">Governed FSH results</h3><div className="mt-3 space-y-2">{overview.fshResults.map((result) => <div key={result.resultId} className="rounded-xl border border-white/10 p-4"><div className="flex flex-wrap justify-between gap-2"><span className="text-sm text-white/80">FSH {result.fshValue} {result.currency}</span><span className="text-xs text-white/50">{label(result.status)}</span></div><p className="mt-2 text-xs text-white/40">LOAD {result.loadTotal} · FLOW {result.flowTotal} · System State not authorized · Participant release blocked</p></div>)}</div></div> : null}
      </>}
    </section>
  );
}
