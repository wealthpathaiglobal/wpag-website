"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ConsentKey =
  | "participantInformation"
  | "programmePurpose"
  | "voluntaryParticipation"
  | "dataProcessing"
  | "programmeParticipation";

type ConsentState = Record<ConsentKey, boolean>;

const initialConsentState: ConsentState = {
  participantInformation: false,
  programmePurpose: false,
  voluntaryParticipation: false,
  dataProcessing: false,
  programmeParticipation: false,
};

const consentStatements: Array<{
  key: ConsentKey;
  title: string;
  description: string;
}> = [
  {
    key: "participantInformation",
    title: "Participant information reviewed",
    description:
      "I confirm that I have read and understood the participant information presented during this onboarding journey.",
  },
  {
    key: "programmePurpose",
    title: "Programme purpose understood",
    description:
      "I understand the purpose of the Wealth Path AI Global research programme and the intended participant journey.",
  },
  {
    key: "voluntaryParticipation",
    title: "Voluntary participation understood",
    description:
      "I understand that participation is voluntary and that I may ask questions before deciding whether to continue.",
  },
  {
    key: "dataProcessing",
    title: "Information processing understood",
    description:
      "I understand that production participation may involve the controlled processing of personal, research, and programme information.",
  },
  {
    key: "programmeParticipation",
    title: "Consent to participate",
    description:
      "I agree to continue with the prototype participant enrolment process.",
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
      <span className="text-sm font-medium leading-6 text-black">{value}</span>
    </div>
  );
}

export default function ConsentPage() {
  const router = useRouter();

  const [consents, setConsents] =
    useState<ConsentState>(initialConsentState);

  const [validationMessage, setValidationMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const completedConsentCount = useMemo(
    () => Object.values(consents).filter(Boolean).length,
    [consents],
  );

  const allConsentsAccepted =
    completedConsentCount === consentStatements.length;

  function updateConsent(key: ConsentKey) {
    setConsents((current) => ({
      ...current,
      [key]: !current[key],
    }));

    if (validationMessage) {
      setValidationMessage("");
    }
  }

  function handleSelectAll() {
    const nextValue = !allConsentsAccepted;

    setConsents({
      participantInformation: nextValue,
      programmePurpose: nextValue,
      voluntaryParticipation: nextValue,
      dataProcessing: nextValue,
      programmeParticipation: nextValue,
    });

    if (validationMessage) {
      setValidationMessage("");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!allConsentsAccepted) {
      setValidationMessage(
        "Review and accept every required consent statement before continuing.",
      );

      return;
    }

    setIsSubmitting(true);

    await new Promise((resolve) => {
      window.setTimeout(resolve, 700);
    });

    router.push("/participant/enrollment-confirmation");
  }

  function handleBack() {
    router.push("/participant/identity-verification");
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
                Participant Journey · Step 7
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
              Informed consent
            </p>

            <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Understand before you agree.
            </h1>

            <p className="mt-8 max-w-2xl text-base leading-8 text-black/65 sm:text-lg">
              Participation is voluntary. Before continuing, review the
              programme purpose, participant rights, privacy expectations,
              and the limitations of this prototype environment.
            </p>
          </div>

          <aside className="border border-black bg-black p-6 text-white sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
              Prototype notice
            </p>

            <p className="mt-5 text-sm leading-7 text-white/80">
              This page demonstrates the intended consent workflow only.
              No production consent record, legal signature, timestamp,
              participant identity link, or audit record is created.
            </p>

            <p className="mt-4 text-sm leading-7 text-white/80">
              Production consent will require version-controlled documents,
              authenticated participants, secure recordkeeping, legal review,
              and jurisdiction-specific governance.
            </p>
          </aside>
        </section>

        <form onSubmit={handleSubmit} noValidate>
          <section className="border-t border-black py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/50">
                  01
                </p>

                <h2 className="mt-4 font-serif text-3xl tracking-[-0.025em] sm:text-4xl">
                  Before you continue
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  These principles apply to participant consent and should be
                  understood before any production enrolment takes place.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    title: "Voluntary participation",
                    text: "Participation should be based on an informed and voluntary decision.",
                  },
                  {
                    title: "Right to ask questions",
                    text: "Participants may request clarification before agreeing to continue.",
                  },
                  {
                    title: "Privacy protection",
                    text: "Production information must be handled under approved privacy controls.",
                  },
                  {
                    title: "Withdrawal rights",
                    text: "Withdrawal will be governed by programme, legal, and record-retention requirements.",
                  },
                  {
                    title: "No guaranteed outcome",
                    text: "Participation does not guarantee a financial, research, or programme result.",
                  },
                  {
                    title: "No professional advice",
                    text: "Research participation does not replace financial, legal, medical, or tax advice.",
                  },
                ].map((item) => (
                  <article
                    key={item.title}
                    className="border border-black/20 bg-white/35 p-6 sm:p-7"
                  >
                    <h3 className="font-serif text-2xl tracking-[-0.02em]">
                      {item.title}
                    </h3>

                    <p className="mt-4 text-sm leading-7 text-black/60">
                      {item.text}
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
                  02
                </p>

                <h2 className="mt-4 font-serif text-3xl tracking-[-0.025em] sm:text-4xl">
                  Participant rights
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  The production programme must provide clear participant
                  protections throughout enrolment, research activity, and
                  follow-up.
                </p>
              </div>

              <div className="border border-black/20 bg-white/40">
                {[
                  {
                    number: "01",
                    title: "Privacy",
                    text: "Personal and programme information must be protected using approved institutional controls.",
                  },
                  {
                    number: "02",
                    title: "Transparency",
                    text: "Programme objectives, participant responsibilities, and information use must be explained clearly.",
                  },
                  {
                    number: "03",
                    title: "Withdrawal",
                    text: "Participants may request withdrawal subject to applicable programme and legal obligations.",
                  },
                  {
                    number: "04",
                    title: "Questions and support",
                    text: "Participants should be able to contact WPAG before and during their programme participation.",
                  },
                ].map((item) => (
                  <article
                    key={item.number}
                    className="grid gap-4 border-b border-black/10 p-6 last:border-b-0 sm:grid-cols-[60px_1fr] sm:p-8"
                  >
                    <p className="text-xs font-semibold tracking-[0.2em] text-black/45">
                      {item.number}
                    </p>

                    <div>
                      <h3 className="font-serif text-2xl">
                        {item.title}
                      </h3>

                      <p className="mt-3 text-sm leading-7 text-black/60">
                        {item.text}
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
                  03
                </p>

                <h2 className="mt-4 font-serif text-3xl tracking-[-0.025em] sm:text-4xl">
                  Consent statements
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  Every statement is required before the participant may
                  continue to the enrolment confirmation stage.
                </p>

                <p className="mt-6 text-sm font-medium text-black">
                  {completedConsentCount} of {consentStatements.length} accepted
                </p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="mb-4 inline-flex min-h-12 items-center justify-center border border-black px-5 text-xs font-semibold uppercase tracking-[0.14em] transition hover:bg-black hover:text-white"
                >
                  {allConsentsAccepted
                    ? "Clear all statements"
                    : "Accept all statements"}
                </button>

                <div className="grid gap-4">
                  {consentStatements.map((statement, index) => {
                    const isChecked = consents[statement.key];

                    return (
                      <label
                        key={statement.key}
                        className={`grid cursor-pointer gap-5 border p-6 transition sm:grid-cols-[auto_1fr] sm:p-8 ${
                          isChecked
                            ? "border-black bg-black text-white"
                            : "border-black/25 bg-transparent text-black hover:border-black"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() =>
                            updateConsent(statement.key)
                          }
                          className="sr-only"
                        />

                        <span
                          aria-hidden="true"
                          className={`mt-1 flex h-7 w-7 items-center justify-center border ${
                            isChecked
                              ? "border-white bg-white text-black"
                              : "border-black"
                          }`}
                        >
                          {isChecked ? "✓" : ""}
                        </span>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-55">
                            Statement {String(index + 1).padStart(2, "0")}
                          </p>

                          <h3 className="mt-3 font-serif text-2xl">
                            {statement.title}
                          </h3>

                          <p
                            className={`mt-3 text-sm leading-7 ${
                              isChecked
                                ? "text-white/70"
                                : "text-black/60"
                            }`}
                          >
                            {statement.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {validationMessage && (
                  <div
                    className="mt-5 border border-red-700 bg-red-50 p-5 text-sm leading-7 text-red-800"
                    role="alert"
                  >
                    {validationMessage}
                  </div>
                )}
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
                  Prototype consent status
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  This status reflects interface completion only. It is not a
                  legally binding or production consent record.
                </p>
              </div>

              <div className="border border-black/25 px-6 sm:px-8">
                <StatusRow
                  label="Required statements accepted"
                  value={`${completedConsentCount} of ${consentStatements.length}`}
                />

                <StatusRow
                  label="Consent completion"
                  value={
                    allConsentsAccepted
                      ? "Prototype requirements completed"
                      : "Awaiting participant acceptance"
                  }
                />

                <StatusRow
                  label="Consent document version"
                  value="Prototype draft v1.0"
                />

                <StatusRow
                  label="Participant identity linked"
                  value="No"
                />

                <StatusRow
                  label="Digital signature"
                  value="Not collected"
                />

                <StatusRow
                  label="Acceptance timestamp"
                  value="Not recorded"
                />

                <StatusRow
                  label="Database record"
                  value="Not created"
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
                onClick={handleBack}
                disabled={isSubmitting}
                className="inline-flex min-h-14 items-center justify-center border border-black px-7 text-sm font-semibold uppercase tracking-[0.14em] transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Return to Identity Verification
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-14 items-center justify-center bg-black px-8 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "Recording Consent..."
                  : "Agree and Continue"}
              </button>
            </div>

            <p className="mt-8 max-w-4xl text-xs leading-6 text-black/50">
              Production consent records will require participant
              authentication, consent-version control, acceptance timestamps,
              jurisdictional notices, secure storage, withdrawal history, and
              complete institutional audit controls.
            </p>
          </section>
        </form>
      </div>
    </main>
  );
}