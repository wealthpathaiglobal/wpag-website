"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AcknowledgementKey =
  | "informationAccuracy"
  | "prototypeUnderstanding"
  | "evidenceRequirement"
  | "noFinancialAdvice"
  | "noDiagnosis";

type Acknowledgements = Record<AcknowledgementKey, boolean>;

const initialAcknowledgements: Acknowledgements = {
  informationAccuracy: false,
  prototypeUnderstanding: false,
  evidenceRequirement: false,
  noFinancialAdvice: false,
  noDiagnosis: false,
};

const assessmentModules = [
  {
    number: "01",
    title: "Financial Profile",
    route: "/participant/assessment/financial-profile",
  },
  {
    number: "02",
    title: "Cash Flow",
    route: "/participant/assessment/cash-flow",
  },
  {
    number: "03",
    title: "Debt & Obligations",
    route: "/participant/assessment/debt-obligations",
  },
  {
    number: "04",
    title: "Stability & Margin",
    route: "/participant/assessment/stability-margin",
  },
  {
    number: "05",
    title: "Protection & Risk",
    route: "/participant/assessment/protection-risk",
  },
  {
    number: "06",
    title: "Goals & Planning",
    route: "/participant/assessment/goals-planning",
  },
];

const acknowledgementOptions: Array<{
  key: AcknowledgementKey;
  label: string;
  description: string;
}> = [
  {
    key: "informationAccuracy",
    label:
      "I confirm that the information entered is accurate to the best of my knowledge.",
    description:
      "This confirmation reflects participant knowledge only and does not replace evidence verification.",
  },
  {
    key: "prototypeUnderstanding",
    label:
      "I understand that this assessment is a prototype demonstration.",
    description:
      "The current workflow demonstrates frontend structure and browser-only interaction.",
  },
  {
    key: "evidenceRequirement",
    label:
      "I understand that a production assessment requires evidence verification.",
    description:
      "Financial statements, identity records, obligations, policies, and supporting documents would require controlled review.",
  },
  {
    key: "noFinancialAdvice",
    label:
      "I understand that no financial, investment, legal, tax, or insurance advice has been provided.",
    description:
      "The prototype does not recommend products, transactions, investments, or financial decisions.",
  },
  {
    key: "noDiagnosis",
    label:
      "I understand that no HFOS diagnosis or treatment plan has been generated.",
    description:
      "A production diagnosis requires verified evidence, governed methodology, authorised review, and audit controls.",
  },
];

function SectionHeader({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/50">
        {number}
      </p>

      <h2 className="mt-4 font-serif text-3xl sm:text-4xl">{title}</h2>

      <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
        {description}
      </p>
    </div>
  );
}

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

function SummaryCard({
  label,
  value,
  dark = false,
}: {
  label: string;
  value: string;
  dark?: boolean;
}) {
  return (
    <article
      className={
        dark
          ? "border border-black bg-black p-6 text-white sm:p-8"
          : "border border-black/20 bg-white/40 p-6 sm:p-8"
      }
    >
      <p
        className={`text-xs font-semibold uppercase tracking-[0.2em] ${
          dark ? "text-white/50" : "text-black/45"
        }`}
      >
        {label}
      </p>

      <p className="mt-5 font-serif text-3xl leading-tight sm:text-4xl">
        {value}
      </p>
    </article>
  );
}

export default function ReviewSubmitPage() {
  const router = useRouter();

  const [acknowledgements, setAcknowledgements] =
    useState<Acknowledgements>(initialAcknowledgements);

  const [acknowledgementError, setAcknowledgementError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const acceptedAcknowledgementCount = useMemo(
    () => Object.values(acknowledgements).filter(Boolean).length,
    [acknowledgements],
  );

  const allAcknowledgementsAccepted =
    acceptedAcknowledgementCount === acknowledgementOptions.length;

  const completion = allAcknowledgementsAccepted ? 100 : 83;

  function toggleAcknowledgement(key: AcknowledgementKey) {
    setAcknowledgements((current) => ({
      ...current,
      [key]: !current[key],
    }));

    setAcknowledgementError("");
    setIsCompleted(false);
    setSuccessMessage("");
  }

  function validateAcknowledgements() {
    if (!allAcknowledgementsAccepted) {
      setAcknowledgementError(
        "Accept all required acknowledgements before completing the prototype assessment.",
      );

      return false;
    }

    setAcknowledgementError("");
    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateAcknowledgements()) {
      setSuccessMessage("");
      return;
    }

    setIsSubmitting(true);

    await new Promise((resolve) => {
      window.setTimeout(resolve, 800);
    });

    setIsSubmitting(false);
    setIsCompleted(true);

    setSuccessMessage(
      "Prototype assessment completed successfully. This prototype demonstrates the participant assessment workflow only. No financial records have been verified, no HFOS diagnosis has been generated, no treatment plan has been created, and no participant information has been stored. Production deployment will require secure authentication, evidence submission, document reconciliation, controlled institutional review, and audited backend services.",
    );
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
                Participant Portal · HFOS Assessment · Final Review
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
              Review and submit
            </p>

            <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Review the assessment before completing the prototype journey.
            </h1>

            <p className="mt-8 max-w-2xl text-base leading-8 text-black/65 sm:text-lg">
              This final step records participant acknowledgements and confirms
              completion of the frontend assessment workflow. It does not create
              a verified financial record or institutional HFOS assessment.
            </p>
          </div>

          <aside className="border border-black bg-black p-6 text-white sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
              Final prototype notice
            </p>

            <p className="mt-5 text-sm leading-7 text-white/80">
              Previous module information exists only within the temporary
              browser state of each page. This review page cannot retrieve,
              reconcile, verify, or permanently preserve information entered in
              earlier modules.
            </p>

            <p className="mt-4 text-sm leading-7 text-white/80">
              Production deployment requires secure authentication, persistent
              storage, evidence handling, controlled verification, audit logs,
              institutional review, and privacy governance.
            </p>
          </aside>
        </section>

        <form onSubmit={handleSubmit} noValidate>
          <section className="border-t border-black py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <SectionHeader
                number="01"
                title="Assessment summary"
                description="The six core assessment modules are presented below as part of the completed prototype journey."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                {assessmentModules.map((module) => (
                  <article
                    key={module.number}
                    className="border border-black/20 bg-white/40 p-6 sm:p-8"
                  >
                    <div className="flex items-start justify-between gap-5">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                          Module {module.number}
                        </p>

                        <h3 className="mt-4 font-serif text-2xl leading-tight">
                          {module.title}
                        </h3>
                      </div>

                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center border border-black bg-black text-sm text-white"
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                    </div>

                    <div className="mt-8 flex items-center justify-between gap-4 border-t border-black/10 pt-5">
                      <span className="text-sm text-black/55">
                        Prototype journey status
                      </span>

                      <span className="text-sm font-semibold">Completed</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => router.push(module.route)}
                      disabled={isSubmitting}
                      className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] underline underline-offset-4 disabled:opacity-50"
                    >
                      Review module
                    </button>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="border-t border-black py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <SectionHeader
                number="02"
                title="Prototype limitations"
                description="The current assessment demonstrates workflow and interface behaviour only."
              />

              <div className="border border-black/20 bg-white/40 p-6 sm:p-8 lg:p-10">
                <div className="space-y-0">
                  <StatusRow
                    label="Participant information"
                    value="Not independently verified"
                  />

                  <StatusRow
                    label="Identity verification"
                    value="Prototype interaction only"
                  />

                  <StatusRow
                    label="Financial evidence"
                    value="Not submitted or validated"
                  />

                  <StatusRow
                    label="Bank-statement reconciliation"
                    value="Not performed"
                  />

                  <StatusRow
                    label="Debt verification"
                    value="Not performed"
                  />

                  <StatusRow
                    label="Insurance-policy verification"
                    value="Not performed"
                  />

                  <StatusRow
                    label="Goal feasibility"
                    value="Not assessed"
                  />

                  <StatusRow
                    label="HFOS diagnosis"
                    value="Not generated"
                  />

                  <StatusRow
                    label="Financial recommendations"
                    value="Not generated"
                  />

                  <StatusRow
                    label="Treatment plan"
                    value="Not generated"
                  />

                  <StatusRow
                    label="Persistent participant record"
                    value="Not created"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-black py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <SectionHeader
                number="03"
                title="Participant acknowledgements"
                description="All acknowledgements are required before the prototype assessment can be completed."
              />

              <div>
                <div className="space-y-4">
                  {acknowledgementOptions.map((option) => {
                    const selected = acknowledgements[option.key];

                    return (
                      <label
                        key={option.key}
                        className={`grid cursor-pointer gap-5 border p-6 transition sm:grid-cols-[auto_1fr] sm:p-8 ${
                          selected
                            ? "border-black bg-black text-white"
                            : "border-black/20 bg-white/40 hover:border-black"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() =>
                            toggleAcknowledgement(option.key)
                          }
                          className="sr-only"
                        />

                        <span
                          className={`flex h-8 w-8 items-center justify-center border ${
                            selected
                              ? "border-white bg-white text-black"
                              : "border-black"
                          }`}
                        >
                          {selected ? "✓" : ""}
                        </span>

                        <span>
                          <span className="block font-serif text-xl leading-7 sm:text-2xl">
                            {option.label}
                          </span>

                          <span
                            className={`mt-3 block text-sm leading-7 ${
                              selected ? "text-white/65" : "text-black/55"
                            }`}
                          >
                            {option.description}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>

                {acknowledgementError && (
                  <p className="mt-5 text-sm leading-7 text-red-700" role="alert">
                    {acknowledgementError}
                  </p>
                )}

                <p className="mt-5 text-sm text-black/55">
                  {acceptedAcknowledgementCount} of{" "}
                  {acknowledgementOptions.length} acknowledgements accepted
                </p>
              </div>
            </div>
          </section>

          <section className="border-t border-black py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <SectionHeader
                number="04"
                title="Prototype assessment summary"
                description="These indicators describe workflow completion only and are not HFOS assessment outputs."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <SummaryCard
                  label="Assessment modules"
                  value="6 / 6 Completed"
                  dark
                />

                <SummaryCard
                  label="Prototype status"
                  value={isCompleted ? "Prototype Complete" : "Final Review"}
                />

                <SummaryCard
                  label="Verification status"
                  value="Pending"
                />

                <SummaryCard
                  label="Evidence status"
                  value="Not Submitted"
                />

                <SummaryCard
                  label="HFOS diagnosis"
                  value="Not Generated"
                />

                <SummaryCard
                  label="Treatment plan"
                  value="Not Generated"
                />
              </div>
            </div>
          </section>

          <section className="border-t border-black py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <SectionHeader
                number="05"
                title="Completion status"
                description="Completion confirms frontend workflow acknowledgement only. It does not establish an institutional assessment record."
              />

              <div>
                <div className="border border-black/25 p-6 sm:p-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                        Assessment completion
                      </p>

                      <p className="mt-4 font-serif text-5xl">
                        {completion}%
                      </p>
                    </div>

                    <p className="text-sm text-black/55">
                      {allAcknowledgementsAccepted
                        ? "All prototype requirements completed"
                        : "Participant acknowledgement pending"}
                    </p>
                  </div>

                  <div className="mt-7 h-2 w-full bg-black/10">
                    <div
                      className="h-full bg-black transition-all duration-300"
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 border border-black/25 px-6 sm:px-8">
                  <StatusRow
                    label="Assessment modules"
                    value="Completed"
                  />

                  <StatusRow
                    label="Participant review"
                    value="Completed"
                  />

                  <StatusRow
                    label="Prototype acknowledgement"
                    value={
                      allAcknowledgementsAccepted
                        ? "Completed"
                        : "Not completed"
                    }
                  />

                  <StatusRow
                    label="Identity verification"
                    value="Prototype only"
                  />

                  <StatusRow
                    label="Evidence verification"
                    value="Pending"
                  />

                  <StatusRow
                    label="Financial reconciliation"
                    value="Not performed"
                  />

                  <StatusRow
                    label="HFOS diagnosis"
                    value="Not generated"
                  />

                  <StatusRow
                    label="Treatment plan"
                    value="Not generated"
                  />

                  <StatusRow
                    label="Participant report"
                    value="Not generated"
                  />

                  <StatusRow
                    label="Database record"
                    value="Not created"
                  />
                </div>

                {successMessage && (
                  <div
                    className="mt-5 border border-black bg-black p-6 text-white sm:p-8"
                    role="status"
                  >
                    <p className="font-serif text-2xl">
                      Prototype assessment completed successfully.
                    </p>

                    <p className="mt-5 text-sm leading-7 text-white/75">
                      {successMessage}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="border-t border-black py-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <button
                type="button"
                onClick={() =>
                  router.push("/participant/assessment/goals-planning")
                }
                disabled={isSubmitting}
                className="inline-flex min-h-14 items-center justify-center border border-black px-7 text-sm font-semibold uppercase tracking-[0.14em] transition hover:bg-black hover:text-white disabled:opacity-50"
              >
                Return to Goals and Planning
              </button>

              <div className="flex flex-col gap-4 sm:flex-row">
                <button
                  type="submit"
                  disabled={isSubmitting || isCompleted}
                  className="inline-flex min-h-14 items-center justify-center border border-black px-7 text-sm font-semibold uppercase tracking-[0.14em] transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSubmitting
                    ? "Completing Assessment..."
                    : isCompleted
                      ? "Prototype Assessment Completed"
                      : "Complete Prototype Assessment"}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/participant/dashboard")}
                  disabled={!isCompleted || isSubmitting}
                  className="inline-flex min-h-14 items-center justify-center bg-black px-8 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>

            <p className="mt-8 max-w-5xl text-xs leading-6 text-black/50">
              Production submission must securely preserve participant
              information, maintain version history, validate evidence,
              reconcile financial records, record consent provenance, enforce
              role-based access, apply governed HFOS methodology, support
              authorised review, and retain a complete institutional audit
              trail. This frontend prototype performs none of those production
              functions.
            </p>
          </section>
        </form>
      </div>
    </main>
  );
}