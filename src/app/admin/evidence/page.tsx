import Link from "next/link";

import { requireRole } from "@/lib/auth/authorization";
import { adminEvidenceVerificationService } from "@/lib/services/admin/admin-evidence-verification-service";

function label(value: string) { return value.split("_").map((word) => word[0].toUpperCase() + word.slice(1)).join(" "); }
function date(value: string) { return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }

export default async function AdminEvidenceQueuePage() {
  const staff = await requireRole("administrator");
  const evidence = await adminEvidenceVerificationService.list(staff.auth_user_id);
  const summaries = [
    ["Awaiting Review", evidence.filter((item) => item.verificationStatus === "pending").length],
    ["In Progress", evidence.filter((item) => item.verificationStatus === "in_progress" && !item.actionRequired).length],
    ["Action Required", evidence.filter((item) => item.actionRequired).length],
    ["Verified", evidence.filter((item) => item.verificationStatus === "verified").length],
    ["Rejected", evidence.filter((item) => item.verificationStatus === "rejected").length],
  ] as const;
  return <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl">
    <nav><Link href="/admin/dashboard" className="text-sm text-white/50 hover:text-white">← Back to Admin Dashboard</Link></nav>
    <header className="mt-8 border-b border-white/10 pb-8"><p className="text-xs uppercase tracking-[0.3em] text-white/40">Governed Evidence</p><h1 className="mt-4 text-3xl font-semibold">Evidence Verification Queue</h1><p className="mt-3 text-sm text-white/50">Review submitted assessment evidence through governed administrator actions.</p></header>
    <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{summaries.map(([name, count]) => <article key={name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-sm text-white/50">{name}</p><p className="mt-3 text-3xl font-semibold">{count}</p></article>)}</section>
    <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">{evidence.length === 0 ? <p className="px-6 py-14 text-center text-sm text-white/50">No submitted evidence is available.</p> : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-white/10 text-white/40"><tr>{["Participant","Evidence","Assessment","Status","Submitted",""].map((heading) => <th key={heading} className="px-5 py-4 font-medium">{heading}</th>)}</tr></thead><tbody className="divide-y divide-white/5">{evidence.map((item) => <tr key={item.documentId}><td className="px-5 py-4"><p>{item.participantName}</p><p className="mt-1 text-xs text-white/40">{item.participantCode}</p></td><td className="px-5 py-4"><p>{item.displayName}</p><p className="mt-1 text-xs text-white/40">{item.originalFilename} · v{item.currentVersion}</p></td><td className="px-5 py-4">#{item.assessmentNumber}</td><td className="px-5 py-4"><span className="rounded-full border border-white/10 px-3 py-1">{item.actionRequired ? "Action Required" : label(item.verificationStatus)}</span></td><td className="px-5 py-4 text-white/60">{date(item.submittedAt)}</td><td className="px-5 py-4"><Link href={`/admin/evidence/${item.documentId}`} className="text-sky-300 hover:text-sky-200">Open Review</Link></td></tr>)}</tbody></table></div>}</section>
  </div></main>;
}
