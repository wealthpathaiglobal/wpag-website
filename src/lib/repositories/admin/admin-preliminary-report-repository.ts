import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  AdminPreliminaryReportRepositoryError,
  type PreliminaryReportDetail,
  type PreliminaryReportQueueItem,
  type PreliminaryReportTransitionPayload,
  type PreliminaryReportTransitionResult,
} from "@/lib/types/admin/admin-preliminary-report";
import {
  preliminaryReportStatuses,
  preliminaryReportType,
  type PreliminaryReportContent,
  type PreliminaryReportStatus,
} from "@/lib/types/preliminary-report";

type QueueRow = {
  participant_id: string; participant_code: string; participant_name: string;
  participant_email: string | null; lifecycle_status: string;
  assessment_id: string; assessment_number: number; assessment_type: string;
  assessment_submitted_at: string; assessment_review_id: string;
  assessment_review_decision: string; assessment_review_completed_at: string;
  report_id: string | null; report_number: string | null; report_title: string | null;
  report_status: string | null; current_version: number | null;
  prepared_by: string | null; prepared_at: string | null;
  reviewed_by: string | null; reviewed_at: string | null;
  approved_by: string | null; approved_at: string | null;
  released_by: string | null; released_at: string | null; updated_at: string | null;
};

type DetailRow = {
  participant_id: string; participant_code: string; participant_name: string;
  participant_email: string | null; lifecycle_status: string;
  assessment_id: string; assessment_number: number; assessment_type: string;
  assessment_version: string; hfos_version: string; assessment_submitted_at: string;
  assessment_review_id: string; assessment_review_decision: string;
  assessment_review_completed_at: string; assessment_reviewer_name: string | null;
  report_id: string; report_number: string; report_type: string; report_title: string;
  report_status: string; current_version: number; current_content: PreliminaryReportContent;
  current_content_hash: string; version_history: PreliminaryReportDetail["versionHistory"];
  documents: PreliminaryReportDetail["documents"]; audit_history: PreliminaryReportDetail["auditHistory"];
  prepared_by: string; preparer_name: string | null; prepared_at: string;
  submitted_for_review_by: string | null; submitted_for_review_at: string | null;
  reviewed_by: string | null; reviewer_name: string | null; reviewed_at: string | null;
  approved_by: string | null; approver_name: string | null; approved_at: string | null;
  released_by: string | null; releaser_name: string | null; released_at: string | null;
  returned_by: string | null; returned_at: string | null; review_notes: string | null;
  report_created_at: string; report_updated_at: string;
};

type TransitionRow = {
  report_id: string; assessment_id: string; report_number: string; report_status: string;
  current_version: number; report_title: string; current_content: PreliminaryReportContent;
  prepared_at: string; submitted_for_review_at: string | null; reviewed_at: string | null;
  approved_at: string | null; released_at: string | null; returned_at: string | null;
  updated_at: string;
};

const safeMessages = new Set([
  "Actor is not authorized to manage preliminary reports.",
  "Preliminary report ID is required.", "Assessment ID is required.",
  "Preliminary report command is invalid.", "Preliminary report content is invalid.",
  "Eligible assessment was not found.",
  "Assessment review is not eligible for a preliminary report.",
  "An active preliminary report already exists for this assessment.",
  "Preliminary report was not found.", "Preliminary report transition is not allowed.",
  "Change summary is required.", "Mandatory preliminary report sections are incomplete.",
  "Report review notes are required.", "Preliminary report approval metadata is incomplete.",
  "Participant is not eligible to receive the preliminary report.",
]);

function mapStatus(value: string): PreliminaryReportStatus {
  if (preliminaryReportStatuses.includes(value as PreliminaryReportStatus)) {
    return value as PreliminaryReportStatus;
  }
  throw new AdminPreliminaryReportRepositoryError("mapStatus", "Preliminary report data is invalid.");
}

function fail(operation: string, fallback: string, error: { code?: string; message?: string }): never {
  const message = error.code === "P1001" && error.message && safeMessages.has(error.message)
    ? error.message : fallback;
  throw new AdminPreliminaryReportRepositoryError(operation, message);
}

function mapQueue(row: QueueRow): PreliminaryReportQueueItem {
  if (row.assessment_review_decision !== "approved") {
    throw new AdminPreliminaryReportRepositoryError("mapQueue", "Preliminary report data is invalid.");
  }
  return {
    participantId: row.participant_id, participantCode: row.participant_code,
    participantName: row.participant_name, participantEmail: row.participant_email,
    lifecycleStatus: row.lifecycle_status, assessmentId: row.assessment_id,
    assessmentNumber: row.assessment_number, assessmentType: row.assessment_type,
    assessmentSubmittedAt: row.assessment_submitted_at,
    assessmentReviewId: row.assessment_review_id, assessmentReviewDecision: "approved",
    assessmentReviewCompletedAt: row.assessment_review_completed_at,
    reportId: row.report_id, reportNumber: row.report_number, reportTitle: row.report_title,
    reportStatus: row.report_status ? mapStatus(row.report_status) : null,
    currentVersion: row.current_version, preparedBy: row.prepared_by, preparedAt: row.prepared_at,
    reviewedBy: row.reviewed_by, reviewedAt: row.reviewed_at,
    approvedBy: row.approved_by, approvedAt: row.approved_at,
    releasedBy: row.released_by, releasedAt: row.released_at, updatedAt: row.updated_at,
  };
}

export class AdminPreliminaryReportRepository {
  async listReports(actorUserId: string): Promise<PreliminaryReportQueueItem[]> {
    const { data, error } = await supabaseAdmin.rpc("list_preliminary_reports", { p_actor_user_id: actorUserId });
    if (error) fail("listReports", "Preliminary report queue could not be loaded.", error);
    return ((data ?? []) as QueueRow[]).map(mapQueue);
  }

  async getReport(reportId: string, actorUserId: string): Promise<PreliminaryReportDetail | null> {
    const { data, error } = await supabaseAdmin.rpc("get_preliminary_report", {
      p_report_id: reportId, p_actor_user_id: actorUserId,
    });
    if (error) fail("getReport", "Preliminary report could not be loaded.", error);
    const row = ((data ?? []) as DetailRow[])[0];
    if (!row) return null;
    if (row.report_type !== preliminaryReportType || row.assessment_review_decision !== "approved") {
      throw new AdminPreliminaryReportRepositoryError("getReport", "Preliminary report data is invalid.");
    }
    return {
      participantId: row.participant_id, participantCode: row.participant_code,
      participantName: row.participant_name, participantEmail: row.participant_email,
      lifecycleStatus: row.lifecycle_status, assessmentId: row.assessment_id,
      assessmentNumber: row.assessment_number, assessmentType: row.assessment_type,
      assessmentVersion: row.assessment_version, hfosVersion: row.hfos_version,
      assessmentSubmittedAt: row.assessment_submitted_at,
      assessmentReviewId: row.assessment_review_id, assessmentReviewDecision: "approved",
      assessmentReviewCompletedAt: row.assessment_review_completed_at,
      assessmentReviewerName: row.assessment_reviewer_name,
      reportId: row.report_id, reportNumber: row.report_number, reportType: preliminaryReportType,
      reportTitle: row.report_title, reportStatus: mapStatus(row.report_status),
      currentVersion: row.current_version, currentContent: row.current_content,
      currentContentHash: row.current_content_hash, versionHistory: row.version_history ?? [],
      documents: row.documents ?? [], auditHistory: row.audit_history ?? [],
      preparedBy: row.prepared_by, preparerName: row.preparer_name, preparedAt: row.prepared_at,
      submittedForReviewBy: row.submitted_for_review_by,
      submittedForReviewAt: row.submitted_for_review_at,
      reviewedBy: row.reviewed_by, reviewerName: row.reviewer_name, reviewedAt: row.reviewed_at,
      approvedBy: row.approved_by, approverName: row.approver_name, approvedAt: row.approved_at,
      releasedBy: row.released_by, releaserName: row.releaser_name, releasedAt: row.released_at,
      returnedBy: row.returned_by, returnedAt: row.returned_at, reviewNotes: row.review_notes,
      reportCreatedAt: row.report_created_at, reportUpdatedAt: row.report_updated_at,
    };
  }

  async transition(payload: PreliminaryReportTransitionPayload): Promise<PreliminaryReportTransitionResult> {
    const { data, error } = await supabaseAdmin.rpc("transition_preliminary_report", {
      p_report_id: payload.reportId, p_assessment_id: payload.assessmentId,
      p_actor_user_id: payload.actorUserId, p_command: payload.command,
      p_content: payload.content, p_change_summary: payload.changeSummary,
      p_review_notes: payload.reviewNotes,
    });
    if (error) fail("transition", "Preliminary report operation could not be completed.", error);
    const row = ((data ?? []) as TransitionRow[])[0];
    if (!row) throw new AdminPreliminaryReportRepositoryError("transition", "Preliminary report operation could not be completed.");
    return {
      reportId: row.report_id, assessmentId: row.assessment_id,
      reportNumber: row.report_number, reportStatus: mapStatus(row.report_status),
      currentVersion: row.current_version, reportTitle: row.report_title,
      currentContent: row.current_content, preparedAt: row.prepared_at,
      submittedForReviewAt: row.submitted_for_review_at, reviewedAt: row.reviewed_at,
      approvedAt: row.approved_at, releasedAt: row.released_at,
      returnedAt: row.returned_at, updatedAt: row.updated_at,
    };
  }
}
