import { assessmentModuleKeys, type AssessmentModuleKey, type AssessmentValueType } from "@/lib/types/participant/assessment";

export const ASSESSMENT_VERSION = "1.0";
export const HFOS_VERSION = "phase-1-draft";

export interface AssessmentQuestionDefinition {
  readonly key: string;
  readonly valueType: AssessmentValueType;
  readonly required: boolean;
  readonly enumValues?: readonly string[];
  readonly min?: number;
  readonly max?: number;
  readonly jsonKeys?: readonly string[];
}

const text = (key: string, required = false): AssessmentQuestionDefinition => ({ key, valueType: "text", required });
const number = (key: string, required = false, min = 0, max = 1_000_000_000): AssessmentQuestionDefinition => ({ key, valueType: "number", required, min, max });
const json = (key: string, required: boolean, jsonKeys: readonly string[]): AssessmentQuestionDefinition => ({ key, valueType: "json", required, jsonKeys });

const currencies = ["INR", "USD", "GBP", "EUR", "AED"] as const;
const frequencies = ["weekly", "fortnightly", "monthly", "quarterly", "annual", "irregular"] as const;
const riskLevels = ["none", "low", "moderate", "high", "critical", "unknown"] as const;
const readinessLevels = ["complete", "mostly-complete", "partial", "not-ready", "unknown"] as const;
const debtStatuses = ["not-applicable", "current", "occasionally-late", "overdue", "restructured", "settlement-discussion", "collection", "legal-action", "closed", "unknown"] as const;
const participantReviewValues = ["reviewed-confirmed", "reviewed-corrections-needed", "assisted-entry", "not-reviewed"] as const;

const enumValuesByQuestion: Readonly<Record<string, readonly string[]>> = {
  "financial_profile.gender": ["female", "male", "non-binary", "prefer-not-to-say", "other"],
  "financial_profile.marital_status": ["single", "married", "separated", "divorced", "widowed", "other"],
  "financial_profile.housing_type": ["owned", "rented", "family-home", "employer-housing", "other"],
  "financial_profile.employment_status": ["full-time", "part-time", "self-employed", "business-owner", "contract", "retired", "student", "unemployed", "other"],
  "financial_profile.income_frequency": ["weekly", "fortnightly", "monthly", "quarterly", "annual"],
  "cash_flow.currency": ["INR", "USD", "GBP", "EUR", "AUD", "CAD", "AED", "OTHER"],
  "cash_flow.assessment_period": ["monthly", "weekly", "annual"],
  "cash_flow.primary_income_frequency": frequencies,
  "cash_flow.secondary_income_frequency": frequencies,
  "cash_flow.income_reliability": ["highly-predictable", "mostly-predictable", "variable", "irregular", "currently-uncertain"],
  "cash_flow.income_change_expected": ["increase", "stable", "decrease", "uncertain"],
  "cash_flow.payment_timing": ["well-aligned", "minor-mismatch", "recurring-mismatch", "severe-mismatch", "uncertain"],
  "cash_flow.shortage_frequency": ["never", "rarely", "some-months", "most-months", "continuously"],
  "cash_flow.bill_delay_frequency": ["never", "rarely", "occasionally", "frequently", "currently-overdue"],
  "cash_flow.borrowing_for_expenses": ["never", "rarely", "occasionally", "frequently", "dependent"],
  "cash_flow.end_of_month_position": ["surplus", "balanced", "small-shortfall", "significant-shortfall", "unknown"],
  "debt_obligations.currency": currencies,
  ...Object.fromEntries(["housing_loan_status", "personal_loan_status", "vehicle_loan_status", "business_loan_status", "education_loan_status", "medical_debt_status", "other_debt_status", "credit_card_status"].map(key => [`debt_obligations.${key}`, debtStatuses])),
  "debt_obligations.missed_payments": ["none", "rare", "occasional", "frequent", "continuous"],
  "debt_obligations.collection_contact": ["none", "reminders", "regular-calls", "field-visits", "agency"],
  "debt_obligations.legal_action": ["none", "notice", "arbitration", "court", "unknown"],
  "debt_obligations.repayment_burden": ["none", "manageable", "restrictive", "severe", "unsustainable"],
  "debt_obligations.borrowing_dependency": ["none", "rare", "occasional", "frequent", "continuous"],
  "debt_obligations.creditor_pressure": ["none", "low", "moderate", "high", "critical"],
  "debt_obligations.debt_priority": ["maintain", "reduce", "regularise", "restructure", "legal-review", "none"],
  "stability_margin.currency": currencies,
  "stability_margin.income_interruption_months": ["none", "one", "two-three", "four-six", "six-plus", "unknown"],
  "stability_margin.expense_coverage_condition": ["none", "partial", "one-month", "three-months", "six-months", "extended"],
  "stability_margin.emergency_access_speed": ["immediate", "one-day", "several-days", "restricted", "none"],
  "stability_margin.liquidity_condition": ["strong", "adequate", "limited", "very-limited", "none"],
  "stability_margin.recent_unexpected_expense": ["none", "absorbed", "savings-used", "payment-delayed", "borrowed", "unresolved"],
  "stability_margin.borrowing_for_emergency": ["none", "rare", "occasional", "frequent", "primary-response"],
  "stability_margin.payment_delay_risk": ["none", "low", "moderate", "high", "active"],
  "stability_margin.essential_expense_risk": ["none", "limited", "moderate", "high", "current-shortfall"],
  "stability_margin.income_concentration": ["diversified", "two-sources", "single-stable", "single-variable", "uncertain"],
  "stability_margin.household_dependency": ["low", "moderate", "high", "critical"],
  "stability_margin.contingency_plan": ["documented", "informal", "partial", "none", "unknown"],
  "stability_margin.margin_priority": ["maintain", "build-cash", "emergency-fund", "reduce-obligations", "protect-income", "stabilise"],
  "protection_risk.currency": currencies,
  "protection_risk.policy_review_date": ["reviewed-six-months", "reviewed-one-year", "older", "never", "unknown", "not-applicable"],
  "protection_risk.premium_affordability": ["comfortable", "manageable", "restrictive", "difficult", "lapsed-risk", "not-applicable"],
  ...Object.fromEntries(["single_income_dependency", "medical_risk", "employment_risk", "debt_risk", "housing_risk", "legal_risk"].map(key => [`protection_risk.${key}`, riskLevels])),
  "protection_risk.business_risk": [...riskLevels, "not-applicable"],
  "protection_risk.disaster_preparedness": ["prepared", "partially-prepared", "limited", "not-prepared", "unknown"],
  ...Object.fromEntries(["emergency_contact_readiness", "financial_document_organisation", "digital_access_planning", "household_continuity_planning"].map(key => [`protection_risk.${key}`, readinessLevels])),
  "protection_risk.nominee_status": ["complete-current", "complete-review-needed", "partial", "not-completed", "unknown", "not-applicable"],
  "protection_risk.estate_planning": ["documented", "informal", "in-progress", "none", "unknown", "not-applicable"],
  "protection_risk.participant_review": participantReviewValues,
  "goals_planning.currency": currencies,
  "goals_planning.primary_goal": ["emergency-fund", "debt-reduction", "home-purchase", "education", "retirement", "business", "investment", "other", "none"],
  "goals_planning.target_timeframe": ["three-months", "six-months", "one-year", "one-three-years", "three-five-years", "five-plus-years", "not-defined"],
  "goals_planning.confidence_level": ["very-high", "high", "moderate", "low", "very-low", "unknown"],
  "goals_planning.current_progress": ["not-started", "early-stage", "in-progress", "advanced", "near-completion", "unknown"],
  "goals_planning.expected_obstacles": ["income", "expenses", "debt", "irregular-cash-flow", "lack-of-plan", "knowledge", "family-obligations", "none", "unknown"],
  "goals_planning.reported_risk_preference": ["capital-preservation", "conservative", "balanced", "growth-oriented", "high-risk", "unknown"],
  "goals_planning.financial_education_interest": ["very-high", "high", "moderate", "low", "none"],
  "goals_planning.investment_experience": ["none", "basic", "moderate", "experienced", "unknown"],
  "goals_planning.budget_frequency": ["weekly", "monthly", "quarterly", "occasionally", "never", "not-applicable"],
  "goals_planning.goal_review_frequency": ["monthly", "quarterly", "six-monthly", "annually", "never", "not-applicable"],
  "goals_planning.family_planning_frequency": ["frequent", "monthly", "occasionally", "rare", "never", "not-applicable"],
  "goals_planning.professional_advice_history": ["current", "previous", "informal", "none", "unknown"],
  "goals_planning.plan_readiness": ["ready", "mostly-ready", "uncertain", "not-ready"],
  "goals_planning.evidence_readiness": ["ready", "partial", "assistance-needed", "not-ready"],
  "goals_planning.follow_up_readiness": ["committed", "likely", "uncertain", "not-available"],
  "goals_planning.reassessment_consent": ["agreed", "conditional", "undecided", "declined"],
  "goals_planning.participant_review": participantReviewValues,
};

const definitions: Record<AssessmentModuleKey, readonly AssessmentQuestionDefinition[]> = {
  financial_profile: [
    text("full_name",true),number("age",true,18,120),text("gender",true),text("country",true),text("state_province"),text("city",true),text("postal_code"),
    text("marital_status",true),number("household_members",true,1,100),number("financial_dependents",true,0,100),text("primary_residence"),text("housing_type",true),text("living_arrangement",true),
    text("employment_status",true),text("occupation",true),text("employer"),text("industry",true),number("years_in_role",false,0,100),
    number("primary_monthly_income",true),number("secondary_income"),number("household_income",true),text("income_frequency",true),text("primary_income_source",true),
    json("assets",true,["savings","currentAccount","property","vehicle","investments","businessOwnership","retirementFund","other"]),
    json("obligations",true,["housingLoan","personalLoan","vehicleLoan","creditCard","businessLoan","educationLoan","medicalDebt","other"]),
  ],
  cash_flow: [
    text("currency",true),text("assessment_period",true),number("primary_income_amount",true),text("primary_income_frequency",true),number("secondary_income_amount"),text("secondary_income_frequency"),number("other_income_amount"),text("income_reliability",true),text("income_change_expected",true),
    ...["housing_expense","food_expense","utilities_expense","transport_expense"].map(k=>number(k,true)),
    ...["education_expense","healthcare_expense","insurance_expense","family_support_expense","other_essential_expense"].map(k=>number(k)),
    number("loan_repayments",true),number("credit_card_payments",true),number("subscriptions_expense"),number("discretionary_expense"),number("irregular_expense"),
    number("savings_contribution",true),number("emergency_contribution"),number("investment_contribution"),
    text("payment_timing",true),text("shortage_frequency",true),text("bill_delay_frequency",true),text("borrowing_for_expenses",true),text("end_of_month_position",true),
    json("timing_pressure",true,["incomeBeforeBills","incomeAfterBills","multipleDueDates","irregularIncomeDates","automaticPayments","cashPayments","noTimingConcern"]),
  ],
  debt_obligations: [
    text("currency",true), json("debt_types",true,["housingLoan","personalLoan","vehicleLoan","businessLoan","educationLoan","creditCard","medicalDebt","otherDebt","noDebt"]),
    ...["housing_loan","personal_loan","vehicle_loan","business_loan","education_loan","medical_debt","other_debt"].flatMap(k=>[number(`${k}_balance`),number(`${k}_payment`),text(`${k}_status`)]),
    number("credit_card_balance"),number("credit_card_minimum_payment"),text("credit_card_status"),number("overdue_amount"),number("overdue_accounts"),
    ...["missed_payments","collection_contact","legal_action","repayment_burden","borrowing_dependency","creditor_pressure","debt_priority"].map(k=>text(k,true)),
  ],
  stability_margin: [
    text("currency",true),json("buffers",true,["cash","savings","emergencyFund","liquidInvestments","creditAccess","familySupport","insurance","noBuffer"]),
    ...["available_cash","bank_savings","emergency_fund","liquid_investments","accessible_credit","monthly_essential_expenses","monthly_debt_payments","monthly_insurance_payments","monthly_dependent_support"].map(k=>number(k)),
    ...["income_interruption_months","expense_coverage_condition","emergency_access_speed","liquidity_condition","recent_unexpected_expense","borrowing_for_emergency","payment_delay_risk","essential_expense_risk","income_concentration","household_dependency","contingency_plan","margin_priority"].map(k=>text(k,true)),
  ],
  protection_risk: [
    text("currency",true),json("protections",true,["lifeInsurance","healthInsurance","disabilityInsurance","criticalIllness","propertyInsurance","vehicleInsurance","businessInsurance","otherProtection","noProtection"]),json("gaps",true,["noHealthInsurance","noLifeInsurance","noEmergencyReserve","highDebtExposure","noIncomeBackup","noSuccessionPlanning","unknownCoverage","noMajorGap"]),
    number("life_cover_amount"),number("health_cover_amount"),number("emergency_medical_reserve"),number("dependents_covered"),text("policy_review_date",true),
    ...["premium_affordability","single_income_dependency","medical_risk","employment_risk","business_risk","debt_risk","housing_risk","legal_risk","disaster_preparedness","emergency_contact_readiness","financial_document_organisation","digital_access_planning","nominee_status","estate_planning","household_continuity_planning","participant_review"].map(k=>text(k,true)),
  ],
  goals_planning: [
    // Savings and investment intentions are separate approved questions; the canonical registry total is intentionally 162.
    text("currency",true),json("goals",true,["emergencyFund","debtReduction","homePurchase","education","retirement","business","investment","otherGoal","noDefinedGoal"]),json("behaviours",true,["writtenBudget","goalTracking","annualReview","familyDiscussions","professionalAdvice","financialRecords","noPlanningBehaviour"]),json("commitments",true,["structuredPlan","futureEvidence","followUpParticipation","periodicReassessment","financialEducation","householdParticipation","notReady"]),
    ...["primary_goal","target_timeframe","confidence_level","current_progress","expected_obstacles"].map(k=>text(k,true)),number("monthly_savings_intention"),number("monthly_investment_intention"),
    ...["reported_risk_preference","financial_education_interest","investment_experience","budget_frequency","goal_review_frequency","family_planning_frequency","professional_advice_history","plan_readiness","evidence_readiness","follow_up_readiness","reassessment_consent","participant_review"].map(k=>text(k,true)),
  ],
};

const metadata = {
  financial_profile: { route: "/participant/assessment/financial-profile", title: "Financial Profile" },
  cash_flow: { route: "/participant/assessment/cash-flow", title: "Cash-Flow Structure" },
  debt_obligations: { route: "/participant/assessment/debt-obligations", title: "Debt and Obligations" },
  stability_margin: { route: "/participant/assessment/stability-margin", title: "Stability and Margin" },
  protection_risk: { route: "/participant/assessment/protection-risk", title: "Protection and Risk" },
  goals_planning: { route: "/participant/assessment/goals-planning", title: "Goals and Planning" },
} as const;

export const assessmentRegistry = assessmentModuleKeys.map((key, index) => ({ key, order: index + 1, ...metadata[key], questions: definitions[key].map(question => ({ ...question, enumValues: enumValuesByQuestion[`${key}.${question.key}`] ?? question.jsonKeys })), requiredCount: definitions[key].filter(q=>q.required).length })) as readonly {
  readonly key: AssessmentModuleKey; readonly order: number; readonly route: string; readonly title: string; readonly questions: readonly AssessmentQuestionDefinition[]; readonly requiredCount: number;
}[];

export function isAssessmentModuleKey(value: string): value is AssessmentModuleKey { return assessmentModuleKeys.includes(value as AssessmentModuleKey); }
export function getAssessmentModule(key: AssessmentModuleKey) { return assessmentRegistry.find(module=>module.key===key)!; }

export function validateModuleAnswers(moduleKey: AssessmentModuleKey, value: unknown) {
  const fieldErrors: Record<string,string> = {};
  if (typeof value !== "object" || value === null || Array.isArray(value)) return { fieldErrors, formError: "Answers must be an object." };
  const normalized: Record<string,unknown> = {};
  const registry = new Map(getAssessmentModule(moduleKey).questions.map(question=>[`${moduleKey}.${question.key}`,question]));
  for (const [key, candidate] of Object.entries(value)) {
    const question=registry.get(key);
    if (!question) { fieldErrors[key]="This question is not available for this module."; continue; }
    if (candidate === null || (typeof candidate === "string" && !candidate.trim())) { normalized[key]=null; continue; }
    if (question.valueType === "text" || question.valueType === "date") {
      if (typeof candidate !== "string") fieldErrors[key]="Enter a valid text value.";
      else {
        const textValue=candidate.trim().replace(/\s+/g," ");
        if (question.valueType === "date" && (!/^\d{4}-\d{2}-\d{2}$/.test(textValue) || Number.isNaN(Date.parse(`${textValue}T00:00:00Z`)) || new Date(`${textValue}T00:00:00Z`) > new Date())) fieldErrors[key]="Enter a valid date that is not in the future.";
        else if (question.enumValues && !question.enumValues.includes(textValue)) fieldErrors[key]="Select a valid option.";
        else normalized[key]=textValue;
      }
    } else if (question.valueType === "number") {
      const numberValue=typeof candidate === "number" ? candidate : Number(candidate);
      if (!Number.isFinite(numberValue) || numberValue < (question.min ?? 0) || numberValue > (question.max ?? Number.MAX_SAFE_INTEGER)) fieldErrors[key]="Enter a valid number.";
      else normalized[key]=numberValue;
    } else if (question.valueType === "boolean") {
      if (typeof candidate !== "boolean") fieldErrors[key]="Select a valid option."; else normalized[key]=candidate;
    } else {
      if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) fieldErrors[key]="Select one or more valid options.";
      else if (Object.keys(candidate).some(k=>!question.jsonKeys?.includes(k)) || Object.values(candidate).some(v=>typeof v!=="boolean")) fieldErrors[key]="Select only valid options.";
      else normalized[key]=question.required&&!Object.values(candidate).some(Boolean)?null:candidate;
    }
  }
  return { normalized, fieldErrors };
}
