import type { AdminHfosMeasurementSummary } from "@/lib/types/admin/admin-hfos-measurement";

function date(value: string) { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? "—" : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(parsed); }

export default function HfosMeasurementFoundationCard({ summary }: { summary: AdminHfosMeasurementSummary | null }) {
  return <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6" aria-label="HFOS measurement foundation">
    <h2 className="text-lg font-semibold">HFOS Measurement Foundation</h2>
    <p className="mt-2 text-sm text-white/45">Infrastructure snapshot only — no HFOS score or diagnosis generated</p>
    {!summary ? <p className="mt-6 text-sm text-white/60">No measurement snapshot captured</p> : <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <div><p className="text-xs text-white/40">Current run</p><p className="mt-2 break-all text-sm">{summary.currentRunId}</p></div>
      <div><p className="text-xs text-white/40">Assessment / HFOS</p><p className="mt-2 text-sm">{summary.assessmentVersion} · {summary.hfosVersion}</p></div>
      <div><p className="text-xs text-white/40">Engine / Formula set</p><p className="mt-2 text-sm">{summary.measurementEngineVersion} · {summary.formulaSetVersion}</p></div>
      <div><p className="text-xs text-white/40">Frozen inputs</p><p className="mt-2 text-sm">{summary.inputCount} · {summary.warningCount} warnings</p></div>
      <div><p className="text-xs text-white/40">Generated</p><p className="mt-2 text-sm">{date(summary.generatedAt)}</p></div>
      <div><p className="text-xs text-white/40">Historical runs</p><p className="mt-2 text-sm">{summary.historicalRunCount}</p></div>
    </div>}
  </section>;
}
