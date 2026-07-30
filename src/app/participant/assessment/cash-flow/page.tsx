"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CashFlowForm = {
  currency: string;
  assessmentPeriod: string;

  primaryIncomeAmount: string;
  primaryIncomeFrequency: string;
  secondaryIncomeAmount: string;
  secondaryIncomeFrequency: string;
  otherIncomeAmount: string;
  incomeReliability: string;
  incomeChangeExpected: string;

  housingExpense: string;
  foodExpense: string;
  utilitiesExpense: string;
  transportExpense: string;
  educationExpense: string;
  healthcareExpense: string;
  insuranceExpense: string;
  familySupportExpense: string;
  otherEssentialExpense: string;

  loanRepayments: string;
  creditCardPayments: string;
  subscriptionsExpense: string;
  discretionaryExpense: string;
  irregularExpense: string;

  savingsContribution: string;
  emergencyContribution: string;
  investmentContribution: string;

  paymentTiming: string;
  shortageFrequency: string;
  billDelayFrequency: string;
  borrowingForExpenses: string;
  endOfMonthPosition: string;
};

type FormErrors = Partial<Record<keyof CashFlowForm, string>>;

type TimingPressureKey =
  | "incomeBeforeBills"
  | "incomeAfterBills"
  | "multipleDueDates"
  | "irregularIncomeDates"
  | "automaticPayments"
  | "cashPayments"
  | "noTimingConcern";

type SelectionState<T extends string> = Record<T, boolean>;

const initialForm: CashFlowForm = {
  currency: "",
  assessmentPeriod: "monthly",

  primaryIncomeAmount: "",
  primaryIncomeFrequency: "",
  secondaryIncomeAmount: "",
  secondaryIncomeFrequency: "",
  otherIncomeAmount: "",
  incomeReliability: "",
  incomeChangeExpected: "",

  housingExpense: "",
  foodExpense: "",
  utilitiesExpense: "",
  transportExpense: "",
  educationExpense: "",
  healthcareExpense: "",
  insuranceExpense: "",
  familySupportExpense: "",
  otherEssentialExpense: "",

  loanRepayments: "",
  creditCardPayments: "",
  subscriptionsExpense: "",
  discretionaryExpense: "",
  irregularExpense: "",

  savingsContribution: "",
  emergencyContribution: "",
  investmentContribution: "",

  paymentTiming: "",
  shortageFrequency: "",
  billDelayFrequency: "",
  borrowingForExpenses: "",
  endOfMonthPosition: "",
};

const initialTimingPressure: SelectionState<TimingPressureKey> = {
  incomeBeforeBills: false,
  incomeAfterBills: false,
  multipleDueDates: false,
  irregularIncomeDates: false,
  automaticPayments: false,
  cashPayments: false,
  noTimingConcern: false,
};

const timingOptions: Array<{
  key: TimingPressureKey;
  label: string;
}> = [
  {
    key: "incomeBeforeBills",
    label: "Income normally arrives before major bills",
  },
  {
    key: "incomeAfterBills",
    label: "Some bills become due before income arrives",
  },
  {
    key: "multipleDueDates",
    label: "Payments are spread across multiple due dates",
  },
  {
    key: "irregularIncomeDates",
    label: "Income dates are irregular or unpredictable",
  },
  {
    key: "automaticPayments",
    label: "Major payments are deducted automatically",
  },
  {
    key: "cashPayments",
    label: "Important expenses are mainly paid in cash",
  },
  {
    key: "noTimingConcern",
    label: "No significant payment-timing concern reported",
  },
];

const requiredFields: Array<keyof CashFlowForm> = [
  "currency",
  "assessmentPeriod",
  "primaryIncomeAmount",
  "primaryIncomeFrequency",
  "incomeReliability",
  "incomeChangeExpected",
  "housingExpense",
  "foodExpense",
  "utilitiesExpense",
  "transportExpense",
  "loanRepayments",
  "creditCardPayments",
  "savingsContribution",
  "paymentTiming",
  "shortageFrequency",
  "billDelayFrequency",
  "borrowingForExpenses",
  "endOfMonthPosition",
];

function parseAmount(value: string) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 0) {
    return 0;
  }

  return amount;
}

function formatAmount(value: number, currency: string) {
  if (!currency) {
    return value.toLocaleString();
  }

  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return value.toLocaleString();
  }
}

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

function TextField({
  id,
  label,
  value,
  placeholder,
  type = "text",
  helper,
  error,
  onChange,
}: {
  id: keyof CashFlowForm;
  label: string;
  value: string;
  placeholder: string;
  type?: string;
  helper?: string;
  error?: string;
  onChange: (field: keyof CashFlowForm, value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-black">
        {label}
      </label>

      {helper && (
        <p className="mt-1 text-xs leading-5 text-black/50">{helper}</p>
      )}

      <input
        id={id}
        name={id}
        type={type}
        min={type === "number" ? "0" : undefined}
        value={value}
        onChange={(event) => onChange(id, event.target.value)}
        aria-invalid={Boolean(error)}
        className="mt-3 w-full border border-black/30 bg-transparent px-4 py-4 text-base outline-none transition placeholder:text-black/30 focus:border-black"
        placeholder={placeholder}
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
  id: keyof CashFlowForm;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
  onChange: (field: keyof CashFlowForm, value: string) => void;
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

export default function CashFlowStructurePage() {
  const router = useRouter();

  const [form, setForm] = useState<CashFlowForm>(initialForm);
  const [timingPressure, setTimingPressure] =
    useState<SelectionState<TimingPressureKey>>(initialTimingPressure);

  const [errors, setErrors] = useState<FormErrors>({});
  const [selectionError, setSelectionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const incomeSectionComplete = useMemo(
    () =>
      Boolean(
        form.currency &&
          form.assessmentPeriod &&
          form.primaryIncomeAmount.trim() &&
          form.primaryIncomeFrequency &&
          form.incomeReliability &&
          form.incomeChangeExpected,
      ),
    [form],
  );

  const essentialExpenseComplete = useMemo(
    () =>
      Boolean(
        form.housingExpense.trim() &&
          form.foodExpense.trim() &&
          form.utilitiesExpense.trim() &&
          form.transportExpense.trim(),
      ),
    [form],
  );

  const obligationExpenseComplete = useMemo(
    () =>
      Boolean(
        form.loanRepayments.trim() &&
          form.creditCardPayments.trim() &&
          form.discretionaryExpense.trim(),
      ),
    [form],
  );

  const savingsSectionComplete = useMemo(
    () =>
      Boolean(
        form.savingsContribution.trim() &&
          form.emergencyContribution.trim() &&
          form.investmentContribution.trim(),
      ),
    [form],
  );

  const timingSectionComplete = useMemo(
    () =>
      Object.values(timingPressure).some(Boolean) &&
      Boolean(form.paymentTiming),
    [form.paymentTiming, timingPressure],
  );

  const pressureSectionComplete = useMemo(
    () =>
      Boolean(
        form.shortageFrequency &&
          form.billDelayFrequency &&
          form.borrowingForExpenses &&
          form.endOfMonthPosition,
      ),
    [form],
  );

  const completedSections = [
    incomeSectionComplete,
    essentialExpenseComplete,
    obligationExpenseComplete,
    savingsSectionComplete,
    timingSectionComplete,
    pressureSectionComplete,
  ].filter(Boolean).length;

  const completion = Math.round((completedSections / 6) * 100);

  const totalIncome =
    parseAmount(form.primaryIncomeAmount) +
    parseAmount(form.secondaryIncomeAmount) +
    parseAmount(form.otherIncomeAmount);

  const totalEssentialExpenses =
    parseAmount(form.housingExpense) +
    parseAmount(form.foodExpense) +
    parseAmount(form.utilitiesExpense) +
    parseAmount(form.transportExpense) +
    parseAmount(form.educationExpense) +
    parseAmount(form.healthcareExpense) +
    parseAmount(form.insuranceExpense) +
    parseAmount(form.familySupportExpense) +
    parseAmount(form.otherEssentialExpense);

  const totalOtherOutflows =
    parseAmount(form.loanRepayments) +
    parseAmount(form.creditCardPayments) +
    parseAmount(form.subscriptionsExpense) +
    parseAmount(form.discretionaryExpense) +
    parseAmount(form.irregularExpense) +
    parseAmount(form.savingsContribution) +
    parseAmount(form.emergencyContribution) +
    parseAmount(form.investmentContribution);

  const totalOutflows = totalEssentialExpenses + totalOtherOutflows;
  const reportedDifference = totalIncome - totalOutflows;

  function updateField(field: keyof CashFlowForm, value: string) {
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

  function toggleTimingOption(key: TimingPressureKey) {
    setTimingPressure((current) => {
      if (key === "noTimingConcern") {
        return {
          ...initialTimingPressure,
          noTimingConcern: !current.noTimingConcern,
        };
      }

      return {
        ...current,
        [key]: !current[key],
        noTimingConcern: false,
      };
    });

    setSelectionError("");
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

    const numericFields: Array<keyof CashFlowForm> = [
      "primaryIncomeAmount",
      "secondaryIncomeAmount",
      "otherIncomeAmount",
      "housingExpense",
      "foodExpense",
      "utilitiesExpense",
      "transportExpense",
      "educationExpense",
      "healthcareExpense",
      "insuranceExpense",
      "familySupportExpense",
      "otherEssentialExpense",
      "loanRepayments",
      "creditCardPayments",
      "subscriptionsExpense",
      "discretionaryExpense",
      "irregularExpense",
      "savingsContribution",
      "emergencyContribution",
      "investmentContribution",
    ];

    for (const field of numericFields) {
      if (form[field].trim() && Number(form[field]) < 0) {
        nextErrors[field] = "Enter zero or a positive amount.";
      }
    }

    const timingSelected = Object.values(timingPressure).some(Boolean);

    if (!timingSelected) {
      setSelectionError("Select at least one payment-timing statement.");
    } else {
      setSelectionError("");
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0 && timingSelected;
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
      "Prototype cash-flow structure completed for this browser session. The calculated totals are illustrative and no information has been stored, reconciled, or verified.",
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
                Participant Portal · HFOS Assessment · Module 02
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
              Cash-flow structure
            </p>

            <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Map how money enters, moves, and leaves the system.
            </h1>

            <p className="mt-8 max-w-2xl text-base leading-8 text-black/65 sm:text-lg">
              This module records participant-reported income, essential
              expenses, financial commitments, savings activity, payment
              timing, and recurring cash-flow pressure.
            </p>
          </div>

          <aside className="border border-black bg-black p-6 text-white sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
              Prototype notice
            </p>

            <p className="mt-5 text-sm leading-7 text-white/80">
              This page does not retrieve bank transactions, reconcile
              accounts, validate income, or calculate a production financial
              diagnosis.
            </p>

            <p className="mt-4 text-sm leading-7 text-white/80">
              Production cash-flow analysis will require verified statements,
              standardised transaction records, reconciliation controls,
              classification review, and institutional audit history.
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
                  Income structure
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  Record the amount, frequency, reliability, and expected
                  continuity of reported income.
                </p>
              </div>

              <div className="border border-black/20 bg-white/40 p-6 sm:p-8 lg:p-10">
                <div className="grid gap-7">
                  <div className="grid gap-7 sm:grid-cols-2">
                    <SelectField
                      id="currency"
                      label="Reporting currency"
                      value={form.currency}
                      error={errors.currency}
                      onChange={updateField}
                      options={[
                        { value: "", label: "Select currency" },
                        { value: "INR", label: "Indian Rupee — INR" },
                        { value: "USD", label: "US Dollar — USD" },
                        { value: "GBP", label: "British Pound — GBP" },
                        { value: "EUR", label: "Euro — EUR" },
                        { value: "AUD", label: "Australian Dollar — AUD" },
                        { value: "CAD", label: "Canadian Dollar — CAD" },
                        { value: "AED", label: "UAE Dirham — AED" },
                        { value: "OTHER", label: "Other currency" },
                      ]}
                    />

                    <SelectField
                      id="assessmentPeriod"
                      label="Assessment period"
                      value={form.assessmentPeriod}
                      error={errors.assessmentPeriod}
                      onChange={updateField}
                      options={[
                        { value: "monthly", label: "Monthly" },
                        { value: "weekly", label: "Weekly" },
                        { value: "annual", label: "Annual" },
                      ]}
                    />
                  </div>

                  <div className="grid gap-7 sm:grid-cols-2">
                    <TextField
                      id="primaryIncomeAmount"
                      label="Primary income amount"
                      value={form.primaryIncomeAmount}
                      placeholder="Enter amount"
                      type="number"
                      error={errors.primaryIncomeAmount}
                      onChange={updateField}
                    />

                    <SelectField
                      id="primaryIncomeFrequency"
                      label="Primary income frequency"
                      value={form.primaryIncomeFrequency}
                      error={errors.primaryIncomeFrequency}
                      onChange={updateField}
                      options={[
                        { value: "", label: "Select frequency" },
                        { value: "weekly", label: "Weekly" },
                        { value: "fortnightly", label: "Fortnightly" },
                        { value: "monthly", label: "Monthly" },
                        { value: "quarterly", label: "Quarterly" },
                        { value: "annual", label: "Annual" },
                        { value: "irregular", label: "Irregular" },
                      ]}
                    />
                  </div>

                  <div className="grid gap-7 sm:grid-cols-2">
                    <TextField
                      id="secondaryIncomeAmount"
                      label="Secondary income amount"
                      value={form.secondaryIncomeAmount}
                      placeholder="Enter 0 if none"
                      type="number"
                      error={errors.secondaryIncomeAmount}
                      onChange={updateField}
                    />

                    <SelectField
                      id="secondaryIncomeFrequency"
                      label="Secondary income frequency"
                      value={form.secondaryIncomeFrequency}
                      error={errors.secondaryIncomeFrequency}
                      onChange={updateField}
                      options={[
                        { value: "", label: "Not applicable / select" },
                        { value: "weekly", label: "Weekly" },
                        { value: "fortnightly", label: "Fortnightly" },
                        { value: "monthly", label: "Monthly" },
                        { value: "quarterly", label: "Quarterly" },
                        { value: "annual", label: "Annual" },
                        { value: "irregular", label: "Irregular" },
                      ]}
                    />
                  </div>

                  <TextField
                    id="otherIncomeAmount"
                    label="Other income"
                    value={form.otherIncomeAmount}
                    placeholder="Enter 0 if none"
                    type="number"
                    error={errors.otherIncomeAmount}
                    onChange={updateField}
                  />

                  <div className="grid gap-7 sm:grid-cols-2">
                    <SelectField
                      id="incomeReliability"
                      label="Income reliability"
                      value={form.incomeReliability}
                      error={errors.incomeReliability}
                      onChange={updateField}
                      options={[
                        { value: "", label: "Select reliability" },
                        { value: "highly-predictable", label: "Highly predictable" },
                        { value: "mostly-predictable", label: "Mostly predictable" },
                        { value: "variable", label: "Variable" },
                        { value: "irregular", label: "Irregular" },
                        { value: "currently-uncertain", label: "Currently uncertain" },
                      ]}
                    />

                    <SelectField
                      id="incomeChangeExpected"
                      label="Expected income change"
                      value={form.incomeChangeExpected}
                      error={errors.incomeChangeExpected}
                      onChange={updateField}
                      options={[
                        { value: "", label: "Select expected change" },
                        { value: "increase", label: "Expected to increase" },
                        { value: "stable", label: "Expected to remain stable" },
                        { value: "decrease", label: "Expected to decrease" },
                        { value: "uncertain", label: "Uncertain" },
                      ]}
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

                <h2 className="mt-4 font-serif text-3xl sm:text-4xl">
                  Essential expenses
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  Record routine expenses required to maintain the household
                  and basic financial continuity.
                </p>
              </div>

              <div className="border border-black/20 bg-white/40 p-6 sm:p-8 lg:p-10">
                <div className="grid gap-7 sm:grid-cols-2">
                  <TextField
                    id="housingExpense"
                    label="Housing"
                    value={form.housingExpense}
                    placeholder="Enter amount"
                    type="number"
                    error={errors.housingExpense}
                    onChange={updateField}
                  />

                  <TextField
                    id="foodExpense"
                    label="Food and groceries"
                    value={form.foodExpense}
                    placeholder="Enter amount"
                    type="number"
                    error={errors.foodExpense}
                    onChange={updateField}
                  />

                  <TextField
                    id="utilitiesExpense"
                    label="Utilities"
                    value={form.utilitiesExpense}
                    placeholder="Enter amount"
                    type="number"
                    error={errors.utilitiesExpense}
                    onChange={updateField}
                  />

                  <TextField
                    id="transportExpense"
                    label="Transport"
                    value={form.transportExpense}
                    placeholder="Enter amount"
                    type="number"
                    error={errors.transportExpense}
                    onChange={updateField}
                  />

                  <TextField
                    id="educationExpense"
                    label="Education"
                    value={form.educationExpense}
                    placeholder="Enter 0 if none"
                    type="number"
                    error={errors.educationExpense}
                    onChange={updateField}
                  />

                  <TextField
                    id="healthcareExpense"
                    label="Healthcare"
                    value={form.healthcareExpense}
                    placeholder="Enter 0 if none"
                    type="number"
                    error={errors.healthcareExpense}
                    onChange={updateField}
                  />

                  <TextField
                    id="insuranceExpense"
                    label="Insurance premiums"
                    value={form.insuranceExpense}
                    placeholder="Enter 0 if none"
                    type="number"
                    error={errors.insuranceExpense}
                    onChange={updateField}
                  />

                  <TextField
                    id="familySupportExpense"
                    label="Family or dependent support"
                    value={form.familySupportExpense}
                    placeholder="Enter 0 if none"
                    type="number"
                    error={errors.familySupportExpense}
                    onChange={updateField}
                  />

                  <TextField
                    id="otherEssentialExpense"
                    label="Other essential expenses"
                    value={form.otherEssentialExpense}
                    placeholder="Enter 0 if none"
                    type="number"
                    error={errors.otherEssentialExpense}
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
                  Commitments and variable spending
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  Record debt payments, recurring non-essential commitments,
                  discretionary spending, and irregular outflows.
                </p>
              </div>

              <div className="border border-black/20 bg-white/40 p-6 sm:p-8 lg:p-10">
                <div className="grid gap-7 sm:grid-cols-2">
                  <TextField
                    id="loanRepayments"
                    label="Loan repayments"
                    value={form.loanRepayments}
                    placeholder="Enter 0 if none"
                    type="number"
                    error={errors.loanRepayments}
                    onChange={updateField}
                  />

                  <TextField
                    id="creditCardPayments"
                    label="Credit-card payments"
                    value={form.creditCardPayments}
                    placeholder="Enter 0 if none"
                    type="number"
                    error={errors.creditCardPayments}
                    onChange={updateField}
                  />

                  <TextField
                    id="subscriptionsExpense"
                    label="Subscriptions and memberships"
                    value={form.subscriptionsExpense}
                    placeholder="Enter 0 if none"
                    type="number"
                    error={errors.subscriptionsExpense}
                    onChange={updateField}
                  />

                  <TextField
                    id="discretionaryExpense"
                    label="Discretionary spending"
                    value={form.discretionaryExpense}
                    placeholder="Enter amount"
                    type="number"
                    error={errors.discretionaryExpense}
                    onChange={updateField}
                  />

                  <TextField
                    id="irregularExpense"
                    label="Average irregular expenses"
                    value={form.irregularExpense}
                    placeholder="Enter 0 if none"
                    type="number"
                    error={errors.irregularExpense}
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
                  Savings and allocation
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  Record regular contributions toward savings, emergency
                  capacity, and investments.
                </p>
              </div>

              <div className="border border-black/20 bg-white/40 p-6 sm:p-8 lg:p-10">
                <div className="grid gap-7 sm:grid-cols-3">
                  <TextField
                    id="savingsContribution"
                    label="General savings"
                    value={form.savingsContribution}
                    placeholder="Enter 0 if none"
                    type="number"
                    error={errors.savingsContribution}
                    onChange={updateField}
                  />

                  <TextField
                    id="emergencyContribution"
                    label="Emergency fund"
                    value={form.emergencyContribution}
                    placeholder="Enter 0 if none"
                    type="number"
                    error={errors.emergencyContribution}
                    onChange={updateField}
                  />

                  <TextField
                    id="investmentContribution"
                    label="Investments"
                    value={form.investmentContribution}
                    placeholder="Enter 0 if none"
                    type="number"
                    error={errors.investmentContribution}
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
                  05
                </p>

                <h2 className="mt-4 font-serif text-3xl sm:text-4xl">
                  Payment timing
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  Identify whether the timing of income and commitments creates
                  temporary pressure even where totals appear sufficient.
                </p>
              </div>

              <div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {timingOptions.map((option) => {
                    const selected = timingPressure[option.key];

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
                          onChange={() => toggleTimingOption(option.key)}
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

                {selectionError && (
                  <p className="mt-4 text-sm text-red-700" role="alert">
                    {selectionError}
                  </p>
                )}

                <div className="mt-5 border border-black/20 bg-white/40 p-6 sm:p-8">
                  <SelectField
                    id="paymentTiming"
                    label="Overall payment-timing condition"
                    value={form.paymentTiming}
                    error={errors.paymentTiming}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select timing condition" },
                      { value: "well-aligned", label: "Income and bills are well aligned" },
                      { value: "minor-mismatch", label: "Occasional minor mismatch" },
                      { value: "recurring-mismatch", label: "Recurring timing mismatch" },
                      { value: "severe-mismatch", label: "Severe or continuous mismatch" },
                      { value: "uncertain", label: "Not yet understood" },
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
                  Cash-flow pressure
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  Record participant-reported signs of shortage, delayed
                  payment, borrowing dependence, and end-of-period position.
                </p>
              </div>

              <div className="border border-black/20 bg-white/40 p-6 sm:p-8 lg:p-10">
                <div className="grid gap-7 sm:grid-cols-2">
                  <SelectField
                    id="shortageFrequency"
                    label="How often does money run short?"
                    value={form.shortageFrequency}
                    error={errors.shortageFrequency}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select frequency" },
                      { value: "never", label: "Never" },
                      { value: "rarely", label: "Rarely" },
                      { value: "some-months", label: "Some months" },
                      { value: "most-months", label: "Most months" },
                      { value: "continuously", label: "Continuously" },
                    ]}
                  />

                  <SelectField
                    id="billDelayFrequency"
                    label="Bills or payments delayed"
                    value={form.billDelayFrequency}
                    error={errors.billDelayFrequency}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select frequency" },
                      { value: "never", label: "Never" },
                      { value: "rarely", label: "Rarely" },
                      { value: "occasionally", label: "Occasionally" },
                      { value: "frequently", label: "Frequently" },
                      { value: "currently-overdue", label: "Currently overdue" },
                    ]}
                  />

                  <SelectField
                    id="borrowingForExpenses"
                    label="Borrowing used for routine expenses"
                    value={form.borrowingForExpenses}
                    error={errors.borrowingForExpenses}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select response" },
                      { value: "never", label: "Never" },
                      { value: "rarely", label: "Rarely" },
                      { value: "occasionally", label: "Occasionally" },
                      { value: "frequently", label: "Frequently" },
                      { value: "dependent", label: "Currently dependent on borrowing" },
                    ]}
                  />

                  <SelectField
                    id="endOfMonthPosition"
                    label="Typical end-of-period position"
                    value={form.endOfMonthPosition}
                    error={errors.endOfMonthPosition}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select position" },
                      { value: "surplus", label: "Money remains after obligations" },
                      { value: "balanced", label: "Approximately balanced" },
                      { value: "small-shortfall", label: "Small shortfall" },
                      { value: "significant-shortfall", label: "Significant shortfall" },
                      { value: "unknown", label: "Not currently known" },
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
                  Reported cash-flow overview
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  These figures are calculated from current form values only.
                  They are not reconciled, verified, or treated as an HFOS
                  diagnosis.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <article className="border border-black bg-black p-6 text-white sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                    Reported income
                  </p>
                  <p className="mt-5 font-serif text-4xl">
                    {formatAmount(totalIncome, form.currency)}
                  </p>
                </article>

                <article className="border border-black/20 bg-white/40 p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                    Reported outflows
                  </p>
                  <p className="mt-5 font-serif text-4xl">
                    {formatAmount(totalOutflows, form.currency)}
                  </p>
                </article>

                <article className="border border-black/20 bg-white/40 p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                    Essential expenses
                  </p>
                  <p className="mt-5 font-serif text-4xl">
                    {formatAmount(totalEssentialExpenses, form.currency)}
                  </p>
                </article>

                <article className="border border-black/20 bg-white/40 p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                    Unreconciled difference
                  </p>
                  <p className="mt-5 font-serif text-4xl">
                    {formatAmount(reportedDifference, form.currency)}
                  </p>
                  <p className="mt-4 text-xs leading-6 text-black/50">
                    A positive or negative figure must not be interpreted as
                    verified surplus or deficit.
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
                  Completion reflects form coverage only and does not establish
                  cash-flow stability or financial capacity.
                </p>
              </div>

              <div>
                <div className="border border-black/25 p-6 sm:p-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                        Module completion
                      </p>

                      <p className="mt-4 font-serif text-5xl">{completion}%</p>
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
                    label="Income structure"
                    value={incomeSectionComplete ? "Completed" : "Not completed"}
                  />
                  <StatusRow
                    label="Essential expenses"
                    value={
                      essentialExpenseComplete ? "Completed" : "Not completed"
                    }
                  />
                  <StatusRow
                    label="Commitments and variable spending"
                    value={
                      obligationExpenseComplete
                        ? "Completed"
                        : "Not completed"
                    }
                  />
                  <StatusRow
                    label="Savings and allocation"
                    value={savingsSectionComplete ? "Completed" : "Not completed"}
                  />
                  <StatusRow
                    label="Payment timing"
                    value={timingSectionComplete ? "Completed" : "Not completed"}
                  />
                  <StatusRow
                    label="Cash-flow pressure"
                    value={
                      pressureSectionComplete ? "Completed" : "Not completed"
                    }
                  />
                  <StatusRow
                    label="Bank-statement reconciliation"
                    value="Not performed"
                  />
                  <StatusRow
                    label="Cash-flow diagnosis"
                    value="Not generated"
                  />
                  <StatusRow label="Database record" value="Not created" />
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
                  router.push("/participant/assessment/financial-profile")
                }
                disabled={isSubmitting}
                className="inline-flex min-h-14 items-center justify-center border border-black px-7 text-sm font-semibold uppercase tracking-[0.14em] transition hover:bg-black hover:text-white disabled:opacity-50"
              >
                Return to Financial Profile
              </button>

              <div className="flex flex-col gap-4 sm:flex-row">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-14 items-center justify-center border border-black px-7 text-sm font-semibold uppercase tracking-[0.14em] transition hover:bg-black hover:text-white disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Completing Module..."
                    : "Complete Cash-Flow Structure"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/participant/assessment/debt-obligations")
                  }
                  disabled={!isCompleted || isSubmitting}
                  className="inline-flex min-h-14 items-center justify-center bg-black px-8 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Continue to Debt and Obligations
                </button>
              </div>
            </div>

            <p className="mt-8 max-w-5xl text-xs leading-6 text-black/50">
              Production cash-flow analysis must use verified transaction
              records, consistent reporting periods, complete category
              coverage, running-balance validation, reconciliation controls,
              reviewer oversight, and institutional audit logging.
            </p>
          </section>
        </form>
      </div>
    </main>
  );
}