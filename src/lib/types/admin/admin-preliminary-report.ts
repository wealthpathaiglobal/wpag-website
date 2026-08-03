import type {
  PreliminaryReportContent,
  PreliminaryReportStatus,
  PreliminaryReportType,
} from "@/lib/types/preliminary-report";

export const preliminaryReportCommands = [
  "create_draft",
  "save_draft",
  "submit_for_review",
  "return_to_draft",
  "approve",
  "release",
] as const;

export type PreliminaryReportTransitionCommand =
  (typeof preliminaryReportCommands)[number];

export interface PreliminaryReportQueueItem {
  participantId: string;
  participantCode: string;
  participantName: string;
  participantEmail: string | null;
  lifecycleStatus: string;
  assessmentId: string;
  assessmentNumber: number;
  assessmentType: string;
  assessmentSubmittedAt: string;
  assessmentReviewId: string;
  assessmentReviewDecision: "approved";
  assessmentReviewCompletedAt: string;
  reportId: string | null;
  reportNumber: string | null;
  reportTitle: string | null;
  reportStatus: PreliminaryReportStatus | null;
  currentVersion: number | null;
  preparedBy: string | null;
  preparedAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  releasedBy: string | null;
  releasedAt: string | null;
  updatedAt: string | null;
}

export interface PreliminaryReportVersionSummary {
  version_number: number;
  change_summary: string | null;
  content_hash: string;
  created_by: string;
  creator_name: string | null;
  created_at: string;
}

export interface PreliminaryReportDocumentSummary {
  id: string;
  document_category: string;
  document_type: string;
  document_name: string;
  description: string | null;
  original_filename: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  verification_status: "pending" | "verified" | "rejected";
  verified_at: string | null;
  verification_notes: string | null;
  created_at: string;
}

export interface PreliminaryReportAuditSummary {
  event_type: string;
  event_title: string;
  event_description: string | null;
  actor_name: string | null;
  event_timestamp: string;
  metadata: Record<string, unknown>;
}

export interface PreliminaryReportDetail {
  participantId: string;
  participantCode: string;
  participantName: string;
  participantEmail: string | null;
  lifecycleStatus: string;
  assessmentId: string;
  assessmentNumber: number;
  assessmentType: string;
  assessmentVersion: string;
  hfosVersion: string;
  assessmentSubmittedAt: string;
  assessmentReviewId: string;
  assessmentReviewDecision: "approved";
  assessmentReviewCompletedAt: string;
  assessmentReviewerName: string | null;
  reportId: string;
  reportNumber: string;
  reportType: PreliminaryReportType;
  reportTitle: string;
  reportStatus: PreliminaryReportStatus;
  currentVersion: number;
  currentContent: PreliminaryReportContent;
  currentContentHash: string;
  versionHistory: PreliminaryReportVersionSummary[];
  documents: PreliminaryReportDocumentSummary[];
  auditHistory: PreliminaryReportAuditSummary[];
  preparedBy: string;
  preparerName: string | null;
  preparedAt: string;
  submittedForReviewBy: string | null;
  submittedForReviewAt: string | null;
  reviewedBy: string | null;
  reviewerName: string | null;
  reviewedAt: string | null;
  approvedBy: string | null;
  approverName: string | null;
  approvedAt: string | null;
  releasedBy: string | null;
  releaserName: string | null;
  releasedAt: string | null;
  returnedBy: string | null;
  returnedAt: string | null;
  reviewNotes: string | null;
  reportCreatedAt: string;
  reportUpdatedAt: string;
}

export interface PreliminaryReportTransitionPayload {
  reportId: string | null;
  assessmentId: string | null;
  actorUserId: string;
  command: PreliminaryReportTransitionCommand;
  content: PreliminaryReportContent | null;
  changeSummary: string | null;
  reviewNotes: string | null;
}

export interface PreliminaryReportTransitionResult {
  reportId: string;
  assessmentId: string;
  reportNumber: string;
  reportStatus: PreliminaryReportStatus;
  currentVersion: number;
  reportTitle: string;
  currentContent: PreliminaryReportContent;
  preparedAt: string;
  submittedForReviewAt: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  releasedAt: string | null;
  returnedAt: string | null;
  updatedAt: string;
}

export class AdminPreliminaryReportRepositoryError extends Error {
  constructor(readonly operation: string, message: string) {
    super(message);
    this.name = "AdminPreliminaryReportRepositoryError";
  }
}
