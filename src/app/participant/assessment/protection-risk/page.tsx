"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ProtectionKey =
  | "lifeInsurance"
  | "healthInsurance"
  | "disabilityInsurance"
  | "criticalIllness"
  | "propertyInsurance"
  | "vehicleInsurance"
  | "businessInsurance"
  | "otherProtection"
  | "noProtection";

type GapKey =
  | "noHealthInsurance"
  | "noLifeInsurance"
  | "noEmergencyReserve"
  | "highDebtExposure"
  | "noIncomeBackup"
  | "noSuccessionPlanning"
  | "unknownCoverage"
  | "noMajorGap";

type ProtectionSelections = Record<ProtectionKey, boolean>;
type GapSelections = Record<GapKey, boolean>;

type ProtectionForm = {
  currency: string;

  lifeCoverAmount: string;
  healthCoverAmount: string;
  emergencyMedicalReserve: string;
  dependentsCovered: string;
  policyReviewDate: string;
  premiumAffordability: string;

  singleIncomeDependency: string;
  medicalRisk: string;
  employmentRisk: string;
  businessRisk: string;
  debtRisk: string;
  housingRisk: string;
  legalRisk: string;
  disasterPreparedness: string;

  emergencyContactReadiness: string;
  financialDocumentOrganisation: string;
  digitalAccessPlanning: string;
  nomineeStatus: string;
  estatePlanning: string;
  householdContinuityPlanning: string;

  participantReview: string;
};

type FormErrors = Partial<Record<keyof ProtectionForm, string>>;

const initialProtectionSelections: ProtectionSelections = {
  lifeInsurance: false,
  healthInsurance: false,
  disabilityInsurance: false,
  criticalIllness: false,
  propertyInsurance: false,
  vehicleInsurance: false,
  businessInsurance: false,
  otherProtection: false,
  noProtection: false,
};

const initialGapSelections: GapSelections = {
  noHealthInsurance: false,
  noLifeInsurance: false,
  noEmergencyReserve: false,
  highDebtExposure: false,
  noIncomeBackup: false,
  noSuccessionPlanning: false,
  unknownCoverage: false,
  noMajorGap: false,
};

const initialForm: ProtectionForm = {
  currency: "INR",

  lifeCoverAmount: "0",
  healthCoverAmount: "0",
  emergencyMedicalReserve: "0",
  dependentsCovered: "0",
  policyReviewDate: "",
  premiumAffordability: "",

  singleIncomeDependency: "",
  medicalRisk: "",
  employmentRisk: "",
  businessRisk: "",
  debtRisk: "",
  housingRisk: "",
  legalRisk: "",
  disasterPreparedness: "",

  emergencyContactReadiness: "",
  financialDocumentOrganisation: "",
  digitalAccessPlanning: "",
  nomineeStatus: "",
  estatePlanning: "",
  householdContinuityPlanning: "",

  participantReview: "",
};

const protectionOptions: Array<{
  key: ProtectionKey;
  label: string;
}> = [
  { key: "lifeInsurance", label: "Life insurance" },
  { key: "healthInsurance", label: "Health insurance" },
  { key: "disabilityInsurance", label: "Disability insurance" },
  { key: "criticalIllness", label: "Critical illness cover" },
  { key: "propertyInsurance", label: "Property insurance" },
  { key: "vehicleInsurance", label: "Vehicle insurance" },
  { key: "businessInsurance", label: "Business insurance" },
  { key: "otherProtection", label: "Other protection" },
  { key: "noProtection", label: "No protection reported" },
];

const gapOptions: Array<{
  key: GapKey;
  label: string;
}> = [
  { key: "noHealthInsurance", label: "No health insurance" },
  { key: "noLifeInsurance", label: "No life insurance" },
  { key: "noEmergencyReserve", label: "No emergency reserve" },
  { key: "highDebtExposure", label: "High debt exposure" },
  { key: "noIncomeBackup", label: "No income backup" },
  { key: "noSuccessionPlanning", label: "No succession planning" },
  { key: "unknownCoverage", label: "Coverage details unknown" },
  { key: "noMajorGap", label: "No major protection gap reported" },
];

const requiredFields: Array<keyof ProtectionForm> = [
  "currency",
  "policyReviewDate",
  "premiumAffordability",
  "singleIncomeDependency",
  "medicalRisk",
  "employmentRisk",
  "businessRisk",
  "debtRisk",
  "housingRisk",
  "legalRisk",
  "disasterPreparedness",
  "emergencyContactReadiness",
  "financialDocumentOrganisation",
  "digitalAccessPlanning",
  "nomineeStatus",
  "estatePlanning",
  "householdContinuityPlanning",
  "participantReview",
];

const standardRiskOptions = [
  { value: "", label: "Select condition" },
  { value: "none", label: "No material risk reported" },
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
  { value: "unknown", label: "Unknown" },
];

const readinessOptions = [
  { value: "", label: "Select condition" },
  { value: "complete", label: "Complete and current" },
  { value: "mostly-complete", label: "Mostly complete" },
  { value: "partial", label: "Partial" },
  { value: "not-ready", label: "Not ready" },
  { value: "unknown", label: "Unknown" },
];

function parseAmount(value: string) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 0) {
    return 0;
  }

  return amount;
}

function formatAmount(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return value.toLocaleString();
  }
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p className="mt-2 text-sm leading-6 text-red-700" role="alert">
      {message}
    </p>
  );
}

function NumberField({
  id,
  label,
  value,
  error,
  onChange,
}: {
  id: keyof ProtectionForm;
  label: string;
  value: string;
  error?: string;
  onChange: (field: keyof ProtectionForm, value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-black">
        {label}
      </label>

      <input
        id={id}
        type="number"
        min="0"
        value={value}
        onChange={(event) => onChange(id, event.target.value)}
        aria-invalid={Boolean(error)}
        className="mt-3 w-full border border-black/30 bg-transparent px-4 py-4 text-base outline-none transition focus:border-black"
      />

      <FieldError message={error} />
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  options,
  error,
  onChange,
}: {
  id: keyof ProtectionForm;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
  onChange: (field: keyof ProtectionForm, value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-black">
        {label}
      </label>

      <select
        id={id}
        value={value}
        onChange={(event) => onChange(id, event.target.value)}
        aria-invalid={Boolean(error)}
        className="mt-3 w-full border border-black/30 bg-transparent px-4 py-4 text-base outline-none transition focus:border-black"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <FieldError message={error} />
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

export default function ProtectionRiskPage() {
  const router = useRouter();

  const [form, setForm] = useState<ProtectionForm>(initialForm);
  const [protections, setProtections] =
    useState<ProtectionSelections>(initialProtectionSelections);
  const [gaps, setGaps] =
    useState<GapSelections>(initialGapSelections);

  const [errors, setErrors] = useState<FormErrors>({});
  const [protectionError, setProtectionError] = useState("");
  const [gapError, setGapError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const selectedProtectionCount = Object.entries(protections).filter(
    ([key, selected]) => key !== "noProtection" && selected,
  ).length;

  const selectedGapCount = Object.entries(gaps).filter(
    ([key, selected]) => key !== "noMajorGap" && selected,
  ).length;

  const insuranceProtectionComplete =
    protections.noProtection || selectedProtectionCount > 0;

  const coverageSummaryComplete = useMemo(
    () =>
      [
        form.lifeCoverAmount,
        form.healthCoverAmount,
        form.emergencyMedicalReserve,
        form.dependentsCovered,
        form.policyReviewDate,
        form.premiumAffordability,
      ].every((value) => value.trim() !== ""),
    [form],
  );

  const householdRisksComplete = Boolean(
    form.singleIncomeDependency &&
      form.medicalRisk &&
      form.employmentRisk &&
      form.businessRisk &&
      form.debtRisk &&
      form.housingRisk &&
      form.legalRisk &&
      form.disasterPreparedness,
  );

  const protectionGapsComplete =
    gaps.noMajorGap || selectedGapCount > 0;

  const recoveryPreparednessComplete = Boolean(
    form.emergencyContactReadiness &&
      form.financialDocumentOrganisation &&
      form.digitalAccessPlanning &&
      form.nomineeStatus &&
      form.estatePlanning &&
      form.householdContinuityPlanning,
  );

  const participantReviewComplete = Boolean(form.participantReview);

  const completedSections = [
    insuranceProtectionComplete,
    coverageSummaryComplete,
    householdRisksComplete,
    protectionGapsComplete,
    recoveryPreparednessComplete,
    participantReviewComplete,
  ].filter(Boolean).length;

  const completion = Math.round((completedSections / 6) * 100);

  const totalReportedCover =
    parseAmount(form.lifeCoverAmount) +
    parseAmount(form.healthCoverAmount) +
    parseAmount(form.emergencyMedicalReserve);

  const insuranceCategoryCount = [
    protections.lifeInsurance,
    protections.healthInsurance,
    protections.disabilityInsurance,
    protections.criticalIllness,
    protections.propertyInsurance,
    protections.vehicleInsurance,
    protections.businessInsurance,
  ].filter(Boolean).length;

  const preparednessCompletedCount = [
    form.emergencyContactReadiness,
    form.financialDocumentOrganisation,
    form.digitalAccessPlanning,
    form.nomineeStatus,
    form.estatePlanning,
    form.householdContinuityPlanning,
  ].filter(Boolean).length;

  function updateField(field: keyof ProtectionForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((current) => ({
        ...current,
        [field]: undefined,
      }));
    }

    setIsCompleted(false);
    setSuccessMessage("");
  }

  function toggleProtection(key: ProtectionKey) {
    setProtections((current) => {
      if (key === "noProtection") {
        return {
          ...initialProtectionSelections,
          noProtection: !current.noProtection,
        };
      }

      return {
        ...current,
        [key]: !current[key],
        noProtection: false,
      };
    });

    setProtectionError("");
    setIsCompleted(false);
    setSuccessMessage("");
  }

  function toggleGap(key: GapKey) {
    setGaps((current) => {
      if (key === "noMajorGap") {
        return {
          ...initialGapSelections,
          noMajorGap: !current.noMajorGap,
        };
      }

      return {
        ...current,
        [key]: !current[key],
        noMajorGap: false,
      };
    });

    setGapError("");
    setIsCompleted(false);
    setSuccessMessage("");
  }

  function validateForm() {
    const nextErrors: FormErrors = {};

    for (const field of requiredFields) {
      if (!form[field].trim()) {
        nextErrors[field] = "Complete this required field.";
      }
    }

    const numericFields: Array<keyof ProtectionForm> = [
      "lifeCoverAmount",
      "healthCoverAmount",
      "emergencyMedicalReserve",
      "dependentsCovered",
    ];

    for (const field of numericFields) {
      if (form[field].trim() && Number(form[field]) < 0) {
        nextErrors[field] = "Enter zero or a positive value.";
      }
    }

    if (!insuranceProtectionComplete) {
      setProtectionError(
        "Select at least one protection category or choose no protection reported.",
      );
    } else {
      setProtectionError("");
    }

    if (!protectionGapsComplete) {
      setGapError(
        "Select at least one reported protection gap or choose no major protection gap reported.",
      );
    } else {
      setGapError("");
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors).length === 0 &&
      insuranceProtectionComplete &&
      coverageSummaryComplete &&
      householdRisksComplete &&
      protectionGapsComplete &&
      recoveryPreparednessComplete &&
      participantReviewComplete
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) {
      setSuccessMessage("");
      return;
    }

    setIsSubmitting(true);

    await new Promise((resolve) => {
      window.setTimeout(resolve, 700);
    });

    setIsSubmitting(false);
    setIsCompleted(true);
    setSuccessMessage(
      "Prototype protection and risk module completed for this browser session. No insurance policy, nominee record, estate arrangement, protection adequacy, or risk classification has been verified, stored, or generated.",
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
                Participant Portal · HFOS Assessment · Module 05
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
              Protection and risk
            </p>

            <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Identify what protects continuity when disruption occurs.
            </h1>

            <p className="mt-8 max-w-2xl text-base leading-8 text-black/65 sm:text-lg">
              This module records participant-reported insurance protection,
              household exposure, protection gaps, recovery readiness, nominee
              arrangements, and continuity planning.
            </p>
          </div>

          <aside className="border border-black bg-black p-6 text-white sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
              Prototype notice
            </p>

            <p className="mt-5 text-sm leading-7 text-white/80">
              This page does not verify insurance policies, coverage limits,
              exclusions, premium status, nominees, legal documents, or estate
              arrangements.
            </p>

            <p className="mt-4 text-sm leading-7 text-white/80">
              Production protection review will require original policy
              documents, insurer confirmation, beneficiary validation, legal
              review, controlled adequacy methodology, and institutional
              oversight.
            </p>
          </aside>
        </section>

        <form onSubmit={handleSubmit} noValidate>
          <section className="border-t border-black py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <SectionHeader
                number="01"
                title="Insurance protection"
                description="Select every protection category currently reported by the participant."
              />

              <div>
                <div className="mb-6 max-w-sm">
                  <SelectField
                    id="currency"
                    label="Reporting currency"
                    value={form.currency}
                    error={errors.currency}
                    onChange={updateField}
                    options={[
                      { value: "INR", label: "Indian Rupee — INR" },
                      { value: "USD", label: "US Dollar — USD" },
                      { value: "GBP", label: "British Pound — GBP" },
                      { value: "EUR", label: "Euro — EUR" },
                      { value: "AED", label: "UAE Dirham — AED" },
                    ]}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {protectionOptions.map((option) => {
                    const selected = protections[option.key];

                    return (
                      <label
                        key={option.key}
                        className={`grid cursor-pointer gap-4 border p-6 transition sm:grid-cols-[auto_1fr] ${
                          selected
                            ? "border-black bg-black text-white"
                            : "border-black/20 bg-white/35 hover:border-black"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleProtection(option.key)}
                          className="sr-only"
                        />

                        <span
                          className={`flex h-7 w-7 items-center justify-center border ${
                            selected
                              ? "border-white bg-white text-black"
                              : "border-black"
                          }`}
                        >
                          {selected ? "✓" : ""}
                        </span>

                        <span className="font-serif text-xl leading-7">
                          {option.label}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {protectionError && (
                  <p className="mt-4 text-sm text-red-700" role="alert">
                    {protectionError}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="border-t border-black py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <SectionHeader
                number="02"
                title="Coverage summary"
                description="Record participant-reported coverage values and basic policy-maintenance information."
              />

              <div className="border border-black/20 bg-white/40 p-6 sm:p-8 lg:p-10">
                <div className="grid gap-7 sm:grid-cols-2">
                  <NumberField
                    id="lifeCoverAmount"
                    label="Reported life cover amount"
                    value={form.lifeCoverAmount}
                    error={errors.lifeCoverAmount}
                    onChange={updateField}
                  />

                  <NumberField
                    id="healthCoverAmount"
                    label="Reported health cover amount"
                    value={form.healthCoverAmount}
                    error={errors.healthCoverAmount}
                    onChange={updateField}
                  />

                  <NumberField
                    id="emergencyMedicalReserve"
                    label="Emergency medical reserve"
                    value={form.emergencyMedicalReserve}
                    error={errors.emergencyMedicalReserve}
                    onChange={updateField}
                  />

                  <NumberField
                    id="dependentsCovered"
                    label="Number of dependents covered"
                    value={form.dependentsCovered}
                    error={errors.dependentsCovered}
                    onChange={updateField}
                  />

                  <SelectField
                    id="policyReviewDate"
                    label="Policy review status"
                    value={form.policyReviewDate}
                    error={errors.policyReviewDate}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select review status" },
                      { value: "reviewed-six-months", label: "Reviewed within six months" },
                      { value: "reviewed-one-year", label: "Reviewed within one year" },
                      { value: "older", label: "Last reviewed more than one year ago" },
                      { value: "never", label: "Never reviewed" },
                      { value: "unknown", label: "Unknown" },
                      { value: "not-applicable", label: "Not applicable" },
                    ]}
                  />

                  <SelectField
                    id="premiumAffordability"
                    label="Premium affordability"
                    value={form.premiumAffordability}
                    error={errors.premiumAffordability}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select condition" },
                      { value: "comfortable", label: "Comfortably affordable" },
                      { value: "manageable", label: "Manageable" },
                      { value: "restrictive", label: "Restricts monthly cash flow" },
                      { value: "difficult", label: "Difficult to maintain" },
                      { value: "lapsed-risk", label: "Risk of lapse reported" },
                      { value: "not-applicable", label: "Not applicable" },
                    ]}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-black py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <SectionHeader
                number="03"
                title="Household risks"
                description="Record participant-reported exposures that could affect financial continuity."
              />

              <div className="border border-black/20 bg-white/40 p-6 sm:p-8 lg:p-10">
                <div className="grid gap-7 sm:grid-cols-2">
                  <SelectField
                    id="singleIncomeDependency"
                    label="Single-income dependency"
                    value={form.singleIncomeDependency}
                    error={errors.singleIncomeDependency}
                    onChange={updateField}
                    options={standardRiskOptions}
                  />

                  <SelectField
                    id="medicalRisk"
                    label="Medical-cost exposure"
                    value={form.medicalRisk}
                    error={errors.medicalRisk}
                    onChange={updateField}
                    options={standardRiskOptions}
                  />

                  <SelectField
                    id="employmentRisk"
                    label="Employment or income risk"
                    value={form.employmentRisk}
                    error={errors.employmentRisk}
                    onChange={updateField}
                    options={standardRiskOptions}
                  />

                  <SelectField
                    id="businessRisk"
                    label="Business exposure"
                    value={form.businessRisk}
                    error={errors.businessRisk}
                    onChange={updateField}
                    options={[
                      ...standardRiskOptions,
                      { value: "not-applicable", label: "Not applicable" },
                    ]}
                  />

                  <SelectField
                    id="debtRisk"
                    label="Debt-related risk"
                    value={form.debtRisk}
                    error={errors.debtRisk}
                    onChange={updateField}
                    options={standardRiskOptions}
                  />

                  <SelectField
                    id="housingRisk"
                    label="Housing continuity risk"
                    value={form.housingRisk}
                    error={errors.housingRisk}
                    onChange={updateField}
                    options={standardRiskOptions}
                  />

                  <SelectField
                    id="legalRisk"
                    label="Legal or liability exposure"
                    value={form.legalRisk}
                    error={errors.legalRisk}
                    onChange={updateField}
                    options={standardRiskOptions}
                  />

                  <SelectField
                    id="disasterPreparedness"
                    label="Disaster preparedness"
                    value={form.disasterPreparedness}
                    error={errors.disasterPreparedness}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select condition" },
                      { value: "prepared", label: "Prepared" },
                      { value: "partially-prepared", label: "Partially prepared" },
                      { value: "limited", label: "Limited preparation" },
                      { value: "not-prepared", label: "Not prepared" },
                      { value: "unknown", label: "Unknown" },
                    ]}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-black py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <SectionHeader
                number="04"
                title="Protection gaps"
                description="Select every gap reported by the participant. No adequacy determination is generated."
              />

              <div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {gapOptions.map((option) => {
                    const selected = gaps[option.key];

                    return (
                      <label
                        key={option.key}
                        className={`grid cursor-pointer gap-4 border p-6 transition sm:grid-cols-[auto_1fr] ${
                          selected
                            ? "border-black bg-black text-white"
                            : "border-black/20 bg-white/35 hover:border-black"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleGap(option.key)}
                          className="sr-only"
                        />

                        <span
                          className={`flex h-7 w-7 items-center justify-center border ${
                            selected
                              ? "border-white bg-white text-black"
                              : "border-black"
                          }`}
                        >
                          {selected ? "✓" : ""}
                        </span>

                        <span className="font-serif text-xl leading-7">
                          {option.label}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {gapError && (
                  <p className="mt-4 text-sm text-red-700" role="alert">
                    {gapError}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="border-t border-black py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <SectionHeader
                number="05"
                title="Recovery preparedness"
                description="Record how prepared the household reports it is to maintain access, authority, documents, and continuity."
              />

              <div className="border border-black/20 bg-white/40 p-6 sm:p-8 lg:p-10">
                <div className="grid gap-7 sm:grid-cols-2">
                  <SelectField
                    id="emergencyContactReadiness"
                    label="Emergency contact readiness"
                    value={form.emergencyContactReadiness}
                    error={errors.emergencyContactReadiness}
                    onChange={updateField}
                    options={readinessOptions}
                  />

                  <SelectField
                    id="financialDocumentOrganisation"
                    label="Financial-document organisation"
                    value={form.financialDocumentOrganisation}
                    error={errors.financialDocumentOrganisation}
                    onChange={updateField}
                    options={readinessOptions}
                  />

                  <SelectField
                    id="digitalAccessPlanning"
                    label="Digital-access planning"
                    value={form.digitalAccessPlanning}
                    error={errors.digitalAccessPlanning}
                    onChange={updateField}
                    options={readinessOptions}
                  />

                  <SelectField
                    id="nomineeStatus"
                    label="Nominee or beneficiary status"
                    value={form.nomineeStatus}
                    error={errors.nomineeStatus}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select condition" },
                      { value: "complete-current", label: "Complete and current" },
                      { value: "complete-review-needed", label: "Complete but review needed" },
                      { value: "partial", label: "Partially completed" },
                      { value: "not-completed", label: "Not completed" },
                      { value: "unknown", label: "Unknown" },
                      { value: "not-applicable", label: "Not applicable" },
                    ]}
                  />

                  <SelectField
                    id="estatePlanning"
                    label="Will or estate planning"
                    value={form.estatePlanning}
                    error={errors.estatePlanning}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select condition" },
                      { value: "documented", label: "Documented arrangements exist" },
                      { value: "informal", label: "Informal arrangements only" },
                      { value: "in-progress", label: "In progress" },
                      { value: "none", label: "No arrangements reported" },
                      { value: "unknown", label: "Unknown" },
                      { value: "not-applicable", label: "Not applicable" },
                    ]}
                  />

                  <SelectField
                    id="householdContinuityPlanning"
                    label="Household continuity planning"
                    value={form.householdContinuityPlanning}
                    error={errors.householdContinuityPlanning}
                    onChange={updateField}
                    options={readinessOptions}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-black py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <SectionHeader
                number="06"
                title="Participant review"
                description="Confirm that the participant has reviewed the information entered in this prototype module."
              />

              <div className="border border-black/20 bg-white/40 p-6 sm:p-8 lg:p-10">
                <SelectField
                  id="participantReview"
                  label="Participant review status"
                  value={form.participantReview}
                  error={errors.participantReview}
                  onChange={updateField}
                  options={[
                    { value: "", label: "Select review status" },
                    { value: "reviewed-confirmed", label: "Reviewed and confirmed" },
                    { value: "reviewed-corrections-needed", label: "Reviewed — corrections may be required" },
                    { value: "assisted-entry", label: "Entered with assistance" },
                    { value: "not-reviewed", label: "Not yet reviewed" },
                  ]}
                />

                <p className="mt-5 text-sm leading-7 text-black/55">
                  Review confirmation does not establish document authenticity,
                  insurance validity, legal sufficiency, or protection adequacy.
                </p>
              </div>
            </div>
          </section>

          <section className="border-t border-black py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <SectionHeader
                number="07"
                title="Prototype protection overview"
                description="The figures below reflect participant-entered information only. No score, diagnosis, or risk classification is produced."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <article className="border border-black bg-black p-6 text-white sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                    Total reported cover
                  </p>

                  <p className="mt-5 font-serif text-4xl">
                    {formatAmount(totalReportedCover, form.currency)}
                  </p>
                </article>

                <article className="border border-black/20 bg-white/40 p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                    Protection categories selected
                  </p>

                  <p className="mt-5 font-serif text-4xl">
                    {protections.noProtection ? "0" : selectedProtectionCount}
                  </p>
                </article>

                <article className="border border-black/20 bg-white/40 p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                    Insurance categories
                  </p>

                  <p className="mt-5 font-serif text-4xl">
                    {insuranceCategoryCount}
                  </p>
                </article>

                <article className="border border-black/20 bg-white/40 p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                    Reported protection gaps
                  </p>

                  <p className="mt-5 font-serif text-4xl">
                    {gaps.noMajorGap ? "0" : selectedGapCount}
                  </p>
                </article>

                <article className="border border-black/20 bg-white/40 p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                    Dependents reported covered
                  </p>

                  <p className="mt-5 font-serif text-4xl">
                    {parseAmount(form.dependentsCovered)}
                  </p>
                </article>

                <article className="border border-black/20 bg-white/40 p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                    Preparedness fields completed
                  </p>

                  <p className="mt-5 font-serif text-4xl">
                    {preparednessCompletedCount} / 6
                  </p>
                </article>
              </div>
            </div>
          </section>

          <section className="border-t border-black py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <SectionHeader
                number="08"
                title="Prototype completion status"
                description="Completion reflects form coverage only. It does not confirm policy validity, protection adequacy, or household risk level."
              />

              <div>
                <div className="border border-black/25 p-6 sm:p-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                        Module completion
                      </p>

                      <p className="mt-4 font-serif text-5xl">
                        {completion}%
                      </p>
                    </div>

                    <p className="text-sm text-black/55">
                      {completedSections} of 6 sections completed
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
                    label="Insurance protection"
                    value={
                      insuranceProtectionComplete
                        ? "Completed"
                        : "Not completed"
                    }
                  />

                  <StatusRow
                    label="Coverage summary"
                    value={
                      coverageSummaryComplete
                        ? "Completed"
                        : "Not completed"
                    }
                  />

                  <StatusRow
                    label="Household risks"
                    value={
                      householdRisksComplete
                        ? "Completed"
                        : "Not completed"
                    }
                  />

                  <StatusRow
                    label="Protection gaps"
                    value={
                      protectionGapsComplete
                        ? "Completed"
                        : "Not completed"
                    }
                  />

                  <StatusRow
                    label="Recovery preparedness"
                    value={
                      recoveryPreparednessComplete
                        ? "Completed"
                        : "Not completed"
                    }
                  />

                  <StatusRow
                    label="Participant review"
                    value={
                      participantReviewComplete
                        ? "Completed"
                        : "Not completed"
                    }
                  />

                  <StatusRow
                    label="Evidence validation"
                    value="Not performed"
                  />

                  <StatusRow
                    label="Policy verification"
                    value="Not performed"
                  />

                  <StatusRow
                    label="Nominee verification"
                    value="Not performed"
                  />

                  <StatusRow
                    label="Legal-document review"
                    value="Not performed"
                  />

                  <StatusRow
                    label="Risk classification"
                    value="Not generated"
                  />

                  <StatusRow
                    label="Protection adequacy"
                    value="Not generated"
                  />

                  <StatusRow
                    label="Database record"
                    value="Not created"
                  />
                </div>

                {successMessage && (
                  <div
                    className="mt-5 border border-black bg-black p-5 text-sm leading-7 text-white"
                    role="status"
                  >
                    {successMessage}
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
                  router.push("/participant/assessment/stability-margin")
                }
                disabled={isSubmitting}
                className="inline-flex min-h-14 items-center justify-center border border-black px-7 text-sm font-semibold uppercase tracking-[0.14em] transition hover:bg-black hover:text-white disabled:opacity-50"
              >
                Return to Stability and Margin
              </button>

              <div className="flex flex-col gap-4 sm:flex-row">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-14 items-center justify-center border border-black px-7 text-sm font-semibold uppercase tracking-[0.14em] transition hover:bg-black hover:text-white disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Completing Module..."
                    : "Complete Protection and Risk"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/participant/assessment/goals-planning")
                  }
                  disabled={!isCompleted || isSubmitting}
                  className="inline-flex min-h-14 items-center justify-center bg-black px-8 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Continue to Goals and Planning
                </button>
              </div>
            </div>

            <p className="mt-8 max-w-5xl text-xs leading-6 text-black/50">
              Production protection assessment must distinguish
              participant-reported information from verified evidence, preserve
              original policy documents, confirm premium and coverage status,
              review exclusions and beneficiaries, validate legal arrangements,
              apply controlled adequacy methodology, and retain a complete
              institutional audit history.
            </p>
          </section>
        </form>
      </div>
    </main>
  );
}