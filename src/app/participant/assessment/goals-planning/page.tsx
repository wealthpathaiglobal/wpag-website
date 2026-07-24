"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type GoalKey =
  | "emergencyFund"
  | "debtReduction"
  | "homePurchase"
  | "education"
  | "retirement"
  | "business"
  | "investment"
  | "otherGoal"
  | "noDefinedGoal";

type BehaviourKey =
  | "writtenBudget"
  | "goalTracking"
  | "annualReview"
  | "familyDiscussions"
  | "professionalAdvice"
  | "financialRecords"
  | "noPlanningBehaviour";

type CommitmentKey =
  | "structuredPlan"
  | "futureEvidence"
  | "followUpParticipation"
  | "periodicReassessment"
  | "financialEducation"
  | "householdParticipation"
  | "notReady";

type GoalSelections = Record<GoalKey, boolean>;
type BehaviourSelections = Record<BehaviourKey, boolean>;
type CommitmentSelections = Record<CommitmentKey, boolean>;

type GoalsPlanningForm = {
  currency: string;

  primaryGoal: string;
  targetTimeframe: string;
  confidenceLevel: string;
  currentProgress: string;
  expectedObstacles: string;

  monthlySavingsIntention: string;
  monthlyInvestmentIntention: string;
  reportedRiskPreference: string;
  financialEducationInterest: string;
  investmentExperience: string;

  budgetFrequency: string;
  goalReviewFrequency: string;
  familyPlanningFrequency: string;
  professionalAdviceHistory: string;

  planReadiness: string;
  evidenceReadiness: string;
  followUpReadiness: string;
  reassessmentConsent: string;

  participantReview: string;
};

type FormErrors = Partial<Record<keyof GoalsPlanningForm, string>>;

const initialGoals: GoalSelections = {
  emergencyFund: false,
  debtReduction: false,
  homePurchase: false,
  education: false,
  retirement: false,
  business: false,
  investment: false,
  otherGoal: false,
  noDefinedGoal: false,
};

const initialBehaviours: BehaviourSelections = {
  writtenBudget: false,
  goalTracking: false,
  annualReview: false,
  familyDiscussions: false,
  professionalAdvice: false,
  financialRecords: false,
  noPlanningBehaviour: false,
};

const initialCommitments: CommitmentSelections = {
  structuredPlan: false,
  futureEvidence: false,
  followUpParticipation: false,
  periodicReassessment: false,
  financialEducation: false,
  householdParticipation: false,
  notReady: false,
};

const initialForm: GoalsPlanningForm = {
  currency: "INR",

  primaryGoal: "",
  targetTimeframe: "",
  confidenceLevel: "",
  currentProgress: "",
  expectedObstacles: "",

  monthlySavingsIntention: "0",
  monthlyInvestmentIntention: "0",
  reportedRiskPreference: "",
  financialEducationInterest: "",
  investmentExperience: "",

  budgetFrequency: "",
  goalReviewFrequency: "",
  familyPlanningFrequency: "",
  professionalAdviceHistory: "",

  planReadiness: "",
  evidenceReadiness: "",
  followUpReadiness: "",
  reassessmentConsent: "",

  participantReview: "",
};

const goalOptions: Array<{ key: GoalKey; label: string }> = [
  { key: "emergencyFund", label: "Emergency fund" },
  { key: "debtReduction", label: "Debt reduction" },
  { key: "homePurchase", label: "Home purchase" },
  { key: "education", label: "Education funding" },
  { key: "retirement", label: "Retirement preparation" },
  { key: "business", label: "Business development" },
  { key: "investment", label: "Investment growth" },
  { key: "otherGoal", label: "Other financial goal" },
  { key: "noDefinedGoal", label: "No defined financial goal" },
];

const behaviourOptions: Array<{
  key: BehaviourKey;
  label: string;
}> = [
  { key: "writtenBudget", label: "Written household budget" },
  { key: "goalTracking", label: "Financial goal tracking" },
  { key: "annualReview", label: "Annual financial review" },
  { key: "familyDiscussions", label: "Family financial discussions" },
  { key: "professionalAdvice", label: "Professional advice history" },
  { key: "financialRecords", label: "Organised financial records" },
  {
    key: "noPlanningBehaviour",
    label: "No planning behaviour currently reported",
  },
];

const commitmentOptions: Array<{
  key: CommitmentKey;
  label: string;
}> = [
  { key: "structuredPlan", label: "Follow a structured financial plan" },
  { key: "futureEvidence", label: "Submit future supporting evidence" },
  { key: "followUpParticipation", label: "Participate in follow-up reviews" },
  { key: "periodicReassessment", label: "Complete periodic reassessments" },
  { key: "financialEducation", label: "Participate in financial education" },
  { key: "householdParticipation", label: "Include household decision-makers" },
  { key: "notReady", label: "Not ready to make commitments" },
];

const requiredFields: Array<keyof GoalsPlanningForm> = [
  "currency",
  "primaryGoal",
  "targetTimeframe",
  "confidenceLevel",
  "currentProgress",
  "expectedObstacles",
  "reportedRiskPreference",
  "financialEducationInterest",
  "investmentExperience",
  "budgetFrequency",
  "goalReviewFrequency",
  "familyPlanningFrequency",
  "professionalAdviceHistory",
  "planReadiness",
  "evidenceReadiness",
  "followUpReadiness",
  "reassessmentConsent",
  "participantReview",
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
  id: keyof GoalsPlanningForm;
  label: string;
  value: string;
  error?: string;
  onChange: (field: keyof GoalsPlanningForm, value: string) => void;
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
  id: keyof GoalsPlanningForm;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
  onChange: (field: keyof GoalsPlanningForm, value: string) => void;
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

export default function GoalsPlanningPage() {
  const router = useRouter();

  const [form, setForm] = useState<GoalsPlanningForm>(initialForm);
  const [goals, setGoals] = useState<GoalSelections>(initialGoals);
  const [behaviours, setBehaviours] =
    useState<BehaviourSelections>(initialBehaviours);
  const [commitments, setCommitments] =
    useState<CommitmentSelections>(initialCommitments);

  const [errors, setErrors] = useState<FormErrors>({});
  const [goalError, setGoalError] = useState("");
  const [behaviourError, setBehaviourError] = useState("");
  const [commitmentError, setCommitmentError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const selectedGoalCount = Object.entries(goals).filter(
    ([key, selected]) => key !== "noDefinedGoal" && selected,
  ).length;

  const selectedBehaviourCount = Object.entries(behaviours).filter(
    ([key, selected]) => key !== "noPlanningBehaviour" && selected,
  ).length;

  const selectedCommitmentCount = Object.entries(commitments).filter(
    ([key, selected]) => key !== "notReady" && selected,
  ).length;

  const financialGoalsComplete =
    goals.noDefinedGoal || selectedGoalCount > 0;

  const goalPrioritiesComplete = Boolean(
    form.primaryGoal &&
      form.targetTimeframe &&
      form.confidenceLevel &&
      form.currentProgress &&
      form.expectedObstacles,
  );

  const savingsInvestmentComplete = useMemo(
    () =>
      [
        form.monthlySavingsIntention,
        form.monthlyInvestmentIntention,
        form.reportedRiskPreference,
        form.financialEducationInterest,
        form.investmentExperience,
      ].every((value) => value.trim() !== ""),
    [form],
  );

  const planningBehaviourComplete =
    (behaviours.noPlanningBehaviour || selectedBehaviourCount > 0) &&
    Boolean(
      form.budgetFrequency &&
        form.goalReviewFrequency &&
        form.familyPlanningFrequency &&
        form.professionalAdviceHistory,
    );

  const participantCommitmentComplete =
    (commitments.notReady || selectedCommitmentCount > 0) &&
    Boolean(
      form.planReadiness &&
        form.evidenceReadiness &&
        form.followUpReadiness &&
        form.reassessmentConsent,
    );

  const participantReviewComplete = Boolean(form.participantReview);

  const completedSections = [
    financialGoalsComplete,
    goalPrioritiesComplete,
    savingsInvestmentComplete,
    planningBehaviourComplete,
    participantCommitmentComplete,
    participantReviewComplete,
  ].filter(Boolean).length;

  const completion = Math.round((completedSections / 6) * 100);

  const totalMonthlyIntention =
    parseAmount(form.monthlySavingsIntention) +
    parseAmount(form.monthlyInvestmentIntention);

  function updateField(field: keyof GoalsPlanningForm, value: string) {
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

  function toggleGoal(key: GoalKey) {
    setGoals((current) => {
      if (key === "noDefinedGoal") {
        return {
          ...initialGoals,
          noDefinedGoal: !current.noDefinedGoal,
        };
      }

      return {
        ...current,
        [key]: !current[key],
        noDefinedGoal: false,
      };
    });

    setGoalError("");
    setIsCompleted(false);
    setSuccessMessage("");
  }

  function toggleBehaviour(key: BehaviourKey) {
    setBehaviours((current) => {
      if (key === "noPlanningBehaviour") {
        return {
          ...initialBehaviours,
          noPlanningBehaviour: !current.noPlanningBehaviour,
        };
      }

      return {
        ...current,
        [key]: !current[key],
        noPlanningBehaviour: false,
      };
    });

    setBehaviourError("");
    setIsCompleted(false);
    setSuccessMessage("");
  }

  function toggleCommitment(key: CommitmentKey) {
    setCommitments((current) => {
      if (key === "notReady") {
        return {
          ...initialCommitments,
          notReady: !current.notReady,
        };
      }

      return {
        ...current,
        [key]: !current[key],
        notReady: false,
      };
    });

    setCommitmentError("");
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

    const numericFields: Array<keyof GoalsPlanningForm> = [
      "monthlySavingsIntention",
      "monthlyInvestmentIntention",
    ];

    for (const field of numericFields) {
      if (form[field].trim() && Number(form[field]) < 0) {
        nextErrors[field] = "Enter zero or a positive amount.";
      }
    }

    if (!financialGoalsComplete) {
      setGoalError(
        "Select at least one financial goal or choose no defined financial goal.",
      );
    } else {
      setGoalError("");
    }

    if (!(behaviours.noPlanningBehaviour || selectedBehaviourCount > 0)) {
      setBehaviourError(
        "Select at least one planning behaviour or choose no planning behaviour currently reported.",
      );
    } else {
      setBehaviourError("");
    }

    if (!(commitments.notReady || selectedCommitmentCount > 0)) {
      setCommitmentError(
        "Select at least one commitment indicator or choose not ready to make commitments.",
      );
    } else {
      setCommitmentError("");
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors).length === 0 &&
      financialGoalsComplete &&
      goalPrioritiesComplete &&
      savingsInvestmentComplete &&
      planningBehaviourComplete &&
      participantCommitmentComplete &&
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
      "Prototype goals and planning module completed for this browser session. No financial recommendation, investment advice, goal feasibility assessment, HFOS treatment plan, or verified participant record has been generated or stored.",
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
                Participant Portal · HFOS Assessment · Module 06
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
              Goals and planning
            </p>

            <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Define direction before building the financial path.
            </h1>

            <p className="mt-8 max-w-2xl text-base leading-8 text-black/65 sm:text-lg">
              This module records participant-reported financial goals,
              priorities, savings intentions, planning behaviour, readiness,
              and commitment to future follow-up.
            </p>
          </div>

          <aside className="border border-black bg-black p-6 text-white sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
              Prototype notice
            </p>

            <p className="mt-5 text-sm leading-7 text-white/80">
              This page does not determine whether a goal is affordable,
              realistic, suitable, advisable, or achievable.
            </p>

            <p className="mt-4 text-sm leading-7 text-white/80">
              Production planning will require verified financial records,
              controlled assumptions, participant suitability review, evidence
              validation, authorised methodology, and institutional oversight.
            </p>
          </aside>
        </section>

        <form onSubmit={handleSubmit} noValidate>
          <section className="border-t border-black py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <SectionHeader
                number="01"
                title="Financial goals"
                description="Select every financial goal currently reported by the participant."
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
                  {goalOptions.map((option) => {
                    const selected = goals[option.key];

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
                          onChange={() => toggleGoal(option.key)}
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

                {goalError && (
                  <p className="mt-4 text-sm text-red-700" role="alert">
                    {goalError}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="border-t border-black py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <SectionHeader
                number="02"
                title="Goal priorities"
                description="Record the participant's current priority, expected timeframe, progress, and anticipated obstacles."
              />

              <div className="border border-black/20 bg-white/40 p-6 sm:p-8 lg:p-10">
                <div className="grid gap-7 sm:grid-cols-2">
                  <SelectField
                    id="primaryGoal"
                    label="Primary financial goal"
                    value={form.primaryGoal}
                    error={errors.primaryGoal}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select primary goal" },
                      { value: "emergency-fund", label: "Emergency fund" },
                      { value: "debt-reduction", label: "Debt reduction" },
                      { value: "home-purchase", label: "Home purchase" },
                      { value: "education", label: "Education funding" },
                      { value: "retirement", label: "Retirement preparation" },
                      { value: "business", label: "Business development" },
                      { value: "investment", label: "Investment growth" },
                      { value: "other", label: "Other goal" },
                      { value: "none", label: "No defined primary goal" },
                    ]}
                  />

                  <SelectField
                    id="targetTimeframe"
                    label="Target timeframe"
                    value={form.targetTimeframe}
                    error={errors.targetTimeframe}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select timeframe" },
                      { value: "three-months", label: "Within three months" },
                      { value: "six-months", label: "Within six months" },
                      { value: "one-year", label: "Within one year" },
                      { value: "one-three-years", label: "One to three years" },
                      { value: "three-five-years", label: "Three to five years" },
                      { value: "five-plus-years", label: "More than five years" },
                      { value: "not-defined", label: "Not defined" },
                    ]}
                  />

                  <SelectField
                    id="confidenceLevel"
                    label="Reported confidence level"
                    value={form.confidenceLevel}
                    error={errors.confidenceLevel}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select confidence" },
                      { value: "very-high", label: "Very high" },
                      { value: "high", label: "High" },
                      { value: "moderate", label: "Moderate" },
                      { value: "low", label: "Low" },
                      { value: "very-low", label: "Very low" },
                      { value: "unknown", label: "Unknown" },
                    ]}
                  />

                  <SelectField
                    id="currentProgress"
                    label="Current progress"
                    value={form.currentProgress}
                    error={errors.currentProgress}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select progress" },
                      { value: "not-started", label: "Not started" },
                      { value: "early-stage", label: "Early stage" },
                      { value: "in-progress", label: "In progress" },
                      { value: "advanced", label: "Advanced progress" },
                      { value: "near-completion", label: "Near completion" },
                      { value: "unknown", label: "Unknown" },
                    ]}
                  />

                  <SelectField
                    id="expectedObstacles"
                    label="Expected primary obstacle"
                    value={form.expectedObstacles}
                    error={errors.expectedObstacles}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select obstacle" },
                      { value: "income", label: "Insufficient income" },
                      { value: "expenses", label: "High essential expenses" },
                      { value: "debt", label: "Debt obligations" },
                      { value: "irregular-cash-flow", label: "Irregular cash flow" },
                      { value: "lack-of-plan", label: "Lack of structured plan" },
                      { value: "knowledge", label: "Limited financial knowledge" },
                      { value: "family-obligations", label: "Family obligations" },
                      { value: "none", label: "No major obstacle reported" },
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
                number="03"
                title="Savings and investment intent"
                description="Record participant-reported monthly intentions and self-described financial preferences."
              />

              <div className="border border-black/20 bg-white/40 p-6 sm:p-8 lg:p-10">
                <div className="grid gap-7 sm:grid-cols-2">
                  <NumberField
                    id="monthlySavingsIntention"
                    label="Intended monthly savings"
                    value={form.monthlySavingsIntention}
                    error={errors.monthlySavingsIntention}
                    onChange={updateField}
                  />

                  <NumberField
                    id="monthlyInvestmentIntention"
                    label="Intended monthly investment"
                    value={form.monthlyInvestmentIntention}
                    error={errors.monthlyInvestmentIntention}
                    onChange={updateField}
                  />

                  <SelectField
                    id="reportedRiskPreference"
                    label="Self-reported risk preference"
                    value={form.reportedRiskPreference}
                    error={errors.reportedRiskPreference}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select preference" },
                      { value: "capital-preservation", label: "Capital preservation" },
                      { value: "conservative", label: "Conservative" },
                      { value: "balanced", label: "Balanced" },
                      { value: "growth-oriented", label: "Growth oriented" },
                      { value: "high-risk", label: "High risk preference" },
                      { value: "unknown", label: "Unknown" },
                    ]}
                  />

                  <SelectField
                    id="financialEducationInterest"
                    label="Financial education interest"
                    value={form.financialEducationInterest}
                    error={errors.financialEducationInterest}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select interest level" },
                      { value: "very-high", label: "Very high" },
                      { value: "high", label: "High" },
                      { value: "moderate", label: "Moderate" },
                      { value: "low", label: "Low" },
                      { value: "none", label: "No current interest" },
                    ]}
                  />

                  <SelectField
                    id="investmentExperience"
                    label="Reported investment experience"
                    value={form.investmentExperience}
                    error={errors.investmentExperience}
                    onChange={updateField}
                    options={[
                      { value: "", label: "Select experience" },
                      { value: "none", label: "No experience" },
                      { value: "basic", label: "Basic experience" },
                      { value: "moderate", label: "Moderate experience" },
                      { value: "experienced", label: "Experienced" },
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
                title="Planning behaviour"
                description="Select current planning practices and record their reported frequency."
              />

              <div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {behaviourOptions.map((option) => {
                    const selected = behaviours[option.key];

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
                          onChange={() => toggleBehaviour(option.key)}
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

                {behaviourError && (
                  <p className="mt-4 text-sm text-red-700" role="alert">
                    {behaviourError}
                  </p>
                )}

                <div className="mt-6 border border-black/20 bg-white/40 p-6 sm:p-8 lg:p-10">
                  <div className="grid gap-7 sm:grid-cols-2">
                    <SelectField
                      id="budgetFrequency"
                      label="Budget review frequency"
                      value={form.budgetFrequency}
                      error={errors.budgetFrequency}
                      onChange={updateField}
                      options={[
                        { value: "", label: "Select frequency" },
                        { value: "weekly", label: "Weekly" },
                        { value: "monthly", label: "Monthly" },
                        { value: "quarterly", label: "Quarterly" },
                        { value: "occasionally", label: "Occasionally" },
                        { value: "never", label: "Never" },
                        { value: "not-applicable", label: "Not applicable" },
                      ]}
                    />

                    <SelectField
                      id="goalReviewFrequency"
                      label="Goal review frequency"
                      value={form.goalReviewFrequency}
                      error={errors.goalReviewFrequency}
                      onChange={updateField}
                      options={[
                        { value: "", label: "Select frequency" },
                        { value: "monthly", label: "Monthly" },
                        { value: "quarterly", label: "Quarterly" },
                        { value: "six-monthly", label: "Every six months" },
                        { value: "annually", label: "Annually" },
                        { value: "never", label: "Never" },
                        { value: "not-applicable", label: "Not applicable" },
                      ]}
                    />

                    <SelectField
                      id="familyPlanningFrequency"
                      label="Family financial discussion frequency"
                      value={form.familyPlanningFrequency}
                      error={errors.familyPlanningFrequency}
                      onChange={updateField}
                      options={[
                        { value: "", label: "Select frequency" },
                        { value: "frequent", label: "Frequent" },
                        { value: "monthly", label: "Monthly" },
                        { value: "occasionally", label: "Occasionally" },
                        { value: "rare", label: "Rare" },
                        { value: "never", label: "Never" },
                        { value: "not-applicable", label: "Not applicable" },
                      ]}
                    />

                    <SelectField
                      id="professionalAdviceHistory"
                      label="Professional advice history"
                      value={form.professionalAdviceHistory}
                      error={errors.professionalAdviceHistory}
                      onChange={updateField}
                      options={[
                        { value: "", label: "Select history" },
                        { value: "current", label: "Currently receives advice" },
                        { value: "previous", label: "Previously received advice" },
                        { value: "informal", label: "Informal advice only" },
                        { value: "none", label: "No advice history" },
                        { value: "unknown", label: "Unknown" },
                      ]}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-black py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <SectionHeader
                number="05"
                title="Participant commitment"
                description="Record the participant's reported readiness for structured planning, evidence submission, follow-up, and reassessment."
              />

              <div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {commitmentOptions.map((option) => {
                    const selected = commitments[option.key];

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
                          onChange={() => toggleCommitment(option.key)}
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

                {commitmentError && (
                  <p className="mt-4 text-sm text-red-700" role="alert">
                    {commitmentError}
                  </p>
                )}

                <div className="mt-6 border border-black/20 bg-white/40 p-6 sm:p-8 lg:p-10">
                  <div className="grid gap-7 sm:grid-cols-2">
                    <SelectField
                      id="planReadiness"
                      label="Structured-plan readiness"
                      value={form.planReadiness}
                      error={errors.planReadiness}
                      onChange={updateField}
                      options={[
                        { value: "", label: "Select readiness" },
                        { value: "ready", label: "Ready" },
                        { value: "mostly-ready", label: "Mostly ready" },
                        { value: "uncertain", label: "Uncertain" },
                        { value: "not-ready", label: "Not ready" },
                      ]}
                    />

                    <SelectField
                      id="evidenceReadiness"
                      label="Future evidence readiness"
                      value={form.evidenceReadiness}
                      error={errors.evidenceReadiness}
                      onChange={updateField}
                      options={[
                        { value: "", label: "Select readiness" },
                        { value: "ready", label: "Ready to provide evidence" },
                        { value: "partial", label: "Can provide partial evidence" },
                        { value: "assistance-needed", label: "Assistance required" },
                        { value: "not-ready", label: "Not ready" },
                      ]}
                    />

                    <SelectField
                      id="followUpReadiness"
                      label="Follow-up participation"
                      value={form.followUpReadiness}
                      error={errors.followUpReadiness}
                      onChange={updateField}
                      options={[
                        { value: "", label: "Select condition" },
                        { value: "committed", label: "Committed" },
                        { value: "likely", label: "Likely to participate" },
                        { value: "uncertain", label: "Uncertain" },
                        { value: "not-available", label: "Not available" },
                      ]}
                    />

                    <SelectField
                      id="reassessmentConsent"
                      label="Periodic reassessment consent"
                      value={form.reassessmentConsent}
                      error={errors.reassessmentConsent}
                      onChange={updateField}
                      options={[
                        { value: "", label: "Select response" },
                        { value: "agreed", label: "Agreed in principle" },
                        { value: "conditional", label: "Conditional agreement" },
                        { value: "undecided", label: "Undecided" },
                        { value: "declined", label: "Declined" },
                      ]}
                    />
                  </div>
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
                    {
                      value: "reviewed-confirmed",
                      label: "Reviewed and confirmed",
                    },
                    {
                      value: "reviewed-corrections-needed",
                      label: "Reviewed — corrections may be required",
                    },
                    {
                      value: "assisted-entry",
                      label: "Entered with assistance",
                    },
                    {
                      value: "not-reviewed",
                      label: "Not yet reviewed",
                    },
                  ]}
                />

                <p className="mt-5 text-sm leading-7 text-black/55">
                  Review confirmation does not establish goal suitability,
                  affordability, accuracy, or future achievement.
                </p>
              </div>
            </div>
          </section>

          <section className="border-t border-black py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <SectionHeader
                number="07"
                title="Prototype planning overview"
                description="The figures below reflect participant-entered information only. No advice, score, or treatment plan is generated."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <article className="border border-black bg-black p-6 text-white sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                    Monthly financial intention
                  </p>

                  <p className="mt-5 font-serif text-4xl">
                    {formatAmount(totalMonthlyIntention, form.currency)}
                  </p>
                </article>

                <article className="border border-black/20 bg-white/40 p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                    Goal categories selected
                  </p>

                  <p className="mt-5 font-serif text-4xl">
                    {goals.noDefinedGoal ? "0" : selectedGoalCount}
                  </p>
                </article>

                <article className="border border-black/20 bg-white/40 p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                    Planning behaviours selected
                  </p>

                  <p className="mt-5 font-serif text-4xl">
                    {behaviours.noPlanningBehaviour
                      ? "0"
                      : selectedBehaviourCount}
                  </p>
                </article>

                <article className="border border-black/20 bg-white/40 p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                    Commitment indicators
                  </p>

                  <p className="mt-5 font-serif text-4xl">
                    {commitments.notReady ? "0" : selectedCommitmentCount}
                  </p>
                </article>

                <article className="border border-black/20 bg-white/40 p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                    Intended monthly savings
                  </p>

                  <p className="mt-5 font-serif text-4xl">
                    {formatAmount(
                      parseAmount(form.monthlySavingsIntention),
                      form.currency,
                    )}
                  </p>
                </article>

                <article className="border border-black/20 bg-white/40 p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                    Intended monthly investment
                  </p>

                  <p className="mt-5 font-serif text-4xl">
                    {formatAmount(
                      parseAmount(form.monthlyInvestmentIntention),
                      form.currency,
                    )}
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
                description="Completion reflects form coverage only. It does not validate goals or generate financial recommendations."
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
                    label="Financial goals"
                    value={
                      financialGoalsComplete ? "Completed" : "Not completed"
                    }
                  />

                  <StatusRow
                    label="Goal priorities"
                    value={
                      goalPrioritiesComplete ? "Completed" : "Not completed"
                    }
                  />

                  <StatusRow
                    label="Savings and investment intent"
                    value={
                      savingsInvestmentComplete
                        ? "Completed"
                        : "Not completed"
                    }
                  />

                  <StatusRow
                    label="Planning behaviour"
                    value={
                      planningBehaviourComplete
                        ? "Completed"
                        : "Not completed"
                    }
                  />

                  <StatusRow
                    label="Participant commitment"
                    value={
                      participantCommitmentComplete
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
                    label="Goal validation"
                    value="Not performed"
                  />

                  <StatusRow
                    label="Affordability analysis"
                    value="Not performed"
                  />

                  <StatusRow
                    label="Suitability review"
                    value="Not performed"
                  />

                  <StatusRow
                    label="Recommendation engine"
                    value="Not generated"
                  />

                  <StatusRow
                    label="HFOS treatment plan"
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
                  router.push("/participant/assessment/protection-risk")
                }
                disabled={isSubmitting}
                className="inline-flex min-h-14 items-center justify-center border border-black px-7 text-sm font-semibold uppercase tracking-[0.14em] transition hover:bg-black hover:text-white disabled:opacity-50"
              >
                Return to Protection and Risk
              </button>

              <div className="flex flex-col gap-4 sm:flex-row">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-14 items-center justify-center border border-black px-7 text-sm font-semibold uppercase tracking-[0.14em] transition hover:bg-black hover:text-white disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Completing Module..."
                    : "Complete Goals and Planning"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/participant/assessment/review-submit")
                  }
                  disabled={!isCompleted || isSubmitting}
                  className="inline-flex min-h-14 items-center justify-center bg-black px-8 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Continue to Review and Submit
                </button>
              </div>
            </div>

            <p className="mt-8 max-w-5xl text-xs leading-6 text-black/50">
              Production planning must distinguish participant intentions from
              verified capacity, reconcile goals with financial evidence,
              document assumptions, evaluate affordability and suitability,
              apply controlled planning methodology, preserve decision
              provenance, and retain a complete institutional audit history.
            </p>
          </section>
        </form>
      </div>
    </main>
  );
}