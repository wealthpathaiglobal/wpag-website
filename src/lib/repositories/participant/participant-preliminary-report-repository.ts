import { createClient } from "@/lib/supabase/server";
import type {
  ParticipantPreliminaryReportDetail,
  ParticipantPreliminaryReportSummary,
} from "@/lib/types/participant/preliminary-report";
import { preliminaryReportType, type PreliminaryReportContent } from "@/lib/types/preliminary-report";

type SummaryRow = {
  report_id: string; report_number: string; report_title: string; report_type: string;
  report_status: string; current_version: number; assessment_id: string;
  assessment_number: number; assessment_type: string;
  assessment_submitted_at: string; released_at: string;
};
type DetailRow = Omit<SummaryRow, "assessment_id"> & { content: PreliminaryReportContent };

export type ParticipantPreliminaryReportErrorKind =
  | "auth_required" | "participant_unavailable" | "not_found" | "persistence_failed";

export class ParticipantPreliminaryReportRepositoryError extends Error {
  constructor(readonly kind: ParticipantPreliminaryReportErrorKind) {
    super("Participant report access could not be completed.");
    this.name = "ParticipantPreliminaryReportRepositoryError";
  }
}

function mapped(error: { message?: string }) {
  const kinds: Record<string, ParticipantPreliminaryReportErrorKind> = {
    "Participant authentication is required.": "auth_required",
    "Participant report access is unavailable.": "participant_unavailable",
    "Released preliminary report was not found.": "not_found",
    "Preliminary report ID is required.": "not_found",
  };
  return new ParticipantPreliminaryReportRepositoryError(kinds[error.message ?? ""] ?? "persistence_failed");
}

function summary(row: SummaryRow): ParticipantPreliminaryReportSummary {
  if (row.report_type !== preliminaryReportType || row.report_status !== "released") {
    throw new ParticipantPreliminaryReportRepositoryError("persistence_failed");
  }
  return {
    reportId: row.report_id, reportNumber: row.report_number,
    reportTitle: row.report_title, reportType: preliminaryReportType,
    reportStatus: "released", currentVersion: row.current_version,
    assessmentId: row.assessment_id, assessmentNumber: row.assessment_number,
    assessmentType: row.assessment_type,
    assessmentSubmittedAt: row.assessment_submitted_at, releasedAt: row.released_at,
  };
}

export async function listCurrentParticipantPreliminaryReports(): Promise<ParticipantPreliminaryReportSummary[]> {
  const client = await createClient();
  const { data, error } = await client.rpc("list_current_participant_preliminary_reports");
  if (error) throw mapped(error);
  return ((data ?? []) as SummaryRow[]).map(summary);
}

export async function getCurrentParticipantPreliminaryReport(reportId: string): Promise<ParticipantPreliminaryReportDetail | null> {
  const client = await createClient();
  const { data, error } = await client.rpc("get_current_participant_preliminary_report", { p_report_id: reportId });
  if (error) throw mapped(error);
  const row = ((data ?? []) as DetailRow[])[0];
  if (!row) return null;
  if (row.report_type !== preliminaryReportType || row.report_status !== "released") {
    throw new ParticipantPreliminaryReportRepositoryError("persistence_failed");
  }
  return {
    reportId: row.report_id, reportNumber: row.report_number,
    reportTitle: row.report_title, reportType: preliminaryReportType,
    reportStatus: "released", currentVersion: row.current_version,
    assessmentNumber: row.assessment_number, assessmentType: row.assessment_type,
    assessmentSubmittedAt: row.assessment_submitted_at, releasedAt: row.released_at,
    content: row.content,
  };
}
