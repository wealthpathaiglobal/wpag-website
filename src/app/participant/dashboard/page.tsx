"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DashboardCard = {
  number: string;
  title: string;
  description: string;
  status: string;
  buttonLabel: string;
  route: string;
};

const dashboardCards: DashboardCard[] = [
  {
    number: "01",
    title: "Participant profile",
    description:
      "Review personal information, programme details, contact information, and participant preferences.",
    status: "Prototype profile",
    buttonLabel: "Open Profile",
    route: "/participant/profile",
  },
  {
    number: "02",
    title: "HFOS assessment",
    description:
      "Begin or continue the Human Financial Operating System assessment and diagnosis workflow.",
    status: "Not started",
    buttonLabel: "Open Assessment",
    route: "/participant/assessment",
  },
  {
    number: "03",
    title: "Evidence submissions",
    description:
      "Review evidence requirements and submit supporting financial records when requested.",
    status: "No active requests",
    buttonLabel: "View Evidence",
    route: "/participant/evidence",
  },
  {
    number: "04",
    title: "Programme tasks",
    description:
      "View assigned research activities, participant actions, and programme requirements.",
    status: "No active tasks",
    buttonLabel: "View Tasks",
    route: "/participant/tasks",
  },
  {
    number: "05",
    title: "Follow-up schedule",
    description:
      "Review upcoming assessments, administrative reviews, and programme milestones.",
    status: "No scheduled events",
    buttonLabel: "View Schedule",
    route: "/participant/follow-ups",
  },
  {
    number: "06",
    title: "Messages",
    description:
      "Access secure programme communications and institutional participant notices.",
    status: "No messages",
    buttonLabel: "View Messages",
    route: "/participant/messages",
  },
  {
    number: "07",
    title: "Documents",
    description:
      "Access participant information, consent materials, programme guides, and research documents.",
    status: "Prototype documents",
    buttonLabel: "Open Documents",
    route: "/participant/documents",
  },
  {
    number: "08",
    title: "Progress and reports",
    description:
      "Review programme progress, completed assessments, evidence status, and available reports.",
    status: "No report available",
    buttonLabel: "View Progress",
    route: "/participant/progress",
  },
];

const journeyStages = [
  {
    title: "Enrollment",
    status: "Completed",
    completed: true,
  },
  {
    title: "Participant profile",
    status: "Awaiting completion",
    completed: false,
  },
  {
    title: "Programme assignment",
    status: "Not assigned",
    completed: false,
  },
  {
    title: "HFOS assessment",
    status: "Not started",
    completed: false,
  },
  {
    title: "Evidence collection",
    status: "Not started",
    completed: false,
  },
  {
    title: "Follow-up",
    status: "Not started",
    completed: false,
  },
  {
    title: "Research completion",
    status: "Not completed",
    completed: false,
  },
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

      <span className="text-sm font-medium leading-6 text-black">
        {value}
      </span>
    </div>
  );
}

export default function ParticipantDashboardPage() {
  const router = useRouter();

  const [loadingRoute, setLoadingRoute] = useState<string | null>(null);

  async function navigateTo(route: string) {
    setLoadingRoute(route);

    await new Promise((resolve) => {
      window.setTimeout(resolve, 500);
    });

    router.push(route);
  }

  function handleReturn() {
    router.push("/participant/enrollment-confirmation");
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
                Participant Portal · Dashboard
              </p>
            </div>

            <p className="max-w-sm text-sm leading-6 text-black/55 sm:text-right">
              Institutional participant workspace prototype
            </p>
          </div>
        </header>

        <section className="grid gap-10 py-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:gap-16 lg:py-20">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-black/55">
              Participant workspace
            </p>

            <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Welcome to your participant portal.
            </h1>

            <p className="mt-8 max-w-2xl text-base leading-8 text-black/65 sm:text-lg">
              This workspace will provide secure access to assessments,
              evidence requirements, programme tasks, participant documents,
              messages, follow-ups, and progress reports.
            </p>
          </div>

          <aside className="border border-black bg-black p-6 text-white sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
              Prototype notice
            </p>

            <p className="mt-5 text-sm leading-7 text-white/80">
              This dashboard does not provide authenticated access or retrieve
              participant information from a database. The status information
              displayed here is illustrative only.
            </p>

            <p className="mt-4 text-sm leading-7 text-white/80">
              Production access will require secure authentication,
              role-based permissions, encrypted participant records, session
              management, and institutional audit controls.
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
                Participant overview
              </h2>

              <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                A high-level summary of the current prototype participant
                status.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <article className="border border-black bg-black p-6 text-white sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                  Participant status
                </p>

                <h3 className="mt-5 font-serif text-3xl">
                  Prototype participant
                </h3>

                <p className="mt-4 text-sm leading-7 text-white/65">
                  No permanent participant profile has been created.
                </p>
              </article>

              <article className="border border-black/20 bg-white/35 p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                  Programme
                </p>

                <h3 className="mt-5 font-serif text-3xl">
                  Pending assignment
                </h3>

                <p className="mt-4 text-sm leading-7 text-black/60">
                  Programme assignment will occur after production approval.
                </p>
              </article>

              <article className="border border-black/20 bg-white/35 p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                  Enrollment
                </p>

                <h3 className="mt-5 font-serif text-3xl">
                  Prototype complete
                </h3>

                <p className="mt-4 text-sm leading-7 text-black/60">
                  Public onboarding interface has been completed.
                </p>
              </article>

              <article className="border border-black/20 bg-white/35 p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                  Research status
                </p>

                <h3 className="mt-5 font-serif text-3xl">
                  Not started
                </h3>

                <p className="mt-4 text-sm leading-7 text-black/60">
                  No research activity or participant evidence is recorded.
                </p>
              </article>
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
                Workspace access
              </h2>

              <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                Access participant modules, programme activity, and research
                workflows.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {dashboardCards.map((card) => {
                const isLoading = loadingRoute === card.route;

                return (
                  <article
                    key={card.number}
                    className="flex min-h-[300px] flex-col justify-between border border-black/20 bg-white/35 p-6 transition hover:border-black sm:p-8"
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
                    </div>

                    <button
                      type="button"
                      onClick={() => navigateTo(card.route)}
                      disabled={loadingRoute !== null}
                      className="mt-8 inline-flex min-h-12 w-full items-center justify-center border border-black px-5 text-xs font-semibold uppercase tracking-[0.14em] transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isLoading ? "Opening..." : card.buttonLabel}
                    </button>
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
                03
              </p>

              <h2 className="mt-4 font-serif text-3xl tracking-[-0.025em] sm:text-4xl">
                Research journey
              </h2>

              <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                Follow the participant journey from enrollment through
                assessment, evidence collection, follow-up, and completion.
              </p>
            </div>

            <div className="border border-black/20 bg-white/35">
              {journeyStages.map((stage, index) => (
                <article
                  key={stage.title}
                  className="grid gap-5 border-b border-black/10 p-6 last:border-b-0 sm:grid-cols-[56px_1fr_auto] sm:items-center sm:p-8"
                >
                  <span className="text-xs font-semibold tracking-[0.2em] text-black/45">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div>
                    <h3 className="font-serif text-2xl">{stage.title}</h3>

                    <p className="mt-2 text-sm leading-6 text-black/55">
                      {stage.status}
                    </p>
                  </div>

                  <span
                    className={`flex h-8 w-8 items-center justify-center border text-sm ${
                      stage.completed
                        ? "border-black bg-black text-white"
                        : "border-black/30 text-black/35"
                    }`}
                  >
                    {stage.completed ? "✓" : "○"}
                  </span>
                </article>
              ))}
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
                Prototype system status
              </h2>

              <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                Current technical limitations of the participant workspace
                demonstration.
              </p>
            </div>

            <div className="border border-black/25 px-6 sm:px-8">
              <StatusRow
                label="Participant authentication"
                value="Not connected"
              />

              <StatusRow
                label="Participant profile"
                value="Not stored"
              />

              <StatusRow
                label="Programme assignment"
                value="Not available"
              />

              <StatusRow
                label="HFOS assessment data"
                value="Not stored"
              />

              <StatusRow
                label="Evidence storage"
                value="Not connected"
              />

              <StatusRow
                label="Secure messaging"
                value="Not connected"
              />

              <StatusRow
                label="Database connection"
                value="Not connected"
              />

              <StatusRow label="Audit history" value="Not created" />
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
              Return to Enrollment
            </button>

            <button
              type="button"
              onClick={() => navigateTo("/participant/assessment")}
              disabled={loadingRoute !== null}
              className="inline-flex min-h-14 items-center justify-center bg-black px-8 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingRoute === "/participant/assessment"
                ? "Opening Assessment..."
                : "Start HFOS Assessment"}
            </button>
          </div>

          <p className="mt-8 max-w-4xl text-xs leading-6 text-black/50">
            Production participant workspaces will require secure login,
            participant-specific data access, role-based permissions,
            encrypted records, session controls, privacy governance, and
            complete institutional audit logging.
          </p>
        </section>
      </div>
    </main>
  );
}