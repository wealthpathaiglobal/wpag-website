"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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

const completedSteps = [
  "Preliminary application completed",
  "Contact verification completed",
  "Identity information completed",
  "Consent statements accepted",
  "Prototype onboarding completed",
];

const nextSteps = [
  {
    number: "01",
    title: "Administrative review",
    description:
      "Programme administrators review participant eligibility, governance requirements, and programme suitability.",
  },
  {
    number: "02",
    title: "Participant profile creation",
    description:
      "A secure participant account and institutional participant record will be created after production approval.",
  },
  {
    number: "03",
    title: "Programme assignment",
    description:
      "Approved participants will be assigned to the appropriate research or evidence programme.",
  },
  {
    number: "04",
    title: "HFOS assessment",
    description:
      "Participants will begin the Human Financial Operating System assessment and diagnosis workflow.",
  },
  {
    number: "05",
    title: "Evidence and follow-up",
    description:
      "Programme activities, evidence collection, reviews, and follow-up milestones will begin according to the approved protocol.",
  },
];

export default function EnrollmentConfirmationPage() {
  const router = useRouter();
  const [isContinuing, setIsContinuing] = useState(false);

  async function handleContinue() {
    setIsContinuing(true);

    await new Promise((resolve) => {
      window.setTimeout(resolve, 700);
    });

    router.push("/participant/dashboard");
  }

  function handleBack() {
    router.push("/participant/consent");
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
                Participant Journey · Step 8
              </p>
            </div>

            <p className="max-w-sm text-sm leading-6 text-black/55 sm:text-right">
              Institutional participant onboarding prototype
            </p>
          </div>
        </header>

        <section className="grid gap-10 py-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:gap-16 lg:py-20">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-black/55">
              Enrollment confirmation
            </p>

            <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Onboarding complete.
            </h1>

            <p className="mt-8 max-w-2xl text-base leading-8 text-black/65 sm:text-lg">
              You have completed the public participant onboarding journey in
              this prototype environment. Production enrollment will occur
              only after administrative approval and institutional systems are
              connected.
            </p>
          </div>

          <aside className="border border-black bg-black p-6 text-white sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
              Prototype notice
            </p>

            <p className="mt-5 text-sm leading-7 text-white/80">
              This page does not create a permanent participant profile,
              participant identifier, secure login, database record, programme
              assignment, or audit record.
            </p>

            <p className="mt-4 text-sm leading-7 text-white/80">
              Production enrollment will require authenticated approval,
              encrypted participant records, secure access controls, and
              complete institutional governance.
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
                Journey completed
              </h2>

              <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                The following onboarding stages have been completed within the
                current prototype session.
              </p>
            </div>

            <div className="border border-black/20 bg-white/40">
              {completedSteps.map((step, index) => (
                <div
                  key={step}
                  className="grid gap-4 border-b border-black/10 p-6 last:border-b-0 sm:grid-cols-[56px_1fr_auto] sm:items-center sm:p-8"
                >
                  <span className="text-xs font-semibold tracking-[0.18em] text-black/45">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <p className="font-serif text-xl sm:text-2xl">{step}</p>

                  <span className="flex h-8 w-8 items-center justify-center border border-black bg-black text-sm text-white">
                    ✓
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
                02
              </p>

              <h2 className="mt-4 font-serif text-3xl tracking-[-0.025em] sm:text-4xl">
                Enrollment status
              </h2>

              <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                This status reflects interface completion only. It does not
                represent production enrollment or institutional approval.
              </p>
            </div>

            <div className="border border-black/25 px-6 sm:px-8">
              <StatusRow
                label="Onboarding journey"
                value="Prototype completed"
              />

              <StatusRow
                label="Enrollment status"
                value="Awaiting production approval"
              />

              <StatusRow
                label="Participant identifier"
                value="Not generated"
              />

              <StatusRow
                label="Participant profile"
                value="Not created"
              />

              <StatusRow
                label="Programme assignment"
                value="Not assigned"
              />

              <StatusRow label="Secure login" value="Not available" />

              <StatusRow label="Database record" value="Not created" />

              <StatusRow label="Audit record" value="Not created" />
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
                What happens next
              </h2>

              <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                Production participants will move through the following
                institutional stages after approval.
              </p>
            </div>

            <div className="border border-black/20 bg-white/35">
              {nextSteps.map((step) => (
                <article
                  key={step.number}
                  className="grid gap-4 border-b border-black/10 p-6 last:border-b-0 sm:grid-cols-[60px_1fr] sm:p-8"
                >
                  <p className="text-xs font-semibold tracking-[0.2em] text-black/45">
                    {step.number}
                  </p>

                  <div>
                    <h3 className="font-serif text-2xl">{step.title}</h3>

                    <p className="mt-3 text-sm leading-7 text-black/60">
                      {step.description}
                    </p>
                  </div>
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
                Participant workspace
              </h2>

              <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                The participant dashboard will become the central location for
                programme activity after production enrollment.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Participant profile",
                "HFOS assessment",
                "Evidence submissions",
                "Programme tasks",
                "Follow-up schedule",
                "Secure messages",
                "Participant documents",
                "Progress and reports",
              ].map((item) => (
                <div
                  key={item}
                  className="border border-black/20 bg-white/35 p-6"
                >
                  <p className="font-serif text-xl">{item}</p>
                  <p className="mt-3 text-sm leading-6 text-black/55">
                    Available after secure production integration.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-black py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={isContinuing}
              className="inline-flex min-h-14 items-center justify-center border border-black px-7 text-sm font-semibold uppercase tracking-[0.14em] transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Return to Consent
            </button>

            <button
              type="button"
              onClick={handleContinue}
              disabled={isContinuing}
              className="inline-flex min-h-14 items-center justify-center bg-black px-8 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isContinuing
                ? "Preparing Workspace..."
                : "Go to Participant Dashboard"}
            </button>
          </div>

          <p className="mt-8 max-w-4xl text-xs leading-6 text-black/50">
            Production enrollment will create a unique participant identifier,
            authenticated profile, programme assignment, secure participant
            workspace, institutional records, and complete audit history.
          </p>
        </section>
      </div>
    </main>
  );
}