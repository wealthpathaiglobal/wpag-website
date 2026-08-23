import {
  getParticipantDashboardPolicy,
  type ParticipantDashboardPolicyInput,
} from "./participant-dashboard-policy";

function statusLabel(value: string) {
  return value.toLowerCase().split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function enrollmentLabel(value: string | null) {
  if (!value) return "Not enrolled";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "Not recorded" : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function SectionIntro({ number, title, children }: { number: string; title: string; children: string }) {
  return <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/50">{number}</p><h2 className="mt-4 font-serif text-3xl tracking-[-0.025em] sm:text-4xl">{title}</h2><p className="mt-5 max-w-md text-sm leading-7 text-black/60">{children}</p></div>;
}

export type ParticipantDashboardClientProps = ParticipantDashboardPolicyInput & {
  participantCode: string;
  enrollmentDate: string | null;
};

export default function ParticipantDashboardClient(props: ParticipantDashboardClientProps) {
  const policy = getParticipantDashboardPolicy(props);
  const active = props.lifecycleStatus === "active";

  return <main className="min-h-screen bg-[#f4f2ed] text-black"><div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-16">
    <header className="border-b border-black pb-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.28em] text-black/55">Wealth Path AI Global</p><p className="mt-3 text-sm uppercase tracking-[0.18em] text-black/60">Participant Portal · Dashboard</p></div><p className="max-w-sm text-sm leading-6 text-black/55 sm:text-right">Governed participant workspace</p></div></header>

    <section className="grid gap-10 py-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:gap-16 lg:py-20"><div><p className="text-sm font-medium uppercase tracking-[0.18em] text-black/55">Participant workspace</p><h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl">Welcome to your participant portal.</h1><p className="mt-8 max-w-2xl text-base leading-8 text-black/65 sm:text-lg">Available destinations and actions below reflect your current participant lifecycle and governed research status.</p></div><aside className="border border-black bg-black p-6 text-white sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">Current access</p><p className="mt-5 text-sm leading-7 text-white/80">{policy.enrollmentNotice}</p><p className="mt-4 text-sm leading-7 text-white/80">An available page can still contain a governed write action. Each destination identifies whether it is read-only or can change data.</p></aside></section>

    <section className="border-t border-black py-12 lg:py-16"><div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16"><SectionIntro number="01" title="Participant overview">Current values loaded from the governed participant and research records.</SectionIntro><div className="grid gap-4 sm:grid-cols-2">
      <article className="border border-black bg-black p-6 text-white sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Participant status</p><h3 className="mt-5 font-serif text-3xl">{statusLabel(props.lifecycleStatus)}</h3><p className="mt-4 text-sm leading-7 text-white/65">Participant identifier: {props.participantCode}</p></article>
      <article className="border border-black/20 bg-white/35 p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">Research status</p><h3 className="mt-5 font-serif text-3xl">{statusLabel(props.researchStatus)}</h3><p className="mt-4 text-sm leading-7 text-black/60">Consent: {statusLabel(props.consentStatus)}</p></article>
      <article className="border border-black/20 bg-white/35 p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">Enrollment</p><h3 className="mt-5 font-serif text-3xl">{enrollmentLabel(props.enrollmentDate)}</h3><p className="mt-4 text-sm leading-7 text-black/60">{active ? "The participant lifecycle is active." : `Enrollment is not complete; lifecycle is ${statusLabel(props.lifecycleStatus)}.`}</p></article>
      <article className="border border-black/20 bg-white/35 p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">Profile</p><h3 className="mt-5 font-serif text-3xl">{props.profileCompleted ? "Complete" : "Incomplete"}</h3><p className="mt-4 text-sm leading-7 text-black/60">Profile state is loaded from the participant record.</p></article>
    </div></div></section>

    <section className="border-t border-black py-12 lg:py-16"><div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16"><SectionIntro number="02" title="Workspace access">Unavailable modules have no navigation target. Available modules disclose whether the destination contains write actions.</SectionIntro><div className="grid gap-4 sm:grid-cols-2">{policy.controls.map((card) => <article key={card.id} className={`flex min-h-[330px] flex-col justify-between border bg-white/35 p-6 sm:p-8 ${card.available ? "border-black/20" : "border-black/10 opacity-75"}`} data-control={card.id} data-available={String(card.available)}><div><div className="flex items-start justify-between gap-4"><p className="text-xs font-semibold tracking-[0.2em] text-black/45">{card.number}</p><span className="border border-black/20 px-3 py-1 text-xs leading-5 text-black/55">{card.status}</span></div><h3 className="mt-7 font-serif text-3xl tracking-[-0.025em]">{card.title}</h3><p className="mt-5 text-sm leading-7 text-black/60">{card.description}</p><p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-black/45">{card.mode === "read_only" ? "Read-only destination" : card.mode === "contains_writes" ? "Destination contains governed write actions" : "Unavailable for current lifecycle"}</p><p className="mt-2 text-xs leading-6 text-black/55">{card.notice}</p></div>{card.available && card.href ? <a href={card.href} className="mt-8 inline-flex min-h-12 w-full items-center justify-center border border-black px-5 text-center text-xs font-semibold uppercase tracking-[0.14em] transition hover:bg-black hover:text-white">{card.buttonLabel}</a> : <button type="button" disabled className="mt-8 inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center border border-black/25 px-5 text-xs font-semibold uppercase tracking-[0.14em] text-black/40">{card.buttonLabel}</button>}</article>)}</div></div></section>

    <section className="border-t border-black py-12 lg:py-16"><div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16"><SectionIntro number="03" title="Governed journey state">This factual view does not infer completion from prototype navigation or page visits.</SectionIntro><div className="border border-black/20 bg-white/35">{policy.journey.map((stage, index) => <article key={stage.title} className="grid gap-5 border-b border-black/10 p-6 last:border-b-0 sm:grid-cols-[56px_1fr_auto] sm:items-center sm:p-8"><span className="text-xs font-semibold tracking-[0.2em] text-black/45">{String(index + 1).padStart(2, "0")}</span><div><h3 className="font-serif text-2xl">{stage.title}</h3><p className="mt-2 text-sm leading-6 text-black/55">{stage.status}</p></div><span className={`flex h-8 w-8 items-center justify-center border text-sm ${stage.complete ? "border-black bg-black text-white" : "border-black/30 text-black/35"}`}>{stage.complete ? "✓" : "○"}</span></article>)}</div></div></section>

    <section className="border-t border-black py-12 lg:py-16"><div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16"><SectionIntro number="04" title="Governed access status">Current lifecycle and research firewalls. The dashboard does not alter these gates.</SectionIntro><div className="border border-black/25 px-6 sm:px-8">{policy.gateSummary.map(([label, value]) => <div key={label} className="grid gap-2 border-b border-black/10 py-4 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center"><span className="text-sm leading-6 text-black/60">{label}</span><span className="text-sm font-medium leading-6 text-black">{value}</span></div>)}</div></div></section>

    <section className="border-t border-black py-10"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-3xl text-sm leading-7 text-black/60">{policy.enrollmentNotice}</p>{policy.assessmentAvailable ? <a href="/participant/assessment" className="inline-flex min-h-14 items-center justify-center bg-black px-8 text-center text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-black/80">Start HFOS Assessment</a> : <button type="button" disabled className="inline-flex min-h-14 cursor-not-allowed items-center justify-center border border-black/25 px-8 text-sm font-semibold uppercase tracking-[0.14em] text-black/40">Assessment Unavailable</button>}</div><p className="mt-8 max-w-4xl text-xs leading-6 text-black/50">No dashboard control creates consent, privacy, enrollment, evidence, FSH-output, or release authority. Destination pages retain their existing server-side authorization checks.</p></section>
  </div></main>;
}
