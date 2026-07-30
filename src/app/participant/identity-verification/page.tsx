"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type VerificationMethod = "government-id" | "manual-review";

type DocumentType =
  | ""
  | "passport"
  | "national-id"
  | "driving-licence"
  | "other-government-id";

type FormValues = {
  fullName: string;
  dateOfBirth: string;
  country: string;
  documentType: DocumentType;
  documentNumber: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialFormValues: FormValues = {
  fullName: "",
  dateOfBirth: "",
  country: "",
  documentType: "",
  documentNumber: "",
};

const documentOptions: Array<{
  value: Exclude<DocumentType, "">;
  label: string;
}> = [
  {
    value: "passport",
    label: "Passport",
  },
  {
    value: "national-id",
    label: "National identity card",
  },
  {
    value: "driving-licence",
    label: "Driving licence",
  },
  {
    value: "other-government-id",
    label: "Other government-issued identification",
  },
];

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-2 text-sm leading-6 text-red-700" role="alert">
      {message}
    </p>
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
      <span className="text-sm font-medium leading-6 text-black">{value}</span>
    </div>
  );
}

export default function IdentityVerificationPage() {
  const router = useRouter();

  const [verificationMethod, setVerificationMethod] =
    useState<VerificationMethod>("government-id");

  const [formValues, setFormValues] =
    useState<FormValues>(initialFormValues);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);

  const selectedMethodLabel = useMemo(() => {
    if (verificationMethod === "manual-review") {
      return "Manual research verification";
    }

    return "Government-issued identification";
  }, [verificationMethod]);

  function updateField<K extends keyof FormValues>(
    field: K,
    value: FormValues[K],
  ) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((current) => ({
        ...current,
        [field]: undefined,
      }));
    }

    if (hasValidated) {
      setHasValidated(false);
    }
  }

  function validateForm() {
    const nextErrors: FormErrors = {};

    if (!formValues.fullName.trim()) {
      nextErrors.fullName = "Enter the participant's full legal name.";
    } else if (formValues.fullName.trim().length < 2) {
      nextErrors.fullName = "Enter a valid full legal name.";
    }

    if (!formValues.dateOfBirth) {
      nextErrors.dateOfBirth = "Enter the participant's date of birth.";
    } else {
      const selectedDate = new Date(`${formValues.dateOfBirth}T00:00:00`);
      const currentDate = new Date();

      if (Number.isNaN(selectedDate.getTime())) {
        nextErrors.dateOfBirth = "Enter a valid date of birth.";
      } else if (selectedDate > currentDate) {
        nextErrors.dateOfBirth =
          "The date of birth cannot be in the future.";
      }
    }

    if (!formValues.country.trim()) {
      nextErrors.country = "Enter the participant's country or territory.";
    }

    if (!formValues.documentType) {
      nextErrors.documentType = "Select an identity document type.";
    }

    if (!formValues.documentNumber.trim()) {
      nextErrors.documentNumber =
        "Enter the identity document reference number.";
    } else if (formValues.documentNumber.trim().length < 4) {
      nextErrors.documentNumber =
        "Enter a valid identity document reference number.";
    }

    setErrors(nextErrors);
    setHasValidated(Object.keys(nextErrors).length === 0);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    await new Promise((resolve) => {
      window.setTimeout(resolve, 700);
    });

    router.push("/participant/consent");
  }

  function handleBack() {
    router.push("/participant/verify-contact");
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
                Participant Journey · Step 6
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
              Identity verification
            </p>

            <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Verify your identity.
            </h1>

            <p className="mt-8 max-w-2xl text-base leading-8 text-black/65 sm:text-lg">
              Identity verification helps protect participants, maintain
              research integrity, and ensure that enrolment is completed by
              the correct individual.
            </p>
          </div>

          <aside className="border border-black bg-black p-6 text-white sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
              Prototype notice
            </p>

            <p className="mt-5 text-sm leading-7 text-white/80">
              This prototype does not perform production identity
              verification. No documents are uploaded, stored, scanned, or
              validated. No biometric processing takes place.
            </p>

            <p className="mt-4 text-sm leading-7 text-white/80">
              Production verification will require approved identity
              providers, privacy controls, encryption, audit logging, and
              jurisdiction-specific compliance.
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
                  Verification method
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  Select the method intended for the participant identity
                  review.
                </p>
              </div>

              <div className="grid gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setVerificationMethod("government-id")
                  }
                  aria-pressed={
                    verificationMethod === "government-id"
                  }
                  className={`group w-full border p-6 text-left transition sm:p-8 ${
                    verificationMethod === "government-id"
                      ? "border-black bg-black text-white"
                      : "border-black/25 bg-transparent text-black hover:border-black"
                  }`}
                >
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-60">
                        Primary method
                      </p>

                      <h3 className="mt-4 font-serif text-2xl">
                        Government-issued identification
                      </h3>

                      <p
                        className={`mt-4 max-w-xl text-sm leading-7 ${
                          verificationMethod === "government-id"
                            ? "text-white/70"
                            : "text-black/60"
                        }`}
                      >
                        Passport, national identity card, driving licence,
                        or another accepted government-issued document.
                      </p>
                    </div>

                    <span
                      className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        verificationMethod === "government-id"
                          ? "border-white"
                          : "border-black"
                      }`}
                    >
                      {verificationMethod === "government-id" && (
                        <span className="h-2.5 w-2.5 rounded-full bg-white" />
                      )}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setVerificationMethod("manual-review")
                  }
                  aria-pressed={
                    verificationMethod === "manual-review"
                  }
                  className={`group w-full border p-6 text-left transition sm:p-8 ${
                    verificationMethod === "manual-review"
                      ? "border-black bg-black text-white"
                      : "border-black/25 bg-transparent text-black hover:border-black"
                  }`}
                >
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-60">
                        Alternative method
                      </p>

                      <h3 className="mt-4 font-serif text-2xl">
                        Manual research verification
                      </h3>

                      <p
                        className={`mt-4 max-w-xl text-sm leading-7 ${
                          verificationMethod === "manual-review"
                            ? "text-white/70"
                            : "text-black/60"
                        }`}
                      >
                        Intended for programme-specific administrative
                        review where manual institutional verification is
                        required.
                      </p>
                    </div>

                    <span
                      className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        verificationMethod === "manual-review"
                          ? "border-white"
                          : "border-black"
                      }`}
                    >
                      {verificationMethod === "manual-review" && (
                        <span className="h-2.5 w-2.5 rounded-full bg-white" />
                      )}
                    </span>
                  </div>
                </button>
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
                  Identity information
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  Enter prototype identity references. These values are not
                  uploaded, stored, or verified by this page.
                </p>
              </div>

              <div className="border border-black/20 bg-white/45 p-6 sm:p-8 lg:p-10">
                <div className="grid gap-7">
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-sm font-medium text-black"
                    >
                      Full legal name
                    </label>

                    <p className="mt-1 text-xs leading-5 text-black/50">
                      Enter the name as it appears on the identity document.
                    </p>

                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      value={formValues.fullName}
                      onChange={(event) =>
                        updateField("fullName", event.target.value)
                      }
                      aria-invalid={Boolean(errors.fullName)}
                      aria-describedby={
                        errors.fullName ? "fullName-error" : undefined
                      }
                      className="mt-3 w-full border border-black/30 bg-transparent px-4 py-4 text-base outline-none transition placeholder:text-black/30 focus:border-black"
                      placeholder="Enter full legal name"
                    />

                    <div id="fullName-error">
                      <FieldError message={errors.fullName} />
                    </div>
                  </div>

                  <div className="grid gap-7 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="dateOfBirth"
                        className="block text-sm font-medium text-black"
                      >
                        Date of birth
                      </label>

                      <input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        autoComplete="bday"
                        value={formValues.dateOfBirth}
                        onChange={(event) =>
                          updateField(
                            "dateOfBirth",
                            event.target.value,
                          )
                        }
                        aria-invalid={Boolean(errors.dateOfBirth)}
                        className="mt-3 w-full border border-black/30 bg-transparent px-4 py-4 text-base outline-none transition focus:border-black"
                      />

                      <FieldError message={errors.dateOfBirth} />
                    </div>

                    <div>
                      <label
                        htmlFor="country"
                        className="block text-sm font-medium text-black"
                      >
                        Country or territory
                      </label>

                      <input
                        id="country"
                        name="country"
                        type="text"
                        autoComplete="country-name"
                        value={formValues.country}
                        onChange={(event) =>
                          updateField("country", event.target.value)
                        }
                        aria-invalid={Boolean(errors.country)}
                        className="mt-3 w-full border border-black/30 bg-transparent px-4 py-4 text-base outline-none transition placeholder:text-black/30 focus:border-black"
                        placeholder="Enter country or territory"
                      />

                      <FieldError message={errors.country} />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="documentType"
                      className="block text-sm font-medium text-black"
                    >
                      Identity document type
                    </label>

                    <select
                      id="documentType"
                      name="documentType"
                      value={formValues.documentType}
                      onChange={(event) =>
                        updateField(
                          "documentType",
                          event.target.value as DocumentType,
                        )
                      }
                      aria-invalid={Boolean(errors.documentType)}
                      className="mt-3 w-full appearance-none border border-black/30 bg-transparent px-4 py-4 text-base outline-none transition focus:border-black"
                    >
                      <option value="">Select document type</option>

                      {documentOptions.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <FieldError message={errors.documentType} />
                  </div>

                  <div>
                    <label
                      htmlFor="documentNumber"
                      className="block text-sm font-medium text-black"
                    >
                      Document reference number
                    </label>

                    <p className="mt-1 text-xs leading-5 text-black/50">
                      Prototype input only. Do not use a real sensitive
                      document number during testing.
                    </p>

                    <input
                      id="documentNumber"
                      name="documentNumber"
                      type="text"
                      value={formValues.documentNumber}
                      onChange={(event) =>
                        updateField(
                          "documentNumber",
                          event.target.value,
                        )
                      }
                      aria-invalid={Boolean(errors.documentNumber)}
                      className="mt-3 w-full border border-black/30 bg-transparent px-4 py-4 text-base uppercase outline-none transition placeholder:normal-case placeholder:text-black/30 focus:border-black"
                      placeholder="Enter prototype reference"
                    />

                    <FieldError message={errors.documentNumber} />
                  </div>
                </div>
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
                  Prototype status
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  This status reflects the current demonstration environment,
                  not a production identity decision.
                </p>
              </div>

              <div className="border border-black/25 px-6 sm:px-8">
                <StatusRow
                  label="Verification method"
                  value={selectedMethodLabel}
                />

                <StatusRow
                  label="Identity information entered"
                  value={
                    hasValidated
                      ? "Prototype fields completed"
                      : "Awaiting completion"
                  }
                />

                <StatusRow
                  label="Document uploaded"
                  value="No"
                />

                <StatusRow
                  label="Identity verified"
                  value="Not performed"
                />

                <StatusRow
                  label="Biometric processing"
                  value="Not performed"
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
                Return to Contact Verification
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-14 items-center justify-center bg-black px-8 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "Validating Identity..."
                  : "Continue to Consent"}
              </button>
            </div>

            <p className="mt-8 max-w-4xl text-xs leading-6 text-black/50">
              Production identity verification will be enabled only after
              approved authentication services, encrypted data handling,
              privacy governance, jurisdictional compliance, and
              institutional audit controls have been connected.
            </p>
          </section>
        </form>
      </div>
    </main>
  );
}