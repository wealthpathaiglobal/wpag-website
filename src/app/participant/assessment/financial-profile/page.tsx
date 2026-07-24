"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type FinancialProfileForm = {
  fullName: string;
  age: string;
  gender: string;
  country: string;
  stateProvince: string;
  city: string;
  postalCode: string;

  maritalStatus: string;
  householdMembers: string;
  financialDependents: string;
  primaryResidence: string;
  housingType: string;
  livingArrangement: string;

  employmentStatus: string;
  occupation: string;
  employer: string;
  industry: string;
  yearsInRole: string;

  primaryMonthlyIncome: string;
  secondaryIncome: string;
  householdIncome: string;
  incomeFrequency: string;
  primaryIncomeSource: string;
};

type FormErrors = Partial<Record<keyof FinancialProfileForm, string>>;

type AssetKey =
  | "savings"
  | "currentAccount"
  | "property"
  | "vehicle"
  | "investments"
  | "businessOwnership"
  | "retirementFund"
  | "other";

type ObligationKey =
  | "housingLoan"
  | "personalLoan"
  | "vehicleLoan"
  | "creditCard"
  | "businessLoan"
  | "educationLoan"
  | "medicalDebt"
  | "other";

type SelectionState<T extends string> = Record<T, boolean>;

const initialForm: FinancialProfileForm = {
  fullName: "",
  age: "",
  gender: "",
  country: "",
  stateProvince: "",
  city: "",
  postalCode: "",

  maritalStatus: "",
  householdMembers: "",
  financialDependents: "",
  primaryResidence: "",
  housingType: "",
  livingArrangement: "",

  employmentStatus: "",
  occupation: "",
  employer: "",
  industry: "",
  yearsInRole: "",

  primaryMonthlyIncome: "",
  secondaryIncome: "",
  householdIncome: "",
  incomeFrequency: "",
  primaryIncomeSource: "",
};

const initialAssets: SelectionState<AssetKey> = {
  savings: false,
  currentAccount: false,
  property: false,
  vehicle: false,
  investments: false,
  businessOwnership: false,
  retirementFund: false,
  other: false,
};

const initialObligations: SelectionState<ObligationKey> = {
  housingLoan: false,
  personalLoan: false,
  vehicleLoan: false,
  creditCard: false,
  businessLoan: false,
  educationLoan: false,
  medicalDebt: false,
  other: false,
};

const assetOptions: Array<{ key: AssetKey; label: string }> = [
  { key: "savings", label: "Savings" },
  { key: "currentAccount", label: "Current account" },
  { key: "property", label: "Property" },
  { key: "vehicle", label: "Vehicle" },
  { key: "investments", label: "Investments" },
  { key: "businessOwnership", label: "Business ownership" },
  { key: "retirementFund", label: "Retirement fund" },
  { key: "other", label: "Other" },
];

const obligationOptions: Array<{
  key: ObligationKey;
  label: string;
}> = [
  { key: "housingLoan", label: "Housing loan" },
  { key: "personalLoan", label: "Personal loan" },
  { key: "vehicleLoan", label: "Vehicle loan" },
  { key: "creditCard", label: "Credit card" },
  { key: "businessLoan", label: "Business loan" },
  { key: "educationLoan", label: "Education loan" },
  { key: "medicalDebt", label: "Medical debt" },
  { key: "other", label: "Other" },
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

function TextField({
  id,
  label,
  value,
  placeholder,
  type = "text",
  error,
  onChange,
}: {
  id: keyof FinancialProfileForm;
  label: string;
  value: string;
  placeholder: string;
  type?: string;
  error?: string;
  onChange: (
    field: keyof FinancialProfileForm,
    value: string,
  ) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-black">
        {label}
      </label>

      <input
        id={id}
        name={id}
        type={type}
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

export default function FinancialProfileModulePage() {
  const router = useRouter();

  const [form, setForm] = useState<FinancialProfileForm>(initialForm);
  const [assets, setAssets] =
    useState<SelectionState<AssetKey>>(initialAssets);
  const [obligations, setObligations] =
    useState<SelectionState<ObligationKey>>(initialObligations);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const identityComplete = useMemo(
    () =>
      Boolean(
        form.fullName.trim() &&
          form.age.trim() &&
          form.gender &&
          form.country.trim() &&
          form.city.trim(),
      ),
    [form],
  );

  const householdComplete = useMemo(
    () =>
      Boolean(
        form.maritalStatus &&
          form.householdMembers.trim() &&
          form.financialDependents.trim() &&
          form.housingType &&
          form.livingArrangement.trim(),
      ),
    [form],
  );

  const employmentComplete = useMemo(
    () =>
      Boolean(
        form.employmentStatus &&
          form.occupation.trim() &&
          form.industry.trim(),
      ),
    [form],
  );

  const incomeComplete = useMemo(
    () =>
      Boolean(
        form.primaryMonthlyIncome.trim() &&
          form.householdIncome.trim() &&
          form.incomeFrequency &&
          form.primaryIncomeSource.trim(),
      ),
    [form],
  );

  const assetsComplete = useMemo(
    () => Object.values(assets).some(Boolean),
    [assets],
  );

  const obligationsComplete = useMemo(
    () => Object.values(obligations).some(Boolean),
    [obligations],
  );

  const completedSections = [
    identityComplete,
    householdComplete,
    employmentComplete,
    incomeComplete,
    assetsComplete,
    obligationsComplete,
  ].filter(Boolean).length;

  const completion = Math.round((completedSections / 6) * 100);

  function updateField(
    field: keyof FinancialProfileForm,
    value: string,
  ) {
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

    if (successMessage) {
      setSuccessMessage("");
    }

    if (isCompleted) {
      setIsCompleted(false);
    }
  }

  function toggleAsset(key: AssetKey) {
    setAssets((current) => ({
      ...current,
      [key]: !current[key],
    }));

    if (isCompleted) {
      setIsCompleted(false);
    }

    if (successMessage) {
      setSuccessMessage("");
    }
  }

  function toggleObligation(key: ObligationKey) {
    setObligations((current) => ({
      ...current,
      [key]: !current[key],
    }));

    if (isCompleted) {
      setIsCompleted(false);
    }

    if (successMessage) {
      setSuccessMessage("");
    }
  }

  function validateForm() {
    const nextErrors: FormErrors = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Enter the participant's full name.";
    }

    if (!form.age.trim()) {
      nextErrors.age = "Enter the participant's age.";
    } else {
      const age = Number(form.age);

      if (!Number.isInteger(age) || age < 18 || age > 120) {
        nextErrors.age = "Enter a valid age between 18 and 120.";
      }
    }

    if (!form.gender) {
      nextErrors.gender = "Select a gender option.";
    }

    if (!form.country.trim()) {
      nextErrors.country = "Enter the participant's country.";
    }

    if (!form.city.trim()) {
      nextErrors.city = "Enter the participant's city.";
    }

    if (!form.maritalStatus) {
      nextErrors.maritalStatus = "Select marital status.";
    }

    if (!form.householdMembers.trim()) {
      nextErrors.householdMembers =
        "Enter the number of household members.";
    }

    if (!form.financialDependents.trim()) {
      nextErrors.financialDependents =
        "Enter the number of financial dependents.";
    }

    if (!form.housingType) {
      nextErrors.housingType = "Select a housing type.";
    }

    if (!form.livingArrangement.trim()) {
      nextErrors.livingArrangement =
        "Enter the participant's living arrangement.";
    }

    if (!form.employmentStatus) {
      nextErrors.employmentStatus =
        "Select the participant's employment status.";
    }

    if (!form.occupation.trim()) {
      nextErrors.occupation = "Enter the participant's occupation.";
    }

    if (!form.industry.trim()) {
      nextErrors.industry = "Enter the participant's industry.";
    }

    if (!form.primaryMonthlyIncome.trim()) {
      nextErrors.primaryMonthlyIncome =
        "Enter the participant's primary monthly income.";
    }

    if (!form.householdIncome.trim()) {
      nextErrors.householdIncome =
        "Enter the total household income.";
    }

    if (!form.incomeFrequency) {
      nextErrors.incomeFrequency = "Select an income frequency.";
    }

    if (!form.primaryIncomeSource.trim()) {
      nextErrors.primaryIncomeSource =
        "Enter the primary income source.";
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors).length === 0 &&
      assetsComplete &&
      obligationsComplete
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
      "Prototype financial profile completed for this browser session. No information has been stored or verified.",
    );
  }

  function handleReturn() {
    router.push("/participant/assessment");
  }

  function handleContinue() {
    router.push("/participant/assessment/cash-flow");
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
                Participant Portal · HFOS Assessment · Module 01
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
              Financial profile
            </p>

            <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Establish the participant&apos;s financial context.
            </h1>

            <p className="mt-8 max-w-2xl text-base leading-8 text-black/65 sm:text-lg">
              This module records household structure, employment, income,
              assets, and financial responsibilities. Information entered here
              remains participant-provided and unverified.
            </p>
          </div>

          <aside className="border border-black bg-black p-6 text-white sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
              Prototype notice
            </p>

            <p className="mt-5 text-sm leading-7 text-white/80">
              This prototype does not store participant information or create
              a permanent financial profile.
            </p>

            <p className="mt-4 text-sm leading-7 text-white/80">
              Production deployment will require authenticated records,
              encrypted storage, evidence validation, access controls, audit
              logging, and institutional governance.
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
                  Participant identity
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  Record the participant&apos;s basic identity and location
                  context.
                </p>
              </div>

              <div className="border border-black/20 bg-white/40 p-6 sm:p-8 lg:p-10">
                <div className="grid gap-7">
                  <TextField
                    id="fullName"
                    label="Full name"
                    value={form.fullName}
                    placeholder="Enter full name"
                    error={errors.fullName}
                    onChange={updateField}
                  />

                  <div className="grid gap-7 sm:grid-cols-2">
                    <TextField
                      id="age"
                      label="Age"
                      value={form.age}
                      placeholder="Enter age"
                      type="number"
                      error={errors.age}
                      onChange={updateField}
                    />

                    <div>
                      <label
                        htmlFor="gender"
                        className="block text-sm font-medium text-black"
                      >
                        Gender
                      </label>

                      <select
                        id="gender"
                        value={form.gender}
                        onChange={(event) =>
                          updateField("gender", event.target.value)
                        }
                        className="mt-3 w-full border border-black/30 bg-transparent px-4 py-4 text-base outline-none transition focus:border-black"
                      >
                        <option value="">Select gender</option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="non-binary">Non-binary</option>
                        <option value="prefer-not-to-say">
                          Prefer not to say
                        </option>
                        <option value="other">Other</option>
                      </select>

                      <FieldError message={errors.gender} />
                    </div>
                  </div>

                  <div className="grid gap-7 sm:grid-cols-2">
                    <TextField
                      id="country"
                      label="Country"
                      value={form.country}
                      placeholder="Enter country"
                      error={errors.country}
                      onChange={updateField}
                    />

                    <TextField
                      id="stateProvince"
                      label="State or province"
                      value={form.stateProvince}
                      placeholder="Enter state or province"
                      error={errors.stateProvince}
                      onChange={updateField}
                    />
                  </div>

                  <div className="grid gap-7 sm:grid-cols-2">
                    <TextField
                      id="city"
                      label="City"
                      value={form.city}
                      placeholder="Enter city"
                      error={errors.city}
                      onChange={updateField}
                    />

                    <TextField
                      id="postalCode"
                      label="Postal code"
                      value={form.postalCode}
                      placeholder="Enter postal code"
                      error={errors.postalCode}
                      onChange={updateField}
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
                  Household information
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  Establish household size, dependency, housing, and living
                  responsibilities.
                </p>
              </div>

              <div className="border border-black/20 bg-white/40 p-6 sm:p-8 lg:p-10">
                <div className="grid gap-7">
                  <div className="grid gap-7 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="maritalStatus"
                        className="block text-sm font-medium text-black"
                      >
                        Marital status
                      </label>

                      <select
                        id="maritalStatus"
                        value={form.maritalStatus}
                        onChange={(event) =>
                          updateField(
                            "maritalStatus",
                            event.target.value,
                          )
                        }
                        className="mt-3 w-full border border-black/30 bg-transparent px-4 py-4 text-base outline-none transition focus:border-black"
                      >
                        <option value="">Select marital status</option>
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                        <option value="separated">Separated</option>
                        <option value="divorced">Divorced</option>
                        <option value="widowed">Widowed</option>
                        <option value="other">Other</option>
                      </select>

                      <FieldError message={errors.maritalStatus} />
                    </div>

                    <TextField
                      id="householdMembers"
                      label="Household members"
                      value={form.householdMembers}
                      placeholder="Enter household size"
                      type="number"
                      error={errors.householdMembers}
                      onChange={updateField}
                    />
                  </div>

                  <div className="grid gap-7 sm:grid-cols-2">
                    <TextField
                      id="financialDependents"
                      label="Financial dependents"
                      value={form.financialDependents}
                      placeholder="Enter number of dependents"
                      type="number"
                      error={errors.financialDependents}
                      onChange={updateField}
                    />

                    <TextField
                      id="primaryResidence"
                      label="Primary residence"
                      value={form.primaryResidence}
                      placeholder="Enter primary residence"
                      error={errors.primaryResidence}
                      onChange={updateField}
                    />
                  </div>

                  <div className="grid gap-7 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="housingType"
                        className="block text-sm font-medium text-black"
                      >
                        Housing type
                      </label>

                      <select
                        id="housingType"
                        value={form.housingType}
                        onChange={(event) =>
                          updateField("housingType", event.target.value)
                        }
                        className="mt-3 w-full border border-black/30 bg-transparent px-4 py-4 text-base outline-none transition focus:border-black"
                      >
                        <option value="">Select housing type</option>
                        <option value="owned">Owned</option>
                        <option value="rented">Rented</option>
                        <option value="family-home">Family home</option>
                        <option value="employer-housing">
                          Employer housing
                        </option>
                        <option value="other">Other</option>
                      </select>

                      <FieldError message={errors.housingType} />
                    </div>

                    <TextField
                      id="livingArrangement"
                      label="Living arrangement"
                      value={form.livingArrangement}
                      placeholder="Describe living arrangement"
                      error={errors.livingArrangement}
                      onChange={updateField}
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
                  03
                </p>

                <h2 className="mt-4 font-serif text-3xl tracking-[-0.025em] sm:text-4xl">
                  Employment
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  Record current employment structure and income-related work
                  context.
                </p>
              </div>

              <div className="border border-black/20 bg-white/40 p-6 sm:p-8 lg:p-10">
                <div className="grid gap-7">
                  <div>
                    <label
                      htmlFor="employmentStatus"
                      className="block text-sm font-medium text-black"
                    >
                      Employment status
                    </label>

                    <select
                      id="employmentStatus"
                      value={form.employmentStatus}
                      onChange={(event) =>
                        updateField(
                          "employmentStatus",
                          event.target.value,
                        )
                      }
                      className="mt-3 w-full border border-black/30 bg-transparent px-4 py-4 text-base outline-none transition focus:border-black"
                    >
                      <option value="">Select employment status</option>
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="self-employed">Self-employed</option>
                      <option value="business-owner">
                        Business owner
                      </option>
                      <option value="contract">Contract</option>
                      <option value="retired">Retired</option>
                      <option value="student">Student</option>
                      <option value="unemployed">Unemployed</option>
                      <option value="other">Other</option>
                    </select>

                    <FieldError message={errors.employmentStatus} />
                  </div>

                  <div className="grid gap-7 sm:grid-cols-2">
                    <TextField
                      id="occupation"
                      label="Occupation"
                      value={form.occupation}
                      placeholder="Enter occupation"
                      error={errors.occupation}
                      onChange={updateField}
                    />

                    <TextField
                      id="employer"
                      label="Employer"
                      value={form.employer}
                      placeholder="Enter employer"
                      error={errors.employer}
                      onChange={updateField}
                    />
                  </div>

                  <div className="grid gap-7 sm:grid-cols-2">
                    <TextField
                      id="industry"
                      label="Industry"
                      value={form.industry}
                      placeholder="Enter industry"
                      error={errors.industry}
                      onChange={updateField}
                    />

                    <TextField
                      id="yearsInRole"
                      label="Years in current role"
                      value={form.yearsInRole}
                      placeholder="Enter years"
                      type="number"
                      error={errors.yearsInRole}
                      onChange={updateField}
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
                  04
                </p>

                <h2 className="mt-4 font-serif text-3xl tracking-[-0.025em] sm:text-4xl">
                  Income overview
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  Record participant-reported income context without
                  calculating a score or financial diagnosis.
                </p>
              </div>

              <div className="border border-black/20 bg-white/40 p-6 sm:p-8 lg:p-10">
                <div className="grid gap-7">
                  <div className="grid gap-7 sm:grid-cols-2">
                    <TextField
                      id="primaryMonthlyIncome"
                      label="Primary monthly income"
                      value={form.primaryMonthlyIncome}
                      placeholder="Enter amount"
                      type="number"
                      error={errors.primaryMonthlyIncome}
                      onChange={updateField}
                    />

                    <TextField
                      id="secondaryIncome"
                      label="Secondary income"
                      value={form.secondaryIncome}
                      placeholder="Enter amount"
                      type="number"
                      error={errors.secondaryIncome}
                      onChange={updateField}
                    />
                  </div>

                  <TextField
                    id="householdIncome"
                    label="Total household income"
                    value={form.householdIncome}
                    placeholder="Enter household income"
                    type="number"
                    error={errors.householdIncome}
                    onChange={updateField}
                  />

                  <div className="grid gap-7 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="incomeFrequency"
                        className="block text-sm font-medium text-black"
                      >
                        Income frequency
                      </label>

                      <select
                        id="incomeFrequency"
                        value={form.incomeFrequency}
                        onChange={(event) =>
                          updateField(
                            "incomeFrequency",
                            event.target.value,
                          )
                        }
                        className="mt-3 w-full border border-black/30 bg-transparent px-4 py-4 text-base outline-none transition focus:border-black"
                      >
                        <option value="">Select frequency</option>
                        <option value="weekly">Weekly</option>
                        <option value="fortnightly">Fortnightly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="annual">Annual</option>
                      </select>

                      <FieldError message={errors.incomeFrequency} />
                    </div>

                    <TextField
                      id="primaryIncomeSource"
                      label="Primary income source"
                      value={form.primaryIncomeSource}
                      placeholder="Enter income source"
                      error={errors.primaryIncomeSource}
                      onChange={updateField}
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
                  05
                </p>

                <h2 className="mt-4 font-serif text-3xl tracking-[-0.025em] sm:text-4xl">
                  Assets
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  Select asset categories reported by the participant. No
                  valuation or verification is performed.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {assetOptions.map((option) => {
                  const selected = assets[option.key];

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
                        onChange={() => toggleAsset(option.key)}
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

                      <span className="font-serif text-xl">
                        {option.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="border-t border-black py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/50">
                  06
                </p>

                <h2 className="mt-4 font-serif text-3xl tracking-[-0.025em] sm:text-4xl">
                  Financial obligations
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  Select applicable obligation categories. Detailed debt
                  information will be collected in a later module.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {obligationOptions.map((option) => {
                  const selected = obligations[option.key];

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
                        onChange={() =>
                          toggleObligation(option.key)
                        }
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

                      <span className="font-serif text-xl">
                        {option.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="border-t border-black py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/50">
                  07
                </p>

                <h2 className="mt-4 font-serif text-3xl tracking-[-0.025em] sm:text-4xl">
                  Prototype completion status
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  Completion reflects participant-entered fields only. It does
                  not represent verified financial information.
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
                    label="Identity information"
                    value={
                      identityComplete ? "Completed" : "Not completed"
                    }
                  />

                  <StatusRow
                    label="Household information"
                    value={
                      householdComplete ? "Completed" : "Not completed"
                    }
                  />

                  <StatusRow
                    label="Employment information"
                    value={
                      employmentComplete ? "Completed" : "Not completed"
                    }
                  />

                  <StatusRow
                    label="Income information"
                    value={
                      incomeComplete ? "Completed" : "Not completed"
                    }
                  />

                  <StatusRow
                    label="Assets"
                    value={assetsComplete ? "Completed" : "Not completed"}
                  />

                  <StatusRow
                    label="Financial obligations"
                    value={
                      obligationsComplete ? "Completed" : "Not completed"
                    }
                  />

                  <StatusRow
                    label="Evidence validation"
                    value="Not performed"
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
                onClick={handleReturn}
                disabled={isSubmitting}
                className="inline-flex min-h-14 items-center justify-center border border-black px-7 text-sm font-semibold uppercase tracking-[0.14em] transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Return to Assessment Dashboard
              </button>

              <div className="flex flex-col gap-4 sm:flex-row">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-14 items-center justify-center border border-black px-7 text-sm font-semibold uppercase tracking-[0.14em] transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Completing Module..."
                    : "Complete Financial Profile"}
                </button>

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!isCompleted || isSubmitting}
                  className="inline-flex min-h-14 items-center justify-center bg-black px-8 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Continue to Cash-Flow Structure
                </button>
              </div>
            </div>

            <p className="mt-8 max-w-5xl text-xs leading-6 text-black/50">
              Completion of this module records participant-provided
              information only. Production assessment will require supporting
              records and evidence validation before any financial information
              is treated as confirmed.
            </p>
          </section>
        </form>
      </div>
    </main>
  );
}