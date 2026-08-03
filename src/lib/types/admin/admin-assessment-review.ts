import type {
  AssessmentModuleKey,
  AssessmentModuleProgress,
  AssessmentValueType,
} from "@/lib/types/participant/assessment";

export const assessmentReviewStatuses = [
  "pending",
  "in_review",
  "completed",
  "returned",
] as const;

export type AssessmentReviewStatus =
  (typeof assessmentReviewStatuses)[number];

export const assessmentReviewDecisions = [
  "approved",
  "rejected",
  "needs_information",
] as const;

export type AssessmentReviewDecision =
  (typeof assessmentReviewDecisions)[number];

export const assessmentReviewCommands = [
  "start_review",
  "save_notes",
  "request_information",
  "approve",
  "reject",
] as const;

export type AssessmentReviewTransitionCommand =
  (typeof assessmentReviewCommands)[number];

export interface AssessmentReviewQueueItem {
  participantId: string;
  participantCode: string;
  participantName: string;
  participantEmail: string | null;
  lifecycleStatus: string;
  assessmentId: string;
  assessmentSessionId: string;
  assessmentNumber: number;
  assessmentType: string;
  assessmentVersion: string;
  hfosVersion: string;
  assessmentStatus: "submitted";
  submittedAt: string;
  reviewId: string | null;
  reviewStatus: AssessmentReviewStatus | null;
  reviewDecision: AssessmentReviewDecision | null;
  reviewStartedAt: string | null;
  reviewCompletedAt: string | null;
  reviewedBy: string | null;
  reviewerName: string | null;
  reviewCreatedAt: string | null;
  reviewUpdatedAt: string | null;
}

export interface AssessmentReviewAnswer {
  value_type: AssessmentValueType;
  value: unknown;
  is_answered: boolean;
  response_order: number;
  updated_at: string;
}

export interface AssessmentReviewDocument {
  id: string;
  document_category: string;
  document_type: string;
  document_name: string;
  description: string | null;
  original_filename: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  verification_status:
    | "pending"
    | "in_progress"
    | "verified"
    | "rejected"
    | "expired";
  verified_at: string | null;
  verified_by: string | null;
  verification_notes: string | null;
  created_at: string;
}

export interface AssessmentReviewDetail
  extends AssessmentReviewQueueItem {
  assessmentCreatedAt: string;
  assessmentUpdatedAt: string;
  moduleProgress: Partial<
    Record<AssessmentModuleKey, AssessmentModuleProgress>
  >;
  answers: Partial<
    Record<
      AssessmentModuleKey,
      Record<string, AssessmentReviewAnswer>
    >
  >;
  documents: AssessmentReviewDocument[];
  reviewNotes: string | null;
  informationRequest: string | null;
}

export interface AssessmentReviewTransitionInput {
  assessmentId: string;
  actorUserId: string;
  command: AssessmentReviewTransitionCommand;
  reviewerNotes?: string | null;
  informationRequest?: string | null;
}

export interface AssessmentReviewTransitionResult {
  assessmentId: string;
  reviewId: string;
  reviewStatus: AssessmentReviewStatus;
  reviewDecision: AssessmentReviewDecision | null;
  reviewStartedAt: string;
  reviewCompletedAt: string | null;
  reviewedBy: string;
  reviewerName: string | null;
  reviewNotes: string | null;
  informationRequest: string | null;
  reviewCreatedAt: string;
  reviewUpdatedAt: string;
}

export class AdminAssessmentReviewRepositoryError extends Error {
  constructor(
    readonly operation: string,
    message: string,
  ) {
    super(message);
    this.name = "AdminAssessmentReviewRepositoryError";
  }
}
