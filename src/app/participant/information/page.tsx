import { Container } from "@/components/layout/container";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { typography } from "@/styles/typography";
import { Button } from "@/ui/button";

const information = [
  ["Programme purpose", "WPAG studies financial stability, pressure, resilience, and continuity through structured participant research."],
  ["Voluntary participation", "Participation is voluntary. You may decide not to apply, and an application does not guarantee eligibility or enrollment."],
  ["Privacy expectations", "Information is collected only for stated programme and research purposes and is subject to approved privacy and governance controls."],
  ["No guaranteed outcome", "Participation does not guarantee a financial, research, programme, or other outcome."],
  ["No professional advice", "WPAG research materials do not provide personal financial, legal, medical, tax, or investment advice."],
  ["Participant journey", "After preliminary screening and application, administrators review eligibility. Approved applicants receive an invitation before authenticated onboarding begins."],
] as const;

export default function ParticipantInformationPage() {
  return <><SiteHeader /><main className="min-h-screen bg-black text-white"><section className="py-24"><Container><div className="max-w-4xl"><p className={`mb-6 ${typography.caption}`}>Participant Journey · Step 1</p><h1 className={typography.display}>Participant information.</h1><p className={`mt-8 max-w-3xl ${typography.bodyLarge}`}>Read this information before deciding whether to continue to preliminary eligibility screening.</p><div className="mt-16 divide-y divide-zinc-800 border-y border-zinc-800">{information.map(([title, description], index) => <article key={title} className="grid gap-4 py-8 md:grid-cols-[80px_220px_1fr]"><p className="text-sm font-semibold tracking-[0.2em] text-zinc-500">{String(index + 1).padStart(2, "0")}</p><h2 className="text-lg font-semibold">{title}</h2><p className="leading-7 text-zinc-400">{description}</p></article>)}</div><div className="mt-10 flex flex-col gap-4 sm:flex-row"><Button href="/participant/eligibility">Continue to Eligibility</Button><Button href="/participant" variant="secondary">Return to Participant Portal</Button></div></div></Container></section></main><SiteFooter /></>;
}
