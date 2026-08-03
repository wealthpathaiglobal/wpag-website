import Link from "next/link";

import CreatePreliminaryReportButton from "@/components/admin/preliminary-reports/CreatePreliminaryReportButton";
import { requireRole } from "@/lib/auth/authorization";
import { adminPreliminaryReportService } from "@/lib/services/admin/admin-preliminary-report-service";

function label(value: string | null) {
  return value ? value.split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ") : "Eligible";
}

function date(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
}

export default async function PreliminaryReportQueuePage() {
  const staff = await requireRole("administrator");
  const reports = await adminPreliminaryReportService.listReports(staff.auth_user_id);
  const statuses = ["eligible", "draft", "under_review", "returned", "approved", "released"] as const;

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin/dashboard" className="text-sm text-white/50 hover:text-white">← Back to Admin Dashboard</Link>
        <header className="mt-8 border-b border-white/10 pb-8">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/40">Governed Research Reports</p>
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Preliminary Report Queue</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55">Approved human-reviewed assessments eligible for a manually authored preliminary research report.</p>
        </header>
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {statuses.map((status) => <article key={status} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-sm text-white/50">{label(status)}</p><p className="mt-3 text-3xl font-semibold">{reports.filter((item) => status === "eligible" ? !item.reportStatus : item.reportStatus === status).length}</p></article>)}
        </section>
        <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          {reports.length === 0 ? <p className="px-6 py-16 text-center text-white/55">No eligible assessments or active preliminary reports.</p> : (
            <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-white/10 bg-white/[0.02]"><tr>{["Participant", "Assessment", "Review", "Report", "Status", "Updated", "Action"].map((heading) => <th key={heading} className="px-5 py-4 text-xs uppercase tracking-wider text-white/35">{heading}</th>)}</tr></thead><tbody>
              {reports.map((item) => <tr key={item.assessmentId} className="border-b border-white/5 last:border-0"><td className="px-5 py-5"><p className="font-medium">{item.participantName}</p><p className="mt-1 font-mono text-xs text-white/40">{item.participantCode}</p></td><td className="px-5 py-5 text-white/60">#{item.assessmentNumber} · {label(item.assessmentType)}</td><td className="px-5 py-5 text-white/60">Approved<br/><span className="text-xs text-white/35">{date(item.assessmentReviewCompletedAt)}</span></td><td className="px-5 py-5">{item.reportNumber ?? "Not created"}</td><td className="px-5 py-5">{label(item.reportStatus)}</td><td className="px-5 py-5 text-white/50">{date(item.updatedAt)}</td><td className="px-5 py-5">{item.reportId ? <Link href={`/admin/reports/${item.reportId}`} className="text-sky-300 hover:underline">Open Report</Link> : <CreatePreliminaryReportButton assessmentId={item.assessmentId} participantName={item.participantName} assessmentNumber={item.assessmentNumber} />}</td></tr>)}
            </tbody></table></div>
          )}
        </section>
      </div>
    </main>
  );
}
