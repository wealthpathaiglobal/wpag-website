import ParticipantPortalLink from "@/components/participant/ParticipantPortalLink";
import {
  getParticipantDashboardPolicy,
  type ParticipantDashboardPolicyInput,
} from "./participant-dashboard-policy";

function statusLabel(value: string) {
  const participantLabels: Record<string, string> = {
    NOT_PRESENTED: "Information not yet presented",
    PRESENTED: "Ready for your choice",
    GRANTED: "Consent given",
    DECLINED: "Consent declined",
  };
  if (participantLabels[value]) return participantLabels[value];
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function enrollmentLabel(value: string | null) {
  if (!value) return "Not enrolled";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? "Not recorded"
    : new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
}

function SectionIntro({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/50">
        {number}
      </p>
      <h2 className="mt-4 font-serif text-3xl tracking-[-0.025em] sm:text-4xl">
        {title}
      </h2>
      <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
        {children}
      </p>
    </div>
  );
}

export type ParticipantDashboardClientProps = ParticipantDashboardPolicyInput & {
  participantCode: string;
  enrollmentDate: string | null;
};

export default function ParticipantDashboardClient(
  props: ParticipantDashboardClientProps,
) {
  const policy = getParticipantDashboardPolicy(props);
  const active = props.lifecycleStatus === "active";

  return (
    <main className="min-h-screen bg-[#f4f2ed] text-black">
      <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-16">
        <header className="border-b border-black pb-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-black/55">
                Wealth Path AI Global
              </p>
              <p className="mt-3 text-sm uppercase tracking-[0.18em] text-black/60">
                Participant Portal · Dashboard
              </p>
            </div>
            <p className="max-w-sm text-sm leading-6 text-black/55 sm:text-right">
              Signed-in participant workspace
            </p>
          </div>
        </header>

        <section className="grid gap-8 py-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:gap-16 lg:py-16">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-black/55">
              Your current position
            </p>
            <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              {active ? "Your enrollment is active." : "Your enrollment is pending."}
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-8 text-black/65 sm:text-lg">
              {policy.enrollmentNotice}
            </p>
          </div>

          <aside className="border border-black bg-black p-6 text-white sm:p-8" aria-labelledby="next-step-title">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
              What happens next
            </p>
            <h2 id="next-step-title" className="mt-4 font-serif text-3xl">
              Your next step
            </h2>
            <p className="mt-5 text-sm leading-7 text-white/80">
              {policy.nextStep}
            </p>
          </aside>
        </section>

        <section className="border-t border-black py-12 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
            <SectionIntro number="01" title="At a glance">
              The information below comes from your current participant record.
            </SectionIntro>
            <div className="grid gap-4 sm:grid-cols-2">
              <article className="border border-black bg-black p-6 text-white sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                  Enrollment
                </p>
                <h3 className="mt-5 font-serif text-3xl">
                  {active ? "Active" : "Pending"}
                </h3>
                <p className="mt-4 text-sm leading-7 text-white/65">
                  Participant ID: {props.participantCode}
                </p>
              </article>
              <article className="border border-black/20 bg-white/35 p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                  Research participation
                </p>
                <h3 className="mt-5 font-serif text-3xl">
                  {props.researchStatus === "enrolled" ? "Participating" : "Not enrolled"}
                </h3>
                <p className="mt-4 text-sm leading-7 text-black/60">
                  Research information: {statusLabel(props.consentStatus)}
                </p>
              </article>
              <article className="border border-black/20 bg-white/35 p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                  Enrollment date
                </p>
                <h3 className="mt-5 font-serif text-3xl">
                  {enrollmentLabel(props.enrollmentDate)}
                </h3>
                <p className="mt-4 text-sm leading-7 text-black/60">
                  {active
                    ? "Your participant enrollment is active."
                    : "No completed enrollment date is recorded."}
                </p>
              </article>
              <article className="border border-black/20 bg-white/35 p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                  Profile
                </p>
                <h3 className="mt-5 font-serif text-3xl">
                  {props.profileCompleted ? "Complete" : "Needs attention"}
                </h3>
                <p className="mt-4 text-sm leading-7 text-black/60">
                  You decide when to save changes or mark the profile complete.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="border-t border-black py-12 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
            <SectionIntro number="02" title="What you can do now">
              Available items are links. Items that are not ready have no destination and cannot be opened.
            </SectionIntro>
            <div className="grid gap-4 sm:grid-cols-2">
              {policy.controls.map((card) => (
                <article
                  key={card.id}
                  className={`flex min-h-[330px] flex-col justify-between border bg-white/35 p-6 sm:p-8 ${card.available ? "border-black/20" : "border-black/10 opacity-75"}`}
                  data-control={card.id}
                  data-available={String(card.available)}
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-xs font-semibold tracking-[0.2em] text-black/45">
                        {card.number}
                      </p>
                      <span className="border border-black/20 px-3 py-1 text-xs leading-5 text-black/55">
                        {card.status}
                      </span>
                    </div>
                    <h3 className="mt-7 font-serif text-3xl tracking-[-0.025em]">
                      {card.title}
                    </h3>
                    <p className="mt-5 text-sm leading-7 text-black/60">
                      {card.description}
                    </p>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-black/45">
                      {card.mode === "read_only"
                        ? "View only"
                        : card.mode === "contains_writes"
                          ? "You choose whether to make changes"
                          : "Not available yet"}
                    </p>
                    <p className="mt-2 text-xs leading-6 text-black/55">
                      {card.notice}
                    </p>
                  </div>
                  {card.available && card.href ? (
                    <ParticipantPortalLink
                      href={card.href}
                      label={card.buttonLabel}
                      className="mt-8 inline-flex min-h-12 w-full items-center justify-center border border-black px-5 text-center text-xs font-semibold uppercase tracking-[0.14em] transition hover:bg-black hover:text-white"
                    />
                  ) : (
                    <button
                      type="button"
                      disabled
                      aria-label={`${card.title}: not available yet`}
                      className="mt-8 inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center border border-black/25 px-5 text-xs font-semibold uppercase tracking-[0.14em] text-black/40"
                    >
                      {card.buttonLabel}
                    </button>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-black py-12 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
            <SectionIntro number="03" title="Your journey">
              A simple view of the stages currently recorded for your participant account.
            </SectionIntro>
            <div className="border border-black/20 bg-white/35">
              {policy.journey.map((stage, index) => (
                <article key={stage.title} className="grid gap-5 border-b border-black/10 p-6 last:border-b-0 sm:grid-cols-[56px_1fr_auto] sm:items-center sm:p-8">
                  <span className="text-xs font-semibold tracking-[0.2em] text-black/45">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-serif text-2xl">{stage.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-black/55">{stage.status}</p>
                  </div>
                  <span aria-label={stage.complete ? "Complete" : "Not complete"} className={`flex h-8 w-8 items-center justify-center border text-sm ${stage.complete ? "border-black bg-black text-white" : "border-black/30 text-black/35"}`}>
                    {stage.complete ? "✓" : "○"}
                  </span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-black py-10">
          <details className="border border-black/20 bg-white/30 p-5">
            <summary className="cursor-pointer font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black">
              Detailed status information
            </summary>
            <p className="mt-3 text-sm leading-6 text-black/60">
              These exact system states are provided for reference. They do not change your rights or make unavailable actions available.
            </p>
            <dl className="mt-5 divide-y divide-black/10">
              {policy.gateSummary.map(([label, value, technicalValue]) => (
                <div key={label} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <dt className="text-sm text-black/60">{label}</dt>
                  <dd className="text-sm font-medium text-black">{value} <code className="ml-2 text-xs text-black/45">{technicalValue}</code></dd>
                </div>
              ))}
            </dl>
          </details>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-3xl text-sm leading-7 text-black/60">{policy.nextStep}</p>
            {policy.assessmentAvailable ? (
              <ParticipantPortalLink
                href="/participant/assessment"
                label="Start HFOS Assessment"
                className="inline-flex min-h-14 items-center justify-center bg-black px-8 text-center text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-black/80"
              />
            ) : (
              <button type="button" disabled className="inline-flex min-h-14 cursor-not-allowed items-center justify-center border border-black/25 px-8 text-sm font-semibold uppercase tracking-[0.14em] text-black/40">
                Assessment Not Available Yet
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
