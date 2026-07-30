"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type DebtForm = {
  currency: string;

  housingLoanBalance: string;
  housingLoanPayment: string;
  housingLoanStatus: string;

  personalLoanBalance: string;
  personalLoanPayment: string;
  personalLoanStatus: string;

  vehicleLoanBalance: string;
  vehicleLoanPayment: string;
  vehicleLoanStatus: string;

  businessLoanBalance: string;
  businessLoanPayment: string;
  businessLoanStatus: string;

  educationLoanBalance: string;
  educationLoanPayment: string;
  educationLoanStatus: string;

  creditCardBalance: string;
  creditCardMinimumPayment: string;
  creditCardStatus: string;

  medicalDebtBalance: string;
  medicalDebtPayment: string;
  medicalDebtStatus: string;

  otherDebtBalance: string;
  otherDebtPayment: string;
  otherDebtStatus: string;

  overdueAmount: string;
  overdueAccounts: string;
  missedPayments: string;
  collectionContact: string;
  legalAction: string;

  repaymentBurden: string;
  borrowingDependency: string;
  creditorPressure: string;
  debtPriority: string;
};

type DebtKey =
  | "housingLoan"
  | "personalLoan"
  | "vehicleLoan"
  | "businessLoan"
  | "educationLoan"
  | "creditCard"
  | "medicalDebt"
  | "otherDebt"
  | "noDebt";

type DebtSelections = Record<DebtKey, boolean>;

type FormErrors = Partial<Record<keyof DebtForm, string>>;

const initialForm: DebtForm = {
  currency: "INR",

  housingLoanBalance: "0",
  housingLoanPayment: "0",
  housingLoanStatus: "not-applicable",

  personalLoanBalance: "0",
  personalLoanPayment: "0",
  personalLoanStatus: "not-applicable",

  vehicleLoanBalance: "0",
  vehicleLoanPayment: "0",
  vehicleLoanStatus: "not-applicable",

  businessLoanBalance: "0",
  businessLoanPayment: "0",
  businessLoanStatus: "not-applicable",

  educationLoanBalance: "0",
  educationLoanPayment: "0",
  educationLoanStatus: "not-applicable",

  creditCardBalance: "0",
  creditCardMinimumPayment: "0",
  creditCardStatus: "not-applicable",

  medicalDebtBalance: "0",
  medicalDebtPayment: "0",
  medicalDebtStatus: "not-applicable",

  otherDebtBalance: "0",
  otherDebtPayment: "0",
  otherDebtStatus: "not-applicable",

  overdueAmount: "0",
  overdueAccounts: "0",
  missedPayments: "",
  collectionContact: "",
  legalAction: "",

  repaymentBurden: "",
  borrowingDependency: "",
  creditorPressure: "",
  debtPriority: "",
};

const initialSelections: DebtSelections = {
  housingLoan: false,
  personalLoan: false,
  vehicleLoan: false,
  businessLoan: false,
  educationLoan: false,
  creditCard: false,
  medicalDebt: false,
  otherDebt: false,
  noDebt: false,
};

const debtOptions: Array<{ key: DebtKey; label: string }> = [
  { key: "housingLoan", label: "Housing loan" },
  { key: "personalLoan", label: "Personal loan" },
  { key: "vehicleLoan", label: "Vehicle loan" },
  { key: "businessLoan", label: "Business loan" },
  { key: "educationLoan", label: "Education loan" },
  { key: "creditCard", label: "Credit-card balance" },
  { key: "medicalDebt", label: "Medical debt" },
  { key: "otherDebt", label: "Other obligation" },
  { key: "noDebt", label: "No current debt reported" },
];

const debtStatusOptions = [
  { value: "not-applicable", label: "Not applicable" },
  { value: "current", label: "Current and paid on time" },
  { value: "occasionally-late", label: "Occasionally late" },
  { value: "overdue", label: "Currently overdue" },
  { value: "restructured", label: "Restructured" },
  { value: "settlement-discussion", label: "Settlement discussion" },
  { value: "collection", label: "Collection activity" },
  { value: "legal-action", label: "Legal action reported" },
  { value: "closed", label: "Closed" },
  { value: "unknown", label: "Status unknown" },
];

const requiredFields: Array<keyof DebtForm> = [
  "currency",
  "missedPayments",
  "collectionContact",
  "legalAction",
  "repaymentBurden",
  "borrowingDependency",
  "creditorPressure",
  "debtPriority",
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

function NumberField({
  id,
  label,
  value,
  error,
  onChange,
}: {
  id: keyof DebtForm;
  label: string;
  value: string;
  error?: string;
  onChange: (field: keyof DebtForm, value: string) => void;
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
  id: keyof DebtForm;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
  onChange: (field: keyof DebtForm, value: string) => void;
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

function DebtDetailCard({
  title,
  balanceField,
  paymentField,
  statusField,
  form,
  errors,
  updateField,
}: {
  title: string;
  balanceField: keyof DebtForm;
  paymentField: keyof DebtForm;
  statusField: keyof DebtForm;
  form: DebtForm;
  errors: FormErrors;
  updateField: (field: keyof DebtForm, value: string) => void;
}) {
  return (
    <article className="border border-black/20 bg-white/40 p-6 sm:p-8">
      <h3 className="font-serif text-2xl">{title}</h3>

      <div className="mt-6 grid gap-6">
        <NumberField
          id={balanceField}
          label="Outstanding balance"
          value={form[balanceField]}
          error={errors[balanceField]}
          onChange={updateField}
        />

        <NumberField
          id={paymentField}
          label="Regular repayment amount"
          value={form[paymentField]}
          error={errors[paymentField]}
          onChange={updateField}
        />

        <SelectField
          id={statusField}
          label="Current account status"
          value={form[statusField]}
          options={debtStatusOptions}
          error={errors[statusField]}
          onChange={updateField}
        />
      </div>
    </article>
  );
}

export default function DebtAndObligationsPage() {
  const router = useRouter();

  const [form, setForm] = useState<DebtForm>(initialForm);
  const [selections, setSelections] =
    useState<DebtSelections>(initialSelections);

  const [errors, setErrors] = useState<FormErrors>({});
  const [selectionError, setSelectionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const selectedDebtCount = Object.entries(selections).filter(
    ([key, value]) => key !== "noDebt" && value,
  ).length;

  const debtSelectionComplete =
    selections.noDebt || selectedDebtCount > 0;

  const exposureSectionComplete = useMemo(() => {
    if (selections.noDebt) return true;

    const selectedFields: Array<[DebtKey, keyof DebtForm, keyof DebtForm]> = [
      ["housingLoan", "housingLoanBalance", "housingLoanPayment"],
      ["personalLoan", "personalLoanBalance", "personalLoanPayment"],
      ["vehicleLoan", "vehicleLoanBalance", "vehicleLoanPayment"],
      ["businessLoan", "businessLoanBalance", "businessLoanPayment"],
      ["educationLoan", "educationLoanBalance", "educationLoanPayment"],
      ["creditCard", "creditCardBalance", "creditCardMinimumPayment"],
      ["medicalDebt", "medicalDebtBalance", "medicalDebtPayment"],
      ["otherDebt", "otherDebtBalance", "otherDebtPayment"],
    ];

    return selectedFields
      .filter(([key]) => selections[key])
      .every(
        ([, balanceField, paymentField]) =>
          form[balanceField].trim() !== "" &&
          form[paymentField].trim() !== "",
      );
  }, [form, selections]);

  const arrearsSectionComplete = Boolean(
    form.overdueAmount.trim() &&
      form.overdueAccounts.trim() &&
      form.missedPayments &&
      form.collectionContact &&
      form.legalAction,
  );

  const pressureSectionComplete = Boolean(
    form.repaymentBurden &&
      form.borrowingDependency &&
      form.creditorPressure &&
      form.debtPriority,
  );

  const completedSections = [
    debtSelectionComplete,
    exposureSectionComplete,
    arrearsSectionComplete,
    pressureSectionComplete,
  ].filter(Boolean).length;

  const completion = Math.round((completedSections / 4) * 100);

  const totalDebt =
    parseAmount(form.housingLoanBalance) +
    parseAmount(form.personalLoanBalance) +
    parseAmount(form.vehicleLoanBalance) +
    parseAmount(form.businessLoanBalance) +
    parseAmount(form.educationLoanBalance) +
    parseAmount(form.creditCardBalance) +
    parseAmount(form.medicalDebtBalance) +
    parseAmount(form.otherDebtBalance);

  const totalRepayments =
    parseAmount(form.housingLoanPayment) +
    parseAmount(form.personalLoanPayment) +
    parseAmount(form.vehicleLoanPayment) +
    parseAmount(form.businessLoanPayment) +
    parseAmount(form.educationLoanPayment) +
    parseAmount(form.creditCardMinimumPayment) +
    parseAmount(form.medicalDebtPayment) +
    parseAmount(form.otherDebtPayment);

  function updateField(field: keyof DebtForm, value: string) {
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

  function toggleDebt(key: DebtKey) {
    setSelections((current) => {
      if (key === "noDebt") {
        return {
          ...initialSelections,
          noDebt: !current.noDebt,
        };
      }

      return {
        ...current,
        [key]: !current[key],
        noDebt: false,
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

    const numericFields: Array<keyof DebtForm> = [
      "housingLoanBalance",
      "housingLoanPayment",
      "personalLoanBalance",
      "personalLoanPayment",
      "vehicleLoanBalance",
      "vehicleLoanPayment",
      "businessLoanBalance",
      "businessLoanPayment",
      "educationLoanBalance",
      "educationLoanPayment",
      "creditCardBalance",
      "creditCardMinimumPayment",
      "medicalDebtBalance",
      "medicalDebtPayment",
      "otherDebtBalance",
      "otherDebtPayment",
      "overdueAmount",
      "overdueAccounts",
    ];

    for (const field of numericFields) {
      if (form[field].trim() && Number(form[field]) < 0) {
        nextErrors[field] = "Enter zero or a positive amount.";
      }
    }

    if (!debtSelectionComplete) {
      setSelectionError(
        "Select at least one obligation or choose no current debt reported.",
      );
    } else {
      setSelectionError("");
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors).length === 0 &&
      debtSelectionComplete &&
      exposureSectionComplete
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
      "Prototype debt and obligations module completed for this browser session. No creditor record, bureau data, repayment history, or legal status has been verified or stored.",
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
                Participant Portal · HFOS Assessment · Module 03
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
              Debt and obligations
            </p>

            <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Understand what the financial system is required to carry.
            </h1>

            <p className="mt-8 max-w-2xl text-base leading-8 text-black/65 sm:text-lg">
              This module records participant-reported debt balances,
              repayments, account condition, overdue exposure, creditor
              pressure, and borrowing dependency.
            </p>
          </div>

          <aside className="border border-black bg-black p-6 text-white sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
              Prototype notice
            </p>

            <p className="mt-5 text-sm leading-7 text-white/80">
              This page does not retrieve credit-bureau records, lender
              statements, legal notices, repayment history, or settlement
              information.
            </p>

            <p className="mt-4 text-sm leading-7 text-white/80">
              Production debt assessment will require validated creditor
              records, account reconciliation, status confirmation, repayment
              history, evidence review, and institutional oversight.
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
                  Obligation categories
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  Select every category currently reported by the participant.
                  Choose no current debt only where no obligation is reported.
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
                  {debtOptions.map((option) => {
                    const selected = selections[option.key];

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
                          onChange={() => toggleDebt(option.key)}
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
                  Debt exposure
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  Record reported balances, regular payments, and account
                  condition for selected obligations.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {selections.noDebt && (
                  <div className="border border-black bg-black p-8 text-white sm:col-span-2">
                    <p className="font-serif text-3xl">
                      No current debt reported.
                    </p>
                    <p className="mt-4 text-sm leading-7 text-white/70">
                      This remains participant-reported information and has not
                      been validated against financial records.
                    </p>
                  </div>
                )}

                {selections.housingLoan && (
                  <DebtDetailCard
                    title="Housing loan"
                    balanceField="housingLoanBalance"
                    paymentField="housingLoanPayment"
                    statusField="housingLoanStatus"
                    form={form}
                    errors={errors}
                    updateField={updateField}
                  />
                )}

                {selections.personalLoan && (
                  <DebtDetailCard
                    title="Personal loan"
                    balanceField="personalLoanBalance"
                    paymentField="personalLoanPayment"
                    statusField="personalLoanStatus"
                    form={form}
                    errors={errors}
                    updateField={updateField}
                  />
                )}

                {selections.vehicleLoan && (
                  <DebtDetailCard
                    title="Vehicle loan"
                    balanceField="vehicleLoanBalance"
                    paymentField="vehicleLoanPayment"
                    statusField="vehicleLoanStatus"
                    form={form}
                    errors={errors}
                    updateField={updateField}
                  />
                )}

                {selections.businessLoan && (
                  <DebtDetailCard
                    title="Business loan"
                    balanceField="businessLoanBalance"
                    paymentField="businessLoanPayment"
                    statusField="businessLoanStatus"
                    form={form}
                    errors={errors}
                    updateField={updateField}
                  />
                )}

                {selections.educationLoan && (
                  <DebtDetailCard
                    title="Education loan"
                    balanceField="educationLoanBalance"
                    paymentField="educationLoanPayment"
                    statusField="educationLoanStatus"
                    form={form}
                    errors={errors}
                    updateField={updateField}
                  />
                )}

                {selections.creditCard && (
                  <DebtDetailCard
                    title="Credit-card balance"
                    balanceField="creditCardBalance"
                    paymentField="creditCardMinimumPayment"
                    statusField="creditCardStatus"
                    form={form}
                    errors={errors}
                    updateField={updateField}
                  />
                )}

                {selections.medicalDebt && (
                  <DebtDetailCard
                    title="Medical debt"
                    balanceField="medicalDebtBalance"
                    paymentField="medicalDebtPayment"
                    statusField="medicalDebtStatus"
                    form={form}
                    errors={errors}
                    updateField={updateField}
                  />
                )}

                {selections.otherDebt && (
                  <DebtDetailCard
                    title="Other obligation"
                    balanceField="otherDebtBalance"
                    paymentField="otherDebtPayment"
                    statusField="otherDebtStatus"
                    form={form}
                    errors={errors}
                    updateField={updateField}
                  />
                )}
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
                  Arrears and escalation
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  Record missed payments, overdue exposure, collection
                  activity, and reported legal escalation.
                </p>
              </div>

              <div className="border border-black/20 bg-white/40 p-6 sm:p-8 lg:p-10">
                <div className="grid gap-7 sm:grid-cols-2">
                  <NumberField
                    id="overdueAmount"
                    label="Total reported overdue amount"
                    value={form.overdueAmount}
                    error={errors.overdueAmount}
                    onChange={updateField}
                  />

                  <NumberField
                    id="overdueAccounts"
                    label="Number of overdue accounts"
                    value={form.overdueAccounts}
                    error={errors.overdueAccounts}
                    onChange={updateField}
                  />

                  <SelectField
                    id="missedPayments"
                    label="Missed-payment frequency"
                    value={form.missedPayments}
                    error={errors.missedPayments}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select frequency" },
                      { value: "none", label: "No missed payments reported" },
                      { value: "rare", label: "Rare" },
                      { value: "occasional", label: "Occasional" },
                      { value: "frequent", label: "Frequent" },
                      { value: "continuous", label: "Continuous arrears" },
                    ]}
                  />

                  <SelectField
                    id="collectionContact"
                    label="Collection contact"
                    value={form.collectionContact}
                    error={errors.collectionContact}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select response" },
                      { value: "none", label: "No collection contact" },
                      { value: "reminders", label: "Payment reminders only" },
                      { value: "regular-calls", label: "Regular collection calls" },
                      { value: "field-visits", label: "Field visits reported" },
                      { value: "agency", label: "External agency involved" },
                    ]}
                  />

                  <SelectField
                    id="legalAction"
                    label="Legal or formal action"
                    value={form.legalAction}
                    error={errors.legalAction}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select response" },
                      { value: "none", label: "None reported" },
                      { value: "notice", label: "Formal notice received" },
                      { value: "arbitration", label: "Arbitration reported" },
                      { value: "court", label: "Court proceeding reported" },
                      { value: "unknown", label: "Unknown" },
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
                  04
                </p>

                <h2 className="mt-4 font-serif text-3xl sm:text-4xl">
                  Debt pressure
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  Record how repayment obligations affect cash flow,
                  decision-making, and household stability.
                </p>
              </div>

              <div className="border border-black/20 bg-white/40 p-6 sm:p-8 lg:p-10">
                <div className="grid gap-7 sm:grid-cols-2">
                  <SelectField
                    id="repaymentBurden"
                    label="Repayment burden"
                    value={form.repaymentBurden}
                    error={errors.repaymentBurden}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select condition" },
                      { value: "none", label: "No repayment burden reported" },
                      { value: "manageable", label: "Manageable" },
                      { value: "restrictive", label: "Restricts monthly flexibility" },
                      { value: "severe", label: "Severe pressure" },
                      { value: "unsustainable", label: "Currently unsustainable" },
                    ]}
                  />

                  <SelectField
                    id="borrowingDependency"
                    label="Dependency on new borrowing"
                    value={form.borrowingDependency}
                    error={errors.borrowingDependency}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select condition" },
                      { value: "none", label: "No new borrowing dependency" },
                      { value: "rare", label: "Rare" },
                      { value: "occasional", label: "Occasional" },
                      { value: "frequent", label: "Frequent" },
                      { value: "continuous", label: "Continuous dependency" },
                    ]}
                  />

                  <SelectField
                    id="creditorPressure"
                    label="Creditor pressure"
                    value={form.creditorPressure}
                    error={errors.creditorPressure}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select condition" },
                      { value: "none", label: "None reported" },
                      { value: "low", label: "Low" },
                      { value: "moderate", label: "Moderate" },
                      { value: "high", label: "High" },
                      { value: "critical", label: "Critical" },
                    ]}
                  />

                  <SelectField
                    id="debtPriority"
                    label="Current debt priority"
                    value={form.debtPriority}
                    error={errors.debtPriority}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select priority" },
                      { value: "maintain", label: "Maintain current repayment" },
                      { value: "reduce", label: "Reduce balances" },
                      { value: "regularise", label: "Regularise overdue accounts" },
                      { value: "restructure", label: "Explore restructuring" },
                      { value: "legal-review", label: "Legal or professional review required" },
                      { value: "none", label: "No debt priority reported" },
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
                  Reported debt overview
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  Figures below reflect current form inputs only. They do not
                  represent verified lender balances or a formal debt
                  diagnosis.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <article className="border border-black bg-black p-6 text-white sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                    Total reported debt
                  </p>
                  <p className="mt-5 font-serif text-4xl">
                    {formatAmount(totalDebt, form.currency)}
                  </p>
                </article>

                <article className="border border-black/20 bg-white/40 p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                    Regular repayments
                  </p>
                  <p className="mt-5 font-serif text-4xl">
                    {formatAmount(totalRepayments, form.currency)}
                  </p>
                </article>

                <article className="border border-black/20 bg-white/40 p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                    Reported overdue amount
                  </p>
                  <p className="mt-5 font-serif text-4xl">
                    {formatAmount(
                      parseAmount(form.overdueAmount),
                      form.currency,
                    )}
                  </p>
                </article>

                <article className="border border-black/20 bg-white/40 p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                    Selected obligation categories
                  </p>
                  <p className="mt-5 font-serif text-4xl">
                    {selections.noDebt ? "0" : selectedDebtCount}
                  </p>
                </article>
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
                  Prototype completion status
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  Completion reflects form coverage only. It does not confirm
                  debt validity, lender status, credit reporting, or legal
                  position.
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
                      {completedSections} of 4 sections completed
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
                    label="Obligation categories"
                    value={
                      debtSelectionComplete ? "Completed" : "Not completed"
                    }
                  />
                  <StatusRow
                    label="Debt exposure"
                    value={
                      exposureSectionComplete ? "Completed" : "Not completed"
                    }
                  />
                  <StatusRow
                    label="Arrears and escalation"
                    value={
                      arrearsSectionComplete ? "Completed" : "Not completed"
                    }
                  />
                  <StatusRow
                    label="Debt pressure"
                    value={
                      pressureSectionComplete ? "Completed" : "Not completed"
                    }
                  />
                  <StatusRow
                    label="Lender statement validation"
                    value="Not performed"
                  />
                  <StatusRow
                    label="Credit-bureau validation"
                    value="Not performed"
                  />
                  <StatusRow
                    label="Legal-status verification"
                    value="Not performed"
                  />
                  <StatusRow
                    label="Debt diagnosis"
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
                  router.push("/participant/assessment/cash-flow")
                }
                disabled={isSubmitting}
                className="inline-flex min-h-14 items-center justify-center border border-black px-7 text-sm font-semibold uppercase tracking-[0.14em] transition hover:bg-black hover:text-white disabled:opacity-50"
              >
                Return to Cash-Flow Structure
              </button>

              <div className="flex flex-col gap-4 sm:flex-row">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-14 items-center justify-center border border-black px-7 text-sm font-semibold uppercase tracking-[0.14em] transition hover:bg-black hover:text-white disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Completing Module..."
                    : "Complete Debt and Obligations"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/participant/assessment/stability-margin")
                  }
                  disabled={!isCompleted || isSubmitting}
                  className="inline-flex min-h-14 items-center justify-center bg-black px-8 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Continue to Stability and Margin
                </button>
              </div>
            </div>

            <p className="mt-8 max-w-5xl text-xs leading-6 text-black/50">
              Production debt assessment must distinguish participant-reported
              information from validated creditor evidence, preserve original
              lender records, confirm account status, reconcile balances,
              document disputes, maintain legal-review controls, and retain a
              complete audit history.
            </p>
          </section>
        </form>
      </div>
    </main>
  );
}