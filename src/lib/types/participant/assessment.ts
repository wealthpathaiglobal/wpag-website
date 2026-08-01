export const assessmentModuleKeys = [
  "financial_profile", "cash_flow", "debt_obligations",
  "stability_margin", "protection_risk", "goals_planning",
] as const;

export type AssessmentModuleKey = (typeof assessmentModuleKeys)[number];
export type AssessmentModuleStatus = "not_started" | "in_progress" | "complete";
export type AssessmentValueType = "text" | "number" | "boolean" | "date" | "json";

export interface AssessmentAnswerValue {
  value_type: AssessmentValueType;
  value: unknown;
  response_order: number;
  updated_at: string;
}

export interface AssessmentModuleProgress {
  status: AssessmentModuleStatus;
  answered_required_count: number;
  required_count: number;
  completed_at: string | null;
}

export interface CurrentParticipantAssessment {
  session_id: string;
  assessment_id: string;
  session_status: "draft" | "in_progress" | "submitted";
  assessment_version: string;
  hfos_version: string;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  module_progress: Record<AssessmentModuleKey, AssessmentModuleProgress>;
  answers: Record<AssessmentModuleKey, Record<string, AssessmentAnswerValue>>;
}

export interface AssessmentModuleSaveResult {
  session_id: string;
  assessment_id: string;
  module_key: AssessmentModuleKey;
  module_status: AssessmentModuleStatus;
  answered_required_count: number;
  required_count: number;
  completed_at: string | null;
  updated_at: string;
  answers: Record<string, AssessmentAnswerValue>;
  module_progress: CurrentParticipantAssessment["module_progress"];
}

export interface AssessmentActionResult<T> {
  success: boolean;
  assessment?: CurrentParticipantAssessment | null;
  module?: AssessmentModuleSaveResult;
  fieldErrors?: Record<string, string>;
  formError?: string | null;
  data?: T;
}

export interface AdminParticipantAssessmentSummary {
  participant_id: string;
  session_id: string | null;
  assessment_id: string | null;
  session_status: string | null;
  assessment_version: string | null;
  hfos_version: string | null;
  completed_module_count: number;
  total_module_count: number;
  created_at: string | null;
  updated_at: string | null;
  submitted_at: string | null;
}
