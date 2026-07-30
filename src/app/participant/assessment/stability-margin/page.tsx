"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type StabilityForm = {
  currency: string;

  availableCash: string;
  bankSavings: string;
  emergencyFund: string;
  liquidInvestments: string;
  accessibleCredit: string;

  monthlyEssentialExpenses: string;
  monthlyDebtPayments: string;
  monthlyInsurancePayments: string;
  monthlyDependentSupport: string;

  incomeInterruptionMonths: string;
  expenseCoverageCondition: string;
  emergencyAccessSpeed: string;
  liquidityCondition: string;

  recentUnexpectedExpense: string;
  borrowingForEmergency: string;
  paymentDelayRisk: string;
  essentialExpenseRisk: string;

  incomeConcentration: string;
  householdDependency: string;
  contingencyPlan: string;
  marginPriority: string;
};

type FormErrors = Partial<Record<keyof StabilityForm, string>>;

type BufferKey =
  | "cash"
  | "savings"
  | "emergencyFund"
  | "liquidInvestments"
  | "creditAccess"
  | "familySupport"
  | "insurance"
  | "noBuffer";

type BufferSelections = Record<BufferKey, boolean>;

const initialForm: StabilityForm = {
  currency: "INR",

  availableCash: "0",
  bankSavings: "0",
  emergencyFund: "0",
  liquidInvestments: "0",
  accessibleCredit: "0",

  monthlyEssentialExpenses: "0",
  monthlyDebtPayments: "0",
  monthlyInsurancePayments: "0",
  monthlyDependentSupport: "0",

  incomeInterruptionMonths: "",
  expenseCoverageCondition: "",
  emergencyAccessSpeed: "",
  liquidityCondition: "",

  recentUnexpectedExpense: "",
  borrowingForEmergency: "",
  paymentDelayRisk: "",
  essentialExpenseRisk: "",

  incomeConcentration: "",
  householdDependency: "",
  contingencyPlan: "",
  marginPriority: "",
};

const initialBuffers: BufferSelections = {
  cash: false,
  savings: false,
  emergencyFund: false,
  liquidInvestments: false,
  creditAccess: false,
  familySupport: false,
  insurance: false,
  noBuffer: false,
};

const bufferOptions: Array<{ key: BufferKey; label: string }> = [
  { key: "cash", label: "Cash reserve" },
  { key: "savings", label: "Bank savings" },
  { key: "emergencyFund", label: "Dedicated emergency fund" },
  { key: "liquidInvestments", label: "Liquid investments" },
  { key: "creditAccess", label: "Available credit access" },
  { key: "familySupport", label: "Reliable family support" },
  { key: "insurance", label: "Relevant insurance protection" },
  { key: "noBuffer", label: "No financial buffer reported" },
];

const requiredFields: Array<keyof StabilityForm> = [
  "currency",
  "incomeInterruptionMonths",
  "expenseCoverageCondition",
  "emergencyAccessSpeed",
  "liquidityCondition",
  "recentUnexpectedExpense",
  "borrowingForEmergency",
  "paymentDelayRisk",
  "essentialExpenseRisk",
  "incomeConcentration",
  "householdDependency",
  "contingencyPlan",
  "marginPriority",
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
  id: keyof StabilityForm;
  label: string;
  value: string;
  error?: string;
  onChange: (field: keyof StabilityForm, value: string) => void;
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
  id: keyof StabilityForm;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
  onChange: (field: keyof StabilityForm, value: string) => void;
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

export default function StabilityAndMarginPage() {
  const router = useRouter();

  const [form, setForm] = useState<StabilityForm>(initialForm);
  const [buffers, setBuffers] =
    useState<BufferSelections>(initialBuffers);

  const [errors, setErrors] = useState<FormErrors>({});
  const [bufferError, setBufferError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const selectedBufferCount = Object.entries(buffers).filter(
    ([key, selected]) => key !== "noBuffer" && selected,
  ).length;

  const bufferSectionComplete =
    buffers.noBuffer || selectedBufferCount > 0;

  const liquiditySectionComplete = useMemo(
    () =>
      [
        form.availableCash,
        form.bankSavings,
        form.emergencyFund,
        form.liquidInvestments,
        form.accessibleCredit,
      ].every((value) => value.trim() !== ""),
    [form],
  );

  const obligationSectionComplete = useMemo(
    () =>
      [
        form.monthlyEssentialExpenses,
        form.monthlyDebtPayments,
        form.monthlyInsurancePayments,
        form.monthlyDependentSupport,
      ].every((value) => value.trim() !== ""),
    [form],
  );

  const resilienceSectionComplete = Boolean(
    form.incomeInterruptionMonths &&
      form.expenseCoverageCondition &&
      form.emergencyAccessSpeed &&
      form.liquidityCondition,
  );

  const pressureSectionComplete = Boolean(
    form.recentUnexpectedExpense &&
      form.borrowingForEmergency &&
      form.paymentDelayRisk &&
      form.essentialExpenseRisk,
  );

  const dependencySectionComplete = Boolean(
    form.incomeConcentration &&
      form.householdDependency &&
      form.contingencyPlan &&
      form.marginPriority,
  );

  const completedSections = [
    bufferSectionComplete,
    liquiditySectionComplete,
    obligationSectionComplete,
    resilienceSectionComplete,
    pressureSectionComplete,
    dependencySectionComplete,
  ].filter(Boolean).length;

  const completion = Math.round((completedSections / 6) * 100);

  const totalLiquidResources =
    parseAmount(form.availableCash) +
    parseAmount(form.bankSavings) +
    parseAmount(form.emergencyFund) +
    parseAmount(form.liquidInvestments);

  const totalAccessibleResources =
    totalLiquidResources + parseAmount(form.accessibleCredit);

  const monthlyCoreObligations =
    parseAmount(form.monthlyEssentialExpenses) +
    parseAmount(form.monthlyDebtPayments) +
    parseAmount(form.monthlyInsurancePayments) +
    parseAmount(form.monthlyDependentSupport);

  const coverageMonths =
    monthlyCoreObligations > 0
      ? totalLiquidResources / monthlyCoreObligations
      : 0;

  const accessibleCoverageMonths =
    monthlyCoreObligations > 0
      ? totalAccessibleResources / monthlyCoreObligations
      : 0;

  const remainingMargin =
    totalLiquidResources - monthlyCoreObligations;

  function updateField(field: keyof StabilityForm, value: string) {
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

  function toggleBuffer(key: BufferKey) {
    setBuffers((current) => {
      if (key === "noBuffer") {
        return {
          ...initialBuffers,
          noBuffer: !current.noBuffer,
        };
      }

      return {
        ...current,
        [key]: !current[key],
        noBuffer: false,
      };
    });

    setBufferError("");
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

    const numericFields: Array<keyof StabilityForm> = [
      "availableCash",
      "bankSavings",
      "emergencyFund",
      "liquidInvestments",
      "accessibleCredit",
      "monthlyEssentialExpenses",
      "monthlyDebtPayments",
      "monthlyInsurancePayments",
      "monthlyDependentSupport",
    ];

    for (const field of numericFields) {
      if (form[field].trim() && Number(form[field]) < 0) {
        nextErrors[field] = "Enter zero or a positive amount.";
      }
    }

    if (!bufferSectionComplete) {
      setBufferError(
        "Select at least one available buffer or choose no financial buffer reported.",
      );
    } else {
      setBufferError("");
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors).length === 0 &&
      bufferSectionComplete &&
      liquiditySectionComplete &&
      obligationSectionComplete
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
      "Prototype stability and margin module completed for this browser session. No financial capacity, resilience classification, or HFOS system-state diagnosis has been verified, stored, or generated.",
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
                Participant Portal · HFOS Assessment · Module 04
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
              Stability and margin
            </p>

            <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Measure the system&apos;s ability to absorb pressure.
            </h1>

            <p className="mt-8 max-w-2xl text-base leading-8 text-black/65 sm:text-lg">
              This module records participant-reported liquidity, emergency
              capacity, essential obligations, disruption tolerance, dependency
              exposure, and available financial margin.
            </p>
          </div>

          <aside className="border border-black bg-black p-6 text-white sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
              Prototype notice
            </p>

            <p className="mt-5 text-sm leading-7 text-white/80">
              This page does not retrieve account balances, validate savings,
              confirm available credit, review insurance policies, or verify
              household obligations.
            </p>

            <p className="mt-4 text-sm leading-7 text-white/80">
              Production stability assessment will require reconciled financial
              records, verified liquidity, validated obligations, evidence
              review, controlled scoring, and institutional oversight.
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

                <h2 className="mt-4 font-serif text-3xl sm:text-4xl">
                  Available buffers
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  Select the resources reported as available during temporary
                  financial disruption.
                </p>
              </div>

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
                  {bufferOptions.map((option) => {
                    const selected = buffers[option.key];

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
                          onChange={() => toggleBuffer(option.key)}
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

                {bufferError && (
                  <p className="mt-4 text-sm text-red-700" role="alert">
                    {bufferError}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="border-t border-black py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/50">
                  02
                </p>

                <h2 className="mt-4 font-serif text-3xl sm:text-4xl">
                  Liquidity position
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  Record resources reported as immediately or reasonably
                  accessible.
                </p>
              </div>

              <div className="border border-black/20 bg-white/40 p-6 sm:p-8 lg:p-10">
                <div className="grid gap-7 sm:grid-cols-2">
                  <NumberField
                    id="availableCash"
                    label="Cash immediately available"
                    value={form.availableCash}
                    error={errors.availableCash}
                    onChange={updateField}
                  />

                  <NumberField
                    id="bankSavings"
                    label="Accessible bank savings"
                    value={form.bankSavings}
                    error={errors.bankSavings}
                    onChange={updateField}
                  />

                  <NumberField
                    id="emergencyFund"
                    label="Dedicated emergency fund"
                    value={form.emergencyFund}
                    error={errors.emergencyFund}
                    onChange={updateField}
                  />

                  <NumberField
                    id="liquidInvestments"
                    label="Liquid investments"
                    value={form.liquidInvestments}
                    error={errors.liquidInvestments}
                    onChange={updateField}
                  />

                  <NumberField
                    id="accessibleCredit"
                    label="Reported accessible credit"
                    value={form.accessibleCredit}
                    error={errors.accessibleCredit}
                    onChange={updateField}
                  />
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

                <h2 className="mt-4 font-serif text-3xl sm:text-4xl">
                  Core monthly obligations
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  Record the recurring commitments that must continue during a
                  disruption.
                </p>
              </div>

              <div className="border border-black/20 bg-white/40 p-6 sm:p-8 lg:p-10">
                <div className="grid gap-7 sm:grid-cols-2">
                  <NumberField
                    id="monthlyEssentialExpenses"
                    label="Essential household expenses"
                    value={form.monthlyEssentialExpenses}
                    error={errors.monthlyEssentialExpenses}
                    onChange={updateField}
                  />

                  <NumberField
                    id="monthlyDebtPayments"
                    label="Debt repayments"
                    value={form.monthlyDebtPayments}
                    error={errors.monthlyDebtPayments}
                    onChange={updateField}
                  />

                  <NumberField
                    id="monthlyInsurancePayments"
                    label="Insurance commitments"
                    value={form.monthlyInsurancePayments}
                    error={errors.monthlyInsurancePayments}
                    onChange={updateField}
                  />

                  <NumberField
                    id="monthlyDependentSupport"
                    label="Dependent or family support"
                    value={form.monthlyDependentSupport}
                    error={errors.monthlyDependentSupport}
                    onChange={updateField}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-black py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/50">
                  04
                </p>

                <h2 className="mt-4 font-serif text-3xl sm:text-4xl">
                  Disruption capacity
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  Record how long the household reports it could continue
                  without normal income.
                </p>
              </div>

              <div className="border border-black/20 bg-white/40 p-6 sm:p-8 lg:p-10">
                <div className="grid gap-7 sm:grid-cols-2">
                  <SelectField
                    id="incomeInterruptionMonths"
                    label="Reported income-interruption capacity"
                    value={form.incomeInterruptionMonths}
                    error={errors.incomeInterruptionMonths}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select duration" },
                      { value: "none", label: "Less than one month" },
                      { value: "one", label: "Approximately one month" },
                      { value: "two-three", label: "Two to three months" },
                      { value: "four-six", label: "Four to six months" },
                      { value: "six-plus", label: "More than six months" },
                      { value: "unknown", label: "Unknown" },
                    ]}
                  />

                  <SelectField
                    id="expenseCoverageCondition"
                    label="Essential-expense coverage"
                    value={form.expenseCoverageCondition}
                    error={errors.expenseCoverageCondition}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select condition" },
                      { value: "none", label: "No coverage reported" },
                      { value: "partial", label: "Partial coverage" },
                      { value: "one-month", label: "Approximately one month" },
                      { value: "three-months", label: "Approximately three months" },
                      { value: "six-months", label: "Approximately six months" },
                      { value: "extended", label: "Extended coverage" },
                    ]}
                  />

                  <SelectField
                    id="emergencyAccessSpeed"
                    label="Speed of emergency access"
                    value={form.emergencyAccessSpeed}
                    error={errors.emergencyAccessSpeed}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select access speed" },
                      { value: "immediate", label: "Immediate" },
                      { value: "one-day", label: "Within one day" },
                      { value: "several-days", label: "Several days" },
                      { value: "restricted", label: "Restricted or uncertain" },
                      { value: "none", label: "No emergency access" },
                    ]}
                  />

                  <SelectField
                    id="liquidityCondition"
                    label="Overall liquidity condition"
                    value={form.liquidityCondition}
                    error={errors.liquidityCondition}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select condition" },
                      { value: "strong", label: "Strong reported liquidity" },
                      { value: "adequate", label: "Adequate" },
                      { value: "limited", label: "Limited" },
                      { value: "very-limited", label: "Very limited" },
                      { value: "none", label: "No liquidity reported" },
                    ]}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-black py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/50">
                  05
                </p>

                <h2 className="mt-4 font-serif text-3xl sm:text-4xl">
                  Pressure response
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  Record how the household responds when an unexpected expense
                  or temporary income interruption occurs.
                </p>
              </div>

              <div className="border border-black/20 bg-white/40 p-6 sm:p-8 lg:p-10">
                <div className="grid gap-7 sm:grid-cols-2">
                  <SelectField
                    id="recentUnexpectedExpense"
                    label="Recent unexpected expense"
                    value={form.recentUnexpectedExpense}
                    error={errors.recentUnexpectedExpense}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select response" },
                      { value: "none", label: "None reported" },
                      { value: "absorbed", label: "Absorbed without disruption" },
                      { value: "savings-used", label: "Savings were used" },
                      { value: "payment-delayed", label: "Another payment was delayed" },
                      { value: "borrowed", label: "Borrowing was required" },
                      { value: "unresolved", label: "Expense remains unresolved" },
                    ]}
                  />

                  <SelectField
                    id="borrowingForEmergency"
                    label="Emergency borrowing dependency"
                    value={form.borrowingForEmergency}
                    error={errors.borrowingForEmergency}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select condition" },
                      { value: "none", label: "No dependency reported" },
                      { value: "rare", label: "Rare" },
                      { value: "occasional", label: "Occasional" },
                      { value: "frequent", label: "Frequent" },
                      { value: "primary-response", label: "Primary emergency response" },
                    ]}
                  />

                  <SelectField
                    id="paymentDelayRisk"
                    label="Risk of delayed commitments"
                    value={form.paymentDelayRisk}
                    error={errors.paymentDelayRisk}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select risk" },
                      { value: "none", label: "No current risk reported" },
                      { value: "low", label: "Low" },
                      { value: "moderate", label: "Moderate" },
                      { value: "high", label: "High" },
                      { value: "active", label: "Payments already delayed" },
                    ]}
                  />

                  <SelectField
                    id="essentialExpenseRisk"
                    label="Risk to essential expenses"
                    value={form.essentialExpenseRisk}
                    error={errors.essentialExpenseRisk}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select risk" },
                      { value: "none", label: "No current risk reported" },
                      { value: "limited", label: "Limited risk" },
                      { value: "moderate", label: "Moderate risk" },
                      { value: "high", label: "High risk" },
                      { value: "current-shortfall", label: "Current shortfall reported" },
                    ]}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-black py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/50">
                  06
                </p>

                <h2 className="mt-4 font-serif text-3xl sm:text-4xl">
                  Dependency and continuity
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  Record concentration risk, household dependency, and the
                  existence of contingency arrangements.
                </p>
              </div>

              <div className="border border-black/20 bg-white/40 p-6 sm:p-8 lg:p-10">
                <div className="grid gap-7 sm:grid-cols-2">
                  <SelectField
                    id="incomeConcentration"
                    label="Income concentration"
                    value={form.incomeConcentration}
                    error={errors.incomeConcentration}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select condition" },
                      { value: "diversified", label: "Multiple reliable income sources" },
                      { value: "two-sources", label: "Two meaningful income sources" },
                      { value: "single-stable", label: "Single relatively stable source" },
                      { value: "single-variable", label: "Single variable source" },
                      { value: "uncertain", label: "Income source uncertain" },
                    ]}
                  />

                  <SelectField
                    id="householdDependency"
                    label="Household dependency level"
                    value={form.householdDependency}
                    error={errors.householdDependency}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select condition" },
                      { value: "low", label: "Low dependency" },
                      { value: "moderate", label: "Moderate dependency" },
                      { value: "high", label: "High dependency" },
                      { value: "critical", label: "Critical dependency" },
                    ]}
                  />

                  <SelectField
                    id="contingencyPlan"
                    label="Contingency plan"
                    value={form.contingencyPlan}
                    error={errors.contingencyPlan}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select condition" },
                      { value: "documented", label: "Documented plan exists" },
                      { value: "informal", label: "Informal plan exists" },
                      { value: "partial", label: "Partial arrangements" },
                      { value: "none", label: "No plan reported" },
                      { value: "unknown", label: "Unknown" },
                    ]}
                  />

                  <SelectField
                    id="marginPriority"
                    label="Current margin priority"
                    value={form.marginPriority}
                    error={errors.marginPriority}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select priority" },
                      { value: "maintain", label: "Maintain existing buffer" },
                      { value: "build-cash", label: "Build immediate cash reserve" },
                      { value: "emergency-fund", label: "Build dedicated emergency fund" },
                      { value: "reduce-obligations", label: "Reduce fixed obligations" },
                      { value: "protect-income", label: "Protect income continuity" },
                      { value: "stabilise", label: "Urgent financial stabilisation" },
                    ]}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-black py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/50">
                  07
                </p>

                <h2 className="mt-4 font-serif text-3xl sm:text-4xl">
                  Reported margin overview
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  These calculations reflect current form values only. They are
                  not verified measures or a production HFOS diagnosis.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <article className="border border-black bg-black p-6 text-white sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                    Liquid resources
                  </p>

                  <p className="mt-5 font-serif text-4xl">
                    {formatAmount(totalLiquidResources, form.currency)}
                  </p>
                </article>

                <article className="border border-black/20 bg-white/40 p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                    Core monthly obligations
                  </p>

                  <p className="mt-5 font-serif text-4xl">
                    {formatAmount(monthlyCoreObligations, form.currency)}
                  </p>
                </article>

                <article className="border border-black/20 bg-white/40 p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                    Liquid coverage
                  </p>

                  <p className="mt-5 font-serif text-4xl">
                    {coverageMonths.toFixed(1)} months
                  </p>
                </article>

                <article className="border border-black/20 bg-white/40 p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                    Coverage including credit
                  </p>

                  <p className="mt-5 font-serif text-4xl">
                    {accessibleCoverageMonths.toFixed(1)} months
                  </p>
                </article>

                <article className="border border-black/20 bg-white/40 p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                    One-month remaining margin
                  </p>

                  <p className="mt-5 font-serif text-4xl">
                    {formatAmount(remainingMargin, form.currency)}
                  </p>
                </article>

                <article className="border border-black/20 bg-white/40 p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                    Reported buffer categories
                  </p>

                  <p className="mt-5 font-serif text-4xl">
                    {buffers.noBuffer ? "0" : selectedBufferCount}
                  </p>
                </article>
              </div>
            </div>
          </section>

          <section className="border-t border-black py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/50">
                  08
                </p>

                <h2 className="mt-4 font-serif text-3xl sm:text-4xl">
                  Prototype completion status
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  Completion reflects participant-entered form coverage only.
                  It does not establish stable, under pressure, fragile, or
                  collapsed system state.
                </p>
              </div>

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
                    label="Available buffers"
                    value={
                      bufferSectionComplete ? "Completed" : "Not completed"
                    }
                  />

                  <StatusRow
                    label="Liquidity position"
                    value={
                      liquiditySectionComplete ? "Completed" : "Not completed"
                    }
                  />

                  <StatusRow
                    label="Core monthly obligations"
                    value={
                      obligationSectionComplete ? "Completed" : "Not completed"
                    }
                  />

                  <StatusRow
                    label="Disruption capacity"
                    value={
                      resilienceSectionComplete ? "Completed" : "Not completed"
                    }
                  />

                  <StatusRow
                    label="Pressure response"
                    value={
                      pressureSectionComplete ? "Completed" : "Not completed"
                    }
                  />

                  <StatusRow
                    label="Dependency and continuity"
                    value={
                      dependencySectionComplete ? "Completed" : "Not completed"
                    }
                  />

                  <StatusRow
                    label="Balance verification"
                    value="Not performed"
                  />

                  <StatusRow
                    label="Obligation reconciliation"
                    value="Not performed"
                  />

                  <StatusRow
                    label="Margin classification"
                    value="Not generated"
                  />

                  <StatusRow
                    label="HFOS system-state diagnosis"
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
                  router.push("/participant/assessment/debt-obligations")
                }
                disabled={isSubmitting}
                className="inline-flex min-h-14 items-center justify-center border border-black px-7 text-sm font-semibold uppercase tracking-[0.14em] transition hover:bg-black hover:text-white disabled:opacity-50"
              >
                Return to Debt and Obligations
              </button>

              <div className="flex flex-col gap-4 sm:flex-row">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-14 items-center justify-center border border-black px-7 text-sm font-semibold uppercase tracking-[0.14em] transition hover:bg-black hover:text-white disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Completing Module..."
                    : "Complete Stability and Margin"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/participant/assessment/protection-risk")
                  }
                  disabled={!isCompleted || isSubmitting}
                  className="inline-flex min-h-14 items-center justify-center bg-black px-8 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Continue to Protection and Risk
                </button>
              </div>
            </div>

            <p className="mt-8 max-w-5xl text-xs leading-6 text-black/50">
              Production stability assessment must distinguish participant
              statements from verified balances, exclude uncertain or
              inaccessible resources, reconcile recurring obligations, document
              liquidity restrictions, preserve evidence provenance, apply
              controlled methodology, and retain a complete institutional audit
              history.
            </p>
          </section>
        </form>
      </div>
    </main>
  );
}