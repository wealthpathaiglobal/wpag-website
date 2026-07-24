"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AssessmentModule = {
  number: string;
  title: string;
  description: string;
  status: string;
  route: string;
};

const assessmentModules: AssessmentModule[] = [
  {
    number: "01",
    title: "Financial profile",
    description:
      "Establish the participant's household, income, expense, debt, asset, and obligation context.",
    status: "Not started",
    route: "/participant/assessment/financial-profile",
  },
  {
    number: "02",
    title: "Cash-flow structure",
    description:
      "Review income continuity, essential expenses, payment timing, recurring obligations, and monthly cash-flow pressure.",
    status: "Locked",
    route: "/participant/assessment/cash-flow",
  },
  {
    number: "03",
    title: "Debt and obligations",
    description:
      "Assess secured debt, unsecured debt, repayment burden, overdue exposure, and creditor pressure.",
    status: "Locked",
    route: "/participant/assessment/debt-obligations",
  },
  {
    number: "04",
    title: "Stability and margin",
    description:
      "Evaluate available financial margin, emergency capacity, liquidity, and the ability to absorb disruption.",
    status: "Locked",
    route: "/participant/assessment/stability-margin",
  },
  {
    number: "05",
    title: "Protection and risk",
    description:
      "Review insurance, dependency risk, health-related financial exposure, income interruption, and major vulnerabilities.",
    status: "Locked",
    route: "/participant/assessment/protection-risk",
  },
  {
    number: "06",
    title: "Financial behaviour",
    description:
      "Examine financial routines, decision patterns, payment discipline, documentation, and planning behaviour.",
    status: "Locked",
    route: "/participant/assessment/financial-behaviour",
  },
  {
    number: "07",
    title: "Evidence review",
    description:
      "Identify the records required to support the assessment and distinguish reported information from verified evidence.",
    status: "Locked",
    route: "/participant/assessment/evidence-review",
  },
  {
    number: "08",
    title: "Assessment summary",
    description:
      "Review the completed assessment, unresolved information, evidence gaps, and prototype system-state summary.",
    status: "Locked",
    route: "/participant/assessment/summary",
  },
];

const assessmentPrinciples = [
  {
    title: "Facts before conclusions",
    description:
      "The assessment should distinguish confirmed information, participant-reported information, and unresolved data.",
  },
  {
    title: "Structure before scoring",
    description:
      "Financial information must be organised and reconciled before any diagnosis or score is considered.",
  },
  {
    title: "Evidence before validation",
    description:
      "Statements are not treated as verified until supporting records have been reviewed under approved controls.",
  },
  {
    title: "Diagnosis before treatment",
    description:
      "Recommendations should follow a documented assessment of financial condition, pressure, and capacity.",
  },
];

const requiredEvidence = [
  "Recent bank statements",
  "Income evidence",
  "Recurring expense records",
  "Debt statements",
  "Loan repayment schedules",
  "Credit-card statements",
  "Insurance information",
  "Relevant financial obligations",
];

function StatusRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid gap-2 border-b border-black/10 py-4 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center">
      <span className="text-sm leading-6 text-black/60">{label}</span>
      <span className="text-sm font-medium leading-6 text-black">{value}</span>
    </div>
  );
}

export default function AssessmentDashboardPage() {
  const router = useRouter();
  const [loadingRoute, setLoadingRoute] = useState<string | null>(null);

  const completedModules = 0;
  const totalModules = assessmentModules.length;
  const progress = Math.round((completedModules / totalModules) * 100);

  async function navigateTo(route: string) {
    setLoadingRoute(route);

    await new Promise((resolve) => {
      window.setTimeout(resolve, 600);
    });

    router.push(route);
  }

  function handleReturn() {
    router.push("/participant/dashboard");
  }

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
                Participant Portal · HFOS Assessment
              </p>
            </div>

            <p className="max-w-sm text-sm leading-6 text-black/55 sm:text-right">
              Human Financial Operating System prototype
            </p>
          </div>
        </header>

        <section className="grid gap-10 py-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:gap-16 lg:py-20">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-black/55">
              Assessment dashboard
            </p>

            <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Understand the financial system before diagnosing it.
            </h1>

            <p className="mt-8 max-w-2xl text-base leading-8 text-black/65 sm:text-lg">
              The HFOS assessment organises participant information across
              cash flow, debt, margin, protection, behaviour, evidence, and
              financial-system condition.
            </p>
          </div>

          <aside className="border border-black bg-black p-6 text-white sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
              Prototype notice
            </p>

            <p className="mt-5 text-sm leading-7 text-white/80">
              This prototype does not calculate a production HFOS score,
              diagnose financial condition, store participant answers, or
              generate financial recommendations.
            </p>

            <p className="mt-4 text-sm leading-7 text-white/80">
              Production assessment requires authenticated records, validated
              financial data, evidence review, scoring governance, human
              oversight, and complete audit history.
            </p>
          </aside>
        </section>

        <section className="border-t border-black py-12 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/50">
                01
              </p>

              <h2 className="mt-4 font-serif text-3xl tracking-[-0.025em] sm:text-4xl">
                Assessment status
              </h2>

              <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                Current completion status for the prototype assessment
                journey.
              </p>
            </div>

            <div>
              <div className="grid gap-4 sm:grid-cols-2">
                <article className="border border-black bg-black p-6 text-white sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                    Assessment state
                  </p>

                  <h3 className="mt-5 font-serif text-3xl">Not started</h3>

                  <p className="mt-4 text-sm leading-7 text-white/65">
                    No prototype assessment module has been completed.
                  </p>
                </article>

                <article className="border border-black/20 bg-white/35 p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                    Evidence state
                  </p>

                  <h3 className="mt-5 font-serif text-3xl">
                    Not submitted
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-black/60">
                    No financial evidence has been uploaded or reviewed.
                  </p>
                </article>

                <article className="border border-black/20 bg-white/35 p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                    System-state result
                  </p>

                  <h3 className="mt-5 font-serif text-3xl">
                    Not determined
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-black/60">
                    Stable, under pressure, fragile, or collapsed has not been
                    assessed.
                  </p>
                </article>

                <article className="border border-black/20 bg-white/35 p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                    Review status
                  </p>

                  <h3 className="mt-5 font-serif text-3xl">
                    Not reviewed
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-black/60">
                    No administrator or research review has been performed.
                  </p>
                </article>
              </div>

              <div className="mt-4 border border-black/25 p-6 sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                      Assessment progress
                    </p>

                    <p className="mt-4 font-serif text-5xl">{progress}%</p>
                  </div>

                  <p className="text-sm text-black/55">
                    {completedModules} of {totalModules} modules completed
                  </p>
                </div>

                <div className="mt-7 h-2 w-full bg-black/10">
                  <div
                    className="h-full bg-black transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-black py-12 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/50">
                02
              </p>

              <h2 className="mt-4 font-serif text-3xl tracking-[-0.025em] sm:text-4xl">
                Assessment principles
              </h2>

              <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                The assessment must follow controlled institutional principles
                before any financial conclusion is formed.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {assessmentPrinciples.map((principle) => (
                <article
                  key={principle.title}
                  className="border border-black/20 bg-white/35 p-6 sm:p-8"
                >
                  <h3 className="font-serif text-2xl">{principle.title}</h3>

                  <p className="mt-4 text-sm leading-7 text-black/60">
                    {principle.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-black py-12 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/50">
                03
              </p>

              <h2 className="mt-4 font-serif text-3xl tracking-[-0.025em] sm:text-4xl">
                Assessment modules
              </h2>

              <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                Complete each module in sequence. Later modules remain locked
                until the required earlier stages are completed.
              </p>
            </div>

            <div className="grid gap-4">
              {assessmentModules.map((module, index) => {
                const isAvailable = index === 0;
                const isLoading = loadingRoute === module.route;

                return (
                  <article
                    key={module.number}
                    className={`border p-6 sm:p-8 ${
                      isAvailable
                        ? "border-black bg-white/40"
                        : "border-black/15 bg-black/[0.02]"
                    }`}
                  >
                    <div className="grid gap-6 sm:grid-cols-[64px_1fr_auto] sm:items-start">
                      <p className="text-xs font-semibold tracking-[0.2em] text-black/45">
                        {module.number}
                      </p>

                      <div>
                        <h3 className="font-serif text-2xl sm:text-3xl">
                          {module.title}
                        </h3>

                        <p className="mt-4 max-w-2xl text-sm leading-7 text-black/60">
                          {module.description}
                        </p>
                      </div>

                      <span className="border border-black/20 px-3 py-1 text-xs leading-5 text-black/55">
                        {module.status}
                      </span>
                    </div>

                    <div className="mt-7 flex justify-end">
                      <button
                        type="button"
                        onClick={() => navigateTo(module.route)}
                        disabled={!isAvailable || loadingRoute !== null}
                        className={`inline-flex min-h-12 items-center justify-center px-6 text-xs font-semibold uppercase tracking-[0.14em] transition disabled:cursor-not-allowed ${
                          isAvailable
                            ? "bg-black text-white hover:bg-black/80 disabled:opacity-50"
                            : "border border-black/20 text-black/35 disabled:opacity-100"
                        }`}
                      >
                        {isLoading
                          ? "Opening Module..."
                          : isAvailable
                            ? "Begin Module"
                            : "Locked"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-t border-black py-12 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/50">
                04
              </p>

              <h2 className="mt-4 font-serif text-3xl tracking-[-0.025em] sm:text-4xl">
                Evidence readiness
              </h2>

              <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                Supporting evidence will be required before reported financial
                information can be treated as validated.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {requiredEvidence.map((item, index) => (
                <div
                  key={item}
                  className="grid gap-4 border border-black/20 bg-white/35 p-6 sm:grid-cols-[40px_1fr_auto] sm:items-center"
                >
                  <span className="text-xs font-semibold tracking-[0.18em] text-black/45">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <p className="font-serif text-xl">{item}</p>

                  <span className="text-xs uppercase tracking-[0.12em] text-black/45">
                    Not provided
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-black py-12 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/50">
                05
              </p>

              <h2 className="mt-4 font-serif text-3xl tracking-[-0.025em] sm:text-4xl">
                Prototype system status
              </h2>

              <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                Current technical and governance limitations of this
                assessment demonstration.
              </p>
            </div>

            <div className="border border-black/25 px-6 sm:px-8">
              <StatusRow
                label="Participant authentication"
                value="Not connected"
              />

              <StatusRow
                label="Profile data retrieval"
                value="Not connected"
              />

              <StatusRow
                label="Assessment responses"
                value="Not stored"
              />

              <StatusRow
                label="Evidence validation"
                value="Not performed"
              />

              <StatusRow
                label="HFOS scoring engine"
                value="Not connected"
              />

              <StatusRow
                label="System-state diagnosis"
                value="Not generated"
              />

              <StatusRow
                label="Human review"
                value="Not performed"
              />

              <StatusRow
                label="Audit record"
                value="Not created"
              />
            </div>
          </div>
        </section>

        <section className="border-t border-black py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleReturn}
              disabled={loadingRoute !== null}
              className="inline-flex min-h-14 items-center justify-center border border-black px-7 text-sm font-semibold uppercase tracking-[0.14em] transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Return to Dashboard
            </button>

            <button
              type="button"
              onClick={() =>
                navigateTo("/participant/assessment/financial-profile")
              }
              disabled={loadingRoute !== null}
              className="inline-flex min-h-14 items-center justify-center bg-black px-8 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingRoute ===
              "/participant/assessment/financial-profile"
                ? "Opening Assessment..."
                : "Begin HFOS Assessment"}
            </button>
          </div>

          <p className="mt-8 max-w-4xl text-xs leading-6 text-black/50">
            Production HFOS assessments will require validated participant
            records, controlled scoring logic, evidence review, reviewer
            oversight, diagnosis governance, privacy controls, and complete
            institutional audit logging.
          </p>
        </section>
      </div>
    </main>
  );
}